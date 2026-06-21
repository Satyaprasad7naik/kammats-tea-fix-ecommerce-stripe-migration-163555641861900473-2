"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateInvoicePDF = void 0;
const pdfkit_1 = __importDefault(require("pdfkit"));
const generateInvoicePDF = (order, res) => {
    const doc = new pdfkit_1.default({ margin: 50 });
    res.setHeader('Content-disposition', `attachment; filename=invoice-${order.invoiceNumber || order.orderNumber}.pdf`);
    res.setHeader('Content-type', 'application/pdf');
    doc.pipe(res);
    const businessName = process.env.BUSINESS_NAME || 'SPYLT Beverages';
    const businessGstin = process.env.BUSINESS_GSTIN || '27XXXXX1234X1XZ';
    const businessAddress = process.env.BUSINESS_ADDRESS || '123 Main Street, Mumbai, Maharashtra 400001';
    // Header
    doc.fontSize(20).font('Helvetica-Bold').text(businessName, { align: 'center' });
    doc.fontSize(10).font('Helvetica').text(businessAddress, { align: 'center' });
    doc.text(`GSTIN: ${businessGstin}`, { align: 'center' });
    doc.moveDown();
    doc.fontSize(16).font('Helvetica-Bold').text('TAX INVOICE', { align: 'center' });
    doc.moveDown();
    // Order Details
    doc.fontSize(10).font('Helvetica');
    doc.text(`Invoice No: ${order.invoiceNumber || 'N/A'}`);
    doc.text(`Order No: ${order.orderNumber}`);
    doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`);
    doc.text(`Payment Status: ${order.paymentStatus}`);
    doc.moveDown();
    // Customer Details
    doc.font('Helvetica-Bold').text('Billed To:');
    doc.font('Helvetica').text(order.customerName);
    doc.text(order.address);
    doc.text(`${order.city}, ${order.state} - ${order.pincode}`);
    doc.text(`Phone: ${order.phone}`);
    if (order.email)
        doc.text(`Email: ${order.email}`);
    doc.moveDown(2);
    // Table Header
    const tableTop = doc.y;
    doc.font('Helvetica-Bold');
    doc.text('Item', 50, tableTop);
    doc.text('HSN', 200, tableTop);
    doc.text('Qty', 260, tableTop);
    doc.text('Price', 300, tableTop);
    doc.text('GST %', 360, tableTop);
    doc.text('CGST', 410, tableTop);
    doc.text('SGST', 460, tableTop);
    doc.text('Total', 510, tableTop);
    doc.moveDown();
    doc.moveTo(50, doc.y - 5).lineTo(550, doc.y - 5).stroke();
    // Table Rows
    let y = doc.y + 5;
    doc.font('Helvetica');
    order.items.forEach((item) => {
        const cgstAmount = item.gstAmount / 2;
        const sgstAmount = item.gstAmount / 2;
        doc.text(item.productName.substring(0, 20), 50, y);
        doc.text(item.hsnCode || 'N/A', 200, y);
        doc.text(item.quantity.toString(), 260, y);
        doc.text(`Rs. ${item.unitPrice.toFixed(2)}`, 300, y);
        doc.text(`${item.gstRate}%`, 360, y);
        doc.text(cgstAmount.toFixed(2), 410, y);
        doc.text(sgstAmount.toFixed(2), 460, y);
        doc.text(`Rs. ${item.lineTotal.toFixed(2)}`, 510, y);
        y += 20;
    });
    doc.moveTo(50, y).lineTo(550, y).stroke();
    doc.moveDown();
    y += 10;
    // Totals
    doc.font('Helvetica-Bold');
    doc.text('Subtotal:', 400, y);
    doc.text(`Rs. ${order.subtotal.toFixed(2)}`, 510, y);
    y += 15;
    doc.text('GST Total:', 400, y);
    doc.text(`Rs. ${order.gstTotal.toFixed(2)}`, 510, y);
    y += 20;
    doc.fontSize(12);
    doc.text('Grand Total:', 400, y);
    doc.text(`Rs. ${order.grandTotal.toFixed(2)}`, 510, y);
    doc.end();
};
exports.generateInvoicePDF = generateInvoicePDF;
//# sourceMappingURL=invoice.js.map