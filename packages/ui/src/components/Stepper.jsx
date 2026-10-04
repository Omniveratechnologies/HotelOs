import { Fragment } from "react";
import { cn } from "@hotelos/utils";

/**
 * @typedef {Object} StepperStep
 * @property {string} id - Stable step identifier.
 * @property {string} title - Step title.
 * @property {string} [subtitle] - Small helper text under the title.
 */

/**
 * Horizontal numbered stepper. Steps before `currentIndex` are marked done and
 * are clickable (calls `onStepClick`); the active step is highlighted; upcoming
 * steps are muted. Collapses to a "Step X of N · Title" line below `md`.
 *
 * @param {Object} props - Component properties.
 * @param {StepperStep[]} props.steps - Ordered steps (count is derived — never hard-coded).
 * @param {number} props.currentIndex - Index of the active step (0-based).
 * @param {(index: number) => void} [props.onStepClick] - Called when a completed step is clicked.
 * @param {string} [props.className] - Extra classes for the container.
 * @returns {React.ReactElement}
 */
export function Stepper({ steps, currentIndex, onStepClick, className = "" }) {
  const total = steps.length;
  const active = steps[currentIndex];

  return (
    <div className={className}>
      {/* Compact label for small screens */}
      <p className="text-brand-900 text-sm font-semibold md:hidden">
        Step {currentIndex + 1} of {total}
        {active?.title ? ` · ${active.title}` : ""}
      </p>

      <ol className="hidden items-start md:flex">
        {steps.map((step, index) => {
          const done = index < currentIndex;
          const activeStep = index === currentIndex;
          const clickable = done && typeof onStepClick === "function";

          const circle = (
            <span
              aria-hidden="true"
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition-colors",
                done && "bg-brand-700 border-brand-700 text-white",
                activeStep &&
                  "bg-brand-700 border-brand-700 ring-brand-200 text-white ring-4",
                !done &&
                  !activeStep &&
                  "border-surface-300 text-surface-500 bg-white",
              )}
            >
              {done ? (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className="h-4 w-4"
                >
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              ) : (
                index + 1
              )}
            </span>
          );

          const body = (
            <>
              <span
                className={cn(
                  "text-sm font-semibold",
                  activeStep ? "text-brand-900" : "text-surface-600",
                )}
              >
                {step.title}
              </span>
              {step.subtitle && (
                <span className="text-surface-500 mt-0.5 text-xs">
                  {step.subtitle}
                </span>
              )}
            </>
          );

          return (
            <Fragment key={step.id}>
              {index > 0 && (
                <span
                  aria-hidden="true"
                  className={cn(
                    "border-surface-300 mx-3 mt-4 min-w-6 flex-1 border-t",
                    done && "border-brand-700",
                  )}
                />
              )}
              <li
                aria-current={activeStep ? "step" : undefined}
                className="flex shrink-0 items-start gap-2.5"
              >
                {clickable ? (
                  <button
                    type="button"
                    onClick={() => onStepClick(index)}
                    aria-label={`Go back to step ${index + 1}: ${step.title}`}
                    className="hover:ring-brand-200 flex items-start gap-2.5 rounded-lg text-left transition focus-visible:ring-2 focus-visible:outline-none"
                  >
                    {circle}
                    <span className="flex flex-col">{body}</span>
                  </button>
                ) : (
                  <>
                    {circle}
                    <span className="flex flex-col">{body}</span>
                  </>
                )}
              </li>
            </Fragment>
          );
        })}
      </ol>
    </div>
  );
}

export default Stepper;
