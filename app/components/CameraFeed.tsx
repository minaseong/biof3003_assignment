// components/CameraFeed.tsx
import React from 'react';

interface CameraFeedProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

const CameraFeed: React.FC<CameraFeedProps> = ({ videoRef, canvasRef }) => {
  return (
    <div>
      {/* Video Element */}
      <video ref={videoRef} autoPlay playsInline muted className="hidden" />
      <canvas
        ref={canvasRef}
        width={640}
        height={480}
        className="w-full max-w-[640px] h-auto border border-black"
      />
    </div>
  );
};

export default CameraFeed;
