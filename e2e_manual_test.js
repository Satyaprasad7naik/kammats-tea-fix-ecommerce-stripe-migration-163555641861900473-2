const http = require('http');

async function runTest() {
  console.log("Starting E2E API Verification...");
  try {
    const productsRes = await fetch("http://localhost:5000/api/products");
    const products = await productsRes.json();
    console.log(`1. Loaded ${products.length} products`);
    if (products.length !== 6) throw new Error("Expected 6 products");

    const product = products[0];
    console.log(`2. Selected product: ${product.name} (ID: ${product.id})`);

    const orderPayload = {
      customerName: "Test User",
      phone: "1234567890",
      email: "test@example.com",
      address: "123 Test St",
      city: "Test City",
      state: "Test State",
      pincode: "123456",
      businessType: "B2C",
      items: [
        {
          productId: product.id,
          quantity: 2
        }
      ]
    };

    console.log("3. Creating order...");
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
    console.log(`Order created successfully: ${orderData.id}`);

    console.log("5. Generating invoice...");
    const invoiceRes = await fetch(`http://localhost:5000/api/orders/${orderData.id}/invoice/CUSTOMER`);
    if (invoiceRes.ok) {
        console.log("Invoice generated successfully");
    } else {
        const err = await invoiceRes.text();
        throw new Error(`Failed to generate invoice: ${err}`);
    }

    console.log("E2E Verification Complete!");

  } catch (error) {
    console.error("Test failed:", error);
  }
}

runTest();
