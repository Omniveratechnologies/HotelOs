"use client";

import { useCallback, useState } from "react";

import CtaBanner from "@/components/marketing/CtaBanner";
import FeatureStrip from "@/components/marketing/FeatureStrip";
import ProductHero from "@/components/marketing/ProductHero";
import { ROUTES } from "@/data/siteContent";
import useSiteImages from "@/hooks/useSiteImages";
import ConnectedSystem from "./ConnectedSystem";
import HardwareGrid from "./HardwareGrid";
import HospitalityBand from "./HospitalityBand";
import ModuleShowcase from "./ModuleShowcase";
import ProductDetailsModal from "./ProductDetailsModal";
import SoftwareOnHardware from "./SoftwareOnHardware";
import {
  BENEFITS,
  CTA_STATS,
  DEFAULT_IMAGES,
  DIAGRAM_NODES,
  HARDWARE,
  HOSPITALITY_CARDS,
  MODULES,
  SOFTWARE_POINTS,
  STRIP_ITEMS,
  buildProductDetails,
} from "../_data/managementData";
import type { HardwareItem } from "../_types/managementTypes";

export default function ManagementSuiteContent() {
  const images = useSiteImages("management-suite", DEFAULT_IMAGES);
  const showcase = images.softwareOnHardware;
  const [selectedHardware, setSelectedHardware] = useState<HardwareItem | null>(
    null,
  );
  const closeDetails = useCallback(() => setSelectedHardware(null), []);

  return (
    <>
      <ProductHero
        theme="gold"
        eyebrow={{ tag: "MANAGEMENT SUITE" }}
        title={[
          "One Ecosystem.",
          "Every Hospitality",
          [{ text: "Operation.", accent: true }],
        ]}
        description="A complete ecosystem of software and hardware for hotels and restaurants — designed to work seamlessly together."
        primaryCta={{ label: "Request Demo", to: ROUTES.requestDemo }}
        secondaryCta={{ label: "Contact Sales", to: ROUTES.requestDemo }}
        checks={[
          "Hotels",
          "Restaurants",
          "Resorts",
          "Cloud Based",
          "Easy Setup",
        ]}
        slides={images.heroSlides}
        slideLabel="Management Suite hero image"
        showControls={false}
      />

      <FeatureStrip items={STRIP_ITEMS} />

      <ModuleShowcase
        label="All-in-One Platform"
        title="Everything Works Better Together"
        description="From guest bookings to restaurant billing, housekeeping to payments — all modules are connected in a single ecosystem to give you complete control."
        items={MODULES}
      />

      <HardwareGrid
        label="Hardware Ecosystem"
        title="Explore Our Hardware Range"
        description="A wide range of reliable and industry-grade hardware designed to work seamlessly with HotelOS software."
        ctaLabel="View All Hardware"
        items={HARDWARE}
        images={images.hardware}
        onViewDetails={setSelectedHardware}
      />

      <SoftwareOnHardware
        label="Software on Our Hardware"
        title="Your Software, Running on Our Hardware"
        description="Experience how HotelOS PMS, POS and other modules work seamlessly on our own hardware devices. Designed, tested and optimized to give you the best performance."
        points={SOFTWARE_POINTS}
        mainImage={{ src: showcase.main, label: "POS on the counter" }}
        thumbnails={[
          {
            src: showcase.frontDesk,
            title: "Hotel PMS",
            caption: "on Front Desk Terminal",
          },
          {
            src: showcase.counter,
            title: "Restaurant POS",
            caption: "at Counter",
          },
          {
            src: showcase.kitchen,
            title: "Kitchen Display (KDS)",
            caption: "in Kitchen",
          },
          {
            src: showcase.kiosk,
            title: "Self Check-in",
            caption: "Kiosk for Guests",
          },
        ]}
      />

      <ConnectedSystem
        label="Integrated Ecosystem"
        title="One Connected System"
        description="All modules and hardware work together in a unified ecosystem, giving you a seamless and efficient way to manage your entire hotel and restaurant operations."
        benefits={BENEFITS}
        nodes={DIAGRAM_NODES}
      />

      <HospitalityBand
        label="Built for Hospitality"
        title="Designed for Every Corner of Hospitality"
        description="Whether you run a hotel, restaurant, resort or multi-property chain, HotelOS gives you the complete tools and hardware to operate smarter and grow faster."
        cards={HOSPITALITY_CARDS}
        backgroundSrc={images.hospitalityBackground}
      />

      <CtaBanner
        theme="gold"
        eyebrow="Ready to transform your business?"
        title="Bring Your Hospitality Operations Together"
        description="Get a personalized demo and see how HotelOS can simplify your operations and increase your revenue."
        primaryCta={{ label: "Request a Demo", to: ROUTES.requestDemo }}
        secondaryCta={{ label: "Talk to Sales", to: ROUTES.requestDemo }}
        stats={CTA_STATS}
        backgroundSrc={images.ctaBackground}
        backgroundLabel="Restaurant background"
      />

      {selectedHardware && (
        <ProductDetailsModal
          key={selectedHardware.title}
          product={buildProductDetails(
            selectedHardware,
            images.hardwareGallery,
          )}
          onClose={closeDetails}
        />
      )}
    </>
  );
}
