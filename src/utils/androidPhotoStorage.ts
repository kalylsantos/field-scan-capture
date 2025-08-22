import { PhotoRecord } from '@/types/scanner';

// Enhanced photo storage specifically for Android devices
class AndroidPhotoStorage {
  private dbName = 'CampoScannerDB';
  private version = 2;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create photos store with enhanced indexing
        if (!db.objectStoreNames.contains('photos')) {
          const photosStore = db.createObjectStore('photos', { keyPath: 'id' });
          photosStore.createIndex('barcode', 'barcode', { unique: false });
          photosStore.createIndex('timestamp', 'timestamp', { unique: false });
          photosStore.createIndex('fileName', 'fileName', { unique: false });
        }
        
        // Create metadata store for app settings
        if (!db.objectStoreNames.contains('metadata')) {
          const metadataStore = db.createObjectStore('metadata', { keyPath: 'key' });
        }
      };
    });
  }

  // Save photo with Android-optimized compression
  async savePhoto(photoData: PhotoRecord): Promise<void> {
    if (!this.db) await this.init();
    
    // Compress image for Android storage optimization
    const compressedImageData = await this.compressImageForAndroid(photoData.imageData);
    const optimizedPhoto = {
      ...photoData,
      imageData: compressedImageData,
      deviceInfo: this.getDeviceInfo()
    };
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['photos'], 'readwrite');
      const store = transaction.objectStore('photos');
      const request = store.put(optimizedPhoto); // Use put instead of add to allow updates
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        // Also save to Android's file system if available
        this.saveToAndroidFileSystem(optimizedPhoto);
        resolve();
      };
    });
  }

  // Compress image specifically for Android devices
  private async compressImageForAndroid(imageData: string): Promise<string> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Optimize dimensions for Android
        const maxWidth = 1920;
        const maxHeight = 1080;
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Use higher quality for Android devices
        const compressedData = canvas.toDataURL('image/jpeg', 0.85);
        resolve(compressedData);
      };
      
      img.src = imageData;
    });
  }

  // Save to Android file system using File System Access API or fallback
  private async saveToAndroidFileSystem(photoData: PhotoRecord): Promise<void> {
    try {
      // Check if File System Access API is available (Android Chrome 86+)
      if ('showSaveFilePicker' in window) {
        // This will be handled by the download function when user requests it
        return;
      }
      
      // Fallback: Use download attribute for Android browsers
      this.createDownloadLink(photoData);
    } catch (error) {
      console.log('File system access not available, using IndexedDB only');
    }
  }

  // Create download link for Android devices
  private createDownloadLink(photoData: PhotoRecord): void {
    const link = document.createElement('a');
    link.href = photoData.imageData;
    link.download = photoData.fileName;
    link.style.display = 'none';
    document.body.appendChild(link);
    // Don't auto-click, let user decide when to download
    document.body.removeChild(link);
  }

  // Get device information for metadata
  private getDeviceInfo(): any {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screenWidth: screen.width,
      screenHeight: screen.height,
      timestamp: new Date().toISOString()
    };
  }

  // Enhanced download for Android
  async downloadPhotoToAndroid(photoData: PhotoRecord): Promise<void> {
    try {
      // Convert base64 to blob for better Android compatibility
      const response = await fetch(photoData.imageData);
      const blob = await response.blob();
      
      // Create object URL
      const url = URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = photoData.fileName;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      
    } catch (error) {
      console.error('Error downloading photo on Android:', error);
      // Fallback to original method
      const link = document.createElement('a');
      link.href = photoData.imageData;
      link.download = photoData.fileName;
      link.click();
    }
  }

  // Bulk export optimized for Android
  async exportAllPhotosForAndroid(): Promise<void> {
    const photos = await this.getAllPhotos();
    
    if (photos.length === 0) {
      throw new Error('Nenhuma foto para exportar');
    }

    // Create a comprehensive export package
    const exportData = {
      appInfo: {
        name: 'Campo Scanner',
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        deviceInfo: this.getDeviceInfo()
      },
      summary: {
        totalPhotos: photos.length,
        uniqueBarcodes: [...new Set(photos.map(p => p.barcode))].length,
        dateRange: {
          from: photos.reduce((min, p) => p.timestamp < min ? p.timestamp : min, photos[0]?.timestamp),
          to: photos.reduce((max, p) => p.timestamp > max ? p.timestamp : max, photos[0]?.timestamp)
        }
      },
      photos: photos.map(photo => ({
        id: photo.id,
        barcode: photo.barcode,
        fileName: photo.fileName,
        timestamp: photo.timestamp,
        formattedDate: new Date(photo.timestamp).toLocaleString('pt-BR'),
        tags: {
          data: new Date(photo.timestamp).toLocaleDateString('pt-BR'),
          hora: new Date(photo.timestamp).toLocaleTimeString('pt-BR'),
          codigo: photo.barcode,
        },
        // Include image data for complete backup
        imageData: photo.imageData
      }))
    };

    // Create and download JSON file
    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `campo_scanner_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // Standard methods with Android optimizations
  async getAllPhotos(): Promise<PhotoRecord[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['photos'], 'readonly');
      const store = transaction.objectStore('photos');
      const request = store.getAll();
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        // Sort by timestamp descending (newest first)
        const photos = request.result.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        resolve(photos);
      };
    });
  }

  async getPhotosByBarcode(barcode: string): Promise<PhotoRecord[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['photos'], 'readonly');
      const store = transaction.objectStore('photos');
      const index = store.index('barcode');
      const request = index.getAll(barcode);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const photos = request.result.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        resolve(photos);
      };
    });
  }

  async deletePhoto(id: string): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['photos'], 'readwrite');
      const store = transaction.objectStore('photos');
      const request = store.delete(id);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async clearAllPhotos(): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['photos'], 'readwrite');
      const store = transaction.objectStore('photos');
      const request = store.clear();
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  // Get storage usage information
  async getStorageInfo(): Promise<any> {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        return {
          quota: estimate.quota,
          usage: estimate.usage,
          available: estimate.quota ? estimate.quota - (estimate.usage || 0) : null,
          usagePercentage: estimate.quota ? ((estimate.usage || 0) / estimate.quota * 100).toFixed(2) : null
        };
      }
    } catch (error) {
      console.error('Storage estimate not available:', error);
    }
    return null;
  }
}

export const androidPhotoStorage = new AndroidPhotoStorage();