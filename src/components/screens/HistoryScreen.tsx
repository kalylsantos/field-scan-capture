import { PhotoRecord } from '@/types/scanner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PhotoList } from '@/components/PhotoList';
import { Download, Trash2, Home } from 'lucide-react';

interface HistoryScreenProps {
  photos: PhotoRecord[];
  onExportData: () => void;
  onClearHistory: () => void;
  onBackToMain: () => void;
  onRemovePhoto: (photoId: string) => void;
  onDownloadPhoto?: (photo: PhotoRecord) => void;
}

export function HistoryScreen({
  photos,
  onExportData,
  onClearHistory,
  onBackToMain,
  onRemovePhoto,
  onDownloadPhoto,
}: HistoryScreenProps) {
  // Group photos by barcode
  const groupedPhotos = photos.reduce((acc, photo) => {
    if (!acc[photo.barcode]) {
      acc[photo.barcode] = [];
    }
    acc[photo.barcode].push(photo);
    return acc;
  }, {} as Record<string, PhotoRecord[]>);

  const handleClearHistory = () => {
    if (window.confirm('Tem certeza que deseja limpar todo o histórico? Esta ação não pode ser desfeita.')) {
      onClearHistory();
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <Card className="scanner-gradient text-white border-0 elegant-shadow">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Histórico de Fotos</CardTitle>
            <CardDescription className="text-white/90">
              {photos.length} foto{photos.length !== 1 ? 's' : ''} salva{photos.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Photos by Barcode */}
        <div className="space-y-4">
          {Object.keys(groupedPhotos).length === 0 ? (
            <Card className="elegant-shadow">
              <CardContent className="p-8 text-center text-muted-foreground">
                <p>Nenhuma foto no histórico</p>
              </CardContent>
            </Card>
          ) : (
            Object.entries(groupedPhotos).map(([barcode, barcodePhotos]) => (
              <Card key={barcode} className="elegant-shadow">
                <CardHeader className="pb-3">
                  <div className="bg-primary/10 rounded-lg p-3">
                    <CardTitle className="text-lg text-primary">
                      Código: {barcode}
                    </CardTitle>
                    <CardDescription>
                      {barcodePhotos.length} foto{barcodePhotos.length !== 1 ? 's' : ''}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <PhotoList
                    photos={barcodePhotos}
                    onRemovePhoto={onRemovePhoto}
                    onDownloadPhoto={onDownloadPhoto}
                  />
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            variant="default"
            size="lg"
            onClick={onExportData}
            disabled={photos.length === 0}
            className="w-full"
          >
            <Download className="h-5 w-5 mr-2" />
            Exportar Dados
          </Button>
          
          <Button
            variant="destructive"
            size="lg"
            onClick={handleClearHistory}
            disabled={photos.length === 0}
            className="w-full"
          >
            <Trash2 className="h-5 w-5 mr-2" />
            Limpar Histórico
          </Button>
          
          <Button
            variant="secondary"
            size="lg"
            onClick={onBackToMain}
            className="w-full"
          >
            <Home className="h-5 w-5 mr-2" />
            Voltar
          </Button>
        </div>
      </div>
    </div>
  );
}