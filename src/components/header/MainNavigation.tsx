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
  Lock,
} from "lucide-react";
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
  const [betaActive] = React.useState(() => isBetaActive());

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

          // Handle Budget with beta lock
          if (item.title === "Budget") {
            if (!betaActive) {
              return (
                <li key={item.title}>
                  <button
                    type="button"
                    onClick={() => {
                      logAnalyticsEvent('budget_menu_click', { beta_active: false });
                      handleLockedFeatureClick('Budget');
                    }}
                    className={cn(
                      "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      "text-muted-foreground hover:text-foreground hover:bg-accent"
                    )}
                    title={item.title}
                  >
                    {IconComponent && <IconComponent size={18} className="mr-2" />}
                    {item.title}
                    <Lock className="h-3 w-3 ml-1" />
                  </button>
                </li>
              );
            }
            // Beta active - render as normal link
            return (
              <li key={item.title}>
                <Link
                  to={item.path ?? "/budget"}
                  onClick={() => logAnalyticsEvent('budget_menu_click', { beta_active: true })}
                  className={cn(
                    "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    location.pathname.startsWith("/budget")
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                  title={item.title}
                >
                  {IconComponent && <IconComponent size={18} className="mr-2" />}
                  {item.title}
                </Link>
              </li>
            );
          }

          // Handle Import SMS with beta lock
          if (item.title === "Import SMS") {
            return (
              <li key={item.title}>
                <button
                  type="button"
                  onClick={() => {
                    logAnalyticsEvent('import_menu_click', { beta_active: betaActive });
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
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
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

          // Regular navigation items
          return (
            <li key={item.title}>
              <Link
                to={item.path ?? ""}
                className={cn(
                  "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  location.pathname === item.path
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
                title={item.title}
                aria-current={location.pathname === item.path ? "page" : undefined}
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
