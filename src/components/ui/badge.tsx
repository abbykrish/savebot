import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  color?: string;
  variant?: "default" | "outline";
  className?: string;
}

export function Badge({ children, color, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        variant === "default" && "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
        variant === "outline" && "border border-neutral-300 dark:border-neutral-700",
        className
      )}
      style={color ? { backgroundColor: `${color}20`, color, borderColor: `${color}40` } : undefined}
    >
      {children}
    </span>
  );
}
