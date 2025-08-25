import { useState, useEffect, useCallback } from 'react';
import { PhotoRecord } from '@/types/scanner';
import { NativeFileStorage } from '@/utils/nativeFileStorage';
import { useAndroidPhotoStorage } from './useAndroidPhotoStorage';

export function useNativePhotoStorage() {
  const [photos, setPhotos] = useState<PhotoRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [storageInfo, setStorageInfo] = useState<any>(null);
  
  const nativeStorage = new NativeFileStorage();
  const fallbackStorage = useAndroidPhotoStorage();
  
  const isNative = NativeFileStorage.isNativeEnvironment();

  useEffect(() => {
    loadPhotos();
    loadStorageInfo();
  }, []);

  const loadPhotos = async () => {
    try {
      setIsLoading(true);
      if (isNative) {
        const storedPhotos = await nativeStorage.getAllPhotos();
        setPhotos(storedPhotos);
      } else {
        // Use fallback storage for web
        await fallbackStorage.loadPhotos();
        setPhotos(fallbackStorage.photos);
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
        const info = await nativeStorage.getStorageInfo();
        setStorageInfo(info);
      } else {
        setStorageInfo(fallbackStorage.storageInfo);
      }
    } catch (error) {
      console.error('Error loading storage info:', error);
    }
  };

  const addPhoto = useCallback(async (barcode: string, imageData: string) => {
    try {
      if (isNative) {
        const photo = await nativeStorage.savePhoto(barcode, imageData);
        setPhotos(prev => [photo, ...prev]);
        loadStorageInfo();
        return photo;
      } else {
        return await fallbackStorage.addPhoto(barcode, imageData);
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
          await nativeStorage.deletePhoto(photo);
          setPhotos(prev => prev.filter(photo => photo.id !== photoId));
          loadStorageInfo();
        }
      } else {
        await fallbackStorage.removePhoto(photoId);
        setPhotos(fallbackStorage.photos);
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
        await nativeStorage.clearAllPhotos();
        setPhotos([]);
        loadStorageInfo();
      } else {
        await fallbackStorage.clearAllPhotos();
        setPhotos([]);
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