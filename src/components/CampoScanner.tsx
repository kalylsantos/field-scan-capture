import { useState } from 'react';
import { useAndroidPhotoStorage } from '@/hooks/useAndroidPhotoStorage';
import { BarcodeScanner } from './BarcodeScanner';
import { PhotoCamera } from './PhotoCamera';
import { ManualBarcodeInput } from './ManualBarcodeInput';
import { MainScreen } from './screens/MainScreen';
import { WorkScreen } from './screens/WorkScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { APP_SCREENS, AppScreenType } from '@/types/scanner';
import { useToast } from '@/hooks/use-toast';

export function CampoScanner() {
  const [currentScreen, setCurrentScreen] = useState<AppScreenType>(APP_SCREENS.MAIN);
  const [currentBarcode, setCurrentBarcode] = useState<string | null>(null);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showPhotoCamera, setShowPhotoCamera] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  
  const {
    photos,
    addPhoto,
    removePhoto,
    getPhotosByBarcode,
    clearAllPhotos,
    exportData,
    downloadPhoto,
    storageInfo,
  } = useAndroidPhotoStorage();
  
  const { toast } = useToast();

  const handleBarcodeDetected = (barcode: string) => {
    setCurrentBarcode(barcode);
    setCurrentScreen(APP_SCREENS.WORK);
    setShowBarcodeScanner(false);
    
    toast({
      title: "Código detectado!",
      description: `Código: ${barcode}`,
    });
  };

  const handleManualBarcodeEntered = (barcode: string) => {
    setCurrentBarcode(barcode);
    setCurrentScreen(APP_SCREENS.WORK);
    setShowManualInput(false);
    
    toast({
      title: "Código inserido!",
      description: `Código: ${barcode}`,
    });
  };

  const handlePhotoSaved = async (imageData: string) => {
    if (!currentBarcode) return;
    
    try {
      const photo = await addPhoto(currentBarcode, imageData);
      setShowPhotoCamera(false);
      
      toast({
        title: "Foto salva!",
        description: `Arquivo: ${photo.fileName}`,
      });
    } catch (error) {
      console.error('Error saving photo:', error);
      toast({
        title: "Erro ao salvar foto",
        description: "Tente novamente",
        variant: "destructive",
      });
    }
  };

  const handleExportData = () => {
    if (photos.length === 0) {
      toast({
        title: "Nenhuma foto para exportar",
        variant: "destructive",
      });
      return;
    }
    
    exportData();
    toast({
      title: "Dados exportados!",
      description: "Arquivo JSON baixado com sucesso",
    });
  };

  const handleClearHistory = () => {
    clearAllPhotos();
    toast({
      title: "Histórico limpo!",
      description: "Todas as fotos foram removidas",
    });
  };

  const handleRemovePhoto = (photoId: string) => {
    if (window.confirm('Tem certeza que deseja remover esta foto?')) {
      removePhoto(photoId);
      toast({
        title: "Foto removida",
        description: "A foto foi excluída do histórico",
      });
    }
  };

  const getCurrentPhotos = () => {
    return currentBarcode ? getPhotosByBarcode(currentBarcode) : [];
  };

  return (
    <>
      {/* Main Screens */}
      {currentScreen === APP_SCREENS.MAIN && (
        <MainScreen
          onStartScanner={() => setShowBarcodeScanner(true)}
          onShowHistory={() => setCurrentScreen(APP_SCREENS.HISTORY)}
          onManualEntry={() => setShowManualInput(true)}
        />
      )}

      {currentScreen === APP_SCREENS.WORK && currentBarcode && (
        <WorkScreen
          barcode={currentBarcode}
          photos={getCurrentPhotos()}
          onTakePhoto={() => setShowPhotoCamera(true)}
          onNewBarcode={() => setShowBarcodeScanner(true)}
          onManualEntry={() => setShowManualInput(true)}
          onBackToMain={() => setCurrentScreen(APP_SCREENS.MAIN)}
          onRemovePhoto={handleRemovePhoto}
        />
      )}

      {currentScreen === APP_SCREENS.HISTORY && (
        <HistoryScreen
          photos={photos}
          onExportData={handleExportData}
          onClearHistory={handleClearHistory}
          onBackToMain={() => setCurrentScreen(APP_SCREENS.MAIN)}
          onRemovePhoto={handleRemovePhoto}
          onDownloadPhoto={downloadPhoto}
          storageInfo={storageInfo}
        />
      )}

      {/* Camera Modals */}
      <BarcodeScanner
        isOpen={showBarcodeScanner}
        onClose={() => setShowBarcodeScanner(false)}
        onBarcodeDetected={handleBarcodeDetected}
      />

      <PhotoCamera
        isOpen={showPhotoCamera}
        onClose={() => setShowPhotoCamera(false)}
        onPhotoSaved={handlePhotoSaved}
        barcode={currentBarcode}
      />

      <ManualBarcodeInput
        isOpen={showManualInput}
        onClose={() => setShowManualInput(false)}
        onBarcodeEntered={handleManualBarcodeEntered}
      />
    </>
  );
}