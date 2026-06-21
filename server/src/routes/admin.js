"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;
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
        const isMatch = await bcryptjs_1.default.compare(password, admin.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = jsonwebtoken_1.default.sign({ id: admin.id, username: admin.username, role: 'admin' }, JWT_SECRET, { expiresIn: '1d' });
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
    }
    catch (error) {
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
    if (!token)
        return res.status(401).json({ error: 'Unauthorized' });
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        res.json({ admin: decoded });
    }
    catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
});
// Get all orders (Protected)
router.get('/orders', async (req, res) => {
    try {
        const token = req.cookies.admin_token;
        if (!token)
            return res.status(401).json({ error: 'Unauthorized' });
        try {
            jsonwebtoken_1.default.verify(token, JWT_SECRET);
        }
        catch (err) {
            return res.status(401).json({ error: 'Invalid token' });
        }
        const orders = await prisma.order.findMany({
            orderBy: { createdAt: 'desc' },
            include: { items: true }
        });
        res.json(orders);
    }
    catch (error) {
        console.error('Error fetching admin orders:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});
exports.default = router;
//# sourceMappingURL=admin.js.map