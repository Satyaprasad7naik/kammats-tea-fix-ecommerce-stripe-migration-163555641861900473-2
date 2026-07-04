/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import Navbar from '../components/Navbar';
import FooterSection from '../sections/FooterSection';

const CheckoutSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const upiUriParam = searchParams.get('upiUri');

  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successOrder, setSuccessOrder] = useState<any | null>(null);

  useEffect(() => {
    if (!orderId) {
      navigate('/shop');
      return;
    }

    const fetchOrder = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const res = await fetch(`${apiUrl}/api/orders/${orderId}`);

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to fetch order details');

        setSuccessOrder(data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch order details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, navigate]);

  if (loading) {
    return (
      <div className="bg-[#f5ebe0] min-h-screen font-sans flex flex-col justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#3e2a21] border-t-transparent mb-4"></div>
        <p className="font-bold text-[#3e2a21]">Loading order details...</p>
      </div>
    );
  }

  if (error || !successOrder) {
    return (
      <div className="bg-[#f5ebe0] min-h-screen font-sans flex flex-col justify-center items-center">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center">
          <i className="ri-error-warning-line text-5xl text-red-500 mb-4 block"></i>
          <h2 className="text-2xl font-bold text-[#3e2a21] mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error || 'Order not found'}</p>
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
          <h1 className="text-3xl font-black text-[#3e2a21] mb-2 uppercase">Order Received!</h1>
          <p className="text-gray-500 mb-6">Thank you for your purchase.</p>

          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
            <p className="text-sm text-gray-500 mb-1">Order Number:</p>
            <p className="font-bold text-[#3e2a21]">{successOrder.orderNumber}</p>
            <p className="text-sm text-gray-500 mt-3 mb-1">Invoice Number:</p>
            <p className="font-bold text-[#3e2a21]">{successOrder.invoiceNumber}</p>
          </div>

          {upiUriParam && (
             <div className="mb-8 flex flex-col items-center">
               <h3 className="text-lg font-bold text-[#3e2a21] mb-2">Scan to Pay (UPI)</h3>
               <div className="p-4 bg-white rounded-xl shadow border border-gray-100 mb-2">
                 <QRCodeSVG value={decodeURIComponent(upiUriParam)} size={150} />
               </div>
               <p className="text-2xl font-black text-[#d89945]">₹{successOrder.grandTotal.toFixed(2)}</p>
             </div>
          )}

          <div className="flex flex-col gap-3">
            <a
              href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/orders/${successOrder.id}/customer-invoice`}
              className="w-full py-4 border-2 border-[#3e2a21] text-[#3e2a21] font-bold rounded-xl hover:bg-[#3e2a21] hover:text-white transition-colors flex items-center justify-center gap-2"
              target="_blank"
              rel="noopener noreferrer"
            >
              <i className="ri-download-line"></i> Download Invoice
            </a>
            <button
              onClick={() => navigate('/shop')}
              className="w-full py-4 bg-[#d89945] text-white font-bold rounded-xl hover:bg-[#3e2a21] transition-colors"
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
