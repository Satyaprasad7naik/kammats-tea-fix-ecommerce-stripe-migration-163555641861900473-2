import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import Navbar from '../components/Navbar';
import FooterSection from '../sections/FooterSection';
import { useCart } from '../context/CartContext';

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: number;
  gstRate: number;
  hsnCode: string;
  stock: number;
  category: string;
  images: string[];
}

const ProductPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const response = await fetch(`${apiUrl}/api/products/${slug}`);
        if (!response.ok) {
          throw new Error('Product not found');
        }
        const data = await response.json();
        setProduct(data);
      } catch (error) {
        console.error('Error fetching product:', error);
        navigate('/shop');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [slug, navigate]);

  useEffect(() => {
    if (product && imageRef.current) {
      gsap.fromTo(
        imageRef.current,
        { opacity: 0, y: 50, scale: 0.9 },
        { opacity: 1, y: 0, scale: 1, duration: 1, ease: 'power3.out' }
      );
    }
  }, [product]);

  if (loading) {
    return (
      <div className="bg-[#f5ebe0] min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#3e2a21] border-t-transparent"></div>
      </div>
    );
  }

  if (!product) {
    return null; // Handled by navigate('/shop') in catch block
  }

  const [image1, image2, image3, color] = product.images;
  const isOutOfStock = product.stock <= 0;

  return (
    <div className="bg-[#f5ebe0] min-h-screen text-[#3e2a21] font-sans overflow-x-hidden flex flex-col">
      <Navbar />
      <div className="flex-1 pt-24 pb-12 px-4 md:px-12 flex flex-col md:flex-row items-center justify-center gap-10">

        {/* Left Side: Images */}
        <div className="relative w-full md:w-1/2 max-w-lg aspect-square flex items-center justify-center rounded-3xl p-8" style={{ backgroundColor: color || '#d69766' }}>
          {image2 && <img src={image2} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none rounded-3xl opacity-50" />}
          {image3 && <img src={image3} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none z-[3]" />}
          {image1 && (
            <img
              ref={imageRef}
              src={image1}
              alt={product.name}
              className="relative z-10 w-full max-w-[280px] object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-500"
            />
          )}
        </div>

        {/* Right Side: Product Details */}
        <div className="w-full md:w-1/2 max-w-xl flex flex-col items-start space-y-6">
          <div>
            <h1 className="font-black uppercase text-4xl md:text-6xl tracking-tight leading-none text-[#3e2a21]">
              {product.name}
            </h1>
            <p className="text-lg md:text-xl font-medium text-[#d89945] mt-2">
              {product.shortDescription}
            </p>
          </div>

          <div className="text-3xl font-bold text-[#3e2a21]">
            ₹{product.price}
          </div>

          <p className="text-base md:text-lg opacity-80 leading-relaxed max-w-md">
            {product.description}
          </p>

          {/* Quantity and Add to Cart */}
          <div className="flex flex-col space-y-4 w-full max-w-xs pt-4">
             <div className="flex items-center space-x-4">
                <span className="font-bold">Quantity:</span>
                <div className="flex items-center border-2 border-[#3e2a21] rounded-full overflow-hidden">
                    <button
                        className="px-4 py-2 hover:bg-[#3e2a21] hover:text-white transition-colors"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={isOutOfStock}
                    >
                        -
                    </button>
                    <span className="px-4 py-2 font-bold min-w-[3rem] text-center">{quantity}</span>
                    <button
                        className="px-4 py-2 hover:bg-[#3e2a21] hover:text-white transition-colors"
                        onClick={() => setQuantity(quantity + 1)}
                        disabled={isOutOfStock || quantity >= product.stock}
                    >
                        +
                    </button>
                </div>
             </div>

             {isOutOfStock ? (
                <div className="w-full py-4 text-center text-red-500 font-bold border-2 border-red-500 rounded-full">
                    Out of Stock
                </div>
             ) : (
                <button
                className="w-full py-4 rounded-full bg-[#e3a458] text-[#3e2a21] font-bold tracking-widest uppercase shadow-xl hover:bg-amber-500 transition-colors"
                onClick={() => {
                    for (let i = 0; i < quantity; i++) {
                        addToCart({
                        id: product.id,
                        name: product.name,
                        slug: product.slug,
                        price: product.price,
                        gstRate: product.gstRate,
                        image: image1,
                        stock: product.stock,
                        });
                    }
                    // Optional: open sidebar manually, but our Context might do that
                }}
                >
                Add to Cart
                </button>
             )}
          </div>
        </div>
      </div>
      <FooterSection />
    </div>
  );
};

export default ProductPage;
