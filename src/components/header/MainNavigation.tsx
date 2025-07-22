import React from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { getNavItems } from "./route-constants";
import {
  Home,
  PieChart,
  Scale,
  ListIcon,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { logAnalyticsEvent } from "@/utils/firebase-analytics";
import { isBetaActive, handleLockedFeatureClick } from "@/utils/beta-utils";

// Map of icon names to their components
const iconMap = {
  Home: Home,
  PieChart: PieChart,
  Scale: Scale,
  List: ListIcon,
  MessageSquare: MessageSquare,
  Settings: Settings,
  User: User,
  Upload: Upload,
  BrainCircuit: BrainCircuit,
};

export const MainNavigation: React.FC = () => {
  const location = useLocation();
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
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="hidden md:block ml-8"
    >
      <ul className="flex items-center space-x-1">
        {navItems.map((item) => {
          const IconComponent = iconMap[item.icon as keyof typeof iconMap];

          if (item.modal === "budget") {
            return (
              <li key={item.title}>
                <button
                  type="button"
                  onClick={() => {
                    logAnalyticsEvent('budget_menu_click', {
                      beta_active: betaActive
                    });
                    if (!betaActive) {
                      handleLockedFeatureClick('Budget');
                    } else {
                      setBudgetOpen(true);
                    }
                  }}
                  className={cn(
                    "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    location.pathname.startsWith("/budget")
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent",
                  )}
                  title={item.title}
                >
                  {IconComponent && (
                    <IconComponent size={18} className="mr-2" />
                  )}
                  {item.title}
                  {!betaActive && <Lock className="h-3 w-3 ml-1" />}
                </button>

                {betaActive && (
                  <Dialog open={budgetOpen} onOpenChange={setBudgetOpen}>
                    <DialogContent className="sm:max-w-xs">
                      <DialogHeader>
                        <DialogTitle>Select Budget Page</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-2 py-2">
                        {budgetItems.map((b) => (
                          <DialogClose asChild key={b.path}>
                            <Button
                              asChild
                              variant="outline"
                              className="justify-start"
                            >
                              <Link
                                to={b.path}
                                className="flex items-center gap-2"
                              >
                                {b.icon}
                                {b.name}
                              </Link>
                            </Button>
                          </DialogClose>
                        ))}
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </li>
            );
          }

          if (item.title === "Import SMS") {
            return (
              <li key={item.title}>
                <button
                  type="button"
                  onClick={() => {
                    logAnalyticsEvent('import_menu_click', {
                      beta_active: betaActive
                    });
                    if (!betaActive) {
                      handleLockedFeatureClick('Import SMS');
                    } else {
                      window.location.href = item.path ?? "";
                    }
                  }}
                  className={cn(
                    "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    location.pathname === item.path
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent",
                  )}
                  title={item.title}
                >
                  {IconComponent && <IconComponent size={18} className="mr-2" />}
                  {item.title}
                  {!betaActive && <Lock className="h-3 w-3 ml-1" />}
                </button>
              </li>
            );
          }

          return (
            <li key={item.title}>
              <Link
                to={item.path ?? ""}
                className={cn(
                  "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  location.pathname === item.path
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent",
                )}
                title={item.title}
                aria-current={
                  location.pathname === item.path ? "page" : undefined
                }
              >
                {IconComponent && <IconComponent size={18} className="mr-2" />}
                {item.title}
              </Link>
            </li>
          );
        })}
      </ul>
    </motion.nav>
  );
};
