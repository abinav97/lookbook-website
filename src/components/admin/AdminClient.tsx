"use client";

import { useState, useEffect } from "react";
import PhotoUploader from "./PhotoUploader";
import TagReview from "./TagReview";
import { AITagResult } from "@/lib/ai-tagger";

export default function AdminClient() {
  const [apiKey, setApiKey] = useState("");
  const [keyInput, setKeyInput] = useState("");
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [tagResult, setTagResult] = useState<AITagResult | null>(null);
  const [savedOutfits, setSavedOutfits] = useState<string[]>([]);

  // Load API key from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("anthropic-api-key");
    if (stored) setApiKey(stored);
    const saved = JSON.parse(localStorage.getItem("saved-outfits") || "[]");
    setSavedOutfits(saved);
  }, []);

  const saveApiKey = () => {
    localStorage.setItem("anthropic-api-key", keyInput);
    setApiKey(keyInput);
    setKeyInput("");
  };

  const clearApiKey = () => {
    localStorage.removeItem("anthropic-api-key");
    setApiKey("");
  };

  const handleNewUpload = () => {
    setImageBase64(null);
    setTagResult(null);
  };

  return (
    <div className="pt-28 md:pt-36 pb-16 px-[var(--page-margin)]">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <p className="text-[10px] tracking-[0.25em] text-text-muted mb-3">
            ADMIN
          </p>
          <h1 className="font-serif text-4xl md:text-5xl font-light tracking-[0.02em]">
            Upload & Tag
          </h1>
          <p className="text-text-muted text-sm mt-3 leading-relaxed max-w-lg">
            Drop an outfit photo and AI will automatically detect garments,
            extract colors, suggest season and occasion, and place tag positions.
          </p>
        </div>

        {/* API Key setup */}
        {!apiKey ? (
          <div className="border border-border p-8 mb-12">
            <p className="text-[10px] tracking-[0.2em] text-text-muted mb-4">
              ANTHROPIC API KEY
            </p>
            <p className="text-sm text-text-muted mb-4 leading-relaxed">
              Enter your Anthropic API key to enable AI-powered tagging. The key
              is stored only in your browser&apos;s localStorage and never sent
              anywhere except the Anthropic API.
            </p>
            <div className="flex gap-3">
              <input
                type="password"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="sk-ant-..."
                className="flex-1 px-4 py-2.5 bg-bg-alt border border-border text-sm text-text placeholder:text-text-muted/50 focus:outline-none focus:border-accent"
              />
              <button
                onClick={saveApiKey}
                disabled={!keyInput.startsWith("sk-")}
                className="px-6 py-2.5 text-[11px] tracking-[0.12em] bg-text text-bg hover:bg-accent-dark transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                SAVE KEY
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between border border-border px-6 py-4 mb-12">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-[11px] tracking-[0.1em] text-text-muted">
                API KEY CONFIGURED
              </span>
            </div>
            <button
              onClick={clearApiKey}
              className="text-[10px] tracking-[0.12em] text-text-muted hover:text-text transition-colors"
            >
              REMOVE KEY
            </button>
          </div>
        )}

        {/* Main flow */}
        {apiKey && !tagResult && (
          <PhotoUploader
            apiKey={apiKey}
            onImageLoaded={setImageBase64}
            onTagResult={setTagResult}
          />
        )}

        {apiKey && tagResult && imageBase64 && (
          <TagReview
            imageBase64={imageBase64}
            tagResult={tagResult}
            onReset={handleNewUpload}
            onSave={(json) => {
              const updated = [...savedOutfits, json];
              setSavedOutfits(updated);
              localStorage.setItem("saved-outfits", JSON.stringify(updated));
            }}
          />
        )}

        {/* Saved outfits */}
        {savedOutfits.length > 0 && (
          <div className="mt-16 border-t border-border pt-12">
            <div className="section-divider">
              <span className="text-[10px] tracking-[0.25em] text-text-muted font-light">
                SAVED OUTFITS ({savedOutfits.length})
              </span>
            </div>
            <p className="text-sm text-text-muted mt-4 mb-4 leading-relaxed">
              Copy the JSON below and paste it into{" "}
              <code className="text-[12px] bg-bg-alt px-1.5 py-0.5 border border-border">
                src/data/outfits.json
              </code>{" "}
              to add these outfits to your lookbook.
            </p>
            <div className="relative">
              <pre className="bg-bg-alt border border-border p-4 text-xs text-text-muted overflow-x-auto max-h-64">
                {JSON.stringify(JSON.parse(`[${savedOutfits.join(",")}]`), null, 2)}
              </pre>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    JSON.stringify(JSON.parse(`[${savedOutfits.join(",")}]`), null, 2)
                  );
                }}
                className="absolute top-3 right-3 px-3 py-1.5 text-[9px] tracking-[0.1em] bg-bg border border-border hover:bg-bg-alt transition-colors"
              >
                COPY JSON
              </button>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem("saved-outfits");
                setSavedOutfits([]);
              }}
              className="mt-3 text-[10px] tracking-[0.1em] text-text-muted hover:text-text transition-colors"
            >
              CLEAR SAVED
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
