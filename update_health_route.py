import os

filepath = 'server/src/routes/admin.ts'
with open(filepath, 'r') as f:
    content = f.read()

old_health_logic = """// System Health Monitoring
router.get('/system-health', authenticateAdmin, async (req, res) => {
    try {
        const freeMem = os.freemem();
        const totalMem = os.totalmem();
        const usedMem = totalMem - freeMem;
        const memoryUsagePercent = ((usedMem / totalMem) * 100).toFixed(2);

        let dbStatus = 'disconnected';
        try {
            await prisma.$queryRaw`SELECT 1`;
            dbStatus = 'connected';
        } catch (err) {
            console.error('Database connectivity check failed', err);
        }

        const unsyncedSheetsCount = await prisma.order.count({
            where: { googleSheetsSynced: false }
        });

        const deadLetterCount = await prisma.communication.count({
            where: { status: 'DEAD_LETTER' }
        });

        const pendingCommCount = await prisma.communication.count({
            where: { status: 'PENDING' }
        });

        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            database: dbStatus,
            memoryUsage: `${memoryUsagePercent}%`,
            freeMemoryMB: (freeMem / 1024 / 1024).toFixed(2),
            uptimeSeconds: process.uptime(),
            metrics: {
                unsyncedSheetsCount,
                deadLetterCount,
                pendingCommCount
            }
        });
    } catch (error) {
        console.error('Error fetching system health:', error);
        res.status(500).json({ error: 'Failed to fetch system health' });
    }
});"""

new_health_logic = """// System Health Monitoring
router.get('/system-health', authenticateAdmin, async (req, res) => {
    try {
        const unsyncedSheetsCount = await prisma.order.count({
            where: { googleSheetsSynced: false }
        });

        const deadLetterCount = await prisma.communication.count({
            where: { status: 'DEAD_LETTER' }
        });

        const failedCommunicationsCount = await prisma.communication.count({
            where: { status: 'FAILED' }
        });

        const pendingOrdersCount = await prisma.order.count({
            where: { orderStatus: 'SUBMITTED' }
        });

        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            metrics: {
                unsyncedSheetsCount,
                deadLetterCount,
                failedCommunicationsCount,
                pendingOrdersCount
            }
        });
    } catch (error) {
        console.error('Error fetching system health:', error);
        res.status(500).json({ error: 'Failed to fetch system health' });
    }
});"""

content = content.replace(old_health_logic, new_health_logic)

with open(filepath, 'w') as f:
    f.write(content)
