import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';

const CartSidebar = () => {
  const { cart, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, cartTotal } = useCart();
  const navigate = useNavigate();

  if (!isCartOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-50 transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />
      <div className="fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white z-50 shadow-2xl flex flex-col transform transition-transform duration-300">
        <div className="p-4 sm:p-6 border-b border-gray-100 flex justify-between items-center bg-[#f5ebe0]">
          <h2 className="text-2xl font-black text-[#3e2a21] uppercase tracking-tight">Your Cart</h2>
          <button
            onClick={() => setIsCartOpen(false)}
            className="text-[#3e2a21] hover:text-[#d89945] transition-colors"
          >
            <i className="ri-close-line text-2xl"></i>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-white">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
              <i className="ri-shopping-cart-line text-6xl text-gray-200"></i>
              <p className="text-gray-500 font-medium">Your cart is empty.</p>
              <button
                onClick={() => setIsCartOpen(false)}
                className="px-6 py-3 bg-[#3e2a21] text-white font-bold rounded-full hover:bg-[#d89945] transition-colors uppercase text-sm tracking-wider"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {cart.map((item) => (
                <div key={item.id} className="flex gap-4 border-b border-gray-100 pb-4">
                  <div className="w-20 h-24 bg-[#f5ebe0] rounded-xl flex items-center justify-center p-2 flex-shrink-0">
                    <img src={item.image} alt={item.name} className="h-full object-contain" />
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-[#3e2a21] leading-tight">{item.name}</h3>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <i className="ri-delete-bin-line"></i>
                        </button>
                      </div>
                      <p className="text-[#d89945] font-black mt-1">₹{item.price}</p>
                    </div>

                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center bg-gray-100 rounded-full px-2 py-1">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-6 h-6 flex items-center justify-center text-[#3e2a21] hover:text-[#d89945]"
                        >
                          -
                        </button>
                        <span className="w-8 text-center font-bold text-sm text-[#3e2a21]">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-6 h-6 flex items-center justify-center text-[#3e2a21] hover:text-[#d89945]"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="p-4 sm:p-6 border-t border-gray-100 bg-white">
            <div className="flex justify-between items-center mb-4">
              <span className="font-bold text-gray-500">Subtotal</span>
              <span className="text-2xl font-black text-[#3e2a21]">₹{cartTotal.toFixed(2)}</span>
            </div>
            <p className="text-xs text-gray-400 mb-6 text-center">Shipping and taxes calculated at checkout.</p>
            <button
              onClick={() => {
                setIsCartOpen(false);
                navigate('/checkout');
              }}
              className="w-full py-4 bg-[#d89945] text-white font-black rounded-xl hover:bg-[#3e2a21] transition-colors uppercase tracking-widest text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transform"
            >
              Checkout
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default CartSidebar;