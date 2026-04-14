"use client";

import { useEffect, useState } from "react";

export function AutoGenerateAllModal(input: {
  isOpen: boolean;
  isSubmitting: boolean;
  initialValue: string;
  dictionary: {
    title: string;
    description: string;
    fieldLabel: string;
    fieldPlaceholder: string;
    cancel: string;
    submit: string;
    skip: string;
  };
  onClose: () => void;
  onSubmit: (value: string, submitMode: "submit" | "skip") => void;
}) {
  const [value, setValue] = useState(input.initialValue);

  useEffect(() => {
    if (input.isOpen) {
      setValue(input.initialValue);
    }
  }, [input.initialValue, input.isOpen]);

  if (!input.isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4">
      <div className="w-full max-w-xl rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl">
        <div>
          <p className="text-xl font-semibold text-ink">{input.dictionary.title}</p>
          <p className="mt-2 text-sm text-slate-600">{input.dictionary.description}</p>
        </div>

        <label className="mt-5 block text-sm font-medium text-slate-700">
          {input.dictionary.fieldLabel}
          <textarea
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder={input.dictionary.fieldPlaceholder}
            className="mt-2 min-h-28 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-slate-400"
          />
        </label>

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={input.onClose}
            disabled={input.isSubmitting}
            className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-ink disabled:opacity-60"
          >
            {input.dictionary.cancel}
          </button>
          <button
            type="button"
            onClick={() => input.onSubmit("", "skip")}
            disabled={input.isSubmitting}
            className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-ink disabled:opacity-60"
          >
            {input.dictionary.skip}
          </button>
          <button
            type="button"
            onClick={() => input.onSubmit(value, "submit")}
            disabled={input.isSubmitting}
            className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
          >
            {input.dictionary.submit}
          </button>
        </div>
      </div>
    </div>
  );
}
