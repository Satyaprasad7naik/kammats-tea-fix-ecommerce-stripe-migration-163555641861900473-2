import { google } from 'googleapis';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Create a JWT client for auth
let auth: any = null;
let sheets: any = null;

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY;

if (SPREADSHEET_ID && GOOGLE_CLIENT_EMAIL && GOOGLE_PRIVATE_KEY) {
    try {
        const formattedKey = GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');
        auth = new google.auth.JWT({
            email: GOOGLE_CLIENT_EMAIL,
            key: formattedKey,
            scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });
        sheets = google.sheets({ version: 'v4', auth });
        console.log("Google Sheets Integration Initialized");
    } catch (e) {
        console.error("Failed to initialize Google Sheets", e);
    }
} else {
    console.warn("Google Sheets Integration NOT initialized: Missing credentials.");
}

const mapOrderToRow = (order: any) => {
    // Columns: Invoice Number, Order Number, Customer Name, Phone Number, Pickup Type, Products, Quantity, Grand Total, Payment Status, Order Status, Invoice Status, WhatsApp Status, Created Date, Created Time, Last Updated
    const productsDesc = order.items?.map((i: any) => `${i.productName} (x${i.quantity})`).join(', ') || 'N/A';
    const totalQty = order.items?.reduce((acc: number, i: any) => acc + i.quantity, 0) || 0;

    const createdDate = new Date(order.createdAt).toLocaleDateString();
    const createdTime = new Date(order.createdAt).toLocaleTimeString();
    const lastUpdated = new Date(order.updatedAt).toLocaleString();

    return [
        order.invoiceNumber || '',
        order.orderNumber || '',
        order.customerName || '',
        order.phone || '',
        order.pickupType || 'STORE_PICKUP',
        productsDesc,
        totalQty,
        order.grandTotal || 0,
        order.paymentStatus || '',
        order.orderStatus || '',
        order.invoiceStatus || '',
        order.whatsappStatus || '',
        createdDate,
        createdTime,
        lastUpdated
    ];
};

export const appendOrderRow = async (order: any) => {
    if (!sheets) {
        console.log(`[Google Sheets Stub] Append Row for Order ${order.orderNumber}`);
        return;
    }

    try {
        const row = mapOrderToRow(order);

        const response = await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Sheet1!A:O', // Assuming 'Sheet1' is the name of the tab
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [row]
            }
        });

        const updatedRange = response.data.updates.updatedRange;
        // The updatedRange looks like "'Sheet1'!A2:O2". Let's extract the row number.
        const rowMatch = updatedRange.match(/[A-Z]+(\d+):[A-Z]+(\d+)/);
        if (rowMatch && rowMatch[1]) {
            const rowNumber = rowMatch[1];
            await prisma.order.update({
                where: { id: order.id },
                data: { googleSheetRowId: rowNumber, sheetStatus: 'SYNCED' }
            });
            console.log(`Order ${order.orderNumber} appended to Google Sheet at row ${rowNumber}`);
        } else {
             // Just update status if we can't parse row
             await prisma.order.update({
                where: { id: order.id },
                data: { sheetStatus: 'SYNCED' }
            });
        }
    } catch (error) {
        console.error("Failed to append to Google Sheets:", error);
        await prisma.order.update({
            where: { id: order.id },
            data: { sheetStatus: 'FAILED' }
        });
    }
};

export const updateOrderRow = async (order: any) => {
    if (!sheets) {
        console.log(`[Google Sheets Stub] Update Row for Order ${order.orderNumber}`);
        return;
    }

    if (!order.googleSheetRowId) {
        console.warn(`Cannot update Google Sheet for order ${order.orderNumber}: Missing row ID`);
        // We could fallback to append if we wanted to
        return;
    }

    try {
        const row = mapOrderToRow(order);
        const range = `Sheet1!A${order.googleSheetRowId}:O${order.googleSheetRowId}`;

        await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: range,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [row]
            }
        });

        console.log(`Order ${order.orderNumber} updated in Google Sheet at row ${order.googleSheetRowId}`);
        await prisma.order.update({
            where: { id: order.id },
            data: { sheetStatus: 'SYNCED' }
        });
    } catch (error) {
        console.error("Failed to update Google Sheets:", error);
        await prisma.order.update({
            where: { id: order.id },
            data: { sheetStatus: 'FAILED' }
        });
    }
};
