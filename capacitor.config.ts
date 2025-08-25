import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.61e273881da349699fbbba9dd3ac11e1',
  appName: 'field-scan-capture',
  webDir: 'dist',
  server: {
    url: 'https://61e27388-1da3-4969-9fbb-ba9dd3ac11e1.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    Filesystem: {
      iosIsAppDeletable: true,
      androidIsAppDeletable: true
    }
  }
};

export default config;