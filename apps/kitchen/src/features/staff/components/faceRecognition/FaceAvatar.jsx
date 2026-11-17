import { useState } from "react";
import { initialsOf } from "../../utils/faceUtils.js";

const FaceAvatar = ({ src, name, size = "h-9 w-9", className = "" }) => {
  const [failed, setFailed] = useState(false);

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={name || "Staff"}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
        className={`${size} shrink-0 rounded-full border border-gray-700 object-cover ${className}`}
      />
    );
  }
  return (
    <span
      aria-label={name || "Staff"}
      className={`${size} inline-flex shrink-0 items-center justify-center rounded-full border border-gray-700 bg-gray-800 text-[11px] font-semibold text-gray-300 ${className}`}
    >
      {initialsOf(name)}
    </span>
  );
};

export default FaceAvatar;
