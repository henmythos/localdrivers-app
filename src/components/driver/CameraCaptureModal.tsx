import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, Zap, ZapOff, RefreshCw, Check, RotateCcw, ShieldCheck, AlertCircle } from 'lucide-react';

interface CameraCaptureModalProps {
  isOpen: boolean;
  docTitle: string; // e.g. 'Profile Selfie', 'Aadhaar Card', 'Driving Licence'
  docType: 'selfie' | 'document';
  onClose: () => void;
  onCapture: (imageDataUrl: string) => void;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  docTitle,
  docType,
  onClose,
  onCapture,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>(
    docType === 'selfie' ? 'user' : 'environment'
  );
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [hasFlashSupport, setHasFlashSupport] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Initialize Camera Stream
  useEffect(() => {
    if (!isOpen) return;

    let currentStream: MediaStream | null = null;

    const startCamera = async () => {
      setCameraError(null);
      setCapturedImage(null);

      try {
        const constraints: MediaStreamConstraints = {
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        };

        const newStream = await navigator.mediaDevices.getUserMedia(constraints);
        currentStream = newStream;
        setStream(newStream);

        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
          await videoRef.current.play().catch(e => console.warn('Video play interrupted:', e));
        }

        // Check torch / flash support
        const track = newStream.getVideoTracks()[0];
        if (track) {
          const capabilities = (track.getCapabilities ? track.getCapabilities() : {}) as any;
          if (capabilities.torch) {
            setHasFlashSupport(true);
          } else {
            setHasFlashSupport(false);
          }
        }
      } catch (err: any) {
        console.error('Camera Access Error:', err);
        setCameraError(
          'Unable to access mobile camera. Please check camera permissions in your browser or device settings.'
        );
      }
    };

    startCamera();

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(t => t.stop());
      }
    };
  }, [isOpen, facingMode]);

  // Handle Flashlight / Torch Toggle
  const toggleFlash = async () => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    if (!track) return;

    const nextFlash = !isFlashOn;
    try {
      await (track as any).applyConstraints({
        advanced: [{ torch: nextFlash }],
      });
      setIsFlashOn(nextFlash);
    } catch (e) {
      console.warn('Torch constraint failed:', e);
      setIsFlashOn(nextFlash); // UI toggle
    }
  };

  // Flip Camera Front / Back
  const toggleFacingMode = () => {
    setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
  };

  // Capture Snapshot onto Canvas
  const takePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      // If front camera, mirror image for natural selfie preview
      if (facingMode === 'user') {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      setCapturedImage(dataUrl);
    }
  };

  const handleConfirmPhoto = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black text-white flex flex-col justify-between overflow-hidden animate-fade-in select-none">
      
      {/* Hidden canvas for taking snapshot */}
      <canvas ref={canvasRef} className="hidden" />

      {/* TOP ACTION BAR */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-black/90 via-black/50 to-transparent flex items-center justify-between">
        
        {/* Flip Camera Button */}
        <button
          type="button"
          onClick={toggleFacingMode}
          className="p-3 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full text-white transition-colors"
          title="Switch Front/Back Camera"
        >
          <RefreshCw className="w-5 h-5" />
        </button>

        {/* Document Title Header */}
        <div className="text-center">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400 bg-black/60 px-2.5 py-0.5 rounded-full border border-amber-400/30 block">
            LIVE CAMERA CAPTURE
          </span>
          <h3 className="text-sm sm:text-base font-black text-white mt-0.5">
            {docTitle}
          </h3>
        </div>

        {/* Flash Toggle & Close Buttons */}
        <div className="flex items-center gap-2">
          {hasFlashSupport && (
            <button
              type="button"
              onClick={toggleFlash}
              className={`p-3 backdrop-blur-md rounded-full transition-colors ${
                isFlashOn ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-white/20 text-white hover:bg-white/30'
              }`}
              title="Toggle Flash / Torch"
            >
              {isFlashOn ? <Zap className="w-5 h-5 fill-current" /> : <ZapOff className="w-5 h-5" />}
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="p-3 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full text-white transition-colors"
            title="Close Camera"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* MAIN CAMERA / PREVIEW VIEWPORT */}
      <div className="relative flex-1 w-full h-full flex items-center justify-center bg-slate-950">
        
        {cameraError ? (
          <div className="p-6 text-center max-w-sm mx-auto space-y-4">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
            <h3 className="text-base font-bold text-white">Camera Access Blocked</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{cameraError}</p>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-white text-slate-900 font-bold text-xs rounded-xl shadow-lg"
            >
              Back to Upload Options
            </button>
          </div>
        ) : capturedImage ? (
          /* CAPTURED PHOTO PREVIEW */
          <div className="relative w-full h-full flex items-center justify-center p-4">
            <img
              src={capturedImage}
              alt="Captured document preview"
              className="max-w-full max-h-[75vh] object-contain rounded-2xl border-2 border-emerald-400 shadow-2xl"
            />
            <div className="absolute top-8 bg-emerald-500 text-white font-extrabold text-xs px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
              <Check className="w-4 h-4 stroke-[3]" />
              Photo Captured! Verify preview below
            </div>
          </div>
        ) : (
          /* LIVE VIDEO STREAM & FRAME ALIGNMENT OVERLAY */
          <div className="relative w-full h-full flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
            />

            {/* DOCUMENT FRAME GUIDELINES */}
            {docType === 'selfie' ? (
              /* Oval Guide for Profile Selfie */
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-6">
                <div className="w-64 h-80 rounded-[50%] border-4 border-dashed border-amber-400/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.55)] flex flex-col items-center justify-between p-4">
                  <span className="text-[11px] font-extrabold text-amber-300 bg-black/70 px-3 py-1 rounded-full uppercase tracking-wider mt-4">
                    Position Face Inside Oval
                  </span>
                  <span className="text-[10px] text-white/80 bg-black/70 px-2 py-0.5 rounded mb-4">
                    Ensure Bright Lighting
                  </span>
                </div>
              </div>
            ) : (
              /* Rectangular ID Guide for Aadhaar & Driving Licence */
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-6">
                <div className="w-full max-w-sm h-56 sm:h-64 rounded-2xl border-4 border-dashed border-emerald-400/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.55)] flex flex-col items-center justify-between p-4">
                  <span className="text-[11px] font-extrabold text-emerald-300 bg-black/70 px-3 py-1 rounded-full uppercase tracking-wider mt-2">
                    Align {docTitle} Inside Box
                  </span>
                  <span className="text-[10px] text-white/80 bg-black/70 px-2.5 py-0.5 rounded mb-2">
                    Keep Document Flat & Clear
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* BOTTOM CONTROL BAR */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-6 bg-gradient-to-t from-black/95 via-black/80 to-transparent flex items-center justify-center">
        
        {!capturedImage ? (
          /* CAPTURE BUTTON */
          <button
            type="button"
            onClick={takePhoto}
            disabled={!!cameraError}
            className="w-20 h-20 rounded-full border-4 border-white bg-red-600 hover:bg-red-500 active:scale-95 transition-all flex items-center justify-center shadow-2xl shadow-red-600/50"
            title="Click to Take Photo"
          >
            <div className="w-16 h-16 rounded-full border-2 border-white/60 bg-red-600 flex items-center justify-center">
              <Camera className="w-8 h-8 text-white" />
            </div>
          </button>
        ) : (
          /* CONFIRM OR RETAKE BUTTONS */
          <div className="flex items-center gap-4 w-full max-w-md">
            <button
              type="button"
              onClick={() => setCapturedImage(null)}
              className="flex-1 py-3.5 px-4 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-extrabold text-xs rounded-2xl transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Retake Photo
            </button>

            <button
              type="button"
              onClick={handleConfirmPhoto}
              className="flex-1 py-3.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs rounded-2xl shadow-xl shadow-emerald-500/30 transition-colors flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              Use Photo & Save
            </button>
          </div>
        )}

      </div>

    </div>
  );
};
