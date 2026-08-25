import Header from "../components/Header.jsx";
import Hero from "../components/Hero.jsx";
import DepartmentsCarousel from "../components/DepartmentsCarousel.jsx";
import VideoAISection from "../components/VideoAISection.jsx";
import WhyChoose from "../components/WhyChoose.jsx";
import Pricing from "../components/Pricing.jsx";
import StatsBar from "../components/StatsBar.jsx";
import Testimonial from "../components/Testimonial.jsx";
import CTA from "../components/CTA.jsx";
import Footer from "../components/Footer.jsx";

export default function Landing() {
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
