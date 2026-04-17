import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.costpilot.app',
  appName: 'CostPilot',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: true,
      backgroundColor: "#0c0a09",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
    },
    SystemBars: {
      insetsHandling: "css",
      style: "DEFAULT",
    },
    BackgroundRunner: {
      label: 'com.costpilot.background.backup',
      src: 'runners/backup-runner.js',
      event: 'backupSync',
      repeat: true,
      interval: 15,
      autoStart: true,
    }
  },
};

export default config;
