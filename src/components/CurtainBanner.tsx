import React, { useEffect, useRef, useState } from 'react';
import { Curtains, Plane } from 'curtainsjs';
import * as htmlToImage from 'html-to-image';

interface CurtainBannerProps {
  images: string[];
  lightMode?: boolean;
  enableMouse?: boolean;
  enableTexture?: boolean;
}

export default function CurtainBanner({ images, lightMode = false, enableMouse = true, enableTexture = true }: CurtainBannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const planeElementRef = useRef<HTMLDivElement>(null);
  const curtainsRef = useRef<Curtains | null>(null);
  const planeRef = useRef<Plane | null>(null);
  const captureRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isReady, setIsReady] = useState(false);
  
  const contentData = [
    { title: "Jaipur Jewelry", subtitle: "Elegance in Every Fold" },
    { title: "Royal Heritage", subtitle: "Crafted for Majesty" },
    { title: "Audacious Performance", subtitle: "Power that moves you" },
    { title: "Timeless Design", subtitle: "Crafted for the modern visionary" }
  ];

  const transitioning = useRef(false);
  const transitionTime = useRef(0);
  const transitionProgress = useRef(0);
  const currentDisplayedIndex = useRef(0);
  const transitionLock = useRef(false);

  useEffect(() => {
    if (!containerRef.current || !planeElementRef.current) return;
    if (images.length === 0) return;

    let curtains: Curtains | null = null;
    let plane: Plane | null = null;

    const maxImages = images.length;
    
    // Dynamically build shader to support all textures without runtime swapping
    let samplers = "";
    let oldColorIfs = "";
    let newColorIfs = "";
    let oldContentIfs = "";
    let newContentIfs = "";
    
    for (let i = 0; i < maxImages; i++) {
      samplers += `uniform sampler2D uSampler${i};\n`;
      samplers += `uniform sampler2D uContentSampler${i};\n`;
    
      if (i === maxImages - 1) {
        oldColorIfs += `return texture2D(uSampler${i}, coord);\n`;
        newColorIfs += `return texture2D(uSampler${i}, coord);\n`;
        oldContentIfs += `return texture2D(uContentSampler${i}, coord);\n`;
        newContentIfs += `return texture2D(uContentSampler${i}, coord);\n`;
      } else {
        oldColorIfs += `if (uOldIndex < ${i}.5) return texture2D(uSampler${i}, coord);\n`;
        newColorIfs += `if (uNewIndex < ${i}.5) return texture2D(uSampler${i}, coord);\n`;
        oldContentIfs += `if (uOldIndex < ${i}.5) return texture2D(uContentSampler${i}, coord);\n`;
        newContentIfs += `if (uNewIndex < ${i}.5) return texture2D(uContentSampler${i}, coord);\n`;
      }
    }

    const vertexShader = `
      #ifdef GL_ES
      precision mediump float;
      #endif

      attribute vec3 aVertexPosition;
      attribute vec2 aTextureCoord;

      uniform mat4 uMVMatrix;
      uniform mat4 uPMatrix;

      varying vec3 vVertexPosition;
      varying vec2 vTextureCoord;

      uniform float uTime;
      uniform vec2 uMouse;
      uniform float uEnableMouse;
      uniform float uTransition;

      void main() {
          vec3 vertexPosition = aVertexPosition;
          
          float progress = clamp(uTransition, 0.0, 1.0);
          float boundary = 1.0 - progress;
          
          float depthMultiplier = (1.0 - aVertexPosition.y) * 0.5; 
          
          float movement;
          float coordX;
          float foldFreq;
          float foldDepth;

          if (aTextureCoord.x < boundary) {
              // OLD (Sliding off to the left)
              coordX = aTextureCoord.x + progress;
              foldFreq = 12.0 + (progress * 10.0);
              foldDepth = 0.08 + (progress * 0.22);
              movement = sin((coordX * 2.0 - 1.0) * foldFreq + uTime * 0.02) * foldDepth;
          } else {
              // NEW (Sliding in from the right)
              coordX = aTextureCoord.x - boundary;
              foldFreq = 22.0 - (progress * 10.0);
              foldDepth = 0.3 - (progress * 0.22);
              movement = sin((coordX * 2.0 - 1.0) * foldFreq + uTime * 0.02) * foldDepth;
          }
          
          // Combine multiple varying frequency sine waves for unpredictable natural wind
          float windTime = uTime * 0.015;
          float baseSway = sin(windTime + aTextureCoord.x * 2.5);
          float detailSway1 = cos(windTime * 1.3 - aTextureCoord.y * 3.1 + aTextureCoord.x * 4.2);
          float detailSway2 = sin(windTime * 0.8 + aTextureCoord.y * 1.5 - aTextureCoord.x * 1.8);
          
          // Add a low frequency modulator for wind gusts
          float windGust = sin(windTime * 0.3) * 0.5 + 0.5;
          
          float complexSway = baseSway * 0.5 + detailSway1 * 0.3 * windGust + detailSway2 * 0.2 * windGust;
          
          float airSway = complexSway * 0.04 * (1.0 - aTextureCoord.y);
          float shakeIntensity = length(uMouse) * 0.06 * uEnableMouse;
          float shakeWave = sin(aTextureCoord.x * 25.0 + uTime * 0.1) * cos(aTextureCoord.y * 20.0 - uTime * 0.08) * shakeIntensity;
          
          vertexPosition.z += (movement + airSway + shakeWave * 0.5) * depthMultiplier;

          gl_Position = uPMatrix * uMVMatrix * vec4(vertexPosition, 1.0);

          vTextureCoord = aTextureCoord;
          vVertexPosition = vertexPosition;
      }
    `;

    const fragmentShader = `
      #ifdef GL_ES
      precision mediump float;
      #endif

      varying vec3 vVertexPosition;
      varying vec2 vTextureCoord;

      ${samplers}
      
      uniform float uTime;
      uniform float uTransition;
      uniform float uLightMode;
      uniform float uEnableTexture;
      uniform float uOldIndex;
      uniform float uNewIndex;

      vec4 getOldColor(vec2 coord) {
          ${oldColorIfs}
      }

      vec4 getNewColor(vec2 coord) {
          ${newColorIfs}
      }

      vec4 getOldContent(vec2 coord) {
          ${oldContentIfs}
      }

      vec4 getNewContent(vec2 coord) {
          ${newContentIfs}
      }

      void main() {
          float progress = clamp(uTransition, 0.0, 1.0);
          float boundary = 1.0 - progress;
          
          float depthMultiplier = (1.0 - vVertexPosition.y) * 0.5;
          float derivativeScale = 0.22;
          
          vec4 finalColor;
          vec2 contentCoord;
          float foldX;

          if (vTextureCoord.x < boundary) {
              // OLD CURTAIN (Sliding off to the left)
              contentCoord = vec2(vTextureCoord.x + progress, vTextureCoord.y);
              foldX = contentCoord.x;
              
              vec4 base = getOldColor(contentCoord);
              vec4 content = getOldContent(contentCoord);
              
              float foldFreq = 12.0 + (progress * 10.0);
              float foldDepth = 0.08 + (progress * 0.22);
              float derivative = cos((foldX * 2.0 - 1.0) * foldFreq + uTime * 0.02) * foldDepth * foldFreq * depthMultiplier;
              float shadow = -derivative * derivativeScale;
              
              vec3 combinedColor = mix(base.rgb, content.rgb, content.a);
              vec3 rgb = mix(combinedColor * (0.85 - shadow), combinedColor + vec3(0.12) * max(0.0, shadow), uLightMode);
              
              rgb *= mix(1.0, 0.45, smoothstep(boundary - 0.1, boundary, vTextureCoord.x) * progress);
              finalColor = vec4(rgb, 1.0);
          } else {
              // NEW CURTAIN (Sliding in from the right)
              contentCoord = vec2(vTextureCoord.x - boundary, vTextureCoord.y);
              foldX = contentCoord.x;
              
              vec4 base = getNewColor(contentCoord);
              vec4 content = getNewContent(contentCoord);
              
              float foldFreq = 22.0 - (progress * 10.0);
              float foldDepth = 0.3 - (progress * 0.22);
              float derivative = cos((foldX * 2.0 - 1.0) * foldFreq + uTime * 0.02) * foldDepth * foldFreq * depthMultiplier;
              float shadow = -derivative * derivativeScale;
              
              vec3 combinedColor = mix(base.rgb, content.rgb, content.a);
              vec3 rgb = mix(combinedColor * (0.85 - shadow), combinedColor + vec3(0.12) * max(0.0, shadow), uLightMode);
              
              float shadowStrength = 1.0 - progress;
              rgb *= mix(1.0 - (0.6 * shadowStrength), 1.0, smoothstep(boundary, boundary + 0.16, vTextureCoord.x));
              finalColor = vec4(rgb, 1.0);
          }

          // Woven fabric effect
          vec2 weaveCoord = contentCoord * 1200.0;
          float weave = (sin(weaveCoord.x) * sin(weaveCoord.y)) * 0.5 + 0.5;
          float noise = fract(sin(dot(contentCoord, vec2(12.9898, 78.233))) * 43758.5453);
          
          // Combine weave and a little noise to break up perfection
          float fabric = mix(1.0, 0.93 + 0.08 * weave + 0.04 * noise, uEnableTexture);
          
          gl_FragColor = vec4(finalColor.rgb * fabric, 1.0);
      }
    `;

    const initCurtains = () => {
      curtains = new Curtains({
        container: containerRef.current!,
        pixelRatio: Math.min(1.5, window.devicePixelRatio),
        antialias: false,
        watchScroll: false,
      });

      curtainsRef.current = curtains;

      curtains.onError(() => console.error("CurtainsJS WebGL error"));
      curtains.onContextLost(() => curtains?.restoreContext());

      const params = {
        vertexShader,
        fragmentShader,
        widthSegments: 40,
        heightSegments: 40,
        uniforms: {
          time: { name: "uTime", type: "1f", value: 0 },
          mousePosition: { name: "uMouse", type: "2f", value: [0, 0] },
          transition: { name: "uTransition", type: "1f", value: 0 },
          lightMode: { name: "uLightMode", type: "1f", value: lightMode ? 1.0 : 0.0 },
          enableMouse: { name: "uEnableMouse", type: "1f", value: enableMouse ? 1.0 : 0.0 },
          enableTexture: { name: "uEnableTexture", type: "1f", value: enableTexture ? 1.0 : 0.0 },
          oldIndex: { name: "uOldIndex", type: "1f", value: 0.0 },
          newIndex: { name: "uNewIndex", type: "1f", value: 0.0 },
        },
      };

      plane = new Plane(curtains, planeElementRef.current!, params);
      planeRef.current = plane;

      const contentSamplers: any[] = [];
      for (let i = 0; i < maxImages; i++) {
        const tex = plane.createTexture({ sampler: `uContentSampler${i}` });
        contentSamplers.push(tex);
      }

      const captureAllContents = async () => {
        if (!captureRef.current) return;
        const clientWidth = containerRef.current?.clientWidth || window.innerWidth;
        const clientHeight = containerRef.current?.clientHeight || 600;

        for (let i = 0; i < maxImages; i++) {
          const h1 = captureRef.current.querySelector('h1');
          const p = captureRef.current.querySelector('p');
          if (h1) h1.textContent = contentData[i]?.title || "Jaipur Jewelry";
          if (p) p.textContent = contentData[i]?.subtitle || "Elegance in Every Fold";
          
          await new Promise(resolve => requestAnimationFrame(resolve));
          
          try {
            const dataUrl = await htmlToImage.toPng(captureRef.current, {
              width: clientWidth,
              height: clientHeight,
              backgroundColor: 'rgba(0,0,0,0)',
              pixelRatio: 1.5,
              style: { opacity: '1', visibility: 'visible' }
            });
            const img = new Image();
            img.onload = () => {
               if (contentSamplers[i]) contentSamplers[i].setSource(img);
               if (i === maxImages - 1) setIsReady(true);
            };
            img.src = dataUrl;
          } catch(e) {
            console.error("Capture issue", e);
            if (i === maxImages - 1) setIsReady(true);
          }
        }
      };
      
      captureAllContents();

      plane.onReady(() => {
        if (planeElementRef.current) planeElementRef.current.style.opacity = '0';
      });

      plane.onRender(() => {
        if (plane) {
          plane.uniforms.time.value++;
          
          const currentMouse = plane.uniforms.mousePosition.value;
          currentMouse[0] += (targetMouse.x - currentMouse[0]) * 0.05;
          currentMouse[1] += (targetMouse.y - currentMouse[1]) * 0.05;
          
          if (transitioning.current) {
            transitionTime.current += 0.01;
            
            if (transitionTime.current >= 1.0) {
              plane.uniforms.oldIndex.value = plane.uniforms.newIndex.value;
              plane.uniforms.transition.value = 0.0;
              transitionProgress.current = 0.0;
              transitionTime.current = 0.0;
              transitioning.current = false;
              transitionLock.current = false;
            } else {
              const t = transitionTime.current;
              // Smooth easing function (easeInOutCubic) for more natural movement
              transitionProgress.current = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
              plane.uniforms.transition.value = transitionProgress.current;
            }
          }
        }
      });
    };

    initCurtains();

    const targetMouse = { x: 0, y: 0 };
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        targetMouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        targetMouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      }
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (planeRef.current) planeRef.current.remove();
      if (curtainsRef.current) curtainsRef.current.dispose();
    };
  }, [images]);

  // Auto-advance slider
  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [images.length]);

  // Handle transition when index changes
  useEffect(() => {
    if (planeRef.current && isReady && !transitionLock.current) {
      if (currentIndex === currentDisplayedIndex.current) return;
      
      transitionLock.current = true;
      currentDisplayedIndex.current = currentIndex;
      
      planeRef.current.uniforms.newIndex.value = currentIndex;
      planeRef.current.uniforms.transition.value = 0.0;
      transitionTime.current = 0.0;
      transitionProgress.current = 0.0;
      transitioning.current = true;
    }
  }, [currentIndex, isReady]);

  useEffect(() => {
    if (planeRef.current) {
      planeRef.current.uniforms.lightMode.value = lightMode ? 1.0 : 0.0;
      planeRef.current.uniforms.enableMouse.value = enableMouse ? 1.0 : 0.0;
      planeRef.current.uniforms.enableTexture.value = enableTexture ? 1.0 : 0.0;
    }
  }, [lightMode, enableMouse, enableTexture]);

  return (
    <div className="relative w-full h-[600px] overflow-hidden bg-zinc-900 transition-opacity duration-1000" style={{ opacity: isReady ? 1 : 0 }}>
      {/* Capture div - Dynamically updated for text rendering, hidden via opacity instead of left:-9999px */}
      <div 
        ref={captureRef}
        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-0"
        style={{ zIndex: -100 }}
        aria-hidden="true"
      >
        <h1 className="text-3xl sm:text-4xl md:text-6xl font-serif tracking-widest uppercase text-amber-400 drop-shadow-lg mb-4 text-center px-4"></h1>
        <p className="text-xs sm:text-sm md:text-xl font-light tracking-widest uppercase opacity-90 drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] text-center text-white px-4"></p>
      </div>

      <div ref={containerRef} className="absolute inset-0 z-10 pointer-events-none" />
      
      <div ref={planeElementRef} className="absolute inset-0 w-full h-full">
        {images.map((img, i) => (
          <img 
            key={i}
            src={img} 
            alt={`Curtain Banner ${i + 1}`} 
            crossOrigin="anonymous" 
            data-sampler={`uSampler${i}`}
            className="absolute inset-0 w-full h-full object-cover" 
          />
        ))}
      </div>
      
      {images.length > 1 && (
        <div className="absolute bottom-8 left-0 right-0 z-30 flex justify-center gap-3">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentIndex ? 'bg-amber-400 scale-125' : 'bg-white/50 hover:bg-white/80'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
