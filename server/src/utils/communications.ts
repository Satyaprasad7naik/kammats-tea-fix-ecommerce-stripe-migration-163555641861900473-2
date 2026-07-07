import nodemailer from 'nodemailer';

// Email Transporter setup
// We only initialize this if the SMTP host is actually provided to avoid failing in environments without SMTP
let transporter: nodemailer.Transporter | null = null;

if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
} else {
    console.warn("Business OS Communications Engine: SMTP_HOST not configured. Emails will be logged but not sent.");
}


export const sendCustomerConfirmationEmail = async (order: any, pdfBuffer: Buffer) => {
    if (!order.email) return;

    if (!transporter) {
        console.log(`[COMMUNICATIONS ENGINE] Mock sendCustomerConfirmationEmail to ${order.email} for order ${order.orderNumber}`);
        return;
    }

    try {
        const info = await transporter.sendMail({
            from: '"Spylt Business OS" <orders@spylt.com>',
            to: order.email,
            subject: `Order Confirmation - ${order.orderNumber}`,
            text: `Hi ${order.customerName},\n\nYour order ${order.orderNumber} has been successfully placed. Your total is ₹${order.totalAmount}.\n\nPlease find your invoice attached.\n\nThank you for your business!`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Order Confirmation</h2>
                    <p>Hi ${order.customerName},</p>
                    <p>Your order <strong>${order.orderNumber}</strong> has been successfully placed.</p>
                    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 0; font-size: 18px;"><strong>Total Amount: ₹${order.totalAmount}</strong></p>
                    </div>
                    <p>Please find your detailed invoice attached to this email.</p>
                    <p>Thank you for your business!</p>
                </div>
            `,
            attachments: [
                {
                    filename: `Invoice-${order.orderNumber}.pdf`,
                    content: pdfBuffer
                }
            ]
        });
        console.log("Customer email sent: %s", info.messageId);
    } catch (error) {
        console.error("Failed to send customer email:", error);
    }
};

export const sendAdminNotificationEmail = async (order: any, pdfBuffer: Buffer) => {
    if (!transporter) {
        console.log(`[COMMUNICATIONS ENGINE] Mock sendAdminNotificationEmail to admin for order ${order.orderNumber}`);
        return;
    }

    try {
        const info = await transporter.sendMail({
            from: '"Spylt Business OS" <system@spylt.com>',
            to: process.env.ADMIN_EMAIL || 'admin@spylt.com',
            subject: `New Order Received - ${order.orderNumber} [${order.businessType}]`,
            text: `A new order has been received.\n\nOrder Number: ${order.orderNumber}\nCustomer: ${order.customerName}\nType: ${order.businessType}\nTotal: ₹${order.totalAmount}\n\nInternal invoice attached.`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>New Order Alert</h2>
                    <p>A new order has been received.</p>
                    <ul>
                        <li><strong>Order Number:</strong> ${order.orderNumber}</li>
                        <li><strong>Customer:</strong> ${order.customerName}</li>
                        <li><strong>Business Type:</strong> ${order.businessType}</li>
                        <li><strong>Total Amount:</strong> ₹${order.totalAmount}</li>
                    </ul>
                    <p>Please find the internal processing invoice attached.</p>
                </div>
            `,
            attachments: [
                {
                    filename: `Internal-Invoice-${order.orderNumber}.pdf`,
                    content: pdfBuffer
                }
            ]
        });
        console.log("Admin notification email sent: %s", info.messageId);
    } catch (error) {
        console.error("Failed to send admin notification email:", error);
    }
};

export const generateWhatsAppMessage = (order: any, isAdmin: boolean = false) => {
    if (isAdmin) {
        return `*New Order Alert - Spylt* 🚀\n\n*Order ID:* ${order.orderNumber}\n*Customer:* ${order.customerName}\n*Type:* ${order.businessType}\n*Value:* ₹${order.totalAmount}\n\nPlease check the Admin Dashboard for details.`;
    } else {
        return `Hi ${order.customerName}, thank you for your order from Spylt! 🥤\n\n*Order ID:* ${order.orderNumber}\n*Total Amount:* ₹${order.totalAmount}\n\nYour order is currently processing. You can download your invoice from the checkout success page.`;
    }
};
