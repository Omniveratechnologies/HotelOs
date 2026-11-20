import { THEMES } from "../data/themes.js";

/**
 * Renders a title that is either a plain string or a list of parts:
 *   [{ text: "Why Choose " }, { text: "X Factor", accent: true }, { text: "?" }]
 * Parts marked `accent` get the accent colour.
 */
export function RichTitle({ title, accentClass }) {
  if (typeof title === "string") return title;

  return title.map((part, index) => (
    <span
      key={`part-${index}`}
      className={part.accent ? accentClass : undefined}
    >
      {part.text}
    </span>
  ));
}

/** Centered section heading with an optional subtitle. */
export default function SectionHeading({
  theme = "gold",
  title,
  subtitle,
  className = "",
}) {
  const t = THEMES[theme];

  return (
    <div className={`text-center ${className}`}>
      <h2 className="text-brand-900 text-2xl font-bold tracking-tight sm:text-3xl">
        <RichTitle title={title} accentClass={t.accentText} />
      </h2>
      {subtitle && (
        <p className="text-brand-700/80 mx-auto mt-2 max-w-2xl text-sm">
          {subtitle}
        </p>
      )}
    </div>
  );
}
