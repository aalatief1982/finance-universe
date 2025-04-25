
import * as React from "react"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

interface SidebarContextProps {
  side: "left" | "right"
  isMobile: boolean
  closeSidebar: () => void
}

const SidebarContext = React.createContext<SidebarContextProps>({
  side: "left",
  isMobile: false,
  closeSidebar: () => {},
})

export const useSidebarContext = () => React.useContext(SidebarContext)

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: "left" | "right"
  isMobile?: boolean
  trigger?: React.ReactNode
  onClose?: () => void
}

const Sidebar = ({
  side = "left",
  isMobile = false,
  trigger,
  children,
  onClose,
  ...props
}: SidebarProps) => {
  const [isOpen, setIsOpen] = React.useState(false)

  const closeSidebar = () => {
    setIsOpen(false)
    onClose?.()
  }

  return (
    <SidebarContext.Provider
      value={{
        side,
        isMobile,
        closeSidebar,
      }}
    >
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        {trigger ? (
          <SheetTrigger asChild>{trigger}</SheetTrigger>
        ) : null}
        {children}
      </Sheet>
    </SidebarContext.Provider>
  )
}
Sidebar.displayName = "Sidebar"

const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { side, isMobile } = useSidebarContext()

  return (
    <Sheet>
      <SheetContent
        ref={ref}
        data-sidebar={side}
        data-mobile={isMobile ? 'true' : 'false'}
        className={cn(
          "flex h-full flex-col border-r bg-background p-0",
          className
        )}
        {...props}
      />
    </Sheet>
  )
})
SidebarContent.displayName = "SidebarContent"

const SidebarTrigger = SheetTrigger
const SidebarClose = SheetClose

export { Sidebar, SidebarContent, SidebarTrigger, SidebarClose }
