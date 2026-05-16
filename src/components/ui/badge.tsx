import * as React from "react";
import { cn } from "@/lib/utils";

export const RagBadge = ({ status }: { status: "GREEN" | "RED" }) => (
  <span
    className={cn(
      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
      status === "GREEN" && "bg-green-100 text-green-800",
      status === "RED" && "bg-red-100 text-red-800",
    )}
  >
    {status === "GREEN" ? "Green" : "Red"}
  </span>
);

function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: "default" | "outline" | "success" | "warning" }) {
  return (
    <span
      data-slot="badge"
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        variant === "default" && "bg-primary/10 text-primary",
        variant === "outline" && "border border-input text-foreground",
        variant === "success" && "bg-green-100 text-green-800",
        variant === "warning" && "bg-yellow-100 text-yellow-800",
        className,
      )}
      {...props}
    />
  );
}

export { Badge };
