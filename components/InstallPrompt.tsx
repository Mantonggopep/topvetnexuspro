import React, { useState, useEffect } from 'react';
import { X, Share, Download } from 'lucide-react';

const InstallPrompt: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Check if iOS
    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIosDevice);

    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
    if (isStandalone) return;

    // Handle Android PWA prompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show prompt after a small delay to not annoy user immediately
      setTimeout(() => setShowPrompt(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Show iOS prompt if not installed
    if (isIosDevice) {
       setTimeout(() => setShowPrompt(true), 3000);
    }

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          setShowPrompt(false);
        }
        setDeferredPrompt(null);
      });
    }
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-[60] bg-slate-900/95 backdrop-blur-xl text-white p-4 rounded-2xl shadow-2xl border border-white/10 animate-slide-up">
      <button 
        onClick={() => setShowPrompt(false)}
        className="absolute top-2 right-2 p-1 text-white/50 hover:text-white bg-white/10 rounded-full"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-start space-x-4">
        <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
          <img src="/favicon.ico" alt="App Icon" className="w-8 h-8 opacity-90" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-lg">Install Vet Nexus Pro</h3>
          <p className="text-sm text-slate-300 mt-1 leading-relaxed">
            {isIOS 
              ? "Install this app on your iPhone for a better experience." 
              : "Add to Home Screen for quick access and offline mode."}
          </p>
          
          {isIOS ? (
             <div className="mt-3 text-sm bg-white/10 p-3 rounded-lg border border-white/5">
                Tap <Share className="w-4 h-4 inline mx-1" /> then select <span className="font-bold">"Add to Home Screen"</span>
             </div>
          ) : (
            <button 
              onClick={handleInstallClick}
              className="mt-3 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center shadow-lg transition-all active:scale-95"
            >
              <Download className="w-4 h-4 mr-2" />
              Install App
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;
