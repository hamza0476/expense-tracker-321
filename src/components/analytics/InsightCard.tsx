import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface Props {
  Icon: LucideIcon;
  title: string;
  description?: string;
  tone?: "info" | "warning" | "success";
}

const toneMap = {
  info: "bg-primary text-primary-foreground",
  warning: "bg-warning/10 text-warning-foreground border border-warning/30",
  success: "bg-success/10 text-success-foreground border border-success/30",
} as const;

const iconBg = {
  info: "bg-white/20 text-white",
  warning: "bg-warning/20 text-warning",
  success: "bg-success/20 text-success",
} as const;

export const InsightCard = ({ Icon, title, description, tone = "info" }: Props) => {
  return (
    <div className={cn("rounded-2xl p-3.5 flex items-start gap-3 shadow-sm", toneMap[tone])}>
      <div className={cn("w-9 h-9 rounded-full flex items-center justify-center shrink-0", iconBg[tone])}>
        <Icon className="w-4 h-4" strokeWidth={2.2} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("text-xs font-semibold leading-tight", tone === "info" ? "text-primary-foreground" : "text-foreground")}>
          {title}
        </p>
        {description && (
          <p className={cn("text-[11px] leading-snug mt-0.5", tone === "info" ? "text-primary-foreground/85" : "text-muted-foreground")}>
            {description}
          </p>
        )}
      </div>
    </div>
  );
};
