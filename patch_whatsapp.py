import re

with open('server/src/utils/communications.ts', 'r') as f:
    content = f.read()

# Add WhatsApp stub functions
whatsapp_stubs = """
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const sendWhatsAppInvoice = async (order: any, invoiceUrl?: string) => {
    console.log(`[WhatsApp Stub] Sending Invoice for Order ${order.orderNumber} to ${order.phone}`);
    console.log(`Message: Hello ${order.customerName}, your order has been received. Please pay using the invoice QR. Total: Rs. ${order.totalAmount}`);
    if (invoiceUrl) {
        console.log(`Attachment URL: ${invoiceUrl}`);
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // For now, always succeed
    await prisma.order.update({
        where: { id: order.id },
        data: { whatsappStatus: 'SENT' }
    });
};

export const sendWhatsAppPaymentConfirmation = async (order: any) => {
    console.log(`[WhatsApp Stub] Sending Payment Confirmation for Order ${order.orderNumber} to ${order.phone}`);
    console.log(`Message: Hello ${order.customerName}, we have successfully received your payment of Rs. ${order.totalAmount}. Your order is now confirmed.`);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
};
"""

content = content + "\n" + whatsapp_stubs

with open('server/src/utils/communications.ts', 'w') as f:
    f.write(content)
