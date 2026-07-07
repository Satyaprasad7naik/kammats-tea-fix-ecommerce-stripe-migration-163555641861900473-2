import PDFDocument from 'pdfkit';
import { Response } from 'express';

export const generateInvoicePDFBuffer = async (order: any, type: 'CUSTOMER' | 'INTERNAL'): Promise<Buffer> => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
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

        // Footer
        doc.fontSize(10).font('Helvetica');
        doc.text('Thank you for your business!', 50, 700, { align: 'center', width: 500 });

        doc.end();
    });
};

export const generateInvoicePDF = async (order: any, type: 'CUSTOMER' | 'INTERNAL', res: Response) => {
    try {
        const buffer = await generateInvoicePDFBuffer(order, type);

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
