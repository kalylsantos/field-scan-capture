import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  controls?: ReactNode;
}

export function CameraModal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  controls,
}: CameraModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="bg-black/80 backdrop-blur-sm text-white p-4 flex items-center justify-between">
        <div className="flex-1 text-center">
          <h2 className="text-lg font-bold">{title}</h2>
          {subtitle && <p className="text-sm text-white/80">{subtitle}</p>}
        </div>
        <Button
          variant="camera"
          size="icon"
          onClick={onClose}
          className="ml-4"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 relative">
        {children}
      </div>

      {/* Controls */}
      {controls && (
        <div className="bg-black/80 backdrop-blur-sm p-6 flex justify-center gap-4">
          {controls}
        </div>
      )}
    </div>
  );
}