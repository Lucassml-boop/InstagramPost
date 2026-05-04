"use client";

import type { Dispatch, SetStateAction } from "react";
import { getBrandColorsHistoryLabel, getBrandColorsSwatches } from "./utils";

export function BrandColorsHistory(input: {
  dictionary: any;
  brandColors: string;
  setBrandColors: Dispatch<SetStateAction<string>>;
  brandColorsHistory: string[];
  removeBrandColorsFromHistory: (value: string) => void;
}) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {input.brandColorsHistory.map((palette) => (
        <div
          key={palette}
          className={`rounded-full border px-3 py-1.5 text-left text-xs transition ${
            palette === input.brandColors
              ? "border-ink bg-ink text-white"
              : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:text-ink"
          }`}
        >
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => input.setBrandColors(palette)} className="flex items-center gap-2">
              <span className="flex items-center gap-1">
                {getBrandColorsSwatches(palette).slice(0, 4).map((swatch) => (
                  <span
                    key={`${palette}-${swatch}`}
                    className="h-3 w-3 rounded-full border border-black/10"
                    style={{ backgroundColor: swatch }}
                  />
                ))}
              </span>
              <span>{getBrandColorsHistoryLabel(palette) || palette}</span>
            </button>
            <button
              type="button"
              onClick={() => input.removeBrandColorsFromHistory(palette)}
              className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
                palette === input.brandColors
                  ? "border-white/40 text-white hover:border-white hover:text-white"
                  : "border-slate-300 text-slate-700 hover:border-slate-400 hover:text-ink"
              }`}
            >
              {input.dictionary.common.remove}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
