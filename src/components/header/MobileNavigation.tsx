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
} from "lucide-react";
import { useUser } from "@/context/UserContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
};

interface MobileNavigationProps {
  currentPageTitle: string;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  currentPageTitle,
}) => {
  const location = useLocation();
  const { user } = useUser();
  const navItems = getNavItems();
  const [betaActive] = React.useState(() => isBetaActive());

  return (
    <div className="md:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Open navigation menu">
            <Menu size={28} />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[300px] sm:w-[400px] overflow-y-auto">
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
            {user && (
              <div className="flex items-center space-x-3 p-4 mb-4 bg-muted/50 rounded-lg">
                <Avatar>
                  <AvatarImage
                    src={user.avatar || "/placeholder.svg"}
                    alt={user.fullName || "User"}
                  />
                  <AvatarFallback>
                    {user.fullName ? user.fullName.charAt(0) : "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">
                    {user.fullName || "User"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {user.email || user.phone || "No contact info"}
                  </p>
                </div>
              </div>
            )}

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
                          "flex w-full items-center px-4 py-3 rounded-md transition-colors",
                          "text-foreground hover:bg-accent"
                        )}
                      >
                        {IconComponent && <IconComponent size={20} className="mr-3" />}
                        <div className="flex-1 text-left">
                          <p className="font-medium flex items-center">
                            {item.title}
                            <Lock className="h-3 w-3 ml-1" />
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.description}
                          </p>
                        </div>
                      </button>
                    );
                  }
                  // Beta active - render as normal link
                  return (
                    <SheetClose asChild key={item.title}>
                      <Link
                        to={item.path ?? "/budget"}
                        className={cn(
                          "flex items-center px-4 py-3 rounded-md hover:bg-accent transition-colors",
                          location.pathname.startsWith("/budget")
                            ? "bg-primary/10 text-primary"
                            : "text-foreground"
                        )}
                      >
                        {IconComponent && <IconComponent size={20} className="mr-3" />}
                        <div>
                          <p className="font-medium">{item.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.description}
                          </p>
                        </div>
                      </Link>
                    </SheetClose>
                  );
                }

                // Handle Import SMS with beta lock
                if (item.title === "Import SMS") {
                  return (
                    <button
                      key={item.title}
                      type="button"
                      onClick={() => {
                        if (!betaActive) {
                          handleLockedFeatureClick('Import SMS');
                        } else {
                          window.location.href = item.path ?? "";
                        }
                      }}
                      className={cn(
                        "flex items-center px-4 py-3 rounded-md hover:bg-accent transition-colors w-full",
                        location.pathname === item.path
                          ? "bg-primary/10 text-primary"
                          : "text-foreground"
                      )}
                    >
                      {IconComponent && <IconComponent size={20} className="mr-3" />}
                      <div>
                        <p className="font-medium flex items-center">
                          {item.title}
                          {!betaActive && <Lock className="h-3 w-3 ml-1" />}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                    </button>
                  );
                }

                // Regular navigation items
                return (
                  <SheetClose asChild key={item.title}>
                    <Link
                      to={item.path ?? ""}
                      className={cn(
                        "flex items-center px-4 py-3 rounded-md hover:bg-accent transition-colors",
                        location.pathname === item.path
                          ? "bg-primary/10 text-primary"
                          : "text-foreground"
                      )}
                      aria-current={location.pathname === item.path ? "page" : undefined}
                    >
                      {IconComponent && <IconComponent size={20} className="mr-3" />}
                      <div>
                        <p className="font-medium">{item.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
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
