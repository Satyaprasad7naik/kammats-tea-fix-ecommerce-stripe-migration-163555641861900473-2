"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
// Get all products
router.get('/', async (req, res) => {
    try {
        const products = await prisma.product.findMany({
            where: { isActive: true },
            orderBy: { createdAt: 'asc' },
        });
        res.json(products);
    }
    catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});
// Get a single product by slug
router.get('/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const product = await prisma.product.findUnique({
            where: { slug },
        });
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json(product);
    }
    catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ error: 'Failed to fetch product' });
    }
});
exports.default = router;
//# sourceMappingURL=products.js.map