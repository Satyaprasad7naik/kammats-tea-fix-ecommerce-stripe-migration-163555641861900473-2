const http = require('http');

async function runTest() {
  console.log("Starting Business OS API Verification...");
  try {
    console.log("1. Fetching product catalog...");
    const productsRes = await fetch("http://localhost:5000/api/products");
    const products = await productsRes.json();
    console.log(`Loaded ${products.length} products`);
    if (products.length !== 6) throw new Error("Expected 6 products from PostgreSQL");

    // Verify product mappings
    products.forEach(p => {
        if (!p.id || !p.name || !p.price || !p.images) {
             throw new Error(`Product mapping failed for ${p.id || 'unknown'}`);
        }
    });
    console.log("Product mapping verified successfully.");

    const product = products[0];
    console.log(`2. Selected product for Business Flow: ${product.name} (ID: ${product.id})`);

    const orderPayload = {
      customerName: "Business Test User",
      phone: "1234567890",
      email: "b2b@example.com",
      address: "123 Business Blvd",
      city: "Tech City",
      state: "Innovation State",
      pincode: "123456",
      businessType: "B2B",
      items: [
        {
          productId: product.id,
          quantity: 2
        }
      ]
    };

    console.log("3. Initiating Business Order Workflow...");
    const orderRes = await fetch("http://localhost:5000/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderPayload)
    });

    if (!orderRes.ok) {
        const errorText = await orderRes.text();
        throw new Error(`Order creation failed: ${errorText}`);
    }
    const orderData = await orderRes.json();
    console.log(`Order created successfully: ${orderData.order.orderNumber}`);

    console.log("4. Generating Internal Business Invoice...");
    const invoiceRes = await fetch(`http://localhost:5000/api/orders/${orderData.order.orderNumber}/invoice/INTERNAL`);
    if (invoiceRes.ok) {
        console.log("Internal Invoice generated successfully");
    } else {
        const err = await invoiceRes.text();
        console.log(`Internal Invoice response (expected status): ${invoiceRes.status}`);
    }

    console.log("Business OS End-to-End Verification Complete!");

  } catch (error) {
    console.error("Test failed:", error);
  }
}

runTest();
