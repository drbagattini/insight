"use client";

import * as Tabs from "@radix-ui/react-tabs";
import { ReactNode } from "react";

export interface Step {
  id: string;
  label: string;
  content: ReactNode;
}

interface WizardLayoutProps {
  steps: Step[];
  /** currently selected step id */
  value: string;
  /** callback when user changes step */
  onValueChange: (val: string) => void;
  /** whether to render the step header list; hidden when false */
  showList?: boolean;
}

/**
 * Generic wizard layout with horizontal stepper tabs.
 * Keeps visual hierarchy of steps and renders associated content
 * using Radix Tabs. Tailwind CSS is used for styling.
 */
export function WizardLayout({ steps, value, onValueChange, showList = true }: WizardLayoutProps) {
  return (
    <Tabs.Root
      value={value}
      onValueChange={onValueChange}
      orientation="horizontal"
      className="w-full"
    >
      {showList && (
      <Tabs.List className="flex mb-4 border-b border-gray-200 dark:border-gray-700">
        {steps.map((s, idx) => (
          <Tabs.Trigger
            key={s.id}
            value={s.id}
            className={
              "flex-1 py-2 text-sm font-medium text-center transition-colors focus:outline-none " +
              "data-[state=active]:font-semibold data-[state=active]:text-primary data-[state=active]:bg-primary/10 " +
              "data-[state=active]:border-b-2 data-[state=active]:border-primary " +
              "data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:text-primary " +
              "dark:data-[state=inactive]:text-gray-400 dark:data-[state=inactive]:hover:text-primary"
            }
          >
            {idx + 1}. {s.label}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
      )}

      {steps.map((s) => (
        <Tabs.Content key={s.id} value={s.id} className="w-full">
          {s.content}
        </Tabs.Content>
      ))}
    </Tabs.Root>
  );
}
