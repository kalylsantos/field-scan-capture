import React, { useState, useRef, useEffect } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { CameraModal } from './CameraModal';
import { Button } from '@/components/ui/button';
import { Camera as CameraIcon, RotateCcw, Save } from 'lucide-react';

interface PhotoCameraProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoSaved: (imageData: string) => void;
  barcode: string | null;
}

export function PhotoCamera({ isOpen, onClose, onPhotoSaved, barcode }: PhotoCameraProps) {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isNative, setIsNative] = useState(false);

  // Check if we're in a native environment
  useEffect(() => {
    setIsNative((window as any).Capacitor?.isNativePlatform() || false);
  }, []);

  const handleClose = () => {
    setCapturedImage(null);
    setIsCapturing(false);
    setError(null);
    onClose();
  };

  const handleCapture = async () => {
    if (isCapturing) return;

    setIsCapturing(true);
    setError(null);
    
    try {
      if (isNative) {
        // Use Capacitor Camera for native apps
        const image = await Camera.getPhoto({
          quality: 95,
          allowEditing: false,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Camera,
          saveToGallery: false,
          correctOrientation: true,
          width: 1280,
          height: 720,
        });

        if (image.dataUrl) {
          // Add overlay information to the image
          const imageWithOverlay = await addOverlayToImage(image.dataUrl);
          setCapturedImage(imageWithOverlay);
        }
      } else {
        // Fallback for web - this shouldn't be reached in your native app
        setError('Camera not available in web environment');
      }
      
    } catch (error) {
      console.error('Error capturing photo:', error);
      setError('Erro ao capturar foto. Tente novamente.');
    } finally {
      setIsCapturing(false);
    }
  };

  const addOverlayToImage = async (imageDataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        if (!context) {
          resolve(imageDataUrl);
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw the original image
        context.drawImage(img, 0, 0);
        
        // Add overlay with information
        const now = new Date();
        
        // Calculate responsive font size
        const fontSize = Math.max(24, img.width * 0.025);
        context.font = `${fontSize}px Arial`;
        context.textAlign = 'right';
        
        const info = [
          `Data: ${now.toLocaleDateString('pt-BR')}`,
          `Hora: ${now.toLocaleTimeString('pt-BR')}`,
          `Código: ${barcode || 'N/A'}`,
        ];
        
        const lineHeight = fontSize * 1.4;
        const padding = Math.max(16, img.width * 0.015);
        const backgroundWidth = Math.max(300, img.width * 0.3);
        const backgroundHeight = info.length * lineHeight + padding * 2;
        
        const x = img.width - backgroundWidth - Math.max(20, img.width * 0.015);
        const y = img.height - backgroundHeight - Math.max(20, img.height * 0.02);
        
        // Draw semi-transparent background
        context.fillStyle = 'rgba(0, 0, 0, 0.8)';
        context.fillRect(x, y, backgroundWidth, backgroundHeight);
        
        // Draw text
        context.fillStyle = 'white';
        info.forEach((line, index) => {
          const textY = y + padding + (index + 1) * lineHeight;
          context.fillText(line, x + backgroundWidth - padding, textY);
        });
        
        // Convert back to data URL with high quality
        const result = canvas.toDataURL('image/jpeg', 0.95);
        resolve(result);
      };
      
      img.src = imageDataUrl;
    });
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setError(null);
  };

  const handleSave = () => {
    if (capturedImage) {
      onPhotoSaved(capturedImage);
      handleClose();
    }
  };

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setCapturedImage(null);
      setIsCapturing(false);
      setError(null);
    }
  }, [isOpen]);

  const renderControls = () => {
    if (capturedImage) {
      return (
        <div className="flex gap-4 justify-center">
          <Button variant="warning" onClick={handleRetake} size="lg">
            <RotateCcw className="h-5 w-5 mr-2" />
            Repetir
          </Button>
          <Button variant="success" onClick={handleSave} size="lg">
            <Save className="h-5 w-5 mr-2" />
            Salvar
          </Button>
        </div>
      );
    }

    return (
      <div className="flex gap-6 justify-center items-center">
        <Button 
          variant="camera" 
          onClick={handleClose}
          size="lg"
          className="px-8"
        >
          Cancelar
        </Button>
        <Button
          variant="camera"
          size="icon"
          onClick={handleCapture}
          disabled={isCapturing}
          className="bg-white text-black hover:bg-white/90 w-20 h-20 rounded-full disabled:opacity-50 shadow-lg"
        >
          <CameraIcon className="h-10 w-10" />
        </Button>
      </div>
    );
  };

  return (
    <CameraModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Capturar Foto"
      subtitle={barcode ? `Código: ${barcode}` : undefined}
      controls={renderControls()}
    >
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="text-center text-white p-6">
            <p className="text-lg font-semibold mb-2">Erro na Câmera</p>
            <p className="text-sm opacity-80 mb-4">{error}</p>
            <Button
              variant="default"
              onClick={handleCapture}
              className="mt-4"
            >
              Tentar Novamente
            </Button>
          </div>
        </div>
      )}

      {capturedImage ? (
        <div className="w-full h-full flex items-center justify-center bg-black">
          <img
            src={capturedImage}
            alt="Foto capturada"
            className="max-w-full max-h-full object-contain"
          />
        </div>
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-black">
          {isCapturing ? (
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-lg">Capturando foto...</p>
            </div>
          ) : (
            <div className="text-center text-white p-8">
              <CameraIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">Toque no botão para capturar</p>
              <p className="text-sm opacity-75">
                A foto será salva com as informações do código
              </p>
              {barcode && (
                <div className="mt-4 bg-white/10 rounded-lg p-3">
                  <p className="text-sm">Código: <span className="font-mono">{barcode}</span></p>
                  <p className="text-xs opacity-75">
                    {new Date().toLocaleString('pt-BR')}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </CameraModal>
  );
}