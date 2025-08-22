import { PhotoRecord } from '@/types/scanner';
import { Button } from '@/components/ui/button';
import { Trash2, Download } from 'lucide-react';

interface PhotoListProps {
  photos: PhotoRecord[];
  onRemovePhoto: (photoId: string) => void;
  onDownloadPhoto?: (photo: PhotoRecord) => void;
  emptyMessage?: string;
}

export function PhotoList({ photos, onRemovePhoto, onDownloadPhoto, emptyMessage = 'Nenhuma foto disponível' }: PhotoListProps) {
  if (photos.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {photos.map((photo, index) => (
        <div
          key={photo.id}
          className="flex items-center gap-3 p-3 bg-card rounded-xl border elegant-shadow"
        >
          <img
            src={photo.imageData}
            alt={`Foto ${index + 1}`}
            className="w-16 h-12 object-cover rounded-lg border"
          />
          
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">
              Foto {index + 1}
            </p>
            <p className="text-xs text-muted-foreground">
              {new Date(photo.timestamp).toLocaleString('pt-BR')}
            </p>
          </div>
          
          <div className="flex gap-2">
            {onDownloadPhoto && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDownloadPhoto(photo)}
                className="px-2"
              >
                <Download className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onRemovePhoto(photo.id)}
              className="px-2"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}