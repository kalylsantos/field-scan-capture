import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PhotoList } from '@/components/PhotoList';
import { PhotoRecord } from '@/types/scanner';
import { Camera, QrCode, Home } from 'lucide-react';

interface WorkScreenProps {
  barcode: string;
  photos: PhotoRecord[];
  onTakePhoto: () => void;
  onNewBarcode: () => void;
  onBackToMain: () => void;
  onRemovePhoto: (photoId: string) => void;
}

export function WorkScreen({
  barcode,
  photos,
  onTakePhoto,
  onNewBarcode,
  onBackToMain,
  onRemovePhoto,
}: WorkScreenProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <Card className="scanner-gradient text-white border-0 elegant-shadow">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Registro de Campo</CardTitle>
            <CardDescription className="text-white/90">
              {currentTime.toLocaleString('pt-BR')}
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Barcode Display */}
        <Card className="elegant-shadow">
          <CardContent className="p-4">
            <h3 className="font-semibold text-center mb-3">Código Detectado:</h3>
            <div className="bg-primary/10 border-2 border-dashed border-primary rounded-xl p-4 text-center">
              <span className="text-2xl font-bold text-primary">{barcode}</span>
            </div>
          </CardContent>
        </Card>

        {/* Photos List */}
        <Card className="elegant-shadow">
          <CardHeader>
            <CardTitle className="text-lg">Fotos ({photos.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <PhotoList
              photos={photos}
              onRemovePhoto={onRemovePhoto}
              emptyMessage="Nenhuma foto tirada ainda"
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            variant="success"
            size="lg"
            onClick={onTakePhoto}
            className="w-full"
          >
            <Camera className="h-5 w-5 mr-2" />
            Tirar Foto
          </Button>
          
          <Button
            variant="warning"
            size="lg"
            onClick={onNewBarcode}
            className="w-full"
          >
            <QrCode className="h-5 w-5 mr-2" />
            Novo Código
          </Button>
          
          <Button
            variant="secondary"
            size="lg"
            onClick={onBackToMain}
            className="w-full"
          >
            <Home className="h-5 w-5 mr-2" />
            Menu Principal
          </Button>
        </div>
      </div>
    </div>
  );
}