import { useState, useEffect, useCallback } from 'react';
import { PhotoRecord } from '@/types/scanner';
import { nativePhotoStorage } from '@/utils/nativePhotoStorage';
import { useAndroidPhotoStorage } from './useAndroidPhotoStorage';

export function useNativePhotoStorage() {
  const [photos, setPhotos] = useState<PhotoRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [storageInfo, setStorageInfo] = useState<any>(null);
  
  const fallbackStorage = useAndroidPhotoStorage();
  
  // Check if we're in a native environment (Capacitor)
  const isNative = (window as any).Capacitor?.isNativePlatform() || false;

  useEffect(() => {
    loadPhotos();
    loadStorageInfo();
  }, []);

  const loadPhotos = async () => {
    try {
      setIsLoading(true);
      if (isNative) {
        const storedPhotos = await nativePhotoStorage.getAllPhotosMetadata();
        setPhotos(storedPhotos);
      } else {
        // Use fallback storage for web - wait for it to load first
        await fallbackStorage.loadPhotos();
      }
    } catch (error) {
      console.error('Error loading photos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStorageInfo = async () => {
    try {
      if (isNative) {
        const info = await nativePhotoStorage.getStorageInfo();
        setStorageInfo(info);
      } else {
        setStorageInfo(fallbackStorage.storageInfo);
      }
    } catch (error) {
      console.error('Error loading storage info:', error);
    }
  };

  const addPhoto = useCallback(async (barcode: string, imageData: string) => {
    const now = new Date();
    const photo: PhotoRecord = {
      id: `${barcode}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      barcode,
      imageData,
      timestamp: now.toISOString(),
      fileName: `campo_scanner_${barcode}_${now.toISOString().split('T')[0]}_${now.toTimeString().split(' ')[0].replace(/:/g, '')}.jpg`,
      fileSize: Math.round(imageData.length * 0.75), // Estimate JPG file size
    };

    try {
      if (isNative) {
        // Save as actual JPG file using Capacitor
        const savedPhoto = await nativePhotoStorage.savePhoto(photo);
        setPhotos(prev => [savedPhoto, ...prev]);
        loadStorageInfo();
        return savedPhoto;
      } else {
        // Fallback to IndexedDB with proper JPG handling
        const savedPhoto = await fallbackStorage.addPhoto(barcode, imageData);
        await loadPhotos(); // Reload to get updated photos
        return savedPhoto;
      }
    } catch (error) {
      console.error('Error saving photo:', error);
      throw error;
    }
  }, [isNative, fallbackStorage]);

  const removePhoto = useCallback(async (photoId: string) => {
    try {
      if (isNative) {
        const photo = photos.find(p => p.id === photoId);
        if (photo) {
          await nativePhotoStorage.deletePhoto(photo);
          setPhotos(prev => prev.filter(photo => photo.id !== photoId));
          loadStorageInfo();
        }
      } else {
        await fallbackStorage.removePhoto(photoId);
        await loadPhotos(); // Reload to get updated photos
      }
    } catch (error) {
      console.error('Error removing photo:', error);
      throw error;
    }
  }, [photos, isNative, fallbackStorage]);

  const getPhotosByBarcode = useCallback((barcode: string) => {
    return photos.filter(photo => photo.barcode === barcode);
  }, [photos]);

  const clearAllPhotos = useCallback(async () => {
    try {
      if (isNative) {
        await nativePhotoStorage.clearAllPhotos();
        setPhotos([]);
        loadStorageInfo();
      } else {
        await fallbackStorage.clearAllPhotos();
        await loadPhotos(); // Reload to get updated photos
      }
    } catch (error) {
      console.error('Error clearing photos:', error);
      throw error;
    }
  }, [isNative, fallbackStorage]);

  const exportData = useCallback(async () => {
    try {
      if (isNative) {
        // For native, create a JSON export with file references
        const exportData = {
          appInfo: {
            name: 'Campo Scanner',
            version: '1.0.0',
            exportDate: new Date().toISOString(),
            platform: 'native'
          },
          summary: {
            totalPhotos: photos.length,
            uniqueBarcodes: [...new Set(photos.map(p => p.barcode))].length,
          },
          photos: photos.map(photo => ({
            id: photo.id,
            barcode: photo.barcode,
            fileName: photo.fileName,
            filePath: photo.filePath,
            timestamp: photo.timestamp,
          }))
        };
        
        // Create JSON file and save it
        const jsonStr = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `campo_scanner_export_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } else {
        await fallbackStorage.exportData();
      }
    } catch (error) {
      console.error('Error exporting photos:', error);
      throw error;
    }
  }, [photos, isNative, fallbackStorage]);

  const downloadPhoto = useCallback(async (photo: PhotoRecord) => {
    try {
      if (isNative) {
        // For native, the photo is already saved locally
        // We can just show a toast that it's already saved
        console.log('Photo already saved locally at:', photo.filePath);
      } else {
        await fallbackStorage.downloadPhoto(photo);
      }
    } catch (error) {
      console.error('Error downloading photo:', error);
      throw error;
    }
  }, [isNative, fallbackStorage]);

  return {
    photos: isNative ? photos : fallbackStorage.photos,
    isLoading: isNative ? isLoading : fallbackStorage.isLoading,
    storageInfo: isNative ? storageInfo : fallbackStorage.storageInfo,
    addPhoto,
    removePhoto,
    getPhotosByBarcode,
    clearAllPhotos,
    exportData,
    downloadPhoto,
    loadPhotos,
    loadStorageInfo,
    isNative,
  };
}