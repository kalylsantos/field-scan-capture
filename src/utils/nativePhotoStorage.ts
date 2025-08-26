import { PhotoRecord } from '@/types/scanner';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

// Native photo storage for Capacitor apps - saves actual JPG files
class NativePhotoStorage {
  private baseDir = 'campo-scanner';

  // Save photo as actual JPG file on device storage
  async savePhoto(photoData: PhotoRecord): Promise<PhotoRecord> {
    try {
      // Convert base64 data URL to pure base64
      const base64Data = photoData.imageData.replace(/^data:image\/[a-z]+;base64,/, '');
      
      // Create directory structure: Documents/campo-scanner/[BARCODE]/
      const barcodeDir = `${this.baseDir}/${photoData.barcode}`;
      
      try {
        await Filesystem.mkdir({
          path: barcodeDir,
          directory: Directory.Documents,
          recursive: true,
        });
      } catch (error) {
        // Directory might already exist, that's okay
        console.log('Directory already exists or created');
      }

      // Generate unique filename with proper JPG extension
      const timestamp = new Date();
      const fileName = `${photoData.barcode}_${timestamp.getFullYear()}${String(timestamp.getMonth() + 1).padStart(2, '0')}${String(timestamp.getDate()).padStart(2, '0')}_${String(timestamp.getHours()).padStart(2, '0')}${String(timestamp.getMinutes()).padStart(2, '0')}_${Math.random().toString(36).substr(2, 5)}.jpg`;
      
      const filePath = `${barcodeDir}/${fileName}`;

      // Write the actual JPG file to device storage
      const result = await Filesystem.writeFile({
        path: filePath,
        data: base64Data,
        directory: Directory.Documents,
        encoding: Encoding.UTF8, // Base64 encoding
      });

      // Return updated photo record with file path
      const savedPhoto: PhotoRecord = {
        ...photoData,
        fileName,
        filePath: result.uri,
      };

      // Also save metadata to a JSON file for easier access
      await this.savePhotoMetadata(savedPhoto);

      return savedPhoto;

    } catch (error) {
      console.error('Error saving photo to native storage:', error);
      throw new Error(`Failed to save photo: ${error}`);
    }
  }

  // Save photo metadata as JSON for quick access
  private async savePhotoMetadata(photoData: PhotoRecord): Promise<void> {
    try {
      const metadataDir = `${this.baseDir}/metadata`;
      
      try {
        await Filesystem.mkdir({
          path: metadataDir,
          directory: Directory.Documents,
          recursive: true,
        });
      } catch (error) {
        // Directory might already exist
      }

      // Create metadata object without the large image data
      const metadata = {
        id: photoData.id,
        barcode: photoData.barcode,
        timestamp: photoData.timestamp,
        fileName: photoData.fileName,
        filePath: photoData.filePath,
        formattedDate: new Date(photoData.timestamp).toLocaleString('pt-BR'),
        fileSize: Math.round(photoData.imageData.length * 0.75), // Approximate file size
      };

      const metadataFile = `${metadataDir}/${photoData.id}.json`;

      await Filesystem.writeFile({
        path: metadataFile,
        data: JSON.stringify(metadata, null, 2),
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      });

    } catch (error) {
      console.error('Error saving photo metadata:', error);
      // Non-critical error, don't throw
    }
  }

  // Get all photo metadata
  async getAllPhotosMetadata(): Promise<PhotoRecord[]> {
    try {
      const metadataDir = `${this.baseDir}/metadata`;
      
      const files = await Filesystem.readdir({
        path: metadataDir,
        directory: Directory.Documents,
      });

      const photos: PhotoRecord[] = [];

      for (const file of files.files) {
        if (file.name.endsWith('.json')) {
          try {
            const content = await Filesystem.readFile({
              path: `${metadataDir}/${file.name}`,
              directory: Directory.Documents,
              encoding: Encoding.UTF8,
            });

            const metadata = JSON.parse(content.data as string);
            photos.push(metadata);
          } catch (error) {
            console.error(`Error reading metadata file ${file.name}:`, error);
          }
        }
      }

      // Sort by timestamp descending (newest first)
      return photos.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

    } catch (error) {
      console.error('Error loading photos metadata:', error);
      return [];
    }
  }

  // Get photos by barcode
  async getPhotosByBarcode(barcode: string): Promise<PhotoRecord[]> {
    const allPhotos = await this.getAllPhotosMetadata();
    return allPhotos.filter(photo => photo.barcode === barcode);
  }

  // Read actual photo file and return base64 data
  async getPhotoData(photo: PhotoRecord): Promise<string> {
    try {
      if (!photo.filePath) {
        throw new Error('Photo file path not found');
      }

      // Extract path from URI if needed
      const filePath = photo.filePath.replace(/^file:\/\//, '');
      const pathParts = filePath.split('/');
      const documentsIndex = pathParts.findIndex(part => part === 'Documents');
      
      if (documentsIndex === -1) {
        throw new Error('Invalid file path');
      }

      const relativePath = pathParts.slice(documentsIndex + 1).join('/');

      const result = await Filesystem.readFile({
        path: relativePath,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      });

      // Return as data URL for display
      return `data:image/jpeg;base64,${result.data}`;

    } catch (error) {
      console.error('Error reading photo data:', error);
      throw error;
    }
  }

  // Delete photo and its metadata
  async deletePhoto(photo: PhotoRecord): Promise<void> {
    try {
      // Delete the actual image file
      if (photo.filePath) {
        const filePath = photo.filePath.replace(/^file:\/\//, '');
        const pathParts = filePath.split('/');
        const documentsIndex = pathParts.findIndex(part => part === 'Documents');
        
        if (documentsIndex !== -1) {
          const relativePath = pathParts.slice(documentsIndex + 1).join('/');
          
          await Filesystem.deleteFile({
            path: relativePath,
            directory: Directory.Documents,
          });
        }
      }

      // Delete metadata file
      const metadataFile = `${this.baseDir}/metadata/${photo.id}.json`;
      await Filesystem.deleteFile({
        path: metadataFile,
        directory: Directory.Documents,
      });

    } catch (error) {
      console.error('Error deleting photo:', error);
      throw error;
    }
  }

  // Clear all photos and metadata
  async clearAllPhotos(): Promise<void> {
    try {
      // Remove the entire scanner directory
      await Filesystem.rmdir({
        path: this.baseDir,
        directory: Directory.Documents,
        recursive: true,
      });

    } catch (error) {
      console.error('Error clearing all photos:', error);
      throw error;
    }
  }

  // Export all photos and metadata as ZIP-like structure
  async exportAllData(): Promise<void> {
    try {
      const photos = await this.getAllPhotosMetadata();
      
      if (photos.length === 0) {
        throw new Error('No photos to export');
      }

      // Create export manifest
      const manifest = {
        appInfo: {
          name: 'Campo Scanner',
          version: '1.0.0',
          exportDate: new Date().toISOString(),
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
          filePath: photo.filePath,
        }))
      };

      // Save manifest file
      const exportDir = `${this.baseDir}/exports`;
      const exportFile = `export_${new Date().toISOString().split('T')[0]}.json`;

      try {
        await Filesystem.mkdir({
          path: exportDir,
          directory: Directory.Documents,
          recursive: true,
        });
      } catch (error) {
        // Directory might already exist
      }

      await Filesystem.writeFile({
        path: `${exportDir}/${exportFile}`,
        data: JSON.stringify(manifest, null, 2),
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      });

      console.log(`Export manifest saved: ${exportFile}`);
      
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }

  // Get storage information
  async getStorageInfo(): Promise<any> {
    try {
      const photos = await this.getAllPhotosMetadata();
      const totalPhotos = photos.length;
      const uniqueBarcodes = [...new Set(photos.map(p => p.barcode))].length;
      
      // Estimate storage usage (rough calculation)
      const estimatedSize = photos.reduce((total, photo) => total + (photo.fileSize || 0), 0);

      return {
        totalPhotos,
        uniqueBarcodes,
        estimatedStorageUsage: estimatedSize,
        formattedSize: this.formatBytes(estimatedSize),
        storagePath: `Documents/${this.baseDir}`,
      };

    } catch (error) {
      console.error('Error getting storage info:', error);
      return null;
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export const nativePhotoStorage = new NativePhotoStorage();