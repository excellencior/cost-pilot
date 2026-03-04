import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.costpilot.app',
  appName: 'CostPilot',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: false,
      backgroundColor: "#0c0a09",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
    },
    FirebaseAuthentication: {
      providers: ['google.com'],
      skipNativeAuth: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#0c0a09",
      overlaysWebView: false,
    },
  },
};

export default config;
