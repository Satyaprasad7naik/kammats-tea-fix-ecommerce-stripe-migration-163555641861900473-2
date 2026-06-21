# Enterprise Payment Architecture Migration Report

## Architectural Decisions
1. **Migrated from Razorpay to Stripe PaymentIntents:** Replaced Razorpay with Stripe to adhere to a robust, scalable, and secure production-grade architecture. PaymentIntents were utilized specifically (instead of Checkout Sessions) to provide a seamless, non-redirect payment experience on the checkout page, matching the original site's behavior.
2. **Backend as Source of Truth:** All cart calculations, GST, and totals are computed strictly on the Node.js/Prisma backend. The frontend sends only a list of product IDs and quantities, and the backend resolves the prices directly from the database and initializes the payment amount.
3. **Database Concurrency and Locks:** Implemented raw PostgreSQL row-level locks (`SELECT ... FOR UPDATE` inside `$transaction`) during webhook and verify processing. This prevents TOCTOU (Time of Check to Time of Use) race conditions, guaranteeing that inventory isn't double-deducted and duplicate webhooks don't alter the `PAID` state multiple times.
4. **Idempotency on Verification:** The frontend validation route (`/api/orders/verify`) safely returns the order object without throwing an error if the webhook has already processed the payment and marked it as `PAID`.
5. **Secure Authentication:** Migrated the Admin Dashboard JWT authentication from XSS-vulnerable `localStorage` to secure, HTTP-only cookies (`admin_token`).
6. **Robust Validation:** Implemented checks in the backend to ensure quantities cannot be NaN, zero, or negative.

## Razorpay Components Removed
- Frontend Razorpay checkout script loading (`checkout.razorpay.com/v1/checkout.js`).
- `window.Razorpay` global initialization in `CheckoutPage.tsx`.
- Razorpay order creation and HMAC SHA256 signature verification logic in the Express API.
- All razorpay-specific fields from the Prisma database schema (`razorpayOrderId`, `razorpayPaymentId`).

## Stripe Equivalents Introduced
- `@stripe/react-stripe-js` and `@stripe/stripe-js` frontend libraries with `Elements` and `PaymentElement`.
- `stripe.paymentIntents.create` on the backend to initialize transactions securely.
- Stripe webhook signature verification via `stripe.webhooks.constructEvent` using `express.raw` bodies.
- Added `stripePaymentIntentId` to the Prisma `Order` model.

## Security Improvements
- Complete elimination of hardcoded and fallback API secrets; the system mandates strict presence of environment variables.
- XSS prevention via httpOnly cookies.
- Robust webhook verification blocking unauthorized payment completion pings.

## Scalability and Maintainability
- The API is highly scalable, isolating transactions to discrete, locked database queries preventing corruption under heavy concurrent load.
- Future support for Apple Pay and direct Credit Cards is inherited immediately via Stripe Elements.
