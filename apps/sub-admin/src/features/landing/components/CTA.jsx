import CtaBanner from "../../marketing/components/CtaBanner.jsx";
import { ROUTES } from "../../marketing/data/siteContent.js";

const PERKS = [
  { icon: "zap", label: "Quick Setup" },
  { icon: "monitor", label: "Personalized Demo" },
  { icon: "headset", label: "24/7 Support" },
];

/** Final "Ready to Transform Your Business?" banner. */
export default function CTA({ backgroundSrc }) {
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
