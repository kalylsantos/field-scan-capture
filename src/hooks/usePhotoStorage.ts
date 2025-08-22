import { useState, useEffect, useCallback } from 'react';
import { PhotoRecord } from '@/types/scanner';

const STORAGE_KEY = 'campo_scanner_photos';

export function usePhotoStorage() {
  const [photos, setPhotos] = useState<PhotoRecord[]>([]);

  // Load photos from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedPhotos = JSON.parse(stored);
        setPhotos(parsedPhotos);
      }
    } catch (error) {
      console.error('Error loading photos from storage:', error);
    }
  }, []);

  // Save photos to localStorage whenever photos change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(photos));
    } catch (error) {
      console.error('Error saving photos to storage:', error);
    }
  }, [photos]);

  const addPhoto = useCallback((barcode: string, imageData: string) => {
    const now = new Date();
    const photo: PhotoRecord = {
      id: `${barcode}_${Date.now()}`,
      barcode,
      imageData,
      timestamp: now.toISOString(),
      fileName: `${barcode}_${now.toISOString().split('T')[0]}_${now.toTimeString().split(' ')[0].replace(/:/g, '')}.jpg`,
    };

    setPhotos(prev => [...prev, photo]);
    return photo;
  }, []);

  const removePhoto = useCallback((photoId: string) => {
    setPhotos(prev => prev.filter(photo => photo.id !== photoId));
  }, []);

  const getPhotosByBarcode = useCallback((barcode: string) => {
    return photos.filter(photo => photo.barcode === barcode);
  }, [photos]);

  const clearAllPhotos = useCallback(() => {
    setPhotos([]);
  }, []);

  const exportData = useCallback(() => {
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
  }, [photos]);

  return {
    photos,
    addPhoto,
    removePhoto,
    getPhotosByBarcode,
    clearAllPhotos,
    exportData,
  };
}