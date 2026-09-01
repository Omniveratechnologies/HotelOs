import HotelInformationSection from "./_components/HotelInformationSection.jsx";
import NotificationsSection from "./_components/NotificationsSection.jsx";

export default function SettingsPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="font-display text-navy-900 text-2xl font-bold">
          Settings
        </h1>
        <p className="text-sm text-gray-500">Configure your HotelOS</p>
      </div>

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
  );
}

function CardSection({ title, icon, content }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
      <h3 className="text-navy-900 mb-4 flex items-center gap-2 font-bold">
        <span>{icon}</span> {title}
      </h3>
      {content}
    </div>
  );
}
