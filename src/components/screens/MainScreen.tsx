import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { QrCode, History, Smartphone } from 'lucide-react';

interface MainScreenProps {
  onStartScanner: () => void;
  onShowHistory: () => void;
}

export function MainScreen({ onStartScanner, onShowHistory }: MainScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="scanner-gradient text-white border-0 elegant-shadow">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-white/20 rounded-full">
                <Smartphone className="h-8 w-8" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Campo Scanner</CardTitle>
            <CardDescription className="text-white/90">
              Código de Barras + Fotos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
              <CardContent className="p-4">
                <h3 className="font-semibold text-white mb-3">Como usar:</h3>
                <div className="space-y-2 text-white/90 text-sm">
                  <p>1. Escaneie o código de barras</p>
                  <p>2. Tire fotos com as tags</p>
                  <p>3. Repita o processo</p>
                </div>
              </CardContent>
            </Card>
            
            <div className="space-y-3">
              <Button
                variant="scanner"
                size="lg"
                onClick={onStartScanner}
                className="w-full"
              >
                <QrCode className="h-5 w-5 mr-2" />
                Escanear Código de Barras
              </Button>
              
              <Button
                variant="secondary"
                size="lg"
                onClick={onShowHistory}
                className="w-full"
              >
                <History className="h-5 w-5 mr-2" />
                Histórico de Fotos
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}