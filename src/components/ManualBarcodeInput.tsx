import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Keyboard, Check, X } from 'lucide-react';

interface ManualBarcodeInputProps {
  isOpen: boolean;
  onClose: () => void;
  onBarcodeEntered: (barcode: string) => void;
}

export function ManualBarcodeInput({ isOpen, onClose, onBarcodeEntered }: ManualBarcodeInputProps) {
  const [barcode, setBarcode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate barcode
    const trimmedBarcode = barcode.trim();
    if (!trimmedBarcode) {
      setError('Por favor, digite um código de barras');
      return;
    }
    
    if (trimmedBarcode.length < 2) {
      setError('Código muito curto. Digite pelo menos 2 caracteres');
      return;
    }
    
    if (trimmedBarcode.length > 100) {
      setError('Código muito longo. Máximo de 100 caracteres');
      return;
    }

    // Additional validation: only allow alphanumeric characters and some special chars
    if (!/^[a-zA-Z0-9\-_\.\/]+$/.test(trimmedBarcode)) {
      setError('Código contém caracteres inválidos. Use apenas letras, números e - _ . /');
      return;
    }
    
    // Clear error and submit
    setError('');
    onBarcodeEntered(trimmedBarcode);
    handleClose();
  };

  const handleClose = () => {
    setBarcode('');
    setError('');
    onClose();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setBarcode(value);
    
    // Clear error when user starts typing
    if (error && value.trim()) {
      setError('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Entrada Manual
          </DialogTitle>
          <DialogDescription>
            Digite o código de barras manualmente
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="barcode-input">Código de Barras</Label>
            <Input
              id="barcode-input"
              type="text"
              value={barcode}
              onChange={handleInputChange}
              placeholder="Digite o código aqui..."
              className="text-center text-lg font-mono"
              autoFocus
            />
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>
          
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• Mínimo: 2 caracteres</p>
                <p>• Máximo: 100 caracteres</p>
                <p>• Permitido: letras, números, - _ . /</p>
              </div>
            </CardContent>
          </Card>
          
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="default"
              className="flex-1"
              disabled={!barcode.trim()}
            >
              <Check className="h-4 w-4 mr-2" />
              Confirmar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}