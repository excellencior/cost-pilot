import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.costpilot.app',
  appName: 'CostPilot',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: true,
      backgroundColor: "#020617",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
    },
  },
};

export default config;
