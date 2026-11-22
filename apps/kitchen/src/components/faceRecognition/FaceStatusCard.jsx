import {
  FiAlertCircle,
  FiBriefcase,
  FiUserCheck,
  FiUsers,
} from "react-icons/fi";

import StatusCard from "../ui/StatusCard.jsx";

const FaceStatusCards = ({ summary }) => (
  <div className="flex flex-wrap gap-3" aria-label="Face registration summary">
    <StatusCard
      icon={<FiBriefcase size={18} />}
      title="Total Staff"
      value={summary?.total ?? "-"}
      subtitle="Registered in system"
      iconColor="text-blue-400"
      iconBg="bg-blue-950"
      subtitleColor="text-gray-400"
    />
    <StatusCard
      icon={<FiUserCheck size={18} />}
      title="Faces Registered"
      value={summary?.registered ?? "-"}
      subtitle={summary ? `${summary.percent.registered}% of staff` : ""}
      iconColor="text-emerald-400"
      iconBg="bg-emerald-950"
      subtitleColor="text-emerald-400"
    />
    <StatusCard
      icon={<FiAlertCircle size={18} />}
      title="Not Registered"
      value={summary?.notRegistered ?? "-"}
      subtitle={summary ? `${summary.percent.notRegistered}% of staff` : ""}
      iconColor="text-orange-400"
      iconBg="bg-orange-950"
      subtitleColor="text-orange-400"
    />
    <StatusCard
      icon={<FiUsers size={18} />}
      title="Today's Registrations"
      value={summary?.todayRegistrations ?? "-"}
      subtitle="New faces added"
      iconColor="text-purple-400"
      iconBg="bg-purple-950"
      subtitleColor="text-purple-400"
    />
  </div>
);

export default FaceStatusCards;
