import { useState, useEffect } from 'react';

// Interface for the beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface UsePWAInstallReturn {
  isInstallable: boolean;
  isInstalled: boolean;
  installPrompt: () => Promise<void>;
}

/**
 * Hook to manage PWA installation
 *
 * Detects if:
 * - The app is installable (beforeinstallprompt event fired)
 * - The app is already installed (running in standalone mode)
 *
 * Provides a function to trigger the install prompt
 */
export function usePWAInstall(): UsePWAInstallReturn {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);

  useEffect(() => {
    // Check if app is already installed (running in standalone mode)
    const checkIfInstalled = () => {
      // Check display-mode media query
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

      // Check iOS standalone mode
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const isIOSStandalone = (window.navigator as any).standalone === true;

      setIsInstalled(isStandalone || isIOSStandalone);
    };

    checkIfInstalled();

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (event: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      event.preventDefault();

      // Store the event so it can be triggered later
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    // Listen for successful installation
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installPrompt = async (): Promise<void> => {
    if (!deferredPrompt) {
      return;
    }

    // Show the install prompt
    await deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    // const choiceResult = await deferredPrompt.userChoice;
    // if (choiceResult.outcome === 'accepted') {
    //   console.log('User accepted the install prompt');
    // } else {
    //   console.log('User dismissed the install prompt');
    // }

    // Clear the prompt as it can only be used once
    setDeferredPrompt(null);
  };

  return {
    isInstallable: deferredPrompt != null && !isInstalled,
    isInstalled,
    installPrompt,
  };
}
