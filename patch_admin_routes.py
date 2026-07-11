import re

with open('server/src/routes/admin.ts', 'r') as f:
    content = f.read()

admin_routes = """
import { updateOrderRow } from '../utils/sheets';
import { sendWhatsAppPaymentConfirmation, sendWhatsAppInvoice } from '../utils/communications';
import { generateInvoicePDFBuffer } from '../utils/invoice';

// Helper to authenticate admin
const authenticateAdmin = (req: any, res: any, next: any) => {
    const token = req.cookies.admin_token;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.admin = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};

// Log audit action
const logAudit = async (orderId: string, action: string, adminId?: string, details?: string) => {
    await prisma.auditLog.create({
        data: {
            orderId,
            action,
            adminId,
            details
        }
    });
};

router.put('/orders/:id/payment', authenticateAdmin, async (req: any, res: any) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // Expecting 'PAID' or 'PENDING'

        if (status !== 'PAID' && status !== 'PENDING') {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
        if (!order) return res.status(404).json({ error: 'Order not found' });

        const updatedOrder = await prisma.order.update({
            where: { id },
            data: {
                paymentStatus: status,
                paymentVerifiedAt: status === 'PAID' ? new Date() : null,
                paymentVerifiedBy: status === 'PAID' ? req.admin.username : null
            },
            include: { items: true }
        });

        await logAudit(order.id, `PAYMENT_STATUS_UPDATED_${status}`, req.admin.id);

        res.json(updatedOrder);

        // Background tasks
        (async () => {
            try {
                await updateOrderRow(updatedOrder);
                if (status === 'PAID') {
                    await sendWhatsAppPaymentConfirmation(updatedOrder);
                }
            } catch (err) {
                console.error("Background tasks failed after payment update:", err);
            }
        })();

    } catch (error) {
        console.error('Error updating payment status:', error);
        res.status(500).json({ error: 'Failed to update payment status' });
    }
});

router.put('/orders/:id/status', authenticateAdmin, async (req: any, res: any) => {
    try {
        const { id } = req.params;
        const { orderStatus } = req.body; // e.g., 'READY_FOR_PICKUP', 'PICKED_UP'

        const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
        if (!order) return res.status(404).json({ error: 'Order not found' });

        const updatedOrder = await prisma.order.update({
            where: { id },
            data: { orderStatus },
            include: { items: true }
        });

        await logAudit(order.id, `ORDER_STATUS_UPDATED_${orderStatus}`, req.admin.id);

        res.json(updatedOrder);

        // Background tasks
        (async () => {
            try {
                await updateOrderRow(updatedOrder);
            } catch (err) {
                console.error("Background tasks failed after order status update:", err);
            }
        })();

    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ error: 'Failed to update order status' });
    }
});

router.post('/orders/:id/resend-whatsapp', authenticateAdmin, async (req: any, res: any) => {
    try {
        const { id } = req.params;

        const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
        if (!order) return res.status(404).json({ error: 'Order not found' });

        await logAudit(order.id, 'WHATSAPP_RESENT', req.admin.id);

        res.json({ success: true, message: 'WhatsApp resend initiated' });

        // Background
        (async () => {
             try {
                 await sendWhatsAppInvoice(order, order.invoiceUrl || undefined);
             } catch (err) {
                 console.error("Failed to resend WhatsApp:", err);
             }
        })();
    } catch (error) {
        console.error('Error resending WhatsApp:', error);
        res.status(500).json({ error: 'Failed to resend WhatsApp' });
    }
});

router.post('/orders/:id/regenerate-invoice', authenticateAdmin, async (req: any, res: any) => {
    try {
        const { id } = req.params;

        const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
        if (!order) return res.status(404).json({ error: 'Order not found' });

        const newVersion = (order.invoiceVersion || 1) + 1;

        const updatedOrder = await prisma.order.update({
            where: { id },
            data: { invoiceVersion: newVersion },
            include: { items: true }
        });

        const customerPdfData = await generateInvoicePDFBuffer(updatedOrder, 'CUSTOMER');

        let finalOrder = updatedOrder;
        if (customerPdfData.url) {
             finalOrder = await prisma.order.update({
                 where: { id },
                 data: { invoiceUrl: customerPdfData.url },
                 include: { items: true }
             });
        }

        await logAudit(order.id, `INVOICE_REGENERATED_V${newVersion}`, req.admin.id);

        res.json(finalOrder);

        // Background tasks
        (async () => {
             try {
                 await updateOrderRow(finalOrder);
                 await sendWhatsAppInvoice(finalOrder, finalOrder.invoiceUrl || undefined);
             } catch (err) {
                 console.error("Failed background tasks after regenerate invoice:", err);
             }
        })();

    } catch (error) {
        console.error('Error regenerating invoice:', error);
        res.status(500).json({ error: 'Failed to regenerate invoice' });
    }
});
"""

content = content + "\n" + admin_routes

with open('server/src/routes/admin.ts', 'w') as f:
    f.write(content)
