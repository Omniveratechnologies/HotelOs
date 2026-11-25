import type { ReactNode } from "react";
import { THEMES } from "@/data/themes";

export interface TitlePart {
  text: string;
  accent?: boolean;
}

export type TitleProp = string | TitlePart[];

export function RichTitle({
  title,
  accentClass,
}: {
  title: TitleProp;
  accentClass?: string;
}): ReactNode {
  if (typeof title === "string") return title;

  return title.map((part) => (
    <span key={part.text} className={part.accent ? accentClass : undefined}>
      {part.text}
    </span>
  ));
}

interface SectionHeadingProps {
  theme?: "gold" | "rose";
  title: TitleProp;
  subtitle?: string;
  className?: string;
}

export default function SectionHeading({
  theme = "gold",
  title,
  subtitle,
  className = "",
}: SectionHeadingProps) {
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
