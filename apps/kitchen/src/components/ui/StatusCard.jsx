const StatusCard = ({
  icon,
  title,
  value,
  subtitle,
  iconColor = "text-emerald-400",
  iconBg = "bg-emerald-950",
  subtitleColor = "text-emerald-400",
}) => {
  return (
    <div className="flex flex-1 items-center gap-3 rounded-lg border border-gray-800 px-4 py-3">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconBg} ${iconColor}`}
      >
        {icon}
      </div>

      <div className="min-w-0">
        <p className="truncate text-xs text-gray-500">{title}</p>

        <p className="text-xl font-bold text-white">{value}</p>

        {subtitle && (
          <p className={`text-[10px] font-medium ${subtitleColor}`}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};

export default StatusCard;
