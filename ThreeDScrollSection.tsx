import { useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Box, Html } from '@react-three/drei';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import * as THREE from 'three';

gsap.registerPlugin(ScrollTrigger);

// A simple 3D component whose properties will be animated by GSAP
const SpinningBox = () => {
  const boxRef = useRef<THREE.Mesh>(null!);
  const { camera } = useThree(); // Hook to get the scene's camera

  useGSAP(() => {
    if (!boxRef.current) return;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: '.scroll-container', // The element that creates the scroll area
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1, // Smoothly scrubs the animation on scroll
      },
    });

    // Animate the box's rotation
    tl.to(boxRef.current.rotation, { x: Math.PI, y: Math.PI * 2 });

    // And also animate the camera's position to move closer
    tl.to(camera.position, { z: 5 }, 0); // The '0' at the end makes it start at the same time as the rotation

  }, []);

  return (
    <Box ref={boxRef} args={[2, 2, 2]}>
      <meshStandardMaterial color="orange" />
    </Box>
  );
};

export const ThreeDScrollSection = () => {
  return (
    // This container defines the scrollable area for the ScrollTrigger
    <div className="scroll-container h-[200vh] relative">
      {/* The Canvas sticks to the screen */}
      <div className="w-full h-screen sticky top-0">
        <Canvas camera={{ position: [0, 0, 10], fov: 75 }}>
          <ambientLight intensity={1.5} />
          <directionalLight position={[10, 10, 5]} />
          <SpinningBox />
          <Html center>
            <div className="text-white bg-black/50 p-4 rounded-lg text-center">
              <h1 className="text-3xl font-bold">Scroll Down</h1>
              <p>The box and camera will animate.</p>
            </div>
          </Html>
        </Canvas>
      </div>
    </div>
  );
};