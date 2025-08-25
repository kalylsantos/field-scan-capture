import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

import { Camera, CameraResultType } from '@capacitor/camera';

export async function takePhoto() {
  try {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.Uri
    });

    console.log('Photo URI:', image.path || image.webPath);
  } catch (error) {
    console.error('Camera error:', error);
  }
}


createRoot(document.getElementById("root")!).render(<App />);
