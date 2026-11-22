import { Icon } from "./MarketingIcons.jsx";

// Centre points (in %) of the eight modules around the hub, used for the
// connecting lines. POSITIONS holds the same points as complete Tailwind classes.
const POINTS = [
  [28, 8],
  [74, 8],
  [14, 36],
  [86, 36],
  [16, 68],
  [84, 68],
  [32, 92],
  [70, 92],
];

const POSITIONS = [
  "left-[28%] top-[8%]",
  "left-[74%] top-[8%]",
  "left-[14%] top-[36%]",
  "left-[86%] top-[36%]",
  "left-[16%] top-[68%]",
  "left-[84%] top-[68%]",
  "left-[32%] top-[92%]",
  "left-[70%] top-[92%]",
];

function ModuleNode({ node }) {
  return (
    <div className="ring-surface-200 flex items-center gap-2.5 rounded-xl bg-white px-3 py-2 shadow-md ring-1">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#fdf1dd] text-[#e0932b]">
        <Icon name={node.icon} className="h-5 w-5" />
      </span>
      <span>
        <span className="text-brand-900 block text-[13px] leading-tight font-bold whitespace-nowrap">
          {node.title}
        </span>
        <span className="text-brand-700/70 block text-[11px] whitespace-nowrap">
          {node.subtitle}
        </span>
      </span>
    </div>
  );
}

/**
 * "One Connected System": text and key benefits on the left, a hub diagram
 * with the HotelOS logo in the centre and up to eight modules around it on
 * the right (drawn in code, no image needed).
 *
 * Props
 *  label, title, description   text block
 *  benefitsTitle, benefits      "Key Benefits" list
 *  nodes                        [{ icon, title, subtitle }]  (up to 8)
 */
export default function ConnectedSystem({
  label,
  title,
  description,
  benefitsTitle = "Key Benefits",
  benefits = [],
  nodes = [],
}) {
  return (
    <section className="mx-auto max-w-[1400px] px-6 py-12 lg:px-10">
      <div className="grid items-center gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
        <div>
          {label && (
            <p className="text-xs font-bold tracking-[0.18em] text-[#c9962c] uppercase">
              {label}
            </p>
          )}
          <h2 className="text-brand-900 mt-3 text-4xl leading-tight font-extrabold tracking-tight">
            {title}
          </h2>
          {description && (
            <p className="text-brand-700/80 mt-4 max-w-md text-base leading-relaxed">
              {description}
            </p>
          )}

          <h3 className="text-brand-900 mt-8 text-sm font-bold">
            {benefitsTitle}
          </h3>
          <ul className="mt-3 space-y-3">
            {benefits.map((benefit) => (
              <li
                key={benefit}
                className="text-brand-800 flex items-center gap-3 text-[15px]"
              >
                <Icon
                  name="checkCircle"
                  className="h-5 w-5 shrink-0 text-[#e0932b]"
                />
                {benefit}
              </li>
            ))}
          </ul>
        </div>

        {/* Hub diagram (tablet and desktop) */}
        <div className="relative hidden aspect-[5/4] w-full sm:block">
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
            className="absolute inset-0 h-full w-full text-[#e0b458]"
          >
            {nodes.slice(0, POINTS.length).map((node, index) => (
              <line
                key={node.title}
                x1="50"
                y1="50"
                x2={POINTS[index][0]}
                y2={POINTS[index][1]}
                stroke="currentColor"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>

          <div className="absolute top-1/2 left-1/2 flex h-32 w-32 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center gap-1.5 rounded-full bg-white shadow-xl ring-4 ring-[#f6e7c9]">
            <span className="font-display border-primary-400 bg-brand-900 text-primary-400 flex h-10 w-10 items-center justify-center rounded-full border text-xl leading-none font-bold">
              H
            </span>
            <span className="font-display text-brand-900 text-lg leading-none font-semibold">
              Hotel<span className="text-primary-500">OS</span>
            </span>
          </div>

          <ul>
            {nodes.slice(0, POSITIONS.length).map((node, index) => (
              <li
                key={node.title}
                className={`absolute -translate-x-1/2 -translate-y-1/2 ${POSITIONS[index]}`}
              >
                <ModuleNode node={node} />
              </li>
            ))}
          </ul>
        </div>

        {/* Simple list (phones) */}
        <ul className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 sm:hidden">
          {nodes.map((node) => (
            <li key={node.title}>
              <ModuleNode node={node} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
