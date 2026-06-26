import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import FlavorTitle from "../components/FlavorTitle";
import FlavorSlider from "../components/FlavorSlider";
import { useRef } from "react";
import { Link } from "react-router-dom";
import { useMediaQuery } from "react-responsive";

gsap.registerPlugin(ScrollTrigger);

const FlavorSection = () => {

    const flavorRef = useRef<HTMLDivElement | null>(null);
    const slideRef = useRef<HTMLDivElement | null>(null);
    const scrollInnerRef = useRef<HTMLDivElement | null>(null);

    const isMob = useMediaQuery({
        query: "(max-width: 768px)",
    });

    useGSAP(
        () => {
            if (!scrollInnerRef.current) return;

            const mm = gsap.matchMedia();

            // Desktop-only horizontal scroll animation
            mm.add("(min-width: 1025px)", () => {
                const scrollAmount = scrollInnerRef.current!.scrollWidth - window.innerWidth;

                gsap.to(scrollInnerRef.current, {
                    x: `-${scrollAmount}px`,
                    ease: "power1.inOut",
                    scrollTrigger: {
                        trigger: flavorRef.current,
                        start: "top top",
                        end: "+=4000",
                        scrub: true,
                        pin: true,
                        invalidateOnRefresh: true, // Recalculates on resize
                    },
                });
            });

            // Mobile-only button behavior
            mm.add("(max-width: 768px)", () => {
                ScrollTrigger.create({
                    trigger: flavorRef.current,
                    start: "top 90%",
                    end: "bottom bottom",
                    // This adds the 'is-active' class to the button when the section is active
                    toggleClass: { targets: ".fixed-btn", className: "is-active" },
                });
            });

            return () => {
                mm.revert(); // Cleanup GSAP animations and ScrollTriggers
            };
        },
        { scope: flavorRef }
    );

    return (
        <section ref={flavorRef} className="flavor-section relative overflow-hidden">
            {/* Button state is now controlled by CSS classes for better separation of concerns */}
            <div
                // On mobile, this button's position is toggled by the 'is-active' class via GSAP.
                // On desktop, it's always absolute.
                className="fixed-btn w-full py-4 h-22 z-[100] flex justify-center bg-milk"
            >
                <Link to="/shop" className="text-sm rounded-4xl bg-[#e3a458] px-10 md:py-4 py-3 cursor-pointer shadow-md hover:bg-amber-500 transition-all" >
                    Get It Now
                </Link>
            </div>
            {/* This container moves horizontally */}
            <div ref={scrollInnerRef} className="flavor-scroll-inner h-full flex lg:flex-row flex-col relative lg:w-[max-content]">
                <div className="lg:w-[57vw] flex-none h-80 lg:h-full lg:mt-[9%] xl:mt-0 lg:pb-50">
                    <FlavorTitle />
                </div>
                <div ref={slideRef} className="lg:pb-0 pb-8 slider-con">
                    <FlavorSlider />
                </div>
            </div>

        </section >
    );
};

/*
  CSS changes needed to support the new 'is-active' class for the mobile button.
  Add this to your global CSS file (e.g., index.css):

  .fixed-btn {
    // Desktop default styles
    position: absolute;
    bottom: 10%;
    left: 50%;
    transform: translateX(-50%);
  }

  @media (max-width: 768px) {
    .fixed-btn {
      // Mobile default state (before scrolling into view)
      position: absolute;
      bottom: 0;
    }
    .fixed-btn.is-active {
      // Mobile active state (while scrolling through the section)
      position: fixed;
    }
  }
*/

export default FlavorSection;