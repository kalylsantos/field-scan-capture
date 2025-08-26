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

    // Stop any existing stream first
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 60 },
          focusMode: { ideal: 'continuous' },
          exposureMode: { ideal: 'continuous' },
          whiteBalanceMode: { ideal: 'continuous' }
        } as any,
      });

      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        
        // Wait for video to be ready
        await new Promise((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = resolve;
          }
        });
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
        } else if (error.name === 'NotReadableError') {
          errorMessage = 'Câmera está sendo usada por outro aplicativo.';
        }
      }

      setPermissionState({
        hasPermission: false,
        isRequesting: false,
        error: errorMessage,
      });

      throw error;
    }
  }, [stream]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
      });
      setStream(null);
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setPermissionState(prev => ({
      ...prev,
      hasPermission: null,
    }));
  }, [stream]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !stream) return null;

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) return null;

    // Ensure video dimensions are available
    const videoWidth = videoRef.current.videoWidth;
    const videoHeight = videoRef.current.videoHeight;
    
    if (videoWidth === 0 || videoHeight === 0) {
      console.error('Video dimensions not available');
      return null;
    }

    canvas.width = videoWidth;
    canvas.height = videoHeight;
    
    context.drawImage(videoRef.current, 0, 0, videoWidth, videoHeight);
    
    // Use higher quality for better image output
    return canvas.toDataURL('image/jpeg', 0.92);
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