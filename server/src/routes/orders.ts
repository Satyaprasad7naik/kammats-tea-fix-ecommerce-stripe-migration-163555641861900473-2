import express from 'express';
import { PrismaClient } from '@prisma/client';
import { generateInvoicePDFBuffer } from '../utils/invoice';
import { sendOrderEmail, sendWhatsAppMessage } from '../services/communication';
import { appendOrderToSheet } from '../services/googleSheets';

const router = express.Router();
const prisma = new PrismaClient();

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
      businessType, // 'B2B' or 'B2C'
      notes
    } = req.body;

    if (!customerName || !phone || !address || !city || !state || !pincode || !items || !items.length) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const resolvedBusinessType = businessType === 'B2B' ? 'B2B' : 'B2C';

    // Validate quantities to prevent negative amounts or 0
    for (const item of items) {
      if (typeof item.quantity !== 'number' || item.quantity <= 0 || !Number.isInteger(item.quantity)) {
        return res.status(400).json({ error: 'Invalid quantity provided' });
      }
    }

    // Move everything inside a transaction
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

        // Decrement stock immediately on order creation
        await tx.product.update({
          where: { id: product.id },
          data: {
            stock: {
              decrement: item.quantity
            }
          }
        });
      }

      subtotal = Number(subtotal.toFixed(2));
      gstTotal = Number(gstTotal.toFixed(2));
      const grandTotal = Number((subtotal + gstTotal).toFixed(2));

      const uniqueSuffix = `${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
      const orderNumber = `ORD-${uniqueSuffix}`;
      const invoiceNumber = `INV-${uniqueSuffix}`;
      const internalInvoiceNumber = `INT-${uniqueSuffix}`;

      // Create the order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          invoiceNumber,
          internalInvoiceNumber,
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
          businessType: resolvedBusinessType,
          notes: notes || null,
          items: {
            create: orderItemsData
          }
        },
        include: {
          items: true
        }
      });

      // Create Audit Log
      await tx.auditLog.create({
        data: {
          orderId: newOrder.id,
          action: 'ORDER_CREATED',
          details: `Order created for ${customerName} with total ${grandTotal}`
        }
      });

      // Create Communication pending records
      if (email) {
          await tx.communication.create({
              data: {
                  orderId: newOrder.id,
                  type: 'EMAIL',
                  recipient: email,
                  status: 'PENDING',
                  message: `Order confirmation for ${orderNumber}`
              }
          });
      }
      if (phone) {
          await tx.communication.create({
              data: {
                  orderId: newOrder.id,
                  type: 'WHATSAPP',
                  recipient: phone,
                  status: 'PENDING',
                  message: `Order confirmation for ${orderNumber}`
              }
          });
      }

      return newOrder;
    });

    // Fire and forget communication sending and syncing
    (async () => {
        try {
            await appendOrderToSheet(orderResult);

            if (orderResult.email) {
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
            }
        } catch (e) {
            console.error("Async communication/sync failed", e);
        }
    })();

    const upiId = process.env.BUSINESS_UPI_ID || 'spylt@upi';
    const upiName = process.env.BUSINESS_NAME || 'SPYLT Beverages';
    // standard UPI URI scheme
    const upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(upiName)}&am=${orderResult.grandTotal}&cu=INR&tn=${encodeURIComponent('Order ' + orderResult.orderNumber)}`;

    res.status(201).json({ order: orderResult, upiUri });

  } catch (error: any) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: error.message || 'Failed to create order' });
  }
});

// Generate Customer Invoice
router.get('/:id/customer-invoice', async (req, res) => {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const pdfBuffer = await generateInvoicePDFBuffer(order, 'CUSTOMER');
    res.setHeader('Content-disposition', `attachment; filename=invoice-${order.invoiceNumber || order.orderNumber}.pdf`);
    res.setHeader('Content-type', 'application/pdf');
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Error generating invoice:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate invoice' });
    }
  }
});

// Generate Internal Invoice
router.get('/:id/internal-invoice', async (req, res) => {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: { include: { product: true } } }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const pdfBuffer = await generateInvoicePDFBuffer(order, 'INTERNAL');
    res.setHeader('Content-disposition', `attachment; filename=invoice-${order.internalInvoiceNumber || order.orderNumber}.pdf`);
    res.setHeader('Content-type', 'application/pdf');
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Error generating internal invoice:', error);
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
      include: { items: true, auditLogs: true, communications: true }
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
