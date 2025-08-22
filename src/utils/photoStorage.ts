// Internal storage using IndexedDB for better photo management
class PhotoStorage {
  private dbName = 'CampoScannerDB';
  private version = 1;
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
        
        // Create photos store
        if (!db.objectStoreNames.contains('photos')) {
          const photosStore = db.createObjectStore('photos', { keyPath: 'id' });
          photosStore.createIndex('barcode', 'barcode', { unique: false });
          photosStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  async savePhoto(photoData: any): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['photos'], 'readwrite');
      const store = transaction.objectStore('photos');
      const request = store.add(photoData);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getAllPhotos(): Promise<any[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['photos'], 'readonly');
      const store = transaction.objectStore('photos');
      const request = store.getAll();
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async getPhotosByBarcode(barcode: string): Promise<any[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['photos'], 'readonly');
      const store = transaction.objectStore('photos');
      const index = store.index('barcode');
      const request = index.getAll(barcode);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
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

  // Download photo to device
  downloadPhoto(photoData: any): void {
    const link = document.createElement('a');
    link.href = photoData.imageData;
    link.download = photoData.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Export all photos as ZIP (would require additional library in real implementation)
  async exportAllPhotos(): Promise<void> {
    const photos = await this.getAllPhotos();
    
    // For now, create a JSON export with base64 data
    const exportData = {
      exportDate: new Date().toISOString(),
      totalPhotos: photos.length,
      photos: photos.map(photo => ({
        id: photo.id,
        barcode: photo.barcode,
        fileName: photo.fileName,
        timestamp: photo.timestamp,
        imageData: photo.imageData // Base64 image data
      }))
    };

    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `campo_scanner_export_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

export const photoStorage = new PhotoStorage();