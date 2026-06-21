import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import FooterSection from '../sections/FooterSection';
import { useCart } from '../context/CartContext';

const CheckoutSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const paymentIntentId = searchParams.get('payment_intent');
  const paymentIntentClientSecret = searchParams.get('payment_intent_client_secret');
  const redirectStatus = searchParams.get('redirect_status');

  const navigate = useNavigate();
  const { clearCart } = useCart();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successOrder, setSuccessOrder] = useState<any | null>(null);

  useEffect(() => {
    if (!paymentIntentId || !paymentIntentClientSecret) {
      navigate('/shop');
      return;
    }

    if (redirectStatus !== 'succeeded') {
        setError('Payment was not successful. Please try again.');
        setLoading(false);
        return;
    }

    const verifyPayment = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const res = await fetch(`${apiUrl}/api/orders/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ payment_intent_id: paymentIntentId })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Payment verification failed');

        setSuccessOrder(data.order);
        clearCart();
      } catch (err: any) {
        setError(err.message || 'Payment verification failed');
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [paymentIntentId, paymentIntentClientSecret, redirectStatus, navigate, clearCart]);

  if (loading) {
    return (
      <div className="bg-[#f5ebe0] min-h-screen font-sans flex flex-col justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#3e2a21] border-t-transparent mb-4"></div>
        <p className="font-bold text-[#3e2a21]">Verifying your payment...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#f5ebe0] min-h-screen font-sans flex flex-col justify-center items-center">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center">
          <i className="ri-error-warning-line text-5xl text-red-500 mb-4 block"></i>
          <h2 className="text-2xl font-bold text-[#3e2a21] mb-2">Verification Failed</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/shop')}
            className="w-full py-3 bg-[#3e2a21] text-white font-bold rounded-xl hover:bg-[#d89945]"
          >
            Return to Shop
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f5ebe0] min-h-screen font-sans flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center pt-24 pb-12 px-4">
        <div className="bg-white p-8 md:p-12 rounded-3xl shadow-2xl max-w-lg w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="ri-check-line text-4xl text-green-500"></i>
          </div>
          <h1 className="text-3xl font-black text-[#3e2a21] mb-2 uppercase">Order Successful!</h1>
          <p className="text-gray-500 mb-6">Thank you for your purchase.</p>
          <div className="bg-gray-50 rounded-xl p-4 mb-8 text-left">
            <p className="text-sm text-gray-500 mb-1">Order Number:</p>
            <p className="font-bold text-[#3e2a21]">{successOrder?.orderNumber}</p>
            <p className="text-sm text-gray-500 mt-3 mb-1">Invoice Number:</p>
            <p className="font-bold text-[#3e2a21]">{successOrder?.invoiceNumber}</p>
          </div>
          <div className="flex flex-col gap-3">
            <a
              href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/orders/${successOrder?.id}/invoice`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-4 bg-[#3e2a21] text-white font-bold rounded-xl hover:bg-[#d89945] transition-colors uppercase tracking-widest text-sm block text-center"
            >
              Download Invoice
            </a>
            <button
              onClick={() => navigate('/shop')}
              className="w-full py-4 bg-transparent border-2 border-[#3e2a21] text-[#3e2a21] font-bold rounded-xl hover:bg-[#3e2a21] hover:text-white transition-colors uppercase tracking-widest text-sm"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
      <FooterSection />
    </div>
  );
};

export default CheckoutSuccessPage;
