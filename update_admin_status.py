import os

filepath = 'server/src/routes/admin.ts'
with open(filepath, 'r') as f:
    content = f.read()

old_status_logic = """        const dataToUpdate: any = {};
        if (orderStatus) dataToUpdate.orderStatus = orderStatus;
        if (paymentStatus) dataToUpdate.paymentStatus = paymentStatus;

        const order = await prisma.order.update({
            where: { id: id as string },
            data: dataToUpdate
        });"""

new_status_logic = """        const existingOrder = await prisma.order.findUnique({ where: { id: id as string } });
        if (!existingOrder) {
            res.status(404).json({ error: 'Order not found' });
            return;
        }

        const validTransitions: Record<string, string[]> = {
            'DRAFT': ['SUBMITTED', 'CANCELLED'],
            'SUBMITTED': ['AWAITING_PAYMENT', 'CONFIRMED', 'CANCELLED', 'REJECTED'],
            'AWAITING_PAYMENT': ['PAYMENT_VERIFIED', 'EXPIRED', 'CANCELLED'],
            'PAYMENT_VERIFIED': ['CONFIRMED', 'CANCELLED'],
            'CONFIRMED': ['PREPARING', 'CANCELLED'],
            'PREPARING': ['PACKED', 'CANCELLED'],
            'PACKED': ['READY', 'CANCELLED'],
            'READY': ['OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'],
            'OUT_FOR_DELIVERY': ['DELIVERED', 'CANCELLED'],
            'DELIVERED': ['COMPLETED'],
            'COMPLETED': [], // Terminal state
            'CANCELLED': [], // Terminal state
            'REJECTED': [], // Terminal state
            'EXPIRED': [] // Terminal state
        };

        if (orderStatus && existingOrder.orderStatus !== orderStatus) {
            const allowedNextStates = validTransitions[existingOrder.orderStatus] || [];
            if (!allowedNextStates.includes(orderStatus)) {
                res.status(400).json({ error: `Invalid state transition from ${existingOrder.orderStatus} to ${orderStatus}` });
                return;
            }
        }

        const dataToUpdate: any = {};
        if (orderStatus) dataToUpdate.orderStatus = orderStatus;
        if (paymentStatus) dataToUpdate.paymentStatus = paymentStatus;

        const order = await prisma.order.update({
            where: { id: id as string },
            data: dataToUpdate
        });"""

content = content.replace(old_status_logic, new_status_logic)

with open(filepath, 'w') as f:
    f.write(content)
