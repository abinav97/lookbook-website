"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { AITagResult, AIDetectedItem } from "@/lib/ai-tagger";
import { CATEGORY_LABELS, ClosetCategory } from "@/lib/types";
import { slugify } from "@/lib/utils";

interface TagReviewProps {
  imageBase64: string;
  tagResult: AITagResult;
  onReset: () => void;
  onSave: (json: string) => void;
}

export default function TagReview({
  imageBase64,
  tagResult,
  onReset,
  onSave,
}: TagReviewProps) {
  const [title, setTitle] = useState(tagResult.title);
  const [season, setSeason] = useState(tagResult.season);
  const [occasion, setOccasion] = useState(tagResult.occasion);
  const [description, setDescription] = useState(tagResult.description);
  const [colorPalette, setColorPalette] = useState(tagResult.colorPalette);
  const [items, setItems] = useState<AIDetectedItem[]>(tagResult.items);
  const [hoveredItem, setHoveredItem] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);

  const allOccasions = [
    "casual",
    "work",
    "dinner",
    "evening",
    "weekend",
    "brunch",
    "date",
    "travel",
  ];

  const toggleOccasion = (occ: string) => {
    setOccasion((prev) =>
      prev.includes(occ) ? prev.filter((o) => o !== occ) : [...prev, occ]
    );
  };

  const updateItem = (index: number, updates: Partial<AIDetectedItem>) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...updates } : item))
    );
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const slug = slugify(title);
    const outfitId = `outfit-${Date.now()}`;

    // Build closet items
    const closetItems = items.map((item, i) => ({
      id: `item-${Date.now()}-${i}`,
      name: item.name,
      brand: item.brand || undefined,
      category: item.category,
      color: item.color,
      colorHex: item.colorHex,
      images: [] as string[],
    }));

    // Build outfit object
    const outfit = {
      id: outfitId,
      slug,
      title,
      date: new Date().toISOString().split("T")[0],
      season,
      occasion,
      description,
      images: [
        {
          src: `/outfits/${slug}.jpg`,
          alt: title,
          width: 800,
          height: 1200,
          tags: items.map((item, i) => ({
            id: `tag-${Date.now()}-${i}`,
            closetItemId: closetItems[i].id,
            position: item.position,
          })),
        },
      ],
      colorPalette,
      featured: false,
    };

    const output = {
      outfit,
      closetItems,
      _instructions: `Save the photo as public/outfits/${slug}.jpg, add the outfit to src/data/outfits.json, and add new closet items to src/data/closet-items.json.`,
    };

    onSave(JSON.stringify(output));
    setSaved(true);
  };

  return (
    <div>
      {/* Success banner */}
      {saved && (
        <motion.div
          className="mb-8 p-4 border border-green-300 bg-green-50"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-sm text-green-800 font-medium">
            Outfit saved! Scroll down to copy the JSON data.
          </p>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* ============================================ */}
        {/* LEFT: Photo with tag dots */}
        {/* ============================================ */}
        <div className="lg:col-span-5">
          <div className="sticky top-28">
            <p className="text-[10px] tracking-[0.2em] text-text-muted mb-3">
              DETECTED ITEMS
            </p>
            <div className="relative overflow-hidden">
              <img
                src={imageBase64}
                alt="Uploaded outfit"
                className="w-full"
              />

              {/* Tag dots on the image */}
              {items.map((item, i) => (
                <motion.div
                  key={i}
                  className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                  style={{
                    left: `${item.position.x}%`,
                    top: `${item.position.y}%`,
                  }}
                  onMouseEnter={() => setHoveredItem(i)}
                  onMouseLeave={() => setHoveredItem(null)}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    delay: 0.2 + i * 0.1,
                    type: "spring",
                    stiffness: 300,
                    damping: 20,
                  }}
                >
                  <span
                    className={`block w-4 h-4 rounded-full border-2 border-white shadow-md transition-transform duration-200 ${
                      hoveredItem === i ? "scale-150" : "tag-pulse"
                    }`}
                    style={{ background: item.colorHex }}
                  />
                  {hoveredItem === i && (
                    <motion.div
                      className="absolute left-5 top-1/2 -translate-y-1/2 bg-white/95 backdrop-blur-sm border border-border px-3 py-2 whitespace-nowrap z-20"
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      <p className="text-[11px] font-medium text-text">
                        {item.name}
                      </p>
                      <p className="text-[9px] text-text-muted">
                        {CATEGORY_LABELS[item.category]}
                      </p>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>

            <button
              onClick={onReset}
              className="mt-4 text-[10px] tracking-[0.12em] text-text-muted hover:text-text transition-colors"
            >
              &larr; UPLOAD DIFFERENT PHOTO
            </button>
          </div>
        </div>

        {/* ============================================ */}
        {/* RIGHT: Editable metadata */}
        {/* ============================================ */}
        <div className="lg:col-span-7">
          {/* Title */}
          <div className="mb-8">
            <label className="block text-[9px] tracking-[0.2em] text-text-muted mb-2">
              OUTFIT TITLE
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-bg-alt border border-border text-text font-serif text-2xl font-light focus:outline-none focus:border-accent"
            />
          </div>

          {/* Description */}
          <div className="mb-8">
            <label className="block text-[9px] tracking-[0.2em] text-text-muted mb-2">
              DESCRIPTION
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-bg-alt border border-border text-sm text-text leading-relaxed focus:outline-none focus:border-accent resize-none"
            />
          </div>

          {/* Season */}
          <div className="mb-8">
            <label className="block text-[9px] tracking-[0.2em] text-text-muted mb-2">
              SEASON
            </label>
            <div className="flex gap-2">
              {(["spring", "summer", "fall", "winter"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSeason(s)}
                  className={`px-4 py-2 text-[10px] tracking-[0.12em] border transition-colors duration-200 ${
                    season === s
                      ? "bg-text text-bg border-text"
                      : "border-border text-text-muted hover:border-text hover:text-text"
                  }`}
                >
                  {s.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Occasion */}
          <div className="mb-8">
            <label className="block text-[9px] tracking-[0.2em] text-text-muted mb-2">
              OCCASION
            </label>
            <div className="flex gap-2 flex-wrap">
              {allOccasions.map((occ) => (
                <button
                  key={occ}
                  onClick={() => toggleOccasion(occ)}
                  className={`px-3 py-1.5 text-[10px] tracking-[0.1em] border transition-colors duration-200 ${
                    occasion.includes(occ)
                      ? "bg-text text-bg border-text"
                      : "border-border text-text-muted hover:border-text hover:text-text"
                  }`}
                >
                  {occ.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Color palette */}
          <div className="mb-8">
            <label className="block text-[9px] tracking-[0.2em] text-text-muted mb-2">
              COLOR PALETTE
            </label>
            <div className="flex gap-2 items-center">
              {colorPalette.map((color, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div
                    className="w-10 h-10 border border-border cursor-pointer"
                    style={{ background: color }}
                    title={color}
                  />
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => {
                      const updated = [...colorPalette];
                      updated[i] = e.target.value;
                      setColorPalette(updated);
                    }}
                    className="w-16 text-center text-[9px] text-text-muted bg-transparent border-b border-border focus:outline-none focus:border-accent py-0.5"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Items list */}
          <div className="mb-8">
            <div className="section-divider">
              <span className="text-[10px] tracking-[0.25em] text-text-muted font-light">
                DETECTED ITEMS ({items.length})
              </span>
            </div>

            <div className="flex flex-col gap-4 mt-4">
              {items.map((item, i) => (
                <motion.div
                  key={i}
                  className={`border p-4 transition-colors duration-200 ${
                    hoveredItem === i
                      ? "border-accent bg-accent/5"
                      : "border-border"
                  }`}
                  onMouseEnter={() => setHoveredItem(i)}
                  onMouseLeave={() => setHoveredItem(null)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-3 items-start flex-1 min-w-0">
                      <div
                        className="w-8 h-8 flex-shrink-0 border border-border"
                        style={{ background: item.colorHex }}
                      />
                      <div className="flex-1 min-w-0">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) =>
                            updateItem(i, { name: e.target.value })
                          }
                          className="w-full text-sm font-medium text-text bg-transparent border-b border-transparent focus:border-accent focus:outline-none pb-0.5"
                        />
                        <div className="flex gap-3 mt-2">
                          <select
                            value={item.category}
                            onChange={(e) =>
                              updateItem(i, {
                                category: e.target.value as ClosetCategory,
                              })
                            }
                            className="text-[10px] tracking-[0.08em] text-text-muted bg-bg-alt border border-border px-2 py-1 focus:outline-none focus:border-accent"
                          >
                            {Object.entries(CATEGORY_LABELS).map(
                              ([val, label]) => (
                                <option key={val} value={val}>
                                  {label}
                                </option>
                              )
                            )}
                          </select>
                          <input
                            type="text"
                            value={item.color}
                            onChange={(e) =>
                              updateItem(i, { color: e.target.value })
                            }
                            className="text-[10px] text-text-muted bg-transparent border-b border-border focus:outline-none focus:border-accent w-20 pb-0.5"
                            placeholder="Color"
                          />
                          <input
                            type="text"
                            value={item.brand || ""}
                            onChange={(e) =>
                              updateItem(i, {
                                brand: e.target.value || undefined,
                              })
                            }
                            className="text-[10px] text-text-muted bg-transparent border-b border-border focus:outline-none focus:border-accent w-24 pb-0.5"
                            placeholder="Brand"
                          />
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => removeItem(i)}
                      className="text-text-muted/40 hover:text-red-500 transition-colors text-lg leading-none flex-shrink-0"
                      title="Remove item"
                    >
                      &times;
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Save button */}
          <div className="flex gap-4 items-center">
            <button
              onClick={handleSave}
              disabled={saved || !title || items.length === 0}
              className="px-8 py-3 text-[11px] tracking-[0.15em] bg-text text-bg hover:bg-accent-dark transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {saved ? "SAVED" : "SAVE OUTFIT"}
            </button>
            {saved && (
              <button
                onClick={() => {
                  setSaved(false);
                  onReset();
                }}
                className="text-[10px] tracking-[0.12em] text-text-muted hover:text-text transition-colors"
              >
                UPLOAD ANOTHER
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
