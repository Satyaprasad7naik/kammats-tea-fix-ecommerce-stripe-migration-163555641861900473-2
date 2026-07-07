import { ScrollTrigger } from "gsap/ScrollTrigger";
import Navbar from "./components/Navbar"
import HeroSection from "./sections/HeroSection"
import gsap from "gsap";
import MessageSection from "./sections/MessageSection";
import FlavorSection from "./sections/FlavorSection";
import { useGSAP } from "@gsap/react";
import NutritionSection from "./sections/NutritionSection";
import BenifitSection from "./sections/BenifitSection";
import FooterSection from "./sections/FooterSection";
import BottomBanner from "./sections/BottomBanner";
import "remixicon/fonts/remixicon.css";
import TestimonialSection from "./sections/TestimonialSection";
import PreLoader from "./components/PreLoader";
import { useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import ShopPage from "./pages/ShopPage";
import CheckoutPage from "./pages/CheckoutPage";
import CheckoutSuccessPage from "./pages/CheckoutSuccessPage";
import AdminDashboard from "./pages/AdminDashboard";
import CartSidebar from "./components/CartSidebar";

import { SplitText, ScrollSmoother } from "gsap/all";

gsap.registerPlugin(ScrollTrigger, SplitText, ScrollSmoother);
gsap.config({ nullTargetWarn: false });

console.log("App.tsx: Registering plugins and mounting...");

const HomePage = () => {
    return (
        <>
            <Navbar />
            <HeroSection />
            <MessageSection />
            <FlavorSection />
            <NutritionSection />
            <div>
                <BenifitSection />
                <TestimonialSection />
            </div>
            <BottomBanner />
            <FooterSection />
        </>
    );
};

const App = () => {
    const [loaded, setLoaded] = useState(false);
    const location = useLocation();
    
    useGSAP(() => {
        if (loaded) {
            // Initialize ScrollSmoother for the buttery smooth feel across all pages
            const smoother = ScrollSmoother.create({
                wrapper: "#smooth-wrapper",
                content: "#smooth-content",
                smooth: 1.5,
                effects: true,
                smoothTouch: 0.1,
            });

            // Re-sync ScrollTrigger on every route change
            setTimeout(() => {
                ScrollTrigger.refresh();
                smoother.scrollTo(0, false); // Reset scroll to top on new page
            }, 500);
            
            return () => {
                smoother.kill();
            };
        }
    }, [loaded, location.pathname]); // Trigger refresh on route change

    return (
        <>
            {!loaded && <PreLoader onComplete={() => setLoaded(true)} />}
            <CartSidebar />
            <div id="smooth-wrapper">
                <div id="smooth-content">
                    {loaded && (
                        <Routes>
                            <Route path="/" element={<HomePage />} />
                            <Route path="/shop" element={<ShopPage />} />
                            <Route path="/checkout" element={<CheckoutPage />} />
                            <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
                            <Route path="/admin" element={<AdminDashboard />} />
                        </Routes>
                    )}
                </div>
            </div>
        </>
    );
};

export default App
