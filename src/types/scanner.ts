export interface PhotoRecord {
  id: string;
  barcode: string;
  imageData: string;
  timestamp: string;
  fileName: string;
  filePath?: string; // For native file system paths
}

export interface CameraPermissionState {
  hasPermission: boolean | null;
  isRequesting: boolean;
  error: string | null;
}

export interface ScannerState {
  isScanning: boolean;
  currentBarcode: string | null;
  feedback: string;
}

export interface AppScreen {
  MAIN: 'main';
  WORK: 'work';
  HISTORY: 'history';
}

export const APP_SCREENS = {
  MAIN: 'main' as const,
  WORK: 'work' as const,
  HISTORY: 'history' as const,
} as const;

export type AppScreenType = typeof APP_SCREENS[keyof typeof APP_SCREENS];