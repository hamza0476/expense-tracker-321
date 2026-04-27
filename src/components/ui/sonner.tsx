import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-center"
      duration={2200}
      visibleToasts={3}
      gap={8}
      offset={12}
      closeButton={false}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background/95 group-[.toaster]:backdrop-blur-md group-[.toaster]:text-foreground group-[.toaster]:border group-[.toaster]:border-border/60 group-[.toaster]:shadow-lg group-[.toaster]:rounded-xl group-[.toaster]:py-2 group-[.toaster]:px-3 group-[.toaster]:min-h-0 group-[.toaster]:text-[13px] group-[.toaster]:font-medium",
          title: "text-[13px] font-semibold leading-tight",
          description: "group-[.toast]:text-muted-foreground text-[12px] leading-tight",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:h-7 group-[.toast]:px-2 group-[.toast]:text-xs",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:h-7 group-[.toast]:px-2 group-[.toast]:text-xs",
          success: "group-[.toaster]:!border-success/40 group-[.toaster]:!text-foreground [&_[data-icon]]:!text-success",
          error: "group-[.toaster]:!border-destructive/40 group-[.toaster]:!text-foreground [&_[data-icon]]:!text-destructive",
          icon: "!w-4 !h-4",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
