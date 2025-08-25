import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lovable.app',
  appName: 'field-scan-capture',
  webDir: 'dist',
  plugins: {
    Filesystem: {
      iosIsAppDeletable: true,
      androidIsAppDeletable: true
    }
  }
};

export default config;