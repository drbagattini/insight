// shadcn Checkbox – minimal and typesafe
import * as React from "react";
import { cn } from "@/lib/utils";

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  /** Fired with new checked state */
  onCheckedChange?: (checked: boolean) => void;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, onCheckedChange, onChange, ...rest }, ref) => {
    const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
      onChange?.(e);
      onCheckedChange?.(e.target.checked);
    };

    return (
      <input
        {...rest}
        ref={ref}
        type="checkbox"
        onChange={handleChange}
        className={cn(
          "h-4 w-4 shrink-0 rounded border border-gray-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
      />
    );
  }
);
Checkbox.displayName = "Checkbox";

export default Checkbox;




