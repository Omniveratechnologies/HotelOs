import { useState } from "react";

const getInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

const Avatar = ({ src, name, size = 36 }) => {
  const [failed, setFailed] = useState(false);
  const style = { width: size, height: size };

  if (!src || failed) {
    return (
      <span
        style={style}
        className="inline-flex items-center justify-center rounded-full bg-gray-800 text-[11px] font-semibold text-gray-300"
      >
        {getInitials(name) || "?"}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      style={style}
      loading="lazy"
      onError={() => setFailed(true)}
      className="rounded-full object-cover"
    />
  );
};

export default Avatar;