import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { App as CapApp } from '@capacitor/app';

export const GOOGLE_CLIENT_ID = '1051897287119-f63j3d036r3ksbd28csd3itg8f9paug7.apps.googleusercontent.com';

export const nativeAuth = {
  getGoogleClientId(): string {
    return GOOGLE_CLIENT_ID;
  },

  isNative(): boolean {
    return Capacitor.isNativePlatform();
  },

  // Setup app URL listener for OAuth deep-link redirects on Android
  initDeepLinkListener(onRedirect?: (url: string) => void): () => void {
    if (!Capacitor.isNativePlatform()) {
      return () => {};
    }

    const sub = CapApp.addListener('appUrlOpen', async (data) => {
      // When OAuth completes in external browser / Custom Tab, close the browser
      try {
        await Browser.close();
      } catch {}

      if (data.url && onRedirect) {
        onRedirect(data.url);
      }
    });

    return () => {
      sub.then(handle => handle.remove()).catch(() => {});
    };
  },

  // Open OAuth or external authentication URL safely using Chrome Custom Tabs on Android
  async openAuthUrl(url: string): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      await Browser.open({
        url,
        windowName: '_system',
        presentationStyle: 'popover',
      });
    } else {
      window.location.href = url;
    }
  },
};
