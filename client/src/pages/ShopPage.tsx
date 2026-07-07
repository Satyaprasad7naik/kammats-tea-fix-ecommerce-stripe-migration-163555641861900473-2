import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import Navbar from '../components/Navbar';
import FooterSection from '../sections/FooterSection';
import TestimonialSection from '../sections/TestimonialSection';
import { useCart } from '../context/CartContext';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  images: string[];
}

const ProductCard = ({ product }: { product: Product }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const canRef = useRef<HTMLImageElement>(null);
  const piecesRef = useRef<HTMLImageElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const { addToCart } = useCart();

  useEffect(() => {
    const card = cardRef.current;
    const can = canRef.current;
    const pieces = piecesRef.current;
    const cta = ctaRef.current;
    if (!card || !can || !pieces || !cta) return;

    gsap.set(pieces, { opacity: 0, scale: 0.7, y: 20 });
    gsap.set(cta, { opacity: 0, y: 20 });

    const onEnter = () => {
      gsap.to(can, { rotate: -4, scale: 1.08, y: -12, duration: 0.5, ease: 'power3.out', overwrite: 'auto' });
      gsap.to(pieces, { opacity: 1, scale: 1, y: 0, duration: 0.55, ease: 'back.out(1.4)', overwrite: 'auto' });
      gsap.to(cta, { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out', delay: 0.05, overwrite: 'auto' });
    };

    const onLeave = () => {
      gsap.to(can, { rotate: 0, scale: 1, y: 0, duration: 0.5, ease: 'power3.inOut', overwrite: 'auto' });
      gsap.to(pieces, { opacity: 0, scale: 0.7, y: 20, duration: 0.35, ease: 'power3.in', overwrite: 'auto' });
      gsap.to(cta, { opacity: 0, y: 20, duration: 0.3, ease: 'power3.in', overwrite: 'auto' });
    };

    card.addEventListener('mouseenter', onEnter);
    card.addEventListener('mouseleave', onLeave);
    return () => {
      card.removeEventListener('mouseenter', onEnter);
      card.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  const [image1, image2, image3, color, textColor] = product.images;

  return (
    <div ref={cardRef} className="shop-card relative flex flex-col overflow-hidden rounded-2xl cursor-pointer group" style={{ backgroundColor: color || '#d69766', aspectRatio: '3 / 4' }}>
      {image2 && <img src={image2} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none" draggable={false} />}
      {image3 && <img ref={piecesRef} src={image3} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none z-[3]" draggable={false} />}
      <div className="relative z-10 px-4 md:px-6 pt-5 md:pt-7">
        <h3 className="font-black uppercase leading-tight tracking-tight" style={{ color: textColor || '#fff', fontSize: 'clamp(1rem, 3.5vw, 2rem)', textShadow: '0 2px 8px rgba(0,0,0,0.18)' }}>
          {product.name}
        </h3>
        <p className="font-bold text-lg mt-2" style={{ color: textColor || '#fff' }}>₹{product.price}</p>
      </div>
      <div className="relative z-[4] flex-1 flex items-end justify-center pb-10">
        {image1 && <img ref={canRef} src={image1} alt={product.name} className="object-contain drop-shadow-2xl select-none transition-transform duration-500 group-hover:scale-105" style={{ height: '72%', maxHeight: '360px', width: 'auto', transformOrigin: 'bottom center' }} draggable={false} />}
      </div>
      <div ref={ctaRef} className="absolute bottom-5 left-0 right-0 z-20 flex justify-center pointer-events-none">
        <button
          className="px-8 py-3 rounded-full bg-white/95 text-[#3e2a21] font-bold text-sm tracking-widest uppercase shadow-xl pointer-events-auto hover:bg-[#3e2a21] hover:text-white transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            addToCart({
              id: product.id,
              name: product.name,
              slug: product.id, // using id as slug for now since we removed slug from prisma schema
              price: product.price,
              gstRate: 18, // using 18% gst rate
              image: image1,
              stock: product.stock,
            });
          }}
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
};

const ShopPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const response = await fetch(`${apiUrl}/api/products`);
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <div className="bg-[#f5ebe0] min-h-screen text-[#3e2a21] font-sans overflow-x-hidden">
      <Navbar />
      <section className="pb-10 overflow-hidden pt-24">
        <style>{`
          @keyframes shop-marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
          .shop-marquee-inner { display: flex; width: max-content; animation: shop-marquee 25s linear infinite; }
        `}</style>
        <div className="shop-marquee-inner">
          {[...Array(6)].map((_, i) => (
            <span key={i} className="font-black uppercase whitespace-nowrap mx-6 tracking-tighter" style={{ fontSize: 'clamp(8rem, 18vw, 18rem)', lineHeight: 0.85, color: '#3e2a21' }}>
              EXPLORE <span style={{ color: '#d89945' }}>FULL</span> COLLECTION
            </span>
          ))}
        </div>
        <p className="max-w-2xl mx-auto text-center text-lg font-medium opacity-70 mt-10 px-6">
          Browse all our bold and delicious flavors, ready to fuel your next adventure. Discover your favorite today!
        </p>
      </section>

      <section className="px-3 md:px-4 pb-6">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#3e2a21] border-t-transparent"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      <div className="pt-20">
        <TestimonialSection />
      </div>
      <div className="pt-12">
        <FooterSection />
      </div>
    </div>
  );
};

export default ShopPage;
