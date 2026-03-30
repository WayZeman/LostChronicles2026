"use client"

import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion"

import { cn } from "@/lib/utils"
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react"

function Accordion({ className, ...props }: AccordionPrimitive.Root.Props) {
  return (
    <AccordionPrimitive.Root
      data-slot="accordion"
      className={cn("flex w-full flex-col", className)}
      {...props}
    />
  )
}

function AccordionItem({ className, ...props }: AccordionPrimitive.Item.Props) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn("not-last:border-b", className)}
      {...props}
    />
  )
}

function AccordionTrigger({
  className,
  children,
  ...props
}: AccordionPrimitive.Trigger.Props) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          "group/accordion-trigger relative flex min-h-12 w-full flex-1 touch-manipulation items-center rounded-lg border border-transparent py-2 text-sm font-medium outline-none transition-colors duration-200 hover:bg-white/[0.05] active:bg-white/[0.08] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:after:border-ring aria-disabled:pointer-events-none aria-disabled:opacity-50 sm:min-h-[3rem] sm:py-2.5",
          className
        )}
        {...props}
      >
        <span className="min-w-0 flex-1 break-words px-2.5 pr-[2.75rem] text-left leading-[1.4] sm:px-5 sm:pr-12 sm:leading-snug md:px-10">
          {children}
        </span>
        <span
          className="pointer-events-none absolute right-0.5 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center text-[var(--mc-text-muted)] sm:right-2 sm:size-9"
          aria-hidden
        >
          <ChevronDownIcon
            data-slot="accordion-trigger-icon"
            className="size-[1.125rem] shrink-0 opacity-80 group-aria-expanded/accordion-trigger:hidden sm:size-4"
          />
          <ChevronUpIcon
            data-slot="accordion-trigger-icon"
            className="hidden size-[1.125rem] shrink-0 opacity-80 group-aria-expanded/accordion-trigger:inline sm:size-4"
          />
        </span>
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
}

function AccordionContent({
  className,
  children,
  ...props
}: AccordionPrimitive.Panel.Props) {
  return (
    <AccordionPrimitive.Panel
      data-slot="accordion-content"
      className="overflow-hidden text-sm data-open:animate-accordion-down data-closed:animate-accordion-up"
      {...props}
    >
      <div
        className={cn(
          "h-(--accordion-panel-height) pt-0 pb-3 data-ending-style:h-0 data-starting-style:h-0 sm:pb-4 [&_a]:underline [&_a]:underline-offset-3 [&_p:not(:last-child)]:mb-3 md:[&_p:not(:last-child)]:mb-4",
          className
        )}
      >
        {children}
      </div>
    </AccordionPrimitive.Panel>
  )
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
