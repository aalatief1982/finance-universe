// Map routes to their corresponding titles
export const routeTitleMap: Record<string, string> = {
  "/": "Xpensia",
  "/home": "Xpensia",
  "/transactions": "Transactions",
  "/analytics": "Analytics",
  "/budget": "Budgets",
  "/process-sms": "Import SMS",
  "/settings": "Settings",
  "/profile": "Profile",
  "/sms-providers": "SMS Senders (Advanced, Legacy)",
  "/wireframes": "Wireframes",
  "/wireframes/dashboard": "Dashboard",
  "/wireframes/onboarding": "Onboarding",
  "/wireframes/add-transaction": "Add Transaction",
  "/wireframes/reports": "Reports",
  "/wireframes/settings": "Settings",
  "/wireframes/sms-provider": "SMS Provider",
  "/wireframes/sms-transaction": "SMS Transaction",
  "/import-transactions": "Smart Entry",
  "/review-sms-transactions": "Review Details",
  "/edit-transaction": "Transaction",
  "/budget/accounts": "Accounts & Balances",
  "/budget/set": "Set Budget",
  "/budget/report": "Budget vs Actual",
  "/budget/insights": "Suggestions & Insights",
  "/exchange-rates": "Exchange Rates",
  "/about": "About",
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
      path: "/budget",
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
      title: "Smart Entry",
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
      title: "Exchange Rates",
      path: "/exchange-rates",
      icon: "ArrowLeftRight",
      description: "Manage currency exchange rates",
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
    {
      title: "About",
      path: "/about",
      icon: "Info",
      description: "Learn about Xpensia",
      mobileOnly: true,
    },
  ];


  return items;
};
