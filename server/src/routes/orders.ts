import express from 'express';
import { PrismaClient } from '@prisma/client';
import { generateInvoicePDF, generateInvoicePDFBuffer } from '../utils/invoice';
import { sendCustomerConfirmationEmail, sendAdminNotificationEmail, sendWhatsAppInvoice } from '../utils/communications';
import { appendOrderRow } from '../utils/sheets';

const router = express.Router();
const prisma = new PrismaClient();

// Generate Invoice (HTTP Route for downloading)
// NOTE: MUST Be before /:id otherwise /:id captures it
router.get('/:id/invoice/:type', async (req, res) => {
  try {
    const { id, type } = req.params;

    if (type !== 'CUSTOMER' && type !== 'INTERNAL') {
        return res.status(400).json({ error: 'Invalid invoice type' });
    }

    const order = await prisma.order.findFirst({
      where: {
          OR: [
              { id },
              { orderNumber: id }
          ]
      },
      include: { items: true }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    await generateInvoicePDF(order, type, res);

  } catch (error) {
    console.error('Error generating invoice:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate invoice' });
    }
  }
});

// Backward compatible route
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

      await generateInvoicePDF(order, 'CUSTOMER', res);

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

    // Check by real ID or orderNumber
    const order = await prisma.order.findFirst({
      where: {
          OR: [
              { id },
              { orderNumber: id }
          ]
      },
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
      businessType, // B2B or B2C
      customerNotes,
      items, // Array of { productId, quantity }
    } = req.body;

    if (!customerName || !phone || !address || !city || !state || !pincode || !items || !items.length || !businessType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate quantities
    for (const item of items) {
      if (typeof item.quantity !== 'number' || item.quantity <= 0 || !Number.isInteger(item.quantity)) {
        return res.status(400).json({ error: 'Invalid quantity provided' });
      }
    }

    const orderResult = await prisma.$transaction(async (tx) => {
      let subtotal = 0;
      let gstTotal = 0;
      const orderItemsData: any[] = [];

      for (const item of items) {
        // Lock the product row
        const products: any[] = await tx.$queryRaw`SELECT * FROM "Product" WHERE "id" = ${item.productId} `;

        if (products.length === 0) {
          throw new Error(`Product with id ${item.productId} not found`);
        }

        const product = products[0];

        if (product.stock < item.quantity) {
          throw new Error(`Insufficient stock for product ${product.name}`);
        }

        // Decrement stock immediately since this is a direct order
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity
            }
          }
        });

        const itemSubtotal = Number((product.price * item.quantity).toFixed(2));
        const itemGstAmount = Number(((itemSubtotal * 18) / 100).toFixed(2));
        const lineTotal = Number((itemSubtotal + itemGstAmount).toFixed(2));

        subtotal += itemSubtotal;
        gstTotal += itemGstAmount;

        orderItemsData.push({
          productId: product.id,
          productName: product.name,
          quantity: item.quantity,
          unitPrice: product.price,
          price: product.price, // ensure backwards compatibility
          gstRate: 18,
          gstAmount: itemGstAmount,
          lineTotal: lineTotal
        });
      }

      subtotal = Number(subtotal.toFixed(2));
      gstTotal = Number(gstTotal.toFixed(2));
      const grandTotal = Number((subtotal + gstTotal).toFixed(2));
      const totalAmount = grandTotal; // Total amount includes GST

      const timestamp = Date.now().toString().slice(-6);
      const randomStr = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const orderNumber = `ORD-${timestamp}-${randomStr}`;
      const invoiceNumber = `INV-${timestamp}-${randomStr}`;

      // Calculate UPI Deep Link (No longer using external gateway)
      const businessUpiId = process.env.BUSINESS_UPI_ID || 'kammatstea@ybl';
      const upiLink = `upi://pay?pa=${businessUpiId}&pn=KammatsTea&tr=${orderNumber}&am=${totalAmount}&cu=INR`;

      // Create the order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          invoiceNumber,
          customerName,
          phone,
          email,
          address,
          city,
          state,
          pincode,
          businessType,
          customerNotes,
          subtotal,
          gstTotal,
          grandTotal,
          totalAmount,
          paymentStatus: 'PENDING',
          orderStatus: 'PROCESSING',
          items: {
            create: orderItemsData
          }
        },
        include: {
          items: true
        }
      });

      return { order: newOrder, upiLink };
    });

    // Generate PDFs and send emails asynchronously in background
    (async () => {
        try {
            console.log(`Generating communication artifacts for order ${orderResult.order.orderNumber}`);

            // 1. Generate PDFs
            const customerPdfData = await generateInvoicePDFBuffer(orderResult.order, 'CUSTOMER');
            const internalPdfData = await generateInvoicePDFBuffer(orderResult.order, 'INTERNAL');

            if (customerPdfData.url) {
                await prisma.order.update({
                    where: { id: orderResult.order.id },
                    data: { invoiceUrl: customerPdfData.url }
                });
            }

            // 2. Send Emails (if email provided)
            await sendCustomerConfirmationEmail(orderResult.order, customerPdfData.buffer);
            await sendAdminNotificationEmail(orderResult.order, internalPdfData.buffer);

            // 3. Sync to Google Sheets
            await appendOrderRow(orderResult.order);

            // 4. Log Success
            console.log(`Successfully dispatched communication for ${orderResult.order.orderNumber}`);

            // 5. Send WhatsApp Invoice
            await sendWhatsAppInvoice(orderResult.order, customerPdfData.url);

        } catch (commError) {
             console.error(`Failed background communications for ${orderResult.order.orderNumber}`, commError);
        }
    })();

    res.status(201).json(orderResult);

  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});


export default router;
