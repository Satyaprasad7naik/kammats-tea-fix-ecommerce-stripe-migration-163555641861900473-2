import { useGSAP } from "@gsap/react";
import gsap from "gsap/all";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { getImage } from '../utils/media';
import pinVideo from "../assets/videos/pin-video.mp4"
import { useMediaQuery } from "react-responsive";
import { useRef } from "react";

const VideoPin = () => {
    const vidRef = useRef<HTMLVideoElement>(null);

    const vidMob = useMediaQuery({
        query: "(max-width:768px)",
    })

    useGSAP(() => {
        // Viewport play/pause logic
        if (vidRef.current) {
            ScrollTrigger.create({
                trigger: ".video-wrapper",
                start: "top bottom",
                end: "bottom -3000px", // Accommodates the pin duration
                onEnter: () => vidRef.current?.play(),
                onLeave: () => vidRef.current?.pause(),
                onEnterBack: () => vidRef.current?.play(),
                onLeaveBack: () => vidRef.current?.pause(),
            });
        }

        if (!vidMob) {
            const vpTl = gsap.timeline({
                scrollTrigger: {
                    trigger: ".video-wrapper",
                    start: "top top",
                    end: "+=2500",
                    scrub: 1.5,
                    pin: true,
                    // markers: true
                }
            });
            vpTl.fromTo(
                ".video-box",
                { clipPath: "circle(6% at 50% 50%)" },
                {
                    clipPath: "circle(100% at 50% 50%)",
                    ease: "power1.inOut",
                }
            );
        } else {
            gsap.to(".video-wrapper", {
                scrollTrigger: {
                    trigger: ".vd-pin",
                    start: "0px top",
                    end: "120% top",
                    scrub: 1.5,
                    pin: true,
                    // markers: true
                }
            })
        }
    });

    return (
        <div className="h-screen overflow-hidden ">
            <div className="relative w-full h-full video-box overflow-hidden">
                <img
                    src={getImage("circle-text.svg")}
                    alt=""
                    className="spin-circle absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-100 md:w-[15%] w-[30%] h-auto"
                />
                <video
                    ref={vidRef}
                    src={pinVideo}
                    playsInline
                    muted
                    loop
                    autoPlay
                    preload="metadata"
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full object-cover"
                />
            </div>

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 md:scale-100 scale-200 z-100">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[9vw] flex justify-center items-center bg-[#ffffff1a] backdrop-blur-xl rounded-full">
                    <img src={getImage("play.svg")} alt="" className="size-[3vw] ml-[0.5vw]" />
                </div>
            </div>
        </div>
    )
};

export default VideoPin;