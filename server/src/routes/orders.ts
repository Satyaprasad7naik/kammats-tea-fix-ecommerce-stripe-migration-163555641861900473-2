import express from 'express';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import { generateInvoicePDF } from '../utils/invoice';

const router = express.Router();
const prisma = new PrismaClient();

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("FATAL ERROR: STRIPE_SECRET_KEY is not configured.");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16' as any, // fallback for older stripe typing
});

// Create an order
router.post('/', async (req, res) => {
  try {
    const {
      customerName,
      phone,
      email,
      address,
      city,
      state,
      pincode,
      items, // Array of { productId, quantity }
    } = req.body;

    if (!customerName || !phone || !address || !city || !state || !pincode || !items || !items.length) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate quantities to prevent negative amounts or 0
    for (const item of items) {
      if (typeof item.quantity !== 'number' || item.quantity <= 0 || !Number.isInteger(item.quantity)) {
        return res.status(400).json({ error: 'Invalid quantity provided' });
      }
    }

    // Move everything inside a transaction to prevent race conditions
    const orderResult = await prisma.$transaction(async (tx) => {
      // 1. Fetch products to calculate exact prices (never trust frontend prices)
      let subtotal = 0;
      let gstTotal = 0;
      const orderItemsData: any[] = [];

      for (const item of items) {
        // Lock the product row for update to prevent concurrent race conditions on stock
        const products: any[] = await tx.$queryRaw`SELECT * FROM "Product" WHERE "id" = ${item.productId} FOR UPDATE`;

        if (products.length === 0) {
          throw new Error(`Product with id ${item.productId} not found`);
        }

        const product = products[0];

        if (product.stock < item.quantity) {
          throw new Error(`Insufficient stock for product ${product.name}`);
        }

        const itemSubtotal = Number((product.price * item.quantity).toFixed(2));
        const itemGstAmount = Number(((itemSubtotal * product.gstRate) / 100).toFixed(2));
        const lineTotal = Number((itemSubtotal + itemGstAmount).toFixed(2));

        subtotal += itemSubtotal;
        gstTotal += itemGstAmount;

        orderItemsData.push({
          productId: product.id,
          productName: product.name,
          quantity: item.quantity,
          unitPrice: product.price,
          gstRate: product.gstRate,
          hsnCode: product.hsnCode,
          gstAmount: itemGstAmount,
          lineTotal: lineTotal
        });
      }

      subtotal = Number(subtotal.toFixed(2));
      gstTotal = Number(gstTotal.toFixed(2));
      const grandTotal = Number((subtotal + gstTotal).toFixed(2));
      const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

      // 2. Create Stripe PaymentIntent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(grandTotal * 100),
        currency: 'inr',
        metadata: {
          orderNumber,
        },
      });

      // 3. Create the order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          customerName,
          phone,
          email,
          address,
          city,
          state,
          pincode,
          subtotal,
          gstTotal,
          grandTotal,
          paymentStatus: 'PENDING',
          orderStatus: 'PROCESSING',
          stripePaymentIntentId: paymentIntent.id,
          items: {
            create: orderItemsData
          }
        },
        include: {
          items: true
        }
      });

      return { order: newOrder, clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id };
    });

    res.status(201).json(orderResult);

  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Verify Payment
router.post('/verify', async (req, res) => {
  try {
    const { payment_intent_id } = req.body;

    if (!payment_intent_id) {
      return res.status(400).json({ error: 'Missing Payment Intent ID' });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ error: 'Payment not successful' });
    }

    // Payment is successful, update order status
    const order = await prisma.$transaction(async (tx) => {
      // Use raw query for true row-level locking (SELECT ... FOR UPDATE) to prevent race conditions
      const existingOrders: any[] = await tx.$queryRaw`SELECT "paymentStatus", "id", "orderNumber", "invoiceNumber" FROM "Order" WHERE "stripePaymentIntentId" = ${payment_intent_id} FOR UPDATE`;

      if (existingOrders.length === 0) {
        throw new Error('Order not found');
      }

      if (existingOrders[0].paymentStatus === 'PAID') {
        // Return existing order instead of throwing an error for idempotency.
        return tx.order.findUnique({
            where: { id: existingOrders[0].id },
            include: { items: true }
        });
      }

      const updatedOrder = await tx.order.update({
        where: { stripePaymentIntentId: payment_intent_id },
        data: {
          paymentStatus: 'PAID',
          invoiceNumber: `INV-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`,
        },
        include: { items: true }
      });

      // Decrement stock only when payment is actually confirmed via verify or webhook
      for (const item of updatedOrder.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity
            }
          }
        });
      }

      return updatedOrder;
    });

    res.json({ status: 'success', order });

  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ error: 'Payment verification failed' });
  }
});


// Generate Invoice
router.get('/:id/invoice', async (req, res) => {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.paymentStatus !== 'PAID') {
      return res.status(400).json({ error: 'Cannot generate invoice for unpaid order' });
    }

    generateInvoicePDF(order, res);

  } catch (error) {
    console.error('Error generating invoice:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate invoice' });
    }
  }
});

// Get a single order by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

export default router;