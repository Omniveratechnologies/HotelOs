import { useEffect, useRef, useState } from "react";
import { FiChevronDown, FiSearch, FiX } from "react-icons/fi";

import useDebounce from "../../hooks/useDebounce.js";
import FaceAvatar from "./FaceAvatar.jsx";
import { api, inputCls, query } from "../../utils/faceUtils.js";

const FaceStaffSelect = ({ value, onChange, disabled }) => {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const search = useDebounce(term.trim(), 250);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const controller = new AbortController();
    setLoading(true);
    api(`/staff-options?${query({ q: search, limit: 20 })}`, {
      signal: controller.signal,
    })
      .then((res) => setOptions(res.data))
      .catch(() => {})
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [open, search]);

  useEffect(() => {
    if (!open) return undefined;
    const close = (event) => {
      if (
        event.type === "keydown"
          ? event.key === "Escape"
          : !ref.current?.contains(event.target)
      )
        setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  const pick = (option) => {
    onChange(option);
    setOpen(false);
    setTerm("");
  };

  return (
    <div ref={ref} className="relative">
      <div className="flex items-center rounded-lg border border-gray-700 bg-[#151515] focus-within:border-emerald-400">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label="Select staff"
          className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2 text-left text-xs text-gray-200 disabled:opacity-60"
        >
          {value ? (
            <>
              <FaceAvatar
                src={value.photoUrl}
                name={value.name}
                size="h-6 w-6"
              />
              <span className="truncate">
                {value.name} ({value.staffId})
              </span>
            </>
          ) : (
            <span className="text-gray-500">Choose a staff member</span>
          )}
        </button>
        {value && !disabled && (
          <button
            type="button"
            aria-label="Clear selection"
            onClick={() => onChange(null)}
            className="p-2 text-gray-500 hover:text-white"
          >
            <FiX size={14} />
          </button>
        )}
        <FiChevronDown size={14} className="mr-3 text-gray-500" />
      </div>

      {open && (
        <div className="absolute z-30 mt-1 w-full rounded-lg border border-gray-700 bg-[#151515] p-2 shadow-xl">
          <div className="relative mb-2">
            <FiSearch
              size={13}
              className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-gray-500"
            />
            <input
              autoFocus
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Search name or ID"
              aria-label="Search staff to select"
              className={`${inputCls} pl-8`}
            />
          </div>
          <ul
            role="listbox"
            aria-label="Staff"
            className="max-h-56 overflow-y-auto"
          >
            {options.map((option) => (
              <li
                key={option._id}
                role="option"
                aria-selected={value?._id === option._id}
              >
                <button
                  type="button"
                  onClick={() => pick(option)}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-gray-200 hover:bg-[#1f1f1f]"
                >
                  <FaceAvatar
                    src={option.photoUrl}
                    name={option.name}
                    size="h-6 w-6"
                  />
                  <span className="min-w-0 flex-1 truncate">
                    {option.name}{" "}
                    <span className="text-gray-500">({option.staffId})</span>
                  </span>
                  {option.faceStatus === "REGISTERED" && (
                    <span className="text-[10px] text-emerald-400">
                      Registered
                    </span>
                  )}
                </button>
              </li>
            ))}
            {!options.length && (
              <li className="px-2 py-3 text-center text-[11px] text-gray-500">
                {loading ? "Searching..." : "No staff found."}
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FaceStaffSelect;
