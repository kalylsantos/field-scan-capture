import { useState, useEffect, useCallback } from 'react';
import { PhotoRecord } from '@/types/scanner';
import { photoStorage } from '@/utils/photoStorage';

const STORAGE_KEY = 'campo_scanner_photos';

export function usePhotoStorage() {
  const [photos, setPhotos] = useState<PhotoRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load photos from IndexedDB on mount
  useEffect(() => {
    loadPhotos();
  }, []);

  const loadPhotos = async () => {
    try {
      setIsLoading(true);
      const storedPhotos = await photoStorage.getAllPhotos();
      setPhotos(storedPhotos);
    } catch (error) {
      console.error('Error loading photos from IndexedDB:', error);
      // Fallback to localStorage
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsedPhotos = JSON.parse(stored);
          setPhotos(parsedPhotos);
        }
      } catch (localStorageError) {
        console.error('Error loading photos from localStorage:', localStorageError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const addPhoto = useCallback(async (barcode: string, imageData: string) => {
    const now = new Date();
    const photo: PhotoRecord = {
      id: `${barcode}_${Date.now()}`,
      barcode,
      imageData,
      timestamp: now.toISOString(),
      fileName: `${barcode}_${now.toISOString().split('T')[0]}_${now.toTimeString().split(' ')[0].replace(/:/g, '')}.jpg`,
    };

    try {
      // Save to IndexedDB
      await photoStorage.savePhoto(photo);
      setPhotos(prev => [...prev, photo]);
      
      // Also save to localStorage as backup
      const updatedPhotos = [...photos, photo];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPhotos));
      
      return photo;
    } catch (error) {
      console.error('Error saving photo:', error);
      
      // Fallback to localStorage only
      setPhotos(prev => [...prev, photo]);
      const updatedPhotos = [...photos, photo];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPhotos));
      
      return photo;
    }
  }, [photos]);

  const removePhoto = useCallback(async (photoId: string) => {
    try {
      await photoStorage.deletePhoto(photoId);
      setPhotos(prev => prev.filter(photo => photo.id !== photoId));
      
      // Also update localStorage backup
      const updatedPhotos = photos.filter(photo => photo.id !== photoId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPhotos));
    } catch (error) {
      console.error('Error removing photo:', error);
      
      // Fallback to localStorage only
      setPhotos(prev => prev.filter(photo => photo.id !== photoId));
      const updatedPhotos = photos.filter(photo => photo.id !== photoId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPhotos));
    }
  }, [photos]);

  const getPhotosByBarcode = useCallback((barcode: string) => {
    return photos.filter(photo => photo.barcode === barcode);
  }, [photos]);

  const clearAllPhotos = useCallback(async () => {
    try {
      await photoStorage.clearAllPhotos();
      setPhotos([]);
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing photos:', error);
      
      // Fallback to localStorage only
      setPhotos([]);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const exportData = useCallback(async () => {
    try {
      await photoStorage.exportAllPhotos();
    } catch (error) {
      console.error('Error exporting photos:', error);
      
      // Fallback to simple JSON export
      const exportData = {
        exportDate: new Date().toISOString(),
        totalPhotos: photos.length,
        photos: photos.map(photo => ({
          barcode: photo.barcode,
          fileName: photo.fileName,
          timestamp: photo.timestamp,
          tags: {
            data: new Date(photo.timestamp).toLocaleDateString('pt-BR'),
            hora: new Date(photo.timestamp).toLocaleTimeString('pt-BR'),
            codigo: photo.barcode,
          },
        })),
      };

      const jsonStr = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `campo_scanner_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, [photos]);

  const downloadPhoto = useCallback((photo: PhotoRecord) => {
    photoStorage.downloadPhoto(photo);
  }, []);

  return {
    photos,
    isLoading,
    addPhoto,
    removePhoto,
    getPhotosByBarcode,
    clearAllPhotos,
    exportData,
    downloadPhoto,
    loadPhotos,
  };
}