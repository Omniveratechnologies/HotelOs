import { format } from "date-fns";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const COLORS = {
  primary: "#1e3a8a",
  secondary: "#3b82f6",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#06b6d4",
  purple: "#8b5cf6",
};

const CHART_COLORS = [
  "#1e3a8a",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
  "#f97316",
];

const formatCurrency = (val) => `₹${(val || 0).toLocaleString("en-IN")}`;

const tooltipStyle = {
  backgroundColor: "white",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
};

export const OccupancyTrendChart = ({
  data,
  height = 300,
  animationDuration = 1000,
}) => {
  if (!data || data.length === 0)
    return (
      <div className="flex h-64 items-center justify-center text-gray-400">
        No occupancy data
      </div>
    );

  return (
    <div className="h-64" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#e5e7eb"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tickFormatter={(date) => format(new Date(date), "MMM d")}
            tick={{ fontSize: 11, fill: "#6b7280" }}
            axisLine={{ stroke: "#e5e7eb" }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#6b7280" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            labelFormatter={(date) => format(new Date(date), "MMM d, yyyy")}
            formatter={(value) => [value, "Occupancy %"]}
          />
          <Line
            type="monotone"
            dataKey="occupancyRate"
            stroke={COLORS.primary}
            strokeWidth={2}
            dot={{ r: 4, fill: COLORS.primary, strokeWidth: 2 }}
            activeDot={{ r: 6, fill: COLORS.primary }}
            animationDuration={animationDuration}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export const RevenueTrendChart = ({
  dailyRevenue,
  dailyRoomRevenue,
  height = 300,
  animationDuration = 1000,
}) => {
  const combinedData = [];
  const allDates = new Set([
    ...(dailyRevenue || []).map((d) => d.date),
    ...(dailyRoomRevenue || []).map((d) => d.date),
  ]);

  allDates.forEach((date) => {
    const food = dailyRevenue?.find((d) => d.date === date) || {
      revenue: 0,
      orders: 0,
    };
    const room = dailyRoomRevenue?.find((d) => d.date === date) || {
      revenue: 0,
      rooms: 0,
    };
    combinedData.push({
      date,
      foodRevenue: food.revenue,
      roomRevenue: room.revenue,
      totalRevenue: food.revenue + room.revenue,
    });
  });

  combinedData.sort((a, b) => a.date.localeCompare(b.date));

  if (combinedData.length === 0)
    return (
      <div className="flex h-64 items-center justify-center text-gray-400">
        No revenue data
      </div>
    );

  return (
    <div className="h-64" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={combinedData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#e5e7eb"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tickFormatter={(date) => format(new Date(date), "MMM d")}
            tick={{ fontSize: 11, fill: "#6b7280" }}
            axisLine={{ stroke: "#e5e7eb" }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#6b7280" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(val) => formatCurrency(val / 1000) + "k"}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            labelFormatter={(date) => format(new Date(date), "MMM d, yyyy")}
            formatter={(value, name) => [
              formatCurrency(value),
              name === "foodRevenue"
                ? "F&B Revenue"
                : name === "roomRevenue"
                  ? "Room Revenue"
                  : "Total Revenue",
            ]}
          />
          <Legend />
          <Bar
            dataKey="roomRevenue"
            name="Room Revenue"
            fill={COLORS.primary}
            radius={[4, 4, 0, 0]}
            animationDuration={animationDuration}
          />
          <Bar
            dataKey="foodRevenue"
            name="F&B Revenue"
            fill={COLORS.success}
            radius={[4, 4, 0, 0]}
            animationDuration={animationDuration}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const RevenueByTypePie = ({
  revenueByType,
  height = 300,
  animationDuration = 1000,
}) => {
  if (!revenueByType || revenueByType.length === 0)
    return (
      <div className="flex h-64 items-center justify-center text-gray-400">
        No revenue data
      </div>
    );

  const data = revenueByType.map((item, index) => ({
    name: item.type,
    value: item.revenue,
    color: CHART_COLORS[index % CHART_COLORS.length],
  }));

  return (
    <div className="h-64" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
            nameKey="name"
            label={({ name, percent }) =>
              `${name} ${(percent * 100).toFixed(0)}%`
            }
            labelLine={false}
            animationDuration={animationDuration}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value) => [formatCurrency(value), "Revenue"]}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export const ServiceRequestStatusChart = ({
  serviceRequestsByStatus,
  height = 250,
  animationDuration = 1000,
}) => {
  if (!serviceRequestsByStatus || serviceRequestsByStatus.length === 0)
    return (
      <div className="flex h-48 items-center justify-center text-gray-400">
        No service request data
      </div>
    );

  const statusOrder = [
    "REQUESTED",
    "ACKNOWLEDGED",
    "IN_PROGRESS",
    "COMPLETED",
    "CANCELLED",
  ];
  const statusColors = {
    REQUESTED: COLORS.warning,
    ACKNOWLEDGED: COLORS.info,
    IN_PROGRESS: COLORS.purple,
    COMPLETED: COLORS.success,
    CANCELLED: COLORS.danger,
  };
  const statusLabels = {
    REQUESTED: "Requested",
    ACKNOWLEDGED: "Acknowledged",
    IN_PROGRESS: "In Progress",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
  };

  const data = statusOrder
    .map((status) => {
      const found = serviceRequestsByStatus.find((s) => s.status === status);
      return found
        ? {
            name: statusLabels[status],
            value: found.count,
            color: statusColors[status],
          }
        : null;
    })
    .filter(Boolean);

  return (
    <div className="h-48" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 10, right: 10, left: 80, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#e5e7eb"
            horizontal={false}
          />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: "#6b7280" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            dataKey="name"
            type="category"
            tick={{ fontSize: 11, fill: "#6b7280" }}
            axisLine={{ stroke: "#e5e7eb" }}
            width={80}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value) => [value, "Requests"]}
          />
          <Bar
            dataKey="value"
            name="Requests"
            radius={[0, 4, 4, 0]}
            animationDuration={animationDuration}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const RoomStatusDonut = ({
  available,
  occupied,
  reserved,
  cleaning,
  total,
  occupancyRate,
}) => {
  if (total === 0) {
    return (
      <div className="py-10 text-center text-sm text-gray-400">
        No rooms yet.
      </div>
    );
  }

  const segments = [
    { value: available, color: COLORS.success, label: "Available" },
    { value: occupied, color: COLORS.secondary, label: "Occupied" },
    { value: reserved, color: COLORS.warning, label: "Reserved" },
    { value: cleaning, color: "#9ca3af", label: "Cleaning" },
  ].filter((s) => s.value > 0);

  return (
    <div className="flex items-center gap-6">
      <div className="relative h-36 w-36 shrink-0">
        <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
          {segments.map((segment, index) => {
            const previousSum = segments
              .slice(0, index)
              .reduce((sum, s) => sum + s.value, 0);
            const offset = total > 0 ? -((previousSum / total) * 100) : 0;
            const dashArray =
              total > 0
                ? `${(segment.value / total) * 100} ${100 - (segment.value / total) * 100}`
                : "0 100";
            return (
              <circle
                key={segment.label}
                cx="18"
                cy="18"
                r="15.9"
                fill="none"
                stroke={segment.color}
                strokeWidth="3.5"
                strokeDasharray={dashArray}
                strokeDashoffset={offset}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-brand-900 text-2xl font-bold">
              {occupancyRate}%
            </div>
            <div className="text-xs text-gray-400">Occupied</div>
          </div>
        </div>
      </div>
      <div className="space-y-3">
        {segments.map((segment) => (
          <div key={segment.label} className="flex items-center gap-3">
            <div
              className={`h-3 w-3 shrink-0 rounded-full`}
              style={{ backgroundColor: segment.color }}
            />
            <div>
              <div className="text-brand-900 text-sm font-semibold">
                {segment.value} rooms
              </div>
              <div className="text-xs text-gray-400">{segment.label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
