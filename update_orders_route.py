import os

filepath = 'server/src/routes/orders.ts'
with open(filepath, 'r') as f:
    content = f.read()

old_logic = """            if (orderResult.email) {
                const emailSuccess = await sendOrderEmail(orderResult);
                await prisma.communication.updateMany({
                    where: { orderId: orderResult.id, type: 'EMAIL' },
                    data: { status: emailSuccess ? 'SENT' : 'FAILED' }
                });
            }
            if (orderResult.phone) {
                const waSuccess = await sendWhatsAppMessage(orderResult);
                await prisma.communication.updateMany({
                    where: { orderId: orderResult.id, type: 'WHATSAPP' },
                    data: { status: waSuccess ? 'SENT' : 'FAILED' }
                });
            }"""

new_logic = """            if (orderResult.email) {
                const emailSuccess = await sendOrderEmail(orderResult);
                await prisma.communication.updateMany({
                    where: { orderId: orderResult.id, type: 'EMAIL' },
                    data: {
                        status: emailSuccess ? 'SENT' : 'FAILED',
                        attempts: 1,
                        failureReason: emailSuccess ? null : 'Initial synchronous send failed'
                    }
                });
            }
            if (orderResult.phone) {
                const waSuccess = await sendWhatsAppMessage(orderResult);
                await prisma.communication.updateMany({
                    where: { orderId: orderResult.id, type: 'WHATSAPP' },
                    data: {
                        status: waSuccess ? 'SENT' : 'FAILED',
                        attempts: 1,
                        failureReason: waSuccess ? null : 'Initial synchronous send failed'
                    }
                });
            }"""

content = content.replace(old_logic, new_logic)

with open(filepath, 'w') as f:
    f.write(content)
