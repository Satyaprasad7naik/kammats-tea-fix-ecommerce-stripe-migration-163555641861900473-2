import re

with open('server/src/routes/orders.ts', 'r') as f:
    content = f.read()

# Replace the PDF generation block inside the background async task
old_block = """            // 1. Generate PDFs
            const customerPdf = await generateInvoicePDFBuffer(orderResult.order, 'CUSTOMER');
            const internalPdf = await generateInvoicePDFBuffer(orderResult.order, 'INTERNAL');

            // 2. Send Emails (if email provided)
            await sendCustomerConfirmationEmail(orderResult.order, customerPdf);
            await sendAdminNotificationEmail(orderResult.order, internalPdf);"""

new_block = """            // 1. Generate PDFs
            const customerPdfData = await generateInvoicePDFBuffer(orderResult.order, 'CUSTOMER');
            const internalPdfData = await generateInvoicePDFBuffer(orderResult.order, 'INTERNAL');

            if (customerPdfData.url) {
                await prisma.order.update({
                    where: { id: orderResult.order.id },
                    data: { invoiceUrl: customerPdfData.url }
                });
            }

            // 2. Send Emails (if email provided)
            await sendCustomerConfirmationEmail(orderResult.order, customerPdfData.buffer);
            await sendAdminNotificationEmail(orderResult.order, internalPdfData.buffer);"""

content = content.replace(old_block, new_block)

with open('server/src/routes/orders.ts', 'w') as f:
    f.write(content)
