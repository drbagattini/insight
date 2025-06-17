import * as React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";

export const Accordion = AccordionPrimitive.Root;

interface AccordionItemProps extends AccordionPrimitive.AccordionItemProps {}
export const AccordionItem = React.forwardRef<
  HTMLDivElement,
  AccordionItemProps
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={"border-b border-border " + (className ?? "")}
    {...props}
  />
));
AccordionItem.displayName = "AccordionItem";

interface AccordionTriggerProps extends AccordionPrimitive.AccordionTriggerProps {}
export const AccordionTrigger = React.forwardRef<
  HTMLButtonElement,
  AccordionTriggerProps
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={
        "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180 " +
        (className ?? "")
      }
      {...props}
    >
      {children}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="h-4 w-4 transition-transform duration-200"
      >
        <path
          fillRule="evenodd"
          d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.25 8.27a.75.75 0 01-.02-1.06z"
          clipRule="evenodd"
        />
      </svg>
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
));
AccordionTrigger.displayName = "AccordionTrigger";

interface AccordionContentProps extends AccordionPrimitive.AccordionContentProps {}
export const AccordionContent = React.forwardRef<
  HTMLDivElement,
  AccordionContentProps
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className={
      "overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down " +
      (className ?? "")
    }
    {...props}
  >
    <div className="pt-0 pb-4">{children}</div>
  </AccordionPrimitive.Content>
));
AccordionContent.displayName = "AccordionContent";
