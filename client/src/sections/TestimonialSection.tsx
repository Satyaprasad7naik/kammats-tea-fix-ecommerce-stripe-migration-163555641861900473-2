import { cards } from "../constants/details";
import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap/all";
import { useMediaQuery } from "react-responsive";
import { Link } from "react-router-dom";

const TestimonialSection = () => {
    const isMobile = useMediaQuery({
        query: "(max-width: 768px)",
    });

    // Refs to multiple video elements
    const vdRf = useRef<HTMLVideoElement[]>([]);
    
    // State for the active full-screen video
    const [activeVideo, setActiveVideo] = useState<string | null>(null);

    useGSAP(() => {
        gsap.set(".testimonials-section", {
            marginTop: "0"
        });

        const tesTl = gsap.timeline({
            scrollTrigger: {
                trigger: ".testimonials-section",
                start: "top bottom",
                end: `${isMobile ? "80% top" : "500% top"}`,
                scrub: true,
                // markers: true
                pinSpacing: true
            }
        });

        const pinTl = gsap.timeline({
            scrollTrigger: {
                trigger: ".testimonials-section",
                start: `${isMobile ? "1% top" : "10% top"}`,
                end: `${isMobile ? "100% top" : "200% top"}`,
                scrub: 1.5,
                pin: true,
                // markers: true,
            }
        });

        pinTl.from(".vd-card", {
            // opacity: 0,
            yPercent: 300,
            stagger: 0.3,
            ease: "power1.inOut"
        }, "<");

        tesTl.to(".testimonials-section .ft-anim", {
            xPercent: 70 + 30,
            yPercent: -100
        }).to(".testimonials-section .st-anim", {
            xPercent: 25 + 30, yPercent: -100
        }, "<").to(".testimonials-section .tt-anim", {
            xPercent: -80, yPercent: -100
        }, "<");
    });

    const setVideoRef = (el: HTMLVideoElement | null, index: number): void => {
        if (el) vdRf.current[index] = el;
    };

    const handlePlay = (index: number): void => {
        const video = vdRf.current[index];
        if (video) video.play().catch((err) => console.error("Play failed:", err));
    };

    const handlePause = (index: number): void => {
        const video = vdRf.current[index];
        if (video) video.pause();
    };

    return (
        <section className="testimonials-section">
            <div className="relative w-full lg:h-[130vh] h-[112vh]">
                <div className="all-title lg:h-[150vh] h-full absolute size-full flex flex-col items-center lg:pt-[5vw] pt-[15vw]">
                    <h1 className="text-black first-title ft-anim">What's</h1>
                    <h1 className="text-light-brown sec-title st-anim">Everyone</h1>
                    <h1 className="text-black third-title tt-anim">Talking</h1>
                </div>
                <div className="pin-box ">
                    {
                        cards.map((card, index) => (
                            <div
                                key={index}
                                className={`vd-card cursor-pointer ${card.translation} ${card.rotation}`}
                                onMouseEnter={() => handlePlay(index)}
                                onMouseLeave={() => handlePause(index)}
                                onClick={() => setActiveVideo(card.src as string)}
                            >
                                <video
                                    key={index}
                                    ref={(el) => setVideoRef(el, index)}
                                    src={card.src as string} playsInline muted preload="metadata"
                                    className="size-full object-cover"
                                />
                            </div>
                        ))
                    }
                </div>
            </div>
            <div className="absolute bottom-10 w-full h-auto py-2 flex justify-center items-center z-[80]">
                <Link to="/shop" className="bg-[#e3a458] px-10 py-4 rounded-4xl text-[#3e2a21] font-bold uppercase tracking-widest hover:bg-amber-500 transition-colors">Explore All</Link>
            </div>

            {/* Video Lightbox Modal */}
            {activeVideo && (
                <div 
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 p-5 backdrop-blur-md transition-opacity duration-300"
                    onClick={() => setActiveVideo(null)}
                >
                    <button 
                        className="absolute top-5 right-5 text-white text-4xl font-light cursor-pointer hover:text-gray-300 z-[10000] size-12 flex items-center justify-center bg-transparent border border-white/20 rounded-md"
                        onClick={() => setActiveVideo(null)}
                    >
                        ×
                    </button>
                    <div 
                        className="relative w-full max-w-2xl h-[85vh] flex justify-center bg-black rounded-xl overflow-hidden shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <video 
                            src={activeVideo} 
                            controls 
                            autoPlay 
                            className="w-full h-full object-contain" 
                        />
                    </div>
                </div>
            )}
        </section >
    );
};

export default TestimonialSection;