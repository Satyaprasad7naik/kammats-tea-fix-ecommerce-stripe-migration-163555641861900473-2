"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const invoice_1 = require("../utils/invoice");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
// Create an order
router.post('/', async (req, res) => {
    try {
        const { customerName, phone, email, address, city, state, pincode, businessType, // B2B or B2C
        customerNotes, items, // Array of { productId, quantity }
         } = req.body;
        if (!customerName || !phone || !address || !city || !state || !pincode || !items || !items.length || !businessType) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        // Validate quantities
        for (const item of items) {
            if (typeof item.quantity !== 'number' || item.quantity <= 0 || !Number.isInteger(item.quantity)) {
                return res.status(400).json({ error: 'Invalid quantity provided' });
            }
        }
        const orderResult = await prisma.$transaction(async (tx) => {
            let subtotal = 0;
            let gstTotal = 0;
            const orderItemsData = [];
            for (const item of items) {
                const product = await tx.product.findUnique({
                    where: { id: item.productId }
                });
                if (!product) {
                    throw new Error(`Product with id ${item.productId} not found`);
                }
                // We assume unlimited stock for this business model, but keeping tracking logic active
                // decrementing later if needed, or decrementing immediately.
                // For simplicity, we just decrement immediately to maintain accurate stock records
                await tx.product.update({
                    where: { id: product.id },
                    data: { stock: { decrement: item.quantity } }
                });
                const itemSubtotal = Number((product.price * item.quantity).toFixed(2));
                // Using a default 18% GST if not provided
                const productGst = 18.0;
                const itemGstAmount = Number(((itemSubtotal * productGst) / 100).toFixed(2));
                const lineTotal = Number((itemSubtotal + itemGstAmount).toFixed(2));
                subtotal += itemSubtotal;
                gstTotal += itemGstAmount;
                orderItemsData.push({
                    productId: product.id,
                    productName: product.name,
                    quantity: item.quantity,
                    unitPrice: product.price,
                    price: product.price,
                    gstRate: productGst,
                    gstAmount: itemGstAmount,
                    lineTotal: lineTotal
                });
            }
            subtotal = Number(subtotal.toFixed(2));
            gstTotal = Number(gstTotal.toFixed(2));
            const grandTotal = Number((subtotal + gstTotal).toFixed(2));
            const totalAmount = grandTotal;
            const timestamp = Date.now().toString().slice(-6);
            const orderNumber = `ORD-${timestamp}-${Math.floor(Math.random() * 1000)}`;
            const invoiceNumber = `INV-${timestamp}-${Math.floor(Math.random() * 1000)}`;
            // Generate a mock UPI link. In a real system, you'd insert business UPI ID here
            const businessUpiId = "business@upi";
            const upiLink = `upi://pay?pa=${businessUpiId}&pn=KammatsTea&tr=${orderNumber}&am=${totalAmount}&cu=INR`;
            // Create the order
            const newOrder = await tx.order.create({
                data: {
                    orderNumber,
                    invoiceNumber,
                    customerName,
                    phone,
                    email,
                    address,
                    city,
                    state,
                    pincode,
                    businessType,
                    customerNotes,
                    subtotal,
                    gstTotal,
                    grandTotal,
                    totalAmount,
                    paymentStatus: 'PENDING',
                    orderStatus: 'PROCESSING',
                    items: {
                        create: orderItemsData
                    }
                },
                include: {
                    items: true
                }
            });
            // 7. Sync to Google Sheets (Mock implementation)
            // await syncToGoogleSheets(newOrder);
            // 8. Prepare Notifications (Mock implementation)
            // await sendOrderNotifications(newOrder);
            return { order: newOrder, upiLink };
        });
        res.status(201).json(orderResult);
    }
    catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ error: 'Failed to create order' });
    }
});
// Generate Invoice
router.get('/:id/invoice', async (req, res) => {
    try {
        const { id } = req.params;
        const order = await prisma.order.findUnique({
            where: { id },
            include: { items: true }
        });
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        (0, invoice_1.generateInvoicePDF)(order, res);
    }
    catch (error) {
        console.error('Error generating invoice:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to generate invoice' });
        }
    }
});
// Get a single order by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const order = await prisma.order.findUnique({
            where: { id },
            include: { items: true }
        });
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        res.json(order);
    }
    catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({ error: 'Failed to fetch order' });
    }
});
exports.default = router;
//# sourceMappingURL=orders.js.map