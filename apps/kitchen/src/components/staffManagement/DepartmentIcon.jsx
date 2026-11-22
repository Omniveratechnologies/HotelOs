import {
  DEFAULT_COLOR,
  DEFAULT_ICON,
  DEPARTMENT_ICONS,
} from "../../utils/departmentOptions.js";

const DepartmentIcon = ({ icon, color, size = 16, boxClass = "h-8 w-8" }) => {
  const { Icon } = DEPARTMENT_ICONS[icon] || DEPARTMENT_ICONS[DEFAULT_ICON];
  const tint = /^#[0-9a-f]{6}$/i.test(color || "") ? color : DEFAULT_COLOR;

  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-lg ${boxClass}`}
      style={{ backgroundColor: `${tint}26`, color: tint }}
    >
      <Icon size={size} />
    </span>
  );
};

export default DepartmentIcon;
