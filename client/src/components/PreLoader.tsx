import { useEffect, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import preImg from "../assets/images/nav-logo.svg"

const PreLoader = ({ onComplete }: { onComplete: () => void }) => {
    console.log("PreLoader: Rendering...");
    const [progress, setProgress] = useState(0);
    const [canHide, setCanHide] = useState(false); // flag to control hiding

    useEffect(() => {
        const MIN_DURATION = 1000; // minimum 1 seconds
        const startTime = performance.now();

        const resources: (HTMLImageElement | HTMLVideoElement)[] = [
            ...Array.from(document.images),
            ...Array.from(document.querySelectorAll("video")),
        ];

        const total = resources.length || 1;
        let loaded = 0;

        const updateProgress = () => {
            loaded++;
            const percent = Math.round((loaded / total) * 100);
            setProgress((prev) => (percent > prev ? percent : prev));
        };

        resources.forEach((res) => {
            if (
                (res instanceof HTMLImageElement && res.complete) ||
                (res instanceof HTMLVideoElement && res.readyState >= 3)
            ) {
                updateProgress();
            } else {
                res.addEventListener("load", updateProgress);
                res.addEventListener("loadeddata", updateProgress);
                res.addEventListener("error", updateProgress);
            }
        });

        if (document.fonts) {
            document.fonts.ready.then(() => {
                setProgress((prev) => (prev < 90 ? 90 : prev));
            });
        }

        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(interval);
                    const elapsed = performance.now() - startTime;
                    const remaining = MIN_DURATION - elapsed;
                    if (remaining > 0) {
                        setTimeout(() => setCanHide(true), remaining);
                    } else {
                        setCanHide(true);
                    }
                    return 100;
                }
                return prev + 1;
            });
        }, 50);

        const handleWindowLoad = () => {
            const elapsed = performance.now() - startTime;
            const remaining = MIN_DURATION - elapsed;
            if (remaining > 0) {
                setTimeout(() => setCanHide(true), remaining);
            } else {
                setCanHide(true);
            }
        };
        window.addEventListener("load", handleWindowLoad);

        return () => {
            clearInterval(interval);
            window.removeEventListener("load", handleWindowLoad);
        };
    }, []);

    useGSAP(() => {
        if (progress >= 100 && canHide) {
            const tl = gsap.timeline({
                onComplete: () => {
                    onComplete();
                }
            });

            tl.to(".preloader", {
                yPercent: -100, // Slide up like a curtain
                duration: 1.2,
                ease: "power4.inOut",
            });
            
            // Also fade out the content inside slightly before finish
            tl.to(".preloader-content", {
                opacity: 0,
                duration: 0.4
            }, "-=0.8");
        }
    }, [progress, canHide, onComplete]);

    return (
        <div 
            className="preloader fixed inset-0 z-[9999] flex flex-col items-center justify-center text-white bg-[#7f3b2d]"
            style={{ backgroundColor: '#7f3b2d' }}
        >
            <div className="preloader-content flex flex-col items-center">
                <img src={preImg} alt="logo" className="w-32 md:w-48 mb-8" />
                <p className="text-2xl md:text-4xl font-bold tracking-tighter mb-4">{progress}%</p>
                <div className="w-48 md:w-64 h-1 bg-white/20 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-white transition-all duration-150 ease-linear"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>
        </div>
    );
};

export default PreLoader;