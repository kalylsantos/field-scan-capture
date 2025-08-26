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
  const detectionCountRef = useRef<number>(0);
  const detectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isProcessingRef = useRef(false);

  const validateBarcode = (code: string): boolean => {
    // More strict validation
    if (!code || typeof code !== 'string') return false;
    if (code.length < 6 || code.length > 50) return false;
    
    // Allow only alphanumeric, hyphens, underscores, dots, and forward slashes
    if (!/^[0-9A-Za-z\-_\.\/]+$/.test(code)) return false;
    
    // Reject codes that are too repetitive (like "111111" or "AAAAAA")
    const uniqueChars = new Set(code).size;
    if (uniqueChars < 2 && code.length > 4) return false;
    
    return true;
  };

  const startScanner = useCallback(async () => {
    try {
      setScannerState(prev => ({ 
        ...prev, 
        isScanning: true, 
        feedback: 'Iniciando câmera...',
        currentBarcode: null
      }));

      // Reset all detection state
      lastDetectedRef.current = null;
      detectionCountRef.current = 0;
      isProcessingRef.current = false;
      
      if (detectionTimeoutRef.current) {
        clearTimeout(detectionTimeoutRef.current);
        detectionTimeoutRef.current = null;
      }

      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 10, max: 15 } // Lower frame rate for stability
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

      // Initialize QuaggaJS with more conservative settings
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
          patchSize: 'large', // Larger patch size for better accuracy
          halfSample: false, // Don't downsample for better quality
        },
        numOfWorkers: 1,
        frequency: 3, // Even lower frequency to reduce false positives
        decoder: {
          readers: [
            'code_128_reader',
            'ean_reader',
            'ean_8_reader',
            'code_39_reader',
            'upc_reader',
            'upc_e_reader',
          ],
          multiple: false, // Only detect one barcode at a time
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

        // Set up detection callback with improved debouncing
        Quagga.onDetected((data: any) => {
          // Prevent processing if already processing
          if (isProcessingRef.current) return;
          
          const code = data.codeResult.code;
          
          // Validate barcode
          if (!validateBarcode(code)) {
            return;
          }

          // Check confidence level if available
          if (data.codeResult.confidence && data.codeResult.confidence < 80) {
            return;
          }

          // Improved debouncing logic
          if (lastDetectedRef.current === code) {
            detectionCountRef.current++;
            
            // Require at least 3 consistent detections
            if (detectionCountRef.current >= 3) {
              isProcessingRef.current = true;
              
              setScannerState(prev => ({ 
                ...prev, 
                currentBarcode: code,
                feedback: `Código detectado: ${code}` 
              }));
              
              // Stop scanner immediately to prevent further detections
              setTimeout(() => {
                if (isInitializedRef.current) {
                  Quagga.stop();
                  isInitializedRef.current = false;
                }
              }, 100);
            }
          } else {
            // New code detected, reset counter
            lastDetectedRef.current = code;
            detectionCountRef.current = 1;
            
            // Clear any existing timeout
            if (detectionTimeoutRef.current) {
              clearTimeout(detectionTimeoutRef.current);
            }
            
            // Reset detection after 2 seconds if not confirmed
            detectionTimeoutRef.current = setTimeout(() => {
              lastDetectedRef.current = null;
              detectionCountRef.current = 0;
            }, 2000);
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

    // Clear all detection state
    lastDetectedRef.current = null;
    detectionCountRef.current = 0;
    isProcessingRef.current = false;
    
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