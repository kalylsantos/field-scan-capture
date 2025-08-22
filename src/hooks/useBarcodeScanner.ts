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

  const startScanner = useCallback(async () => {
    try {
      setScannerState(prev => ({ 
        ...prev, 
        isScanning: true, 
        feedback: 'Iniciando câmera...' 
      }));

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
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

      // Initialize QuaggaJS
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
        numOfWorkers: 2,
        decoder: {
          readers: [
            'code_128_reader',
            'ean_reader',
            'ean_8_reader',
            'code_39_reader',
            'code_39_vin_reader',
            'codabar_reader',
            'upc_reader',
            'upc_e_reader',
            'i2of5_reader',
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

        // Set up detection callback
        Quagga.onDetected((data: any) => {
          const code = data.codeResult.code;
          if (code && code.length > 0) {
            setScannerState(prev => ({ 
              ...prev, 
              currentBarcode: code,
              feedback: `Código detectado: ${code}` 
            }));
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