import React, { useEffect, useRef, useState } from 'react';
import * as htmlToImage from 'html-to-image';
import { ExternalLink, Github, Info } from 'lucide-react';

export default function HtmlInCanvasPage() {
  const sourceRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isNativeSupported, setIsNativeSupported] = useState<boolean | null>(null);
  const [renderMode, setRenderMode] = useState<'native' | 'fallback'>('native');
  const [inputValue, setInputValue] = useState('Type here...');
  const [time, setTime] = useState(new Date().toLocaleTimeString());
  const [useMirror, setUseMirror] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);
    
    // Check for native support of drawElementImage
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d') as any;
    const supported = typeof ctx?.drawElementImage === 'function';
    setIsNativeSupported(supported);
    if (!supported) {
      setRenderMode('fallback');
    }

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!sourceRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d') as any;
    let animationFrameId: number;

    const render = async () => {
      if (renderMode === 'native' && isNativeSupported) {
        // HIGH PERFORMANCE NATIVE PATH (Synchronous)
        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (useMirror) {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        try {
          ctx.drawElementImage(sourceRef.current, 0, 0);
        } catch (e) {
          console.error('Native draw failed', e);
        }
        ctx.restore();
        animationFrameId = requestAnimationFrame(render);
      } else {
        // FALLBACK PATH (Asynchronous)
        // Throttle fallback to prevent CPU exhaustion and reduce flicker
        const startTime = performance.now();
        try {
          const resultCanvas = await htmlToImage.toCanvas(sourceRef.current!, {
            backgroundColor: '#ffffff',
            width: 500,
            height: 400,
          });

          // SYNCHRONOUS DRAW BLOCK: Clear and draw in same frame to avoid white flash
          ctx.save();
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          if (useMirror) {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
          }
          ctx.drawImage(resultCanvas, 0, 0);
          ctx.restore();
        } catch (e) {
          // Fail silently
        }

        const endTime = performance.now();
        const duration = endTime - startTime;
        // Schedule next frame with a small delay to keep it stable
        const wait = Math.max(30, 50 - duration); 
        animationFrameId = window.setTimeout(() => requestAnimationFrame(render), wait);
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (typeof animationFrameId === 'number') clearTimeout(animationFrameId);
    };
  }, [renderMode, isNativeSupported, useMirror]);

  return (
    <div className="min-h-screen bg-zinc-50 p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12 border-b border-zinc-200 pb-8">
          <h1 className="text-5xl font-serif text-zinc-900 mb-4 tracking-tight">
            HTML in Canvas Example
          </h1>
          <div className="flex flex-wrap items-center gap-6">
            <a 
              href="https://github.com/WICG/html-in-canvas" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-amber-600 hover:text-amber-700 font-medium transition-colors"
            >
              <Github size={20} />
              WICG/html-in-canvas
              <ExternalLink size={14} />
            </a>
            <div className="flex items-center gap-2 px-3 py-1 bg-zinc-100 rounded-full text-xs font-mono text-zinc-600">
              <span className={`w-2 h-2 rounded-full ${isNativeSupported ? 'bg-green-500' : 'bg-amber-500'}`}></span>
              {isNativeSupported ? 'Native API Supported' : 'Native API Not Detected'}
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Source Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-medium text-zinc-800">Source HTML (Live)</h2>
              <div className="text-[10px] font-mono bg-amber-400 px-2 py-0.5 rounded uppercase font-bold animate-pulse">
                Interactive
              </div>
            </div>
            
            {/* The actual source element that gets rendered to canvas */}
            <div 
              ref={sourceRef}
              style={{ width: '500px', height: '400px' }}
              className="bg-white rounded-2xl shadow-xl overflow-hidden border border-zinc-100 p-8 relative"
              // @ts-ignore - layoutsubtree is a custom attribute from the proposal
              layoutsubtree=""
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-xl">
                      J
                    </div>
                    <div>
                      <h3 className="font-serif text-xl text-zinc-900">Jaipur Royal</h3>
                      <p className="text-xs text-zinc-500 font-mono">{time}</p>
                    </div>
                  </div>
                  <div className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                </div>
                
                <h4 className="text-2xl font-serif text-zinc-800 leading-tight">
                  Message for the <br /> <span className="text-amber-600">Canvas Mirror</span>
                </h4>
                
                <input 
                  type="text" 
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-3 text-zinc-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all font-medium"
                  placeholder="Type something..."
                />

                <p className="text-zinc-600 text-sm leading-relaxed italic">
                  " {inputValue} "
                </p>
                
                <div className="pt-2 flex gap-4">
                  <div className="flex-1 bg-zinc-50 rounded-lg p-3 text-center border border-zinc-100">
                    <div className="w-full h-1 bg-zinc-200 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 animate-[loading_2s_ease-in-out_infinite]" style={{ width: '40%' }} />
                    </div>
                    <span className="text-[10px] uppercase tracking-tighter text-zinc-400 mt-2 block">Sync Pulse</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-zinc-100 border border-zinc-200 rounded-xl flex gap-3 items-start">
              <Info className="text-zinc-500 shrink-0 mt-0.5" size={18} />
              <div className="text-sm text-zinc-600 leading-snug">
                <strong>How to test:</strong> Type in the input box above. You'll see the <strong>Canvas Mirror</strong> on the right update instantly (if native) or with a slight delay (if fallback).
              </div>
            </div>
          </div>

          {/* Canvas Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-medium text-zinc-800 tracking-tight">Canvas Mirror</h2>
              <div className="flex gap-2">
                <button 
                  onClick={() => setUseMirror(!useMirror)}
                  className={`px-3 py-1 rounded-md text-xs transition-colors border ${useMirror ? 'bg-zinc-800 text-white border-zinc-800' : 'bg-white text-zinc-600 border-zinc-200'}`}
                >
                  Mirror Mode: {useMirror ? 'ON' : 'OFF'}
                </button>
                <div className="w-px h-4 bg-zinc-200 self-center mx-1" />
                <button 
                  onClick={() => setRenderMode('native')}
                  disabled={!isNativeSupported}
                  className={`px-3 py-1 rounded-md text-xs transition-colors ${renderMode === 'native' ? 'bg-amber-600 text-white' : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50 disabled:opacity-50'}`}
                >
                  Native WICG
                </button>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl">
              <canvas 
                ref={canvasRef}
                width={500}
                height={400}
                className="bg-black rounded-2xl shadow-2xl w-full aspect-[5/4] object-contain"
              />
              <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-md text-[10px] text-white font-mono uppercase tracking-widest border border-white/10">
                Live Raster Output
              </div>
            </div>

            <div className="p-6 bg-zinc-900 rounded-2xl text-zinc-300 font-mono text-xs space-y-4 shadow-xl">
              <div className="flex items-center gap-2 text-amber-500 font-bold mb-2">
                <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                CANVAS LOGS
              </div>
              <p className="text-zinc-400">
                Mode: <span className="text-white">{renderMode.toUpperCase()}</span><br />
                Resolution: <span className="text-white">500x400</span><br />
                Source ATR: <span className="text-white">layoutsubtree</span>
              </p>
              <p className="text-zinc-500 leading-relaxed italic">
                 The canvas on top is receiving a raw bitstream of the DOM element on the left using the drawElementImage primitive.
              </p>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(250%); }
        }
      `}</style>
    </div>
  );
}
