import express from 'express';

const router = express.Router();

const products = [
  {
    id: "1",
    name: 'Chocolate Milk',
    slug: 'chocolate-milk',
    description: 'Rich, creamy chocolate milk.',
    shortDescription: 'Classic Chocolate',
    price: 99,
    gstRate: 18,
    hsnCode: '2202',
    stock: 100,
    category: 'Milkshake',
    images: [
      'https://cdn.prod.website-files.com/6707999f0e8f3bdab42cb624/670e515a96de6ca581e89ee2_Shop-product-cup_1.webp',
      'https://cdn.prod.website-files.com/6707999f0e8f3bdab42cb624/670e5150e05e18c255f70b1c_Shop-product-back_1.svg',
      'https://cdn.prod.website-files.com/6707999f0e8f3bdab42cb624/670e515f8a6b1236299f2b17_pieces.png',
      '#d69766', // color
      '#fff' // textColor
    ]
  },
  {
    id: "2",
    name: 'Strawberry Milk',
    slug: 'strawberry-milk',
    description: 'Fresh and fruity strawberry milk.',
    shortDescription: 'Fresh Strawberry',
    price: 99,
    gstRate: 18,
    hsnCode: '2202',
    stock: 100,
    category: 'Milkshake',
    images: [
      'https://cdn.prod.website-files.com/6707999f0e8f3bdab42cb624/670e50cdb36e7db2c2ca3681_Shop-product-cup_2.webp',
      'https://cdn.prod.website-files.com/6707999f0e8f3bdab42cb624/670e50c4e61989bc963cf1b1_Shop-product-back_1.svg',
      'https://cdn.prod.website-files.com/6707999f0e8f3bdab42cb624/670e50d598cd58638dbad73d_pieces.png',
      '#d94b59', // color
      '#fff' // textColor
    ]
  }
];

// Get all products
router.get('/', async (req, res) => {
  try {
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get a single product by slug
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const product = products.find(p => p.slug === slug);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

export default router;
