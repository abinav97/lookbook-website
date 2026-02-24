"use client";

import { useState, useCallback } from "react";
import { motion } from "motion/react";
import { AITagResult, analyzeOutfitPhoto, imageFileToBase64, resizeImageForAPI } from "@/lib/ai-tagger";

interface PhotoUploaderProps {
  apiKey: string;
  onImageLoaded: (base64: string) => void;
  onTagResult: (result: AITagResult) => void;
}

export default function PhotoUploader({
  apiKey,
  onImageLoaded,
  onTagResult,
}: PhotoUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const processFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        setError("Please upload an image file (JPEG or PNG).");
        return;
      }

      setError(null);
      setIsAnalyzing(true);

      try {
        const base64 = await imageFileToBase64(file);
        setPreview(base64);
        onImageLoaded(base64);

        // Resize for API to stay under the ~5MB payload limit
        const resized = await resizeImageForAPI(base64);
        const result = await analyzeOutfitPhoto(resized, apiKey);
        onTagResult(result);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to analyze photo."
        );
        setIsAnalyzing(false);
      }
    },
    [apiKey, onImageLoaded, onTagResult]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  return (
    <div>
      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed transition-colors duration-300 ${
          isDragging
            ? "border-accent bg-accent/5"
            : "border-border hover:border-text-muted"
        } ${isAnalyzing ? "pointer-events-none" : ""}`}
      >
        {preview && isAnalyzing ? (
          /* Analyzing state — show preview with overlay */
          <div className="relative aspect-[3/4] max-h-[70vh] overflow-hidden">
            <img
              src={preview}
              alt="Uploaded outfit"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
              <motion.div
                className="w-12 h-12 border-2 border-white/30 border-t-white rounded-full"
                animate={{ rotate: 360 }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
              <p className="text-white text-[11px] tracking-[0.2em] mt-6">
                ANALYZING OUTFIT
              </p>
              <p className="text-white/50 text-[10px] tracking-[0.1em] mt-2">
                Detecting items, colors, and style...
              </p>
            </div>
          </div>
        ) : (
          /* Upload prompt */
          <label className="flex flex-col items-center justify-center py-20 md:py-32 cursor-pointer">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-12 h-12 border border-border flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-text-muted"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm text-text">
                  Drop an outfit photo here
                </p>
                <p className="text-[10px] tracking-[0.1em] text-text-muted mt-1">
                  OR CLICK TO BROWSE
                </p>
              </div>
              <p className="text-[10px] text-text-muted/60">
                JPEG or PNG, any size
              </p>
            </div>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileInput}
              className="hidden"
            />
          </label>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-4 p-4 border border-red-300 bg-red-50">
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setPreview(null);
              setIsAnalyzing(false);
            }}
            className="mt-2 text-[10px] tracking-[0.12em] text-red-600 hover:text-red-800 transition-colors"
          >
            TRY AGAIN
          </button>
        </div>
      )}
    </div>
  );
}
