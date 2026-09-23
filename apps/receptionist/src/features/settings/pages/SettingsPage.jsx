import { Header } from "@hotelos/ui/components/Header";
import HotelInformationSection from "../components/HotelInformationSection.jsx";
import NotificationsSection from "../components/NotificationsSection.jsx";

export default function SettingsPage() {
  return (
    <>
      <Header pageTitle="Settings" pageDescription="Configure your Hotel" />
      <div className="p-6">
        <div className="space-y-5">
          <CardSection
            title="Hotel Information"
            icon="🏨"
            content={<HotelInformationSection />}
          />
          <CardSection
            title="Notifications"
            icon="🔔"
            content={<NotificationsSection />}
          />
        </div>
      </div>
    </>
  );
}

function CardSection({ title, icon, content }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
      <h3 className="text-brand-900 mb-4 flex items-center gap-2 font-bold">
        <span>{icon}</span> {title}
      </h3>
      {content}
    </div>
  );
}
