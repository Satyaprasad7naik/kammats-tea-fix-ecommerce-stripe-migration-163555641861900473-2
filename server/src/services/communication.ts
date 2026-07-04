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
  } catch (error: any) {
    // Intelligent failure classification
    let reason = "Unknown SMTP Error";
    if (error.code === 'ECONNECTION') reason = "Network Connection Error";
    if (error.responseCode >= 500) reason = "SMTP Server Error";
    if (error.responseCode >= 400 && error.responseCode < 500) reason = "SMTP Auth/Client Error";
    console.error('Failed to send order email:', error);
    throw new Error(reason);
  }
};

export const sendWhatsAppMessage = async (order: any) => {
  try {
    if (!order.phone) return false;
    await new Promise(resolve => setTimeout(resolve, 500));

    // Simulate a failure for observability testing randomly 5% of time
    if (Math.random() < 0.05) {
        throw new Error("WhatsApp API Timeout");
    }

    console.log(`[SIMULATED] WhatsApp sent to ${order.phone} for order ${order.orderNumber}`);
    return true;
  } catch (error: any) {
    console.error('Failed to send WhatsApp message:', error);
    throw new Error(error.message || "WhatsApp Provider API Error");
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
                    },
                    attempts: {
                        lt: 3 // Retry up to 3 times (Dead letter queue equivalent)
                    }
                },
                include: { order: { include: { items: true } } }
            });

            for (const comm of failedCommunications) {
                let success = false;
                let failureReason = null;

                try {
                    if (comm.type === 'EMAIL') {
                        success = await sendOrderEmail(comm.order);
                    } else if (comm.type === 'WHATSAPP') {
                        success = await sendWhatsAppMessage(comm.order);
                    }
                } catch(e: any) {
                    success = false;
                    failureReason = e.message || "Unknown error";
                }

                const newAttempts = comm.attempts + 1;

                await prisma.communication.update({
                    where: { id: comm.id },
                    data: {
                        status: success ? 'SENT' : (newAttempts >= 3 ? 'DEAD_LETTER' : 'FAILED'),
                        attempts: newAttempts,
                        failureReason: success ? null : failureReason,
                        updatedAt: new Date()
                    }
                });

                if (success) {
                    console.log(`Successfully retried ${comm.type} for Order ${comm.order.orderNumber}`);
                } else if (newAttempts >= 3) {
                    console.log(`Communication ${comm.id} marked as DEAD_LETTER after 3 failed attempts.`);
                }
            }
        } catch (err) {
            console.error('Communication retry job error:', err);
        }
    }, 5 * 60 * 1000);
};
