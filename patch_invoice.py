import re

with open('server/src/utils/invoice.ts', 'r') as f:
    content = f.read()

# Modify generateInvoicePDFBuffer to add QR Code / UPI
# Also write file to disk

new_code = """import PDFDocument from 'pdfkit';
import { Response } from 'express';
import fs from 'fs';
import path from 'path';

export const generateInvoicePDFBuffer = async (order: any, type: 'CUSTOMER' | 'INTERNAL'): Promise<{buffer: Buffer, url?: string}> => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => {
             const buffer = Buffer.concat(chunks);

             // Save to disk if order is provided
             let invoiceUrl = undefined;
             if (order && order.orderNumber) {
                 const fileName = `INV-${order.orderNumber}-v${order.invoiceVersion || 1}.pdf`;
                 const dir = path.join(process.cwd(), 'uploads', 'invoices');
                 if (!fs.existsSync(dir)) {
                     fs.mkdirSync(dir, { recursive: true });
                 }
                 const filePath = path.join(dir, fileName);
                 fs.writeFileSync(filePath, buffer);
                 // Assuming static serving of uploads folder
                 invoiceUrl = `/uploads/invoices/${fileName}`;
             }

             resolve({buffer, url: invoiceUrl});
        });
        doc.on('error', reject);

        const businessName = process.env.BUSINESS_NAME || 'SPYLT Beverages';
        const businessGstin = process.env.BUSINESS_GSTIN || '27XXXXX1234X1XZ';
        const businessAddress = process.env.BUSINESS_ADDRESS || '123 Main Street, Mumbai, Maharashtra 400001';

        // Header
        doc.fontSize(20).font('Helvetica-Bold').text(businessName, { align: 'center' });
        doc.fontSize(10).font('Helvetica').text(businessAddress, { align: 'center' });
        doc.text(`GSTIN: ${businessGstin}`, { align: 'center' });
        doc.moveDown();

        const title = type === 'INTERNAL' ? 'INTERNAL ORDER AUDIT' : 'TAX INVOICE';
        doc.fontSize(16).font('Helvetica-Bold').text(title, { align: 'center' });
        doc.moveDown();

        // Order Details
        doc.fontSize(10).font('Helvetica');
        doc.text(`Invoice No: ${order.invoiceNumber || 'N/A'}`);
        doc.text(`Order No: ${order.orderNumber}`);
        doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`);
        doc.text(`Type: ${order.businessType}`);
        doc.text(`Pickup: ${order.pickupType || 'STORE_PICKUP'}`);
        doc.text(`Payment Status: ${order.paymentStatus}`);

        doc.moveDown();

        // Customer Details
        doc.font('Helvetica-Bold').text('Billed To:');
        doc.font('Helvetica').text(order.customerName);
        doc.text(order.address);
        doc.text(`${order.city}, ${order.state} - ${order.pincode}`);
        doc.text(`Phone: ${order.phone}`);
        if (order.email) doc.text(`Email: ${order.email}`);

        if (type === 'INTERNAL' && order.customerNotes) {
            doc.moveDown();
            doc.font('Helvetica-Bold').text('Customer Notes:');
            doc.font('Helvetica').text(order.customerNotes);
        }
        doc.moveDown(2);

        // Table Header
        const tableTop = doc.y;
        doc.font('Helvetica-Bold');
        doc.text('Item', 50, tableTop);
        doc.text('Qty', 250, tableTop);
        doc.text('Price', 300, tableTop);
        doc.text('GST Amount', 380, tableTop);
        doc.text('Total', 470, tableTop);

        doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

        let y = tableTop + 25;
        doc.font('Helvetica');

        // Table Rows
        order.items.forEach((item: any) => {
            doc.text(item.productName, 50, y);
            doc.text(item.quantity.toString(), 250, y);
            doc.text(`Rs. ${item.unitPrice.toFixed(2)}`, 300, y);
            doc.text(`Rs. ${item.gstAmount.toFixed(2)}`, 380, y);
            doc.text(`Rs. ${item.lineTotal.toFixed(2)}`, 470, y);
            y += 20;
        });

        doc.moveTo(50, y).lineTo(550, y).stroke();
        y += 10;

        // Totals
        doc.font('Helvetica-Bold');
        doc.text('Subtotal:', 380, y);
        doc.text(`Rs. ${order.subtotal.toFixed(2)}`, 470, y);
        y += 15;

        doc.text('Total GST:', 380, y);
        doc.text(`Rs. ${order.gstTotal.toFixed(2)}`, 470, y);
        y += 15;

        doc.fontSize(12);
        doc.text('Grand Total:', 380, y);
        doc.text(`Rs. ${order.grandTotal.toFixed(2)}`, 470, y);
        y += 30;

        // Payment QR Code (Mock block since we don't have an image file handy, but text instructions)
        if (order.paymentStatus !== 'PAID') {
            doc.fontSize(12).font('Helvetica-Bold').text('Payment Instructions', 50, y);
            y += 15;
            doc.fontSize(10).font('Helvetica').text('Please scan the QR code at the store or use the UPI link below to complete your payment.', 50, y);
            y += 15;
            const businessUpiId = process.env.BUSINESS_UPI_ID || 'kammatstea@ybl';
            const totalAmount = order.totalAmount || order.grandTotal;
            const upiLink = `upi://pay?pa=${businessUpiId}&pn=KammatsTea&tr=${order.orderNumber}&am=${totalAmount}&cu=INR`;
            doc.font('Helvetica').text(`UPI ID: ${businessUpiId}`, 50, y);
            y += 15;
            doc.fillColor('blue').text(`Google Pay Link (Clickable): ${upiLink}`, 50, y, { link: upiLink });
            doc.fillColor('black');
            y += 30;
        }

        // Footer
        doc.fontSize(10).font('Helvetica');
        doc.text('Thank you for your business!', 50, 700, { align: 'center', width: 500 });
        doc.text(`Business Contact: ${process.env.BUSINESS_PHONE || '+91 9876543210'}`, 50, 715, { align: 'center', width: 500 });

        doc.end();
    });
};

export const generateInvoicePDF = async (order: any, type: 'CUSTOMER' | 'INTERNAL', res: Response) => {
    try {
        const {buffer} = await generateInvoicePDFBuffer(order, type);

        const prefix = type === 'INTERNAL' ? 'internal-audit' : 'invoice';
        res.setHeader('Content-disposition', `attachment; filename=${prefix}-${order.invoiceNumber || order.orderNumber}.pdf`);
        res.setHeader('Content-type', 'application/pdf');

        res.end(buffer);
    } catch (error) {
        console.error('Error generating PDF:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to generate invoice PDF' });
        }
    }
};
"""

with open('server/src/utils/invoice.ts', 'w') as f:
    f.write(new_code)
