"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const stripe_1 = __importDefault(require("stripe"));
const crypto_1 = __importDefault(require("crypto"));
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
});
router.post('/stripe', express_1.default.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    }
    catch (err) {
        console.error(`Webhook Error: ${err.message}`);
        res.status(400).send(`Webhook Error: ${err.message}`);
        return;
    }
    // Handle the event
    if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        const orderId = paymentIntent.metadata.orderId;
        if (!orderId) {
            console.error("No orderId found in payment intent metadata");
            res.status(400).send("No orderId found");
            return;
        }
        try {
            await prisma.$transaction(async (tx) => {
                const order = await tx.order.findUnique({
                    where: { id: orderId },
                    include: { items: true }
                });
                if (order && order.status !== 'paid') {
                    await tx.order.update({
                        where: { id: orderId },
                        data: { status: 'paid' }
                    });
                    // decrement stock
                    for (const item of order.items) {
                        await tx.product.update({
                            where: { id: item.productId },
                            data: { stock: { decrement: item.quantity } }
                        });
                    }
                }
            });
            console.log(`Order ${orderId} successfully marked as paid via Stripe webhook.`);
        }
        catch (e) {
            console.error(`Error updating order ${orderId} after Stripe webhook:`, e);
        }
    }
    res.send();
});
router.post('/razorpay', express_1.default.json(), async (req, res) => {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const shasum = crypto_1.default.createHmac('sha256', secret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest('hex');
    if (digest === req.headers['x-razorpay-signature']) {
        const event = req.body.event;
        if (event === 'payment.captured' || event === 'order.paid') {
            const payment = req.body.payload.payment.entity;
            // Get our internal orderId that was stored in the receipt field when creating the razorpay order
            const orderId = payment.notes?.orderId || req.body.payload?.order?.entity?.receipt;
            if (!orderId) {
                console.error("No orderId found in razorpay payload");
                return res.status(400).send("No orderId found");
            }
            try {
                await prisma.$transaction(async (tx) => {
                    const order = await tx.order.findUnique({
                        where: { id: orderId },
                        include: { items: true }
                    });
                    if (order && order.status !== 'paid') {
                        await tx.order.update({
                            where: { id: orderId },
                            data: { status: 'paid' }
                        });
                        for (const item of order.items) {
                            await tx.product.update({
                                where: { id: item.productId },
                                data: { stock: { decrement: item.quantity } }
                            });
                        }
                    }
                });
                console.log(`Order ${orderId} successfully marked as paid via Razorpay webhook.`);
            }
            catch (e) {
                console.error(`Error updating order ${orderId} after Razorpay webhook:`, e);
            }
        }
        res.json({ status: 'ok' });
    }
    else {
        res.status(400).send('Invalid signature');
    }
});
exports.default = router;
//# sourceMappingURL=webhooks.js.map