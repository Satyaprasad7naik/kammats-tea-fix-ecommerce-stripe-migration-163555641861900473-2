import nodemailer from 'nodemailer';
import { generateInvoicePDFBuffer } from '../utils/invoice';

export const sendOrderEmail = async (order: any) => {
  try {
    if (!order.email) return false;

    // Use a mock transporter if actual credentials are not provided
    let transporter;
    if (process.env.SMTP_HOST && process.env.SMTP_PORT) {
        transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT),
          secure: Number(process.env.SMTP_PORT) === 465,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });
    } else {
        // Ethereal mock account for development
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass,
            },
        });
    }

    const pdfBuffer = await generateInvoicePDFBuffer(order, 'CUSTOMER');

    const mailOptions = {
      from: `"SPYLT" <${process.env.SMTP_FROM || 'orders@spylt.com'}>`,
      to: order.email,
      subject: `Order Confirmation - ${order.orderNumber}`,
      text: `Hello ${order.customerName},\n\nThank you for your order! Please find your invoice attached.\n\nOrder Total: Rs. ${order.grandTotal}\nPayment Status: ${order.paymentStatus}\n\nBest,\nSPYLT Team`,
      attachments: [
        {
          filename: `invoice-${order.invoiceNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('Failed to send order email:', error);
    return false;
  }
};

export const sendWhatsAppMessage = async (order: any) => {
  try {
    if (!order.phone) return false;

    // In a real application, you would integrate Twilio or WhatsApp Business API here.
    // We simulate the API call latency and success.

    await new Promise(resolve => setTimeout(resolve, 500));

    console.log(`[SIMULATED] WhatsApp sent to ${order.phone} for order ${order.orderNumber}`);
    return true;
  } catch (error) {
    console.error('Failed to send WhatsApp message:', error);
    return false;
  }
};
