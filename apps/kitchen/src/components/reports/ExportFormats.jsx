import { useId, useState } from "react";
import {
  FiCheck,
  FiChevronDown,
  FiDownload,
  FiPrinter,
  FiSettings,
} from "react-icons/fi";
import ActionButton from "../ui/button/ActionButton.jsx";
import { EXPORT_FORMATS } from "../../utils/exportReport.constants.js";

const ExportFormats = ({
  format,
  onFormatChange,
  includePhotos,
  onIncludePhotosChange,
  onGenerate,
  generating = false,
  disabled = false,
  advancedOptions = null,
}) => {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const panelId = useId();
  const isPrint = format === "PRINT";

  return (
    <section className="rounded-xl border border-gray-800 bg-[#0b1117] p-4">
      <div className="mb-4 flex items-center gap-2">
        <FiDownload size={15} className="text-gray-400" />
        <h3 className="text-sm font-semibold text-white">Export Format</h3>
      </div>

      <div
        role="radiogroup"
        aria-label="Export format"
        className="grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        {EXPORT_FORMATS.map(({ value, label, hint, icon: Icon, iconColor }) => {
          const active = format === value;

          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onFormatChange(value)}
              className={`relative flex flex-col items-center gap-1.5 rounded-lg border px-3 py-4 text-center transition focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none ${
                active
                  ? "border-emerald-500 bg-emerald-950/30"
                  : "border-gray-800 hover:border-gray-600 hover:bg-gray-900/40"
              }`}
            >
              <span
                className={`absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full border ${
                  active
                    ? "border-emerald-500 bg-emerald-500 text-black"
                    : "border-gray-600"
                }`}
              >
                {active && <FiCheck size={10} strokeWidth={3} />}
              </span>

              <Icon size={26} className={iconColor} />
              <span className="text-xs font-semibold text-white">{label}</span>
              <span className="text-[10px] text-gray-500">{hint}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={includePhotos}
          aria-label="Include staff photos in report"
          onClick={() => onIncludePhotosChange(!includePhotos)}
          className={`relative h-5 w-9 shrink-0 rounded-full transition focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none ${
            includePhotos ? "bg-emerald-500" : "bg-gray-700"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
              includePhotos ? "translate-x-4" : ""
            }`}
          />
        </button>
        <span className="text-xs text-gray-300">
          Include staff photos in report
        </span>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          aria-expanded={advancedOpen}
          aria-controls={panelId}
          onClick={() => setAdvancedOpen((open) => !open)}
          className="flex w-full items-center justify-between gap-2 rounded-lg border border-gray-700 px-3 py-2.5 text-xs text-gray-300 transition hover:bg-gray-800 sm:max-w-60"
        >
          <span className="flex items-center gap-2">
            <FiSettings size={14} />
            Advanced Options
          </span>
          <FiChevronDown
            size={14}
            className={`transition-transform ${advancedOpen ? "rotate-180" : ""}`}
          />
        </button>

        <ActionButton
          icon={isPrint ? <FiPrinter size={14} /> : <FiDownload size={14} />}
          onClick={onGenerate}
          disabled={disabled || generating}
          className="py-2.5 sm:min-w-44"
        >
          {generating
            ? "Generating..."
            : isPrint
              ? "Open Print View"
              : "Generate Report"}
        </ActionButton>
      </div>

      {advancedOpen && (
        <div
          id={panelId}
          className="mt-3 rounded-lg border border-gray-800 p-3 text-xs text-gray-400"
        >
          {advancedOptions || "No advanced options available yet."}
        </div>
      )}
    </section>
  );
};

export default ExportFormats;
