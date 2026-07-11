import { PrismaClient } from '@prisma/client';
import { appendOrderRow, updateOrderRow } from './sheets';
import { sendWhatsAppInvoice } from './communications';

const prisma = new PrismaClient();

export const startBackgroundWorker = () => {
    console.log("Starting Background Worker for Retries...");

    // Run every 1 minute
    setInterval(async () => {
        try {
            // Find orders with failed sheets sync
            const failedSheets = await prisma.order.findMany({
                where: { sheetStatus: 'FAILED' },
                include: { items: true },
                take: 10
            });

            for (const order of failedSheets) {
                console.log(`[Worker] Retrying Sheet Sync for Order ${order.orderNumber}`);
                if (order.googleSheetRowId) {
                    await updateOrderRow(order);
                } else {
                    await appendOrderRow(order);
                }
            }

            // Find orders with failed whatsapp
            const failedWhatsApp = await prisma.order.findMany({
                where: { whatsappStatus: 'FAILED' },
                include: { items: true },
                take: 10
            });

            for (const order of failedWhatsApp) {
                console.log(`[Worker] Retrying WhatsApp for Order ${order.orderNumber}`);
                await sendWhatsAppInvoice(order, order.invoiceUrl || undefined);
            }

        } catch (error) {
            console.error("[Worker] Error in background retry loop:", error);
        }
    }, 60 * 1000);
};
