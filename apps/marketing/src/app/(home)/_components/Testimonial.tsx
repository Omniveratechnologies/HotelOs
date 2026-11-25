import ImageSlot from "@/components/ui/ImageSlot";
import { Icon } from "@/components/ui/MarketingIcons";
import SectionHeading from "@/components/marketing/SectionHeading";

const TESTIMONIALS = [
  {
    quote:
      "HotelOS has simplified our operations and increased our revenue. The support team is excellent!",
    name: "Rohit Malhotra",
    role: "Hotel Owner, Goa",
  },
  {
    quote:
      "The POS and table ordering system is super easy to use. Our billing time has reduced by 70%.",
    name: "Priya Sharma",
    role: "Restaurant Owner, Kolkata",
  },
  {
    quote:
      "X Factor table kiosk menu has really improved our customer experience and sales.",
    name: "Amit Verma",
    role: "Café Owner, Delhi",
  },
];

const STARS = [1, 2, 3, 4, 5];

export interface TestimonialProps {
  avatars?: string[];
}

export default function Testimonial({ avatars = [] }: TestimonialProps) {
  return (
    <section className="mx-auto max-w-[1400px] px-6 py-12 lg:px-10">
      <p className="text-center text-xs font-bold tracking-[0.18em] text-[#c9962c] uppercase">
        What Our Customers Say
      </p>
      <SectionHeading
        className="mt-2"
        theme="gold"
        title="Trusted by Hospitality Businesses Across India"
      />

      <ul className="mt-8 grid gap-6 lg:grid-cols-3">
        {TESTIMONIALS.map((item, index) => (
          <li
            key={item.name}
            className="border-surface-200 flex flex-col rounded-xl border bg-white p-6 shadow-sm"
          >
            <p className="text-brand-800 flex-1 text-[15px] leading-relaxed">
              “{item.quote}”
            </p>

            <div className="mt-6 flex items-center gap-3">
              <ImageSlot
                src={avatars[index]}
                label=""
                alt={item.name}
                className="h-12 w-12 shrink-0 rounded-full"
              />
              <div>
                <p className="text-brand-900 text-sm font-semibold">
                  {item.name}
                </p>
                <p className="text-brand-700/80 text-xs">{item.role}</p>
                <div
                  className="mt-1 flex gap-0.5 text-[#e0932b]"
                  role="img"
                  aria-label="5 out of 5 stars"
                >
                  {STARS.map((star) => (
                    <Icon
                      key={star}
                      name="star"
                      strokeWidth={1}
                      className="h-4 w-4 fill-current"
                    />
                  ))}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
