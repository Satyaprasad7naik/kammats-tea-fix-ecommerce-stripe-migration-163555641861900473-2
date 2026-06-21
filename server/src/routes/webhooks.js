"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const stripe_1 = __importDefault(require("stripe"));
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("FATAL ERROR: STRIPE_SECRET_KEY is not configured.");
}
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
});
router.post('/stripe', async (req, res) => {
    const signature = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!signature || !webhookSecret) {
        return res.status(400).json({ error: 'Webhook signature / secret missing' });
    }
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
    }
    catch (err) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        const paymentIntentId = paymentIntent.id;
        try {
            await prisma.$transaction(async (tx) => {
                // Use raw query for true row-level locking (SELECT ... FOR UPDATE) to prevent race conditions
                const existingOrders = await tx.$queryRaw `SELECT "paymentStatus" FROM "Order" WHERE "stripePaymentIntentId" = ${paymentIntentId} FOR UPDATE`;
                if (existingOrders.length > 0 && existingOrders[0].paymentStatus !== 'PAID') {
                    const updatedOrder = await tx.order.update({
                        where: { stripePaymentIntentId: paymentIntentId },
                        data: {
                            paymentStatus: 'PAID',
                            invoiceNumber: `INV-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`,
                        },
                        include: { items: true }
                    });
                    // Decrement stock only when payment is actually confirmed via webhook
                    for (const item of updatedOrder.items) {
                        await tx.product.update({
                            where: { id: item.productId },
                            data: {
                                stock: {
                                    decrement: item.quantity
                                }
                            }
                        });
                    }
                }
            });
        }
        catch (error) {
            console.error('Error processing stripe webhook payment_intent.succeeded:', error);
            return res.status(500).json({ error: 'Internal webhook error' });
        }
    }
    else if (event.type === 'payment_intent.payment_failed') {
        const paymentIntent = event.data.object;
        const paymentIntentId = paymentIntent.id;
        try {
            await prisma.$transaction(async (tx) => {
                const existingOrders = await tx.$queryRaw `SELECT id, "paymentStatus" FROM "Order" WHERE "stripePaymentIntentId" = ${paymentIntentId} FOR UPDATE`;
                if (existingOrders.length > 0 && existingOrders[0].paymentStatus !== 'PAID') {
                    const orderId = existingOrders[0].id;
                    await tx.order.update({
                        where: { id: orderId },
                        data: {
                            paymentStatus: 'FAILED',
                            orderStatus: 'CANCELLED'
                        }
                    });
                }
            });
        }
        catch (error) {
            console.error('Error processing failed payment cancellation', error);
            return res.status(500).json({ error: 'Internal webhook error' });
        }
    }
    res.status(200).json({ received: true });
});
exports.default = router;
//# sourceMappingURL=webhooks.js.map