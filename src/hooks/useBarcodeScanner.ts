import { useState, useRef, useCallback, useEffect } from 'react';
import { ScannerState } from '@/types/scanner';

// @ts-ignore - QuaggaJS types are not perfect
import Quagga from 'quagga';

export function useBarcodeScanner() {
  const [scannerState, setScannerState] = useState<ScannerState>({
    isScanning: false,
    currentBarcode: null,
    feedback: 'Posicione o código de barras na área verde',
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isInitializedRef = useRef(false);
  const lastDetectedRef = useRef<string | null>(null);
  const detectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startScanner = useCallback(async () => {
    try {
      setScannerState(prev => ({ 
        ...prev, 
        isScanning: true, 
        feedback: 'Iniciando câmera...',
        currentBarcode: null
      }));

      // Reset detection state
      lastDetectedRef.current = null;
      if (detectionTimeoutRef.current) {
        clearTimeout(detectionTimeoutRef.current);
        detectionTimeoutRef.current = null;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 15, max: 30 } // Lower frame rate for better stability
        },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Wait for video to be ready
      await new Promise((resolve) => {
        if (videoRef.current) {
          videoRef.current.onloadedmetadata = resolve;
        }
      });

      // Initialize QuaggaJS with better settings
      Quagga.init({
        inputStream: {
          name: 'Live',
          type: 'LiveStream',
          target: videoRef.current,
          constraints: {
            width: 1280,
            height: 720,
            facingMode: 'environment',
          },
        },
        locator: {
          patchSize: 'medium',
          halfSample: true,
        },
        numOfWorkers: 1, // Reduce workers for better stability
        frequency: 5, // Reduce scanning frequency
        decoder: {
          readers: [
            'code_128_reader',
            'ean_reader',
            'ean_8_reader',
            'code_39_reader',
            'upc_reader',
            'upc_e_reader',
          ],
        },
        locate: true,
      }, (err: any) => {
        if (err) {
          console.error('QuaggaJS init error:', err);
          setScannerState(prev => ({ 
            ...prev, 
            isScanning: false, 
            feedback: 'Erro ao iniciar scanner' 
          }));
          return;
        }

        Quagga.start();
        isInitializedRef.current = true;
        setScannerState(prev => ({ 
          ...prev, 
          feedback: 'Scanner ativo - posicione o código de barras' 
        }));

        // Set up detection callback with debouncing
        Quagga.onDetected((data: any) => {
          const code = data.codeResult.code;
          
          // Validate barcode (minimum length and basic format)
          if (!code || code.length < 4 || !/^[0-9A-Za-z\-_\.\/]+$/.test(code)) {
            return;
          }

          // Debounce detection - only accept if same code detected multiple times
          if (lastDetectedRef.current === code) {
            // Same code detected again, accept it
            if (detectionTimeoutRef.current) {
              clearTimeout(detectionTimeoutRef.current);
            }
            
            setScannerState(prev => ({ 
              ...prev, 
              currentBarcode: code,
              feedback: `Código detectado: ${code}` 
            }));
            
            // Stop further detections for a moment
            Quagga.stop();
            isInitializedRef.current = false;
          } else {
            // New code, wait for confirmation
            lastDetectedRef.current = code;
            
            if (detectionTimeoutRef.current) {
              clearTimeout(detectionTimeoutRef.current);
            }
            
            detectionTimeoutRef.current = setTimeout(() => {
              lastDetectedRef.current = null;
            }, 1000); // Reset after 1 second
          }
        });
      });

    } catch (error) {
      console.error('Scanner start error:', error);
      setScannerState(prev => ({ 
        ...prev, 
        isScanning: false, 
        feedback: 'Erro ao acessar câmera. Verifique as permissões.' 
      }));
    }
  }, []);

  const stopScanner = useCallback(() => {
    try {
      if (isInitializedRef.current) {
        Quagga.stop();
        isInitializedRef.current = false;
      }
    } catch (error) {
      console.error('Error stopping Quagga:', error);
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    // Clear detection state
    lastDetectedRef.current = null;
    if (detectionTimeoutRef.current) {
      clearTimeout(detectionTimeoutRef.current);
      detectionTimeoutRef.current = null;
    }

    setScannerState({
      isScanning: false,
      currentBarcode: null,
      feedback: 'Scanner parado',
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  return {
    scannerState,
    videoRef,
    startScanner,
    stopScanner,
  };
}