import { google } from 'googleapis';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

// Mock authentications and appending to google sheets in case credentials are not configured
export const appendOrderToSheet = async (order: any) => {
  try {
    if (!SPREADSHEET_ID || !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      console.log(`[SIMULATED GOOGLE SHEETS] Order ${order.orderNumber} appended to Google Sheets.`);

      await prisma.order.update({
          where: { id: order.id },
          data: { googleSheetsSynced: true }
      });
      return true;
    }

    const auth = new google.auth.GoogleAuth({
      keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    const values = [
      [
        order.id,
        order.invoiceNumber,
        order.customerName,
        order.phone,
        order.address,
        order.items?.map((i: any) => i.productName).join(', ') || '',
        order.items?.reduce((sum: number, i: any) => sum + i.quantity, 0) || 0,
        order.gstTotal,
        order.grandTotal,
        order.businessType,
        order.orderStatus,
        order.paymentStatus,
        new Date(order.createdAt).toISOString(),
        new Date(order.updatedAt).toISOString()
      ]
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Sheet1!A:N',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values },
    });

    await prisma.order.update({
        where: { id: order.id },
        data: { googleSheetsSynced: true }
    });

    console.log(`Order ${order.orderNumber} synced to Google Sheets.`);
    return true;
  } catch (error) {
    console.error('Failed to sync order to Google Sheets:', error);
    return false;
  }
};

export const startGoogleSheetsRetryJob = () => {
    console.log("Google Sheets sync retry background job started.");

    // Check every 10 minutes
    setInterval(async () => {
        try {
            const unsyncedOrders = await prisma.order.findMany({
                where: {
                    googleSheetsSynced: false
                },
                include: { items: true }
            });

            for (const order of unsyncedOrders) {
                const success = await appendOrderToSheet(order);
                if (success) {
                    console.log(`Successfully retried Google Sheets sync for Order ${order.orderNumber}`);
                }
            }
        } catch (err) {
            console.error('Google Sheets retry job error:', err);
        }
    }, 10 * 60 * 1000);
};
