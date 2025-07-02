// Map routes to their corresponding titles
export const routeTitleMap: Record<string, string> = {
  "/": "Xpensia",
  "/home": "Xpensia",
  "/transactions": "Transactions",
  "/analytics": "Analytics",
  "/process-sms": "Import SMS",
  "/settings": "Settings",
  "/profile": "Profile",
  "/sms-providers": "SMS Providers",
  "/wireframes": "Wireframes",
  "/wireframes/dashboard": "Dashboard",
  "/wireframes/onboarding": "Onboarding",
  "/wireframes/add-transaction": "Add Transaction",
  "/wireframes/reports": "Reports",
  "/wireframes/settings": "Settings",
  "/wireframes/sms-provider": "SMS Provider",
  "/wireframes/sms-transaction": "SMS Transaction",
  "/import-transactions": "Paste & Parse",
  "/review-sms-transactions": "Review Details",
  "/edit-transaction": "Transaction",
  "/budget/accounts": "Accounts & Balances",
  "/budget/set": "Set Budget",
  "/budget/report": "Budget vs Actual",
  "/budget/insights": "Suggestions & Insights",
  "/dev/template-health": "Template Health",
  "/dev/template-failures": "Template Failures",
};

// Navigation items that appear in the header
export const getNavItems = () => {
  const items = [
    {
      title: "Home",
      path: "/home",
      icon: "Home",
      description: "Overview of your finances",
    },
    {
      title: "Analytics",
      path: "/analytics",
      icon: "PieChart",
      description: "Detailed reports and charts",
    },
    {
      title: "Budget",
      // Opens a modal instead of linking directly
      modal: "budget",
      icon: "Scale",
      description: "Manage budgets and accounts",
    },
    {
      title: "Transactions",
      path: "/transactions",
      icon: "List",
      description: "View and manage your transactions",
    },
    {
      title: "Paste & Parse",
      path: "/import-transactions",
      icon: "Upload",
      description: "Import transactions from SMS or paste",
    },
    {
      title: "Import SMS",
      path: "/process-sms",
      icon: "MessageSquare",
      description: "Import transactions from SMS",
    },
    {
      title: "Settings",
      path: "/settings",
      icon: "Settings",
      description: "Configure app preferences",
    },
    {
      title: "Profile",
      path: "/profile",
      icon: "User",
      description: "Manage your profile",
    },
  ];

  if (process.env.NODE_ENV === 'development') {
    items.push({
      title: "Template Health",
      path: "/dev/template-health",
      icon: "Activity",
      description: "Template usage metrics",
    });
    items.push({
      title: "Template Failures",
      path: "/dev/template-failures",
      icon: "Bug",
      description: "Failed template logs",
    });
  }

  return items;
};
