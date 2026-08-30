import Header from "./_components/Header.jsx";
import Hero from "./_components/Hero.jsx";
import DepartmentsCarousel from "./_components/DepartmentsCarousel.jsx";
import VideoAISection from "./_components/VideoAISection.jsx";
import WhyChoose from "./_components/WhyChoose.jsx";
import Pricing from "./_components/Pricing.jsx";
import StatsBar from "./_components/StatsBar.jsx";
import Testimonial from "./_components/Testimonial.jsx";
import CTA from "./_components/CTA.jsx";
import Footer from "./_components/Footer.jsx";

export default function LandingPage() {
  return (
    <div className="font-body">
      <Header />
      <Hero />
      <DepartmentsCarousel />
      <VideoAISection />
      <WhyChoose />
      <Pricing />
      <StatsBar />
      <Testimonial />
      <CTA />
      <Footer />
    </div>
  );
}
