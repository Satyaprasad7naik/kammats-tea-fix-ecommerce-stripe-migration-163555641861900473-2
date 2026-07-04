import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';
import { generateInvoicePDFBuffer } from '../utils/invoice';

const prisma = new PrismaClient();

export const sendOrderEmail = async (order: any) => {
  try {
    if (!order.email) return false;

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
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log(`[SIMULATED] WhatsApp sent to ${order.phone} for order ${order.orderNumber}`);
    return true;
  } catch (error) {
    console.error('Failed to send WhatsApp message:', error);
    return false;
  }
};

export const startCommunicationRetryJob = () => {
    console.log("Communication retry background job started.");

    // Check every 5 minutes
    setInterval(async () => {
        try {
            const failedCommunications = await prisma.communication.findMany({
                where: {
                    status: {
                        in: ['PENDING', 'FAILED']
                    }
                },
                include: { order: { include: { items: true } } }
            });

            for (const comm of failedCommunications) {
                let success = false;
                if (comm.type === 'EMAIL') {
                    success = await sendOrderEmail(comm.order);
                } else if (comm.type === 'WHATSAPP') {
                    success = await sendWhatsAppMessage(comm.order);
                }

                await prisma.communication.update({
                    where: { id: comm.id },
                    data: {
                        status: success ? 'SENT' : 'FAILED',
                        updatedAt: new Date()
                    }
                });

                if (success) {
                    console.log(`Successfully retried ${comm.type} for Order ${comm.order.orderNumber}`);
                }
            }
        } catch (err) {
            console.error('Communication retry job error:', err);
        }
    }, 5 * 60 * 1000);
};
