import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'in.localdrivers.app',
  appName: 'Localdrivers',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0F172A',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP'
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0F172A'
    },
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '577882724103-bevg4ia8jafh1thjr2dso1t8a6vcicrj.apps.googleusercontent.com',
      forceCodeForRefreshToken: true
    }
  }
};

export default config;
