import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = express.Router();
const prisma = new PrismaClient();

const JWT_SECRET: string = process.env.JWT_SECRET as string;
if (!JWT_SECRET) {
  throw new Error("FATAL ERROR: JWT_SECRET is not configured in the environment.");
}

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const admin = await prisma.admin.findUnique({
      where: { username }
    });

    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: admin.id, username: admin.username, role: 'admin' },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.cookie('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    res.json({
      success: true,
      admin: {
        id: admin.id,
        username: admin.username
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Logout route
router.post('/logout', (req, res) => {
  res.clearCookie('admin_token');
  res.json({ success: true });
});

// Check auth status
router.get('/me', (req, res) => {
  const token = req.cookies.admin_token;
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ admin: decoded });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Middleware for protected routes
const authenticateAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const token = req.cookies.admin_token;
    if (!token) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    try {
        jwt.verify(token, JWT_SECRET);
        next();
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

// Dashboard Stats
router.get('/dashboard-stats', authenticateAdmin, async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const orders = await prisma.order.findMany();

        const todaysOrders = orders.filter((o: any) => new Date(o.createdAt) >= today);
        const todaysRevenue = todaysOrders.reduce((sum: number, o: any) => sum + o.grandTotal, 0);

        const b2bOrders = orders.filter((o: any) => o.businessType === 'B2B').length;
        const b2cOrders = orders.filter((o: any) => o.businessType === 'B2C').length;

        const pendingOrders = orders.filter((o: any) => o.orderStatus === 'PROCESSING').length;
        const completedOrders = orders.filter((o: any) => o.orderStatus === 'DELIVERED').length;

        const lowStockProducts = await prisma.product.findMany({
            where: { stock: { lte: 10 } },
            select: { id: true, name: true, stock: true }
        });

        res.json({
            todaysRevenue,
            todaysOrdersCount: todaysOrders.length,
            b2bOrders,
            b2cOrders,
            pendingOrders,
            completedOrders,
            lowStockProducts
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
});

// Update Product Stock
router.put('/products/:id/stock', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { stock } = req.body;

        if (typeof stock !== 'number' || stock < 0) {
            res.status(400).json({ error: 'Invalid stock value' });
            return;
        }

        const product = await prisma.product.update({
            where: { id: id as string },
            data: { stock }
        });

        res.json(product);
    } catch (error) {
        console.error('Error updating stock:', error);
        res.status(500).json({ error: 'Failed to update stock' });
    }
});

// Get all orders (Protected)
router.get('/orders', authenticateAdmin, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: { items: true }
    });

    res.json(orders);
  } catch (error) {
    console.error('Error fetching admin orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

export default router;
