import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { SplitText } from "gsap/all";

const MessageSection = () => {
    useGSAP(() => {
        document.fonts.ready.then(() => {
            const firstMsgSplit = SplitText.create(".first-message", { type: "words" });
            const secMsgSplit = SplitText.create(".second-message", { type: "words" });
            const paragraphSplit = SplitText.create(".message-content p", {
                type: "words,lines",
                linesClass: "paragraph-line",
            });

            // Word color reveal – first line
            gsap.to(firstMsgSplit.words, {
                color: "#faeade",
                ease: "none",
                stagger: 1,
                scrollTrigger: {
                    trigger: ".message-content",
                    start: "top 55%",
                    end: "30% 55%",
                    scrub: 1.5,
                },
            });

            // Word color reveal – second line
            gsap.to(secMsgSplit.words, {
                color: "#faeade",
                ease: "none",
                stagger: 1,
                scrollTrigger: {
                    trigger: ".second-message",
                    start: "top 55%",
                    end: "bottom 55%",
                    scrub: 1.5,
                },
            });

            // Stamp reveal for "Fuel Up" badge
            gsap.to(".msg-text-scroll", {
                clipPath: "polygon(0% 0%,100% 0%, 100% 100%, 0% 100%)",
                duration: 0.7,
                ease: "expo.out",
                scrollTrigger: {
                    trigger: ".msg-text-scroll",
                    start: "top 65%",
                },
            });

            // Paragraph words cascade up
            gsap.from(paragraphSplit.words, {
                duration: 0.8,
                stagger: 0.012,
                yPercent: 150,
                opacity: 0,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: ".message-content p",
                    start: "top 75%",
                },
            });
        });
    }, []);

    return (
        <section className="message-content">
            <div className="container mx-auto flex-center py-28 relative">
                <div className="w-full h-full md:px-30">
                    <div className="msg-wrapper">
                        <h1 className="first-message text-wrap w-[90%]">
                            Stir up your fearless past and
                        </h1>
                        <div className="msg-text-scroll md:mt-12 mt-0">
                            <div className="bg-light-brown md:pb-4 pb-3 px-5">
                                <h2 className="text-red-brown">Fuel Up</h2>
                            </div>
                        </div>
                        <h1 className="second-message md:w-full w-[80%]">
                            your future with every gulp of Perfect Protein
                        </h1>
                    </div>
                    <div className="flex-center md:mt-20 mt-10">
                        <div className="max-w-md px-10 flex-center overflow-hidden">
                            <p>
                                Rev up your rebel spirit and feed the adventure of life with SPYLT,
                                where you're one chug away from epic nostalgia and fearless fun.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default MessageSection;