
import * as React from "react"
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible"

const Collapsible = CollapsiblePrimitive.Root

// Check for different property names - some versions use CollapsibleTrigger, others just use Trigger
const CollapsibleTrigger = CollapsiblePrimitive.CollapsibleTrigger || CollapsiblePrimitive.Trigger

// Check for different property names - some versions use CollapsibleContent, others just use Content
const CollapsibleContent = CollapsiblePrimitive.CollapsibleContent || CollapsiblePrimitive.Content

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
