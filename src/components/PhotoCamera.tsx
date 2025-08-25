import React, { useState, useRef, useEffect } from 'react';
import { useCamera } from '@/hooks/useCamera';
import { CameraModal } from './CameraModal';
import { Button } from '@/components/ui/button';
import { Camera, RotateCcw, Save } from 'lucide-react';

interface PhotoCameraProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoSaved: (imageData: string) => void;
  barcode: string | null;
}

export function PhotoCamera({ isOpen, onClose, onPhotoSaved, barcode }: PhotoCameraProps) {
  const { permissionState, videoRef, requestCameraPermission, stopCamera, capturePhoto } = useCamera();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleOpen = async () => {
    if (isOpen && !permissionState.hasPermission) {
      try {
        await requestCameraPermission('environment');
      } catch (error) {
        console.error('Failed to start camera:', error);
      }
    }
  };

  const handleClose = () => {
    stopCamera();
    setCapturedImage(null);
    setIsCapturing(false);
    onClose();
  };

  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current || isCapturing) return;

    setIsCapturing(true);
    
    try {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (!context) return;

      // Get video dimensions
      const videoWidth = videoRef.current.videoWidth;
      const videoHeight = videoRef.current.videoHeight;
      
      if (videoWidth === 0 || videoHeight === 0) {
        console.error('Video not ready');
        return;
      }

      canvas.width = videoWidth;
      canvas.height = videoHeight;
      
      // Draw video frame
      context.drawImage(videoRef.current, 0, 0, videoWidth, videoHeight);
      
      // Add overlay with information
      addOverlayToCanvas(context, videoWidth, videoHeight);
      
      // Convert to high-quality JPEG
      const imageData = canvas.toDataURL('image/jpeg', 0.92);
      setCapturedImage(imageData);
      
    } catch (error) {
      console.error('Error capturing photo:', error);
    } finally {
      setIsCapturing(false);
    }
  };

  const addOverlayToCanvas = (context: CanvasRenderingContext2D, width: number, height: number) => {
    const now = new Date();
    
    // Set up text styling
    context.fillStyle = 'rgba(0, 0, 0, 0.8)';
    context.font = `${Math.max(16, width * 0.02)}px Arial`;
    context.textAlign = 'right';
    
    const info = [
      `Data: ${now.toLocaleDateString('pt-BR')}`,
      `Hora: ${now.toLocaleTimeString('pt-BR')}`,
      `Código: ${barcode || 'N/A'}`,
    ];
    
    const fontSize = Math.max(16, width * 0.02);
    const lineHeight = fontSize * 1.4;
    const padding = Math.max(12, width * 0.01);
    const backgroundWidth = Math.max(220, width * 0.25);
    const backgroundHeight = info.length * lineHeight + padding * 2;
    
    const x = width - backgroundWidth - Math.max(15, width * 0.01);
    const y = height - backgroundHeight - Math.max(15, height * 0.02);
    
    // Draw background
    context.fillRect(x, y, backgroundWidth, backgroundHeight);
    
    // Draw text
    context.fillStyle = 'white';
    info.forEach((line, index) => {
      const textY = y + padding + (index + 1) * lineHeight;
      context.fillText(line, x + backgroundWidth - padding, textY);
    });
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setIsCapturing(false);
  };

  const handleSave = () => {
    if (capturedImage) {
      onPhotoSaved(capturedImage);
      handleClose();
    }
  };

  // Start camera when modal opens
  useEffect(() => {
    if (isOpen) {
      handleOpen();
    } else {
      stopCamera();
      setCapturedImage(null);
      setIsCapturing(false);
    }
  }, [isOpen]);

  const renderControls = () => {
    if (capturedImage) {
      return (
        <>
          <Button variant="warning" onClick={handleRetake} size="lg">
            <RotateCcw className="h-5 w-5 mr-2" />
            Repetir
          </Button>
          <Button variant="success" onClick={handleSave} size="lg">
            <Save className="h-5 w-5 mr-2" />
            Salvar
          </Button>
        </>
      );
    }

    return (
      <>
        <Button 
          variant="camera" 
          onClick={handleClose}
          size="lg"
          className="px-6"
        >
          Cancelar
        </Button>
        <Button
          variant="camera"
          size="icon"
          onClick={handleCapture}
          disabled={!permissionState.hasPermission || isCapturing}
          className="bg-white text-black hover:bg-white/90 w-16 h-16 rounded-full disabled:opacity-50"
        >
          <Camera className="h-8 w-8" />
        </Button>
      </>
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
      {permissionState.error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="text-center text-white p-6">
            <p className="text-lg font-semibold mb-2">Erro na Câmera</p>
            <p className="text-sm opacity-80">{permissionState.error}</p>
            <Button
              variant="default"
              onClick={() => requestCameraPermission('environment')}
              className="mt-4"
            >
              Tentar Novamente
            </Button>
          </div>
        </div>
      )}

      {capturedImage ? (
        <img
          src={capturedImage}
          alt="Foto capturada"
          className="w-full h-full object-contain bg-black"
        />
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
            style={{ transform: 'scaleX(-1)' }} // Mirror for better UX
          />
          
          {/* Camera overlay with information */}
          <div className="absolute bottom-6 right-6 bg-black/70 text-white p-3 rounded-lg text-sm font-mono">
            <div>Data: {new Date().toLocaleDateString('pt-BR')}</div>
            <div>Hora: {new Date().toLocaleTimeString('pt-BR')}</div>
            <div>Código: {barcode || 'N/A'}</div>
          </div>

          {/* Loading indicator when capturing */}
          {isCapturing && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="text-white text-lg">Capturando...</div>
            </div>
          )}
        </>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </CameraModal>
  );
}