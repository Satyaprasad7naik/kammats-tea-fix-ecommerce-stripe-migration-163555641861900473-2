import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Get all products
router.get('/', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
    });

    // Parse the JSON images back to array before sending to frontend
    const parsedProducts = products.map(p => ({
      ...p,
      images: JSON.parse(p.images)
    }));

    if (parsedProducts.length === 0) {
      throw new Error("Products not found in database");
    }
    res.json(parsedProducts);
  } catch (error) {
    console.error('Error fetching products from DB:', error);
    res.status(500).json({ error: 'Failed to fetch products from DB' });
  }
});

// Get a single product by id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const parsedProduct = {
      ...product,
      images: JSON.parse(product.images)
    };

    res.json(parsedProduct);
  } catch (error) {
    console.error('Error fetching product from DB:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

export default router;
