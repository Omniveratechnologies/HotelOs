import { Activity } from "lucide-react";
import { ICONS } from "../utils/iconMap";

export interface IconProps {
  name?: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function Icon({ name, size = 18, ...rest }: IconProps) {
  const Component = (name && ICONS[name]) || Activity;
  return <Component size={size} {...rest} />;
}

export default Icon;
