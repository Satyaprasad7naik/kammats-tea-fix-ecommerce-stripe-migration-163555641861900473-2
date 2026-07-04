import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

export const generateInvoicePDFBuffer = async (order: any, type: 'CUSTOMER' | 'INTERNAL' = 'CUSTOMER'): Promise<Buffer> => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const fileName = type === 'INTERNAL' ? order.internalInvoiceNumber : order.invoiceNumber;

      const businessName = process.env.BUSINESS_NAME || 'SPYLT Beverages';
      const businessGstin = process.env.BUSINESS_GSTIN || '27XXXXX1234X1XZ';
      const businessAddress = process.env.BUSINESS_ADDRESS || '123 Main Street, Mumbai, Maharashtra 400001';

      // Header
      doc.fontSize(20).font('Helvetica-Bold').text(businessName, { align: 'center' });
      doc.fontSize(10).font('Helvetica').text(businessAddress, { align: 'center' });
      doc.text(`GSTIN: ${businessGstin}`, { align: 'center' });
      doc.moveDown();

      doc.fontSize(16).font('Helvetica-Bold').text(type === 'INTERNAL' ? 'INTERNAL INVOICE' : 'TAX INVOICE', { align: 'center' });
      doc.moveDown();

      // Order Details
      doc.fontSize(10).font('Helvetica');
      doc.text(`Invoice No: ${fileName || 'N/A'}`);
      doc.text(`Order No: ${order.orderNumber}`);
      doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`);
      doc.text(`Payment Status: ${order.paymentStatus}`);
      doc.text(`Business Type: ${order.businessType}`);
      doc.moveDown();

      // Customer Details
      doc.font('Helvetica-Bold').text('Billed To:');
      doc.font('Helvetica').text(order.customerName);
      doc.text(order.address);
      doc.text(`${order.city}, ${order.state} - ${order.pincode}`);
      doc.text(`Phone: ${order.phone}`);
      if (order.email) doc.text(`Email: ${order.email}`);
      doc.moveDown(2);

      // Table Header
      const tableTop = doc.y;
      doc.font('Helvetica-Bold');
      doc.text('Item', 50, tableTop);
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

      let totalCost = 0;

      order.items.forEach((item: any) => {
        const cgstAmount = item.gstAmount / 2;
        const sgstAmount = item.gstAmount / 2;

        doc.text(item.productName.substring(0, 20), 50, y);
        doc.text(item.quantity.toString(), 260, y);
        doc.text(`Rs. ${item.unitPrice.toFixed(2)}`, 300, y);
        doc.text(`${item.gstRate}%`, 360, y);
        doc.text(cgstAmount.toFixed(2), 410, y);
        doc.text(sgstAmount.toFixed(2), 460, y);
        doc.text(`Rs. ${item.lineTotal.toFixed(2)}`, 510, y);

        if (type === 'INTERNAL' && item.product && item.product.costPrice) {
            totalCost += (item.product.costPrice * item.quantity);
        }

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
      doc.fontSize(10);

      y += 40;

      if (type === 'CUSTOMER') {
          try {
              const upiId = process.env.BUSINESS_UPI_ID || 'spylt@upi';
              const upiName = process.env.BUSINESS_NAME || 'SPYLT Beverages';
              const upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(upiName)}&am=${order.grandTotal}&cu=INR&tn=${encodeURIComponent('Order ' + order.orderNumber)}`;
              const qrCodeDataUrl = await QRCode.toDataURL(upiUri);
              const base64Data = qrCodeDataUrl.split(',')[1];
              if (base64Data) {
                  const qrCodeImage = Buffer.from(base64Data, 'base64');
                  doc.text('Scan to Pay via UPI', 50, y);
                  doc.image(qrCodeImage, 50, y + 15, { width: 100 });
              }
          } catch (err) {
              console.error('QR code generation failed', err);
          }

          doc.text('Terms & Conditions:', 300, y);
          doc.font('Helvetica').text('1. No refunds on processed orders.', 300, y + 15);
          doc.text('2. Please keep this invoice for reference.', 300, y + 30);
      } else {
          doc.font('Helvetica-Bold').text('INTERNAL SUMMARY', 50, y);
          y += 20;
          doc.font('Helvetica').text(`Order Notes: ${order.notes || 'None'}`, 50, y);
          y += 15;
          if (totalCost > 0) {
              doc.text(`Estimated Cost: Rs. ${totalCost.toFixed(2)}`, 50, y);
              y += 15;
              const margin = order.subtotal - totalCost;
              doc.text(`Estimated Margin: Rs. ${margin.toFixed(2)}`, 50, y);
          }
      }

      doc.end();
    } catch(err) {
      reject(err);
    }
  });
};
