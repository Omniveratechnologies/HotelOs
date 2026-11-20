import { useState } from "react";

/**
 * Two-column FAQ. Each question opens and closes on its own.
 *
 * Props
 *  title   heading
 *  items   [{ question, answer }]  (read left to right, row by row)
 */
export default function FaqAccordion({ title, items = [] }) {
  const [openIds, setOpenIds] = useState([]);

  const toggle = (id) =>
    setOpenIds((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id],
    );

  // Left column gets items 1, 3, 5 and the right column 2, 4, 6, so opening
  // one answer never stretches the card next to it.
  const columns = [
    items
      .map((item, index) => ({ item, index }))
      .filter((entry) => entry.index % 2 === 0),
    items
      .map((item, index) => ({ item, index }))
      .filter((entry) => entry.index % 2 === 1),
  ];

  return (
    <section className="mx-auto max-w-[1400px] px-6 py-12 lg:px-10">
      <h2 className="text-brand-900 text-2xl font-bold tracking-tight sm:text-3xl">
        {title}
      </h2>

      <div className="mt-6 grid items-start gap-4 sm:grid-cols-2">
        {columns.map((column, columnIndex) => (
          <div key={`faq-column-${columnIndex}`} className="space-y-4">
            {column.map(({ item, index }) => {
              const open = openIds.includes(index);
              const buttonId = `faq-question-${index}`;
              const panelId = `faq-answer-${index}`;

              return (
                <div
                  key={item.question}
                  className="border-surface-200 rounded-lg border bg-white"
                >
                  <h3>
                    <button
                      type="button"
                      id={buttonId}
                      aria-expanded={open}
                      aria-controls={panelId}
                      onClick={() => toggle(index)}
                      className="text-brand-900 flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left text-sm font-medium"
                    >
                      {item.question}
                      <span
                        aria-hidden="true"
                        className="shrink-0 text-xl leading-none font-light"
                      >
                        {open ? "−" : "+"}
                      </span>
                    </button>
                  </h3>
                  {open && (
                    <div
                      id={panelId}
                      role="region"
                      aria-labelledby={buttonId}
                      className="text-brand-700/80 px-4 pb-4 text-sm leading-relaxed"
                    >
                      {item.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}
