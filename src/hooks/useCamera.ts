import { useState, useRef, useCallback } from 'react';
import { CameraPermissionState } from '@/types/scanner';

export function useCamera() {
  const [permissionState, setPermissionState] = useState<CameraPermissionState>({
    hasPermission: null,
    isRequesting: false,
    error: null,
  });
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const requestCameraPermission = useCallback(async (facingMode: 'user' | 'environment' = 'environment') => {
    setPermissionState(prev => ({ ...prev, isRequesting: true, error: null }));

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1920, max: 1920 },
          height: { ideal: 1080, max: 1080 },
          frameRate: { ideal: 30, max: 30 }
        },
      });

      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      setPermissionState({
        hasPermission: true,
        isRequesting: false,
        error: null,
      });

      return mediaStream;
    } catch (error) {
      console.error('Camera permission error:', error);
      
      let errorMessage = 'Erro ao acessar a câmera';
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Permissão da câmera negada. Por favor, permita o acesso à câmera nas configurações do navegador.';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'Nenhuma câmera encontrada no dispositivo.';
        } else if (error.name === 'NotSupportedError') {
          errorMessage = 'Câmera não suportada neste dispositivo.';
        }
      }

      setPermissionState({
        hasPermission: false,
        isRequesting: false,
        error: errorMessage,
      });

      throw error;
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [stream]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !stream) return null;

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) return null;

    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    
    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    
    return canvas.toDataURL('image/jpeg', 0.8);
  }, [stream]);

  return {
    permissionState,
    stream,
    videoRef,
    requestCameraPermission,
    stopCamera,
    capturePhoto,
  };
}