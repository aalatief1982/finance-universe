import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Menu,
  Home,
  PieChart,
  Scale,
  List,
  MessageSquare,
  Settings,
  User,
  Upload,
  BrainCircuit,
  Lock,
  ArrowLeftRight,
  Info,
  Mail,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { getNavItems } from "./route-constants";
import { isBetaActive, handleLockedFeatureClick } from "@/utils/beta-utils";
import { useLanguage } from "@/i18n/LanguageContext";

// Map of icon names to their components
const iconMap = {
  Home: Home,
  PieChart: PieChart,
  Scale: Scale,
  List: List,
  MessageSquare: MessageSquare,
  Settings: Settings,
  User: User,
  Upload: Upload,
  BrainCircuit: BrainCircuit,
  ArrowLeftRight: ArrowLeftRight,
  Info: Info,
  Mail: Mail,
};

interface MobileNavigationProps {
  currentPageTitle: string;
  onOpenFeedback?: () => void;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  currentPageTitle,
  onOpenFeedback,
}) => {
  const location = useLocation();
  const navItems = getNavItems();
  const [betaActive] = React.useState(() => isBetaActive());
  const baseMenuItemClass =
    "flex w-full items-center h-12 px-4 gap-3 rounded-md transition-colors";

  const renderMenuItemContent = (
    title: string,
    IconComponent?: LucideIcon,
    showLock?: boolean,
  ) => (
    <>
      <span className="w-6 h-6 flex items-center justify-center shrink-0">
        {IconComponent && <IconComponent size={20} />}
      </span>
      <span className="text-base font-medium flex items-center gap-1">
        {title}
        {showLock && <Lock className="h-3 w-3" />}
      </span>
    </>
  );

  return (
    <div className="md:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="h-11 w-11 p-0" aria-label="Open navigation menu">
            <Menu size={39} />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[300px] sm:w-[400px] max-h-[100dvh] overflow-y-auto">
          <SheetHeader className="border-b pb-4 mb-4">
            <SheetTitle className="flex items-center">
              <div className="h-8 w-8 rounded-lg bg-primary overflow-hidden flex items-center justify-center mr-2">
                <img
                  src="/xpensia-logo.png"
                  alt="Xpensia Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <span>{currentPageTitle}</span>
            </SheetTitle>
          </SheetHeader>

          <div className="py-2">
            <nav className="space-y-1">
              {navItems.map((item) => {
                const IconComponent = iconMap[item.icon as keyof typeof iconMap];

                // Handle Budget with beta lock
                if (item.title === "Budget") {
                  if (!betaActive) {
                    return (
                      <button
                        key={item.title}
                        type="button"
                        onClick={() => handleLockedFeatureClick('Budget')}
                        className={cn(
                          baseMenuItemClass,
                          "text-foreground hover:bg-accent"
                        )}
                      >
                        {renderMenuItemContent(item.title, IconComponent, true)}
                      </button>
                    );
                  }
                  // Beta active - render as normal link
                  return (
                    <SheetClose asChild key={item.title}>
                      <Link
                        to={item.path ?? "/budget"}
                        className={cn(
                          baseMenuItemClass,
                          location.pathname.startsWith("/budget")
                            ? "bg-primary/10 text-primary"
                            : "text-foreground"
                        )}
                      >
                        {renderMenuItemContent(item.title, IconComponent)}
                      </Link>
                    </SheetClose>
                  );
                }

                // Regular navigation items
                if (item.path === '__feedback__') {
                  return (
                    <SheetClose asChild key={item.title}>
                      <button
                        type="button"
                        onClick={onOpenFeedback}
                        className={cn(baseMenuItemClass, "hover:bg-accent text-foreground")}
                      >
                        {renderMenuItemContent(item.title, IconComponent)}
                      </button>
                    </SheetClose>
                  );
                }

                return (
                  <SheetClose asChild key={item.title}>
                    <Link
                      to={item.path ?? ""}
                      className={cn(
                        baseMenuItemClass,
                        location.pathname === item.path
                          ? "bg-primary/10 text-primary"
                          : "text-foreground"
                      )}
                      aria-current={location.pathname === item.path ? "page" : undefined}
                    >
                      {renderMenuItemContent(item.title, IconComponent)}
                    </Link>
                  </SheetClose>
                );
              })}
            </nav>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};
