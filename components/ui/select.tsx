import * as React from "react";
import { cn } from "@/lib/utils";

// Basic interactive Select components (simple dropdown) to mimic shadcn API.
// Not feature-complete but supports value selection via SelectTrigger / SelectItem
// and calls `onValueChange` prop passed to <Select>.

type SelectProps = React.HTMLAttributes<HTMLDivElement>;
interface SelectTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}
interface SelectValueProps extends React.HTMLAttributes<HTMLSpanElement> { placeholder?: string }
type SelectContentProps = React.HTMLAttributes<HTMLDivElement>;
interface SelectItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}
interface SelectCtx {
  value: string;
  label: string;
  setValue: (v: string, lbl?: string) => void;
  open: boolean;
  setOpen: (o: boolean) => void;
}
const SelectContext = React.createContext<SelectCtx | null>(null);

const Select = React.forwardRef<HTMLDivElement, SelectProps & { defaultValue?: string; onValueChange?: (v: string) => void }>(({ className, children, defaultValue = "", onValueChange, ...props }, ref) => {
  const [value, setValue] = React.useState(defaultValue);
  const [label, setLabel] = React.useState("");
  const [open, setOpen] = React.useState(false);

  const handleSetValue = (v: string, lbl?: string) => {
    setValue(v);
    if (lbl) setLabel(lbl);
    onValueChange?.(v);
    setOpen(false);
  };

  return (
    <SelectContext.Provider value={{ value, label, setValue: handleSetValue, open, setOpen }}>
      <div ref={ref} className={cn("relative inline-block w-full", className)} {...props}>
        {children}
      </div>
    </SelectContext.Provider>
  );
});
Select.displayName = "Select";

const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(({ className, children, ...props }, ref) => {
  const ctx = React.useContext(SelectContext);
  if (!ctx) return null;
  return (
    <button
      ref={ref}
      type="button"
      onClick={() => ctx.setOpen(!ctx.open)}
      className={cn(
        "flex w-full items-center justify-between rounded border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
      <svg className="ml-2 h-4 w-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" />
      </svg>
    </button>
  );
});
SelectTrigger.displayName = "SelectTrigger";

const SelectValue = React.forwardRef<HTMLSpanElement, SelectValueProps>(({ className, placeholder = "Seleccionar...", ...props }, ref) => {
  const ctx = React.useContext(SelectContext);
  if (!ctx) return null;
  const label = ctx.value || placeholder;
  return (
    <span ref={ref} className={cn("truncate text-left", className)} {...props}>
      {label}
    </span>
  );
});
SelectValue.displayName = "SelectValue";

const SelectContent = React.forwardRef<HTMLDivElement, SelectContentProps>(({ className, children, ...props }, ref) => {
  const ctx = React.useContext(SelectContext);
  if (!ctx || !ctx.open) return null;
  return (
    <div
      ref={ref}
      className={cn(
        "absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white py-1 text-sm shadow-lg",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});
SelectContent.displayName = "SelectContent";

const SelectItem = React.forwardRef<HTMLButtonElement, SelectItemProps>(({ className, children, value, ...props }, ref) => {
  const ctx = React.useContext(SelectContext);
  if (!ctx) return null;
  const handleClick = () => ctx.setValue(value, typeof children === 'string' ? children : String(children));  return (
    <button
      ref={ref}
      type="button"
      onClick={handleClick}
      data-value={value}
      className={cn(
        "block w-full cursor-pointer select-none px-4 py-2 text-left hover:bg-gray-100 focus:bg-gray-100",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
});
SelectItem.displayName = "SelectItem";

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };
