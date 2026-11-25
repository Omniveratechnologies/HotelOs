import CtaBanner from "@/components/marketing/CtaBanner";
import { ROUTES } from "@/data/siteContent";

const PERKS = [
  { icon: "zap", label: "Quick Setup" },
  { icon: "monitor", label: "Personalized Demo" },
  { icon: "headset", label: "24/7 Support" },
];

export interface CTAProps {
  backgroundSrc?: string;
}

export default function CTA({ backgroundSrc }: CTAProps) {
  return (
    <CtaBanner
      theme="gold"
      title="Ready to Transform Your Business?"
      description="Get a personalized demo and see how HotelOS can help you grow."
      primaryCta={{ label: "Request a Demo", to: ROUTES.requestDemo }}
      secondaryCta={{ label: "Talk to Sales", to: ROUTES.requestDemo }}
      perks={PERKS}
      backgroundSrc={backgroundSrc}
      backgroundLabel="Hotel background"
    />
  );
}
