// components/CameraFeed.tsx
import { useRef, useEffect } from 'react';

interface CameraProps {
  isRecording: boolean;
  startCamera: () => void;
  stopCamera: () => void;
  processFrame: () => void;
}

export default function CameraFeed({
  isRecording,
  startCamera,
  stopCamera,
  processFrame,
}: CameraProps) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (isRecording) {
      startCamera();
      const interval = setInterval(processFrame, 1000 / 30); // Process at 30 FPS
      return () => clearInterval(interval);
    } else {
      stopCamera();
    }
  }, [isRecording]);

  return (
    <div>
      <video ref={videoRef} autoPlay playsInline style={{ width: '100%' }} />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}
