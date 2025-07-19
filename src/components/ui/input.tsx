import * as React from "react"
import { Check, X } from "lucide-react"

import { cn } from "@/lib/utils"

export interface InputProps extends React.ComponentProps<"input"> {
  isAutoFilled?: boolean
  state?: 'default' | 'error' | 'success' | 'loading'
  showStateIcon?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, isAutoFilled, state = 'default', showStateIcon = false, ...props }, ref) => {
    const getStateClasses = () => {
      switch (state) {
        case 'error':
          return "border-destructive focus-visible:ring-destructive"
        case 'success':
          return "border-success focus-visible:ring-success"
        case 'loading':
          return "opacity-75"
        default:
          return ""
      }
    }

    const StateIcon = () => {
      if (!showStateIcon || state === 'default' || state === 'loading') return null
      
      return (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          {state === 'success' && <Check size={16} className="text-success" />}
          {state === 'error' && <X size={16} className="text-destructive" />}
        </div>
      )
    }

    return (
      <div className="relative">
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm transition-all duration-200",
            isAutoFilled && "border-success bg-success/10 dark:bg-success/10",
            getStateClasses(),
            showStateIcon && (state === 'success' || state === 'error') && "pr-10",
            className
          )}
          ref={ref}
          {...props}
        />
        <StateIcon />
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
