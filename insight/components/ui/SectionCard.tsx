"use client";

import clsx from "clsx";
import { forwardRef, HTMLAttributes } from "react";

export interface SectionCardProps extends HTMLAttributes<HTMLDivElement> {
  shadow?: boolean;
}

const SectionCard = forwardRef<HTMLDivElement, SectionCardProps>(
  ({ className, shadow = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          "bg-card_bg dark:bg-card rounded-lg border border-border p-6",
          shadow && "shadow-sm",
          className
        )}
        {...props}
      />
    );
  }
);
SectionCard.displayName = "SectionCard";

export default SectionCard;
