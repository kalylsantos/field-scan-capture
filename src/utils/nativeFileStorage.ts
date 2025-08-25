import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { PhotoRecord } from '@/types/scanner';

export class NativeFileStorage {
  private async ensureDirectoryExists(barcode: string): Promise<void> {
    try {
      await Filesystem.mkdir({
        path: `campo-scanner/${barcode}`,
        directory: Directory.Documents,
        recursive: true,
      });
    } catch (error) {
      // Directory might already exist, which is fine
      console.log('Directory creation note:', error);
    }
  }

  private async getNextFileNumber(barcode: string): Promise<number> {
    try {
      const result = await Filesystem.readdir({
        path: `campo-scanner/${barcode}`,
        directory: Directory.Documents,
      });
      
      const imageFiles = result.files.filter(file => 
        file.name.startsWith(barcode) && file.name.endsWith('.jpg')
      );
      
      return imageFiles.length + 1;
    } catch (error) {
      // Directory doesn't exist or is empty, start with 1
      return 1;
    }
  }

  async savePhoto(barcode: string, imageData: string): Promise<PhotoRecord> {
    await this.ensureDirectoryExists(barcode);
    const fileNumber = await this.getNextFileNumber(barcode);
    
    const now = new Date();
    const fileName = `${barcode} (${fileNumber}).jpg`;
    const filePath = `campo-scanner/${barcode}/${fileName}`;
    
    // Convert base64 to proper format for Capacitor
    const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
    
    try {
      await Filesystem.writeFile({
        path: filePath,
        data: base64Data,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      });

      const photo: PhotoRecord = {
        id: `${barcode}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        barcode,
        imageData,
        timestamp: now.toISOString(),
        fileName,
        filePath,
      };

      return photo;
    } catch (error) {
      console.error('Error saving photo to native storage:', error);
      throw error;
    }
  }

  async getAllPhotos(): Promise<PhotoRecord[]> {
    try {
      // Read the main campo-scanner directory
      const result = await Filesystem.readdir({
        path: 'campo-scanner',
        directory: Directory.Documents,
      });

      const photos: PhotoRecord[] = [];

      // For each barcode directory
      for (const item of result.files) {
        if (item.type === 'directory') {
          try {
            const barcodeDir = await Filesystem.readdir({
              path: `campo-scanner/${item.name}`,
              directory: Directory.Documents,
            });

            // For each image file in the barcode directory
            for (const file of barcodeDir.files) {
              if (file.name.endsWith('.jpg')) {
                try {
                  const fileData = await Filesystem.readFile({
                    path: `campo-scanner/${item.name}/${file.name}`,
                    directory: Directory.Documents,
                    encoding: Encoding.UTF8,
                  });

                  const photo: PhotoRecord = {
                    id: `${item.name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    barcode: item.name,
                    imageData: `data:image/jpeg;base64,${fileData.data}`,
                    timestamp: new Date().toISOString(),
                    fileName: file.name,
                    filePath: `campo-scanner/${item.name}/${file.name}`,
                  };

                  photos.push(photo);
                } catch (error) {
                  console.error('Error reading file:', file.name, error);
                }
              }
            }
          } catch (error) {
            console.error('Error reading barcode directory:', item.name, error);
          }
        }
      }

      // Sort by timestamp descending (newest first)
      return photos.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    } catch (error) {
      console.error('Error getting all photos:', error);
      return [];
    }
  }

  async deletePhoto(photo: PhotoRecord): Promise<void> {
    if (!photo.filePath) return;
    
    try {
      await Filesystem.deleteFile({
        path: photo.filePath,
        directory: Directory.Documents,
      });
    } catch (error) {
      console.error('Error deleting photo:', error);
      throw error;
    }
  }

  async clearAllPhotos(): Promise<void> {
    try {
      await Filesystem.rmdir({
        path: 'campo-scanner',
        directory: Directory.Documents,
        recursive: true,
      });
    } catch (error) {
      console.error('Error clearing all photos:', error);
      throw error;
    }
  }

  async getStorageInfo(): Promise<any> {
    try {
      const result = await Filesystem.stat({
        path: 'campo-scanner',
        directory: Directory.Documents,
      });
      
      return {
        exists: true,
        size: result.size,
        modifiedTime: result.mtime,
      };
    } catch (error) {
      return {
        exists: false,
        size: 0,
      };
    }
  }

  // Check if we're running in a native environment
  static isNativeEnvironment(): boolean {
    return (window as any).Capacitor?.isNativePlatform() || false;
  }
}