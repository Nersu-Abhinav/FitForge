import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';
import { usePersistenceStore } from '@/store/usePersistenceStore';

let lastBackPressTime = 0;

export interface BackButtonHandlers {
  closeModals: () => boolean;
  navigateToHome: () => boolean;
}

export function initMobileNativeIntegrations(handlers: BackButtonHandlers) {
  if (!Capacitor.isNativePlatform()) {
    // Web fallback for browser back button
    window.addEventListener('popstate', () => {
      if (handlers.closeModals()) {
        window.history.pushState(null, '', window.location.href);
        return;
      }
      if (handlers.navigateToHome()) {
        window.history.pushState(null, '', window.location.href);
        return;
      }
    });
    return () => {};
  }

  // Configure Status Bar on Native Android (e.g. OnePlus, Pixel, Samsung)
  try {
    StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
    StatusBar.setBackgroundColor({ color: '#06090F' }).catch(() => {});
    StatusBar.setOverlaysWebView({ overlay: true }).catch(() => {});
  } catch (err) {
    console.warn('Status bar configuration error:', err);
  }

  // Listen to native Android hardware/gesture back button
  const backListenerPromise = CapApp.addListener('backButton', () => {
    // 1. Try closing any open modals/drawers/AI advisor/sheets first
    const modalClosed = handlers.closeModals();
    if (modalClosed) {
      return;
    }

    // 2. If no modal is open, but we're on a subtab, navigate back to 'home'
    const navigated = handlers.navigateToHome();
    if (navigated) {
      return;
    }

    // 3. If on 'home' screen with nothing open, double-tap back to exit
    const now = Date.now();
    if (now - lastBackPressTime < 2000) {
      CapApp.exitApp();
    } else {
      lastBackPressTime = now;
      usePersistenceStore.getState().setSaved(
        `back-${Date.now()}`,
        'workout',
        'Press BACK again to exit FitForge'
      );
    }
  });

  return () => {
    backListenerPromise.then(handle => handle.remove()).catch(() => {});
  };
}

