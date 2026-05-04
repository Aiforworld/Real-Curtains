import React, { useState } from 'react';
import CurtainBanner from './components/CurtainBanner';
import HtmlInCanvasPage from './pages/HtmlInCanvasPage';

const bannerImages = [
  "/BG (1).png",
  "/BG (4).png",
  "/BG(5).png"
];

export default function App() {
  const [view, setView] = useState<'home' | 'html-in-canvas'>('home');
  const [isLightMode, setIsLightMode] = useState(false);
  const [enableMouse, setEnableMouse] = useState(true);
  const [enableTexture, setEnableTexture] = useState(true);

  if (view === 'html-in-canvas') {
    return (
      <div className="flex flex-col min-h-screen">
        <nav className="w-full bg-white border-b border-zinc-200 py-4 px-8 flex justify-between items-center z-50 sticky top-0">
          <button 
            onClick={() => setView('home')}
            className="text-2xl font-serif tracking-widest text-amber-600 hover:opacity-80 transition-opacity"
          >
            JAIPUR
          </button>
          <div className="flex gap-4 text-sm tracking-widest uppercase text-zinc-600 items-center">
            <button 
              onClick={() => setView('home')}
              className="hover:text-amber-600 transition-colors"
            >
              Back to Home
            </button>
          </div>
        </nav>
        <HtmlInCanvasPage />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col font-sans">
      {/* Navigation */}
      <nav className="w-full bg-white border-b border-zinc-200 py-4 px-8 flex justify-between items-center z-50">
        <div className="text-2xl font-serif tracking-widest text-amber-600">
          JAIPUR
        </div>
        <div className="flex gap-4 text-sm tracking-widest uppercase text-zinc-600 items-center">
          <a href="#" className="hover:text-amber-600 transition-colors hidden md:block">Collections</a>
          <a href="#" className="hover:text-amber-600 transition-colors hidden md:block">About</a>
          
          <button 
            onClick={() => setView('html-in-canvas')}
            className="px-4 py-2 bg-amber-600 text-white rounded-full text-xs font-bold hover:bg-amber-700 transition-all shadow-lg hover:shadow-amber-200/50 flex items-center gap-2"
          >
            HTML in Canvas
          </button>

          <div className="flex gap-2 ml-4 border-l border-zinc-200 pl-4">
            <button 
              onClick={() => setEnableMouse(!enableMouse)}
              className={`px-3 py-1.5 border rounded-full text-xs transition-colors flex items-center gap-2 ${enableMouse ? 'bg-amber-50 border-amber-200 text-amber-700' : 'border-zinc-300 hover:bg-zinc-100'}`}
            >
              Interactive Touch
            </button>
            <button 
              onClick={() => setEnableTexture(!enableTexture)}
              className={`px-3 py-1.5 border rounded-full text-xs transition-colors flex items-center gap-2 ${enableTexture ? 'bg-amber-50 border-amber-200 text-amber-700' : 'border-zinc-300 hover:bg-zinc-100'}`}
            >
              Micro-Texture
            </button>
            <button 
              onClick={() => setIsLightMode(!isLightMode)}
              className="px-3 py-1.5 border border-zinc-300 rounded-full text-xs hover:bg-zinc-100 transition-colors flex items-center gap-2"
            >
              {isLightMode ? 'Dark Shadows' : 'Light Shadows'}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Banner */}
      <CurtainBanner 
        images={bannerImages} 
        lightMode={isLightMode} 
        enableMouse={enableMouse}
        enableTexture={enableTexture}
      />

      {/* Content Section */}
      <section className="py-24 px-8 max-w-7xl mx-auto text-center">
        <h2 className="text-4xl font-serif text-zinc-800 mb-6">The Heritage Collection</h2>
        <p className="text-lg text-zinc-600 max-w-2xl mx-auto leading-relaxed">
          Discover our exquisite range of handcrafted jewelry, inspired by the royal heritage of Jaipur. 
          Each piece tells a story of tradition, elegance, and timeless beauty.
        </p>
      </section>
    </div>
  );
}
