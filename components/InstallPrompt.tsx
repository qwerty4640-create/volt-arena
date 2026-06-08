import React, { useState, useEffect } from 'react';
import { Share, X } from 'lucide-react';

export const InstallPrompt: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if running on mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Check if running in browser (not standalone PWA)
    const isBrowser = !window.matchMedia('(display-mode: standalone)').matches;

    // Additionally check iOS standalone logic just in case
    const isIosStandalone = (window.navigator as any).standalone === true;

    // Show if mobile, in browser, and not already dismissed
    const hasDismissed = localStorage.getItem('hideInstallPrompt') === 'true';

    if (isMobile && isBrowser && !isIosStandalone && !hasDismissed) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('hideInstallPrompt', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-5 fade-in duration-500">
      <div className="bg-void/90 border border-volt p-4 shadow-2xl backdrop-blur-md relative flex items-start gap-4">
        <button 
          onClick={handleDismiss}
          className="absolute top-2 right-2 text-volt/50 hover:text-volt transition-colors"
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
        
        <div className="flex-1">
          <p className="text-xs font-black uppercase tracking-widest text-volt leading-relaxed">
            TACTICAL LINK DETECTED: Tap <Share size={12} className="inline mx-1 align-text-bottom" /> then 'Add to Home Screen' for Full-Screen HUD & Offline Access.
          </p>
        </div>
      </div>
    </div>
  );
};
