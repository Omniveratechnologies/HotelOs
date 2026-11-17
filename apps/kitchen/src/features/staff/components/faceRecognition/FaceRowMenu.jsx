import { useEffect, useRef, useState } from "react";
import { FiImage, FiMoreVertical, FiTrash2, FiCamera } from "react-icons/fi";

const FaceRowMenu = ({ row, onSelect, onView, onDelete }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const registered = row.faceStatus === "REGISTERED";

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

  const item =
    "flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-gray-300 hover:bg-[#1f1f1f]";
  const run = (fn) => () => {
    setOpen(false);
    fn(row);
  };

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        aria-label={`More actions for ${row.name}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="rounded-md p-1.5 text-gray-400 hover:bg-[#1a1a1a] hover:text-white"
      >
        <FiMoreVertical size={15} />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-lg border border-gray-700 bg-[#151515] py-1 shadow-xl"
        >
          <button
            type="button"
            role="menuitem"
            className={item}
            onClick={run(onSelect)}
          >
            <FiCamera size={13} />{" "}
            {registered ? "Update face" : "Register face"}
          </button>
          {registered && (
            <>
              <button
                type="button"
                role="menuitem"
                className={item}
                onClick={run(onView)}
              >
                <FiImage size={13} /> View photos
              </button>
              <button
                type="button"
                role="menuitem"
                className={`${item} text-red-400`}
                onClick={run(onDelete)}
              >
                <FiTrash2 size={13} /> Delete face data
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default FaceRowMenu;
