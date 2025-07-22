import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LogOut,
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
  CreditCard,
  ClipboardList,
  Target,
  TrendingDown,
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
import { useToast } from "@/hooks/use-toast";
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
  const { user, logOut } = useUser();
  const navItems = getNavItems();
  const [budgetOpen, setBudgetOpen] = React.useState(false);
  const { toast } = useToast();
  const [betaActive, setBetaActive] = React.useState(() => isBetaActive());

  const budgetItems = [
    {
      name: "Accounts",
      path: "/budget/accounts",
      icon: <CreditCard size={18} />,
    },
    { name: "Budgets", path: "/budget/set", icon: <ClipboardList size={18} /> },
    { name: "Reports", path: "/budget/report", icon: <Target size={18} /> },
    {
      name: "Insights",
      path: "/budget/insights",
      icon: <TrendingDown size={18} />,
    },
  ];

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
                const IconComponent =
                  iconMap[item.icon as keyof typeof iconMap];

                if (item.modal === "budget") {
                  return (
                    <div key={item.title}>
                      <button
                        type="button"
                        onClick={() => {
                          if (!betaActive) {
                            handleLockedFeatureClick('Budget');
                          } else {
                            setBudgetOpen(!budgetOpen);
                          }
                        }}
                        className={cn(
                          "flex w-full items-center px-4 py-3 rounded-md transition-colors",
                          location.pathname.startsWith("/budget")
                            ? "bg-primary/10 text-primary"
                            : "text-foreground hover:bg-accent",
                        )}
                      >
                        {IconComponent && (
                          <IconComponent size={20} className="mr-3" />
                        )}
                        <div className="flex-1 text-left">
                          <p className="font-medium flex items-center">
                            {item.title}
                            {!betaActive && <Lock className="h-3 w-3 ml-1" />}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.description}
                          </p>
                        </div>
                        {betaActive && (
                          <span className="ml-auto">{budgetOpen ? "▾" : "▸"}</span>
                        )}
                      </button>

                      {betaActive && budgetOpen && (
                        <ul className="mt-1 ml-6 space-y-1">
                          {budgetItems.map((b) => (
                            <li key={b.path}>
                              <SheetClose asChild>
                                <Link
                                  to={b.path}
                                  className={cn(
                                    "flex items-center px-4 py-2 rounded-md text-sm transition-colors",
                                    location.pathname === b.path
                                      ? "bg-primary/10 text-primary"
                                      : "text-foreground hover:bg-accent",
                                  )}
                                >
                                  {b.icon}
                                  <span className="ml-2">{b.name}</span>
                                </Link>
                              </SheetClose>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                }

                if (item.title === "Import SMS") {
                  return (
                    <button
                      key={item.title}
                      type="button"
                      onClick={() => {
                        if (!betaActive) {
                          handleLockedFeatureClick('Import SMS');
                        } else {
                          window.location.href = item.path;
                        }
                      }}
                      className={cn(
                        "flex items-center px-4 py-3 rounded-md hover:bg-accent transition-colors w-full",
                        location.pathname === item.path
                          ? "bg-primary/10 text-primary"
                          : "text-foreground",
                      )}
                    >
                      {IconComponent && (
                        <IconComponent size={20} className="mr-3" />
                      )}
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

                return (
                  <SheetClose asChild key={item.title}>
                    <Link
                      to={item.path}
                      className={cn(
                        "flex items-center px-4 py-3 rounded-md hover:bg-accent transition-colors",
                        location.pathname === item.path
                          ? "bg-primary/10 text-primary"
                          : "text-foreground",
                      )}
                      aria-current={
                        location.pathname === item.path ? "page" : undefined
                      }
                    >
                      {IconComponent && (
                        <IconComponent size={20} className="mr-3" />
                      )}
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
