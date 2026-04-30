import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  getCategoryIconConfig,
  getIconByName,
  CATEGORY_ICONS_EVENT,
} from "@/lib/categoryIcons";

interface Props {
  category: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: { box: "w-8 h-8 rounded-lg", icon: 16 },
  md: { box: "w-10 h-10 rounded-xl", icon: 18 },
  lg: { box: "w-11 h-11 rounded-xl", icon: 20 },
};

export const CategoryIcon = ({ category, size = "md", className }: Props) => {
  const [config, setConfig] = useState(() => getCategoryIconConfig(category));

  useEffect(() => {
    setConfig(getCategoryIconConfig(category));
    const handler = () => setConfig(getCategoryIconConfig(category));
    window.addEventListener(CATEGORY_ICONS_EVENT, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(CATEGORY_ICONS_EVENT, handler);
      window.removeEventListener("storage", handler);
    };
  }, [category]);

  const Icon = getIconByName(config.icon);
  const s = sizeMap[size];

  return (
    <div
      className={cn("flex items-center justify-center shrink-0", s.box, className)}
      style={{ backgroundColor: `${config.color}22`, color: config.color }}
    >
      <Icon size={s.icon} strokeWidth={2.2} />
    </div>
  );
};
