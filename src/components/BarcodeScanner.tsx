import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
import { CameraModal } from './CameraModal';
import { Button } from '@/components/ui/button';
import { QrCode } from 'lucide-react';

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onBarcodeDetected: (barcode: string) => void;
}

export function BarcodeScanner({ isOpen, onClose, onBarcodeDetected }: BarcodeScannerProps) {
  const { scannerState, videoRef, startScanner, stopScanner } = useBarcodeScanner();

  const handleOpen = async () => {
    if (isOpen && !scannerState.isScanning) {
      await startScanner();
    }
  };

  const handleClose = () => {
    stopScanner();
    onClose();
  };

  // Start scanner when modal opens
  React.useEffect(() => {
    if (isOpen) {
      handleOpen();
    } else {
      stopScanner();
    }
  }, [isOpen]);

  // Auto-close when barcode is detected
  React.useEffect(() => {
    if (scannerState.currentBarcode) {
      setTimeout(() => {
        onBarcodeDetected(scannerState.currentBarcode!);
        handleClose();
      }, 1000);
    }
  }, [scannerState.currentBarcode, onBarcodeDetected]);

  return (
    <CameraModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Scanner de Código de Barras"
      subtitle="Posicione o código na área verde"
      controls={
        <Button variant="camera" onClick={handleClose}>
          Cancelar
        </Button>
      }
    >
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="w-full h-full object-cover"
      />
      
      {/* Scanner overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-4/5 h-48 border-2 border-green-500 rounded-xl bg-green-500/10 relative">
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded-lg text-sm">
            Posicione o código de barras aqui
          </div>
          
          {/* Corner brackets */}
          <div className="absolute top-2 left-2 w-6 h-6 border-l-4 border-t-4 border-green-400"></div>
          <div className="absolute top-2 right-2 w-6 h-6 border-r-4 border-t-4 border-green-400"></div>
          <div className="absolute bottom-2 left-2 w-6 h-6 border-l-4 border-b-4 border-green-400"></div>
          <div className="absolute bottom-2 right-2 w-6 h-6 border-r-4 border-b-4 border-green-400"></div>
        </div>
      </div>

      {/* Feedback message */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-lg text-sm">
        {scannerState.feedback}
      </div>

      {/* Scanner icon animation */}
      <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2">
        <QrCode className="h-8 w-8 text-white animate-pulse" />
      </div>
    </CameraModal>
  );
}

// Import React for useEffect
import React from 'react';