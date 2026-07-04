/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Navbar from '../components/Navbar';
import FooterSection from '../sections/FooterSection';

const checkoutSchema = z.object({
  customerName: z.string().min(2, 'Name is required'),
  phone: z.string().regex(/^[0-9]{10}$/, 'Invalid phone number (10 digits required)'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  address: z.string().min(5, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().regex(/^[0-9]{6}$/, 'Invalid pincode'),
  businessType: z.enum(['B2C', 'B2B']),
  notes: z.string().optional()
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

const CheckoutPage = () => {
  const { cart, clearCart } = useCart();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
        businessType: 'B2C'
    }
  });

  const onSubmit = async (data: CheckoutForm) => {
    if (cart.length === 0) {
      setError('Your cart is empty');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const items = cart.map((item: any) => ({
        productId: item.id,
        quantity: item.quantity,
      }));

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

      const res = await fetch(`${apiUrl}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          items,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Failed to create order');
      }

      clearCart();
      navigate(`/checkout/success?orderId=${result.order.id}&upiUri=${encodeURIComponent(result.upiUri)}`);

    } catch (err: any) {
      setError(err.message || 'Checkout failed');
    } finally {
        setIsProcessing(false);
    }
  };

  // Calculate GST breakdown exactly mirroring backend calculations
  let subtotalCalc = 0;
  let totalGstDisplay = 0;
  cart.forEach((item: any) => {
    const sub = Number((item.price * item.quantity).toFixed(2));
    const gst = Number(((sub * item.gstRate) / 100).toFixed(2));
    subtotalCalc += sub;
    totalGstDisplay += gst;
  });
  subtotalCalc = Number(subtotalCalc.toFixed(2));
  totalGstDisplay = Number(totalGstDisplay.toFixed(2));
  const grandTotalDisplay = Number((subtotalCalc + totalGstDisplay).toFixed(2));

  return (
    <div className="bg-[#f5ebe0] min-h-screen text-[#3e2a21] font-sans flex flex-col">
      <Navbar />
      <div className="flex-1 pt-32 pb-16 px-4 sm:px-6 max-w-7xl mx-auto w-full">
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-8">Checkout</h1>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-8 rounded shadow-sm">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* Form Section */}
          <div className="flex-1">
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xl">
              <h2 className="text-2xl font-bold mb-6">Delivery Details</h2>
              <form id="checkout-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                <div className="mb-4">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Order Type *</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" value="B2C" {...register('businessType')} className="text-[#d89945] focus:ring-[#d89945] w-4 h-4" />
                      <span>Standard (B2C)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" value="B2B" {...register('businessType')} className="text-[#d89945] focus:ring-[#d89945] w-4 h-4" />
                      <span>Business (B2B)</span>
                    </label>
                  </div>
                  {errors.businessType && <p className="text-red-500 text-xs mt-1">{errors.businessType.message}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      {...register('customerName')}
                      className={`w-full px-4 py-3 rounded-xl border ${errors.customerName ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-[#d89945]`}
                      placeholder="John Doe"
                    />
                    {errors.customerName && <p className="text-red-500 text-xs mt-1">{errors.customerName.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      {...register('phone')}
                      className={`w-full px-4 py-3 rounded-xl border ${errors.phone ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-[#d89945]`}
                      placeholder="9876543210"
                    />
                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    {...register('email')}
                    className={`w-full px-4 py-3 rounded-xl border ${errors.email ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-[#d89945]`}
                    placeholder="john@example.com"
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Full Address *</label>
                  <input
                    type="text"
                    {...register('address')}
                    className={`w-full px-4 py-3 rounded-xl border ${errors.address ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-[#d89945]`}
                    placeholder="123 Main Street, Appt 4B"
                  />
                  {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">City *</label>
                    <input
                      type="text"
                      {...register('city')}
                      className={`w-full px-4 py-3 rounded-xl border ${errors.city ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-[#d89945]`}
                      placeholder="Mumbai"
                    />
                    {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">State *</label>
                    <input
                      type="text"
                      {...register('state')}
                      className={`w-full px-4 py-3 rounded-xl border ${errors.state ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-[#d89945]`}
                      placeholder="Maharashtra"
                    />
                    {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Pincode *</label>
                    <input
                      type="text"
                      {...register('pincode')}
                      className={`w-full px-4 py-3 rounded-xl border ${errors.pincode ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-[#d89945]`}
                      placeholder="400001"
                    />
                    {errors.pincode && <p className="text-red-500 text-xs mt-1">{errors.pincode.message}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Order Notes (Optional)</label>
                  <textarea
                    {...register('notes')}
                    className={`w-full px-4 py-3 rounded-xl border ${errors.notes ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-[#d89945]`}
                    placeholder="Any special instructions?"
                    rows={2}
                  />
                </div>
              </form>
            </div>
          </div>

          {/* Summary Section */}
          <div className="lg:w-[400px]">
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xl sticky top-24">
              <h2 className="text-2xl font-bold mb-6">Order Summary</h2>

              <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2">
                {cart.map((item: any) => (
                  <div key={item.id} className="flex justify-between items-center text-sm border-b border-gray-100 pb-2">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img src={item.image} alt={item.name} className="w-12 h-12 object-contain bg-[#f5ebe0] rounded" />
                        <span className="absolute -top-2 -right-2 bg-gray-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold">
                          {item.quantity}
                        </span>
                      </div>
                      <div>
                        <p className="font-bold">{item.name}</p>
                        <p className="text-gray-500 text-xs">GST: {item.gstRate}%</p>
                      </div>
                    </div>
                    <p className="font-bold text-[#d89945]">₹{(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 pt-4 space-y-3">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-bold">₹{subtotalCalc.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>GST Total</span>
                  <span className="font-bold">₹{totalGstDisplay.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-200 mt-2 pt-4 flex justify-between items-center">
                  <span className="text-lg font-bold uppercase">Grand Total</span>
                  <span className="text-3xl font-black text-[#3e2a21]">₹{grandTotalDisplay.toFixed(2)}</span>
                </div>
              </div>

              <button
                type="submit"
                form="checkout-form"
                disabled={isProcessing}
                className={`w-full mt-8 py-4 bg-[#d89945] text-white font-black rounded-xl hover:bg-[#3e2a21] transition-colors uppercase tracking-widest text-lg shadow-lg ${isProcessing ? 'opacity-70 cursor-not-allowed' : 'hover:-translate-y-0.5 transform'}`}
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <i className="ri-loader-4-line animate-spin"></i> Processing...
                  </span>
                ) : (
                  'Place Order'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      <FooterSection />
    </div>
  );
};

export default CheckoutPage;
