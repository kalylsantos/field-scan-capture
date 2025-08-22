import { useState, useEffect, useCallback } from 'react';
import { PhotoRecord } from '@/types/scanner';
import { androidPhotoStorage } from '@/utils/androidPhotoStorage';

export function useAndroidPhotoStorage() {
  const [photos, setPhotos] = useState<PhotoRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [storageInfo, setStorageInfo] = useState<any>(null);

  // Load photos from IndexedDB on mount
  useEffect(() => {
    loadPhotos();
    loadStorageInfo();
  }, []);

  const loadPhotos = async () => {
    try {
      setIsLoading(true);
      const storedPhotos = await androidPhotoStorage.getAllPhotos();
      setPhotos(storedPhotos);
    } catch (error) {
      console.error('Error loading photos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStorageInfo = async () => {
    try {
      const info = await androidPhotoStorage.getStorageInfo();
      setStorageInfo(info);
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
    };

    try {
      await androidPhotoStorage.savePhoto(photo);
      setPhotos(prev => [photo, ...prev]); // Add to beginning for newest first
      
      // Update storage info
      loadStorageInfo();
      
      return photo;
    } catch (error) {
      console.error('Error saving photo:', error);
      throw error;
    }
  }, []);

  const removePhoto = useCallback(async (photoId: string) => {
    try {
      await androidPhotoStorage.deletePhoto(photoId);
      setPhotos(prev => prev.filter(photo => photo.id !== photoId));
      
      // Update storage info
      loadStorageInfo();
    } catch (error) {
      console.error('Error removing photo:', error);
      throw error;
    }
  }, []);

  const getPhotosByBarcode = useCallback((barcode: string) => {
    return photos.filter(photo => photo.barcode === barcode);
  }, [photos]);

  const clearAllPhotos = useCallback(async () => {
    try {
      await androidPhotoStorage.clearAllPhotos();
      setPhotos([]);
      
      // Update storage info
      loadStorageInfo();
    } catch (error) {
      console.error('Error clearing photos:', error);
      throw error;
    }
  }, []);

  const exportData = useCallback(async () => {
    try {
      await androidPhotoStorage.exportAllPhotosForAndroid();
    } catch (error) {
      console.error('Error exporting photos:', error);
      throw error;
    }
  }, []);

  const downloadPhoto = useCallback(async (photo: PhotoRecord) => {
    try {
      await androidPhotoStorage.downloadPhotoToAndroid(photo);
    } catch (error) {
      console.error('Error downloading photo:', error);
      throw error;
    }
  }, []);

  return {
    photos,
    isLoading,
    storageInfo,
    addPhoto,
    removePhoto,
    getPhotosByBarcode,
    clearAllPhotos,
    exportData,
    downloadPhoto,
    loadPhotos,
    loadStorageInfo,
  };
}