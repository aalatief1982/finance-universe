// Map routes to their corresponding translation keys
export const routeTitleKeyMap: Record<string, string> = {
  "/": "Xpensia",
  "/home": "Xpensia",
  "/transactions": "nav.transactions",
  "/analytics": "nav.analytics",
  "/budget": "budget.budgets",
  "/process-sms": "nav.importSms",
  "/settings": "nav.settings",
  "/profile": "nav.profile",
  "/sms-providers": "nav.smsProviders",
  "/import-transactions": "nav.smartEntry",
  "/review-sms-transactions": "nav.reviewDetails",
  "/sms-review": "nav.smsReview",
  "/edit-transaction": "nav.transaction",
  "/budget/accounts": "nav.accounts",
  "/budget/set": "nav.setBudget",
  "/budget/report": "nav.budgetReport",
  "/budget/insights": "nav.budgetInsights",
  "/exchange-rates": "nav.exchangeRates",
  "/about": "nav.about",
};

// For backward compatibility - returns translated titles
export const getRouteTitleMap = (t: (key: string) => string): Record<string, string> => {
  const result: Record<string, string> = {};
  for (const [path, key] of Object.entries(routeTitleKeyMap)) {
    result[path] = key === 'Xpensia' ? 'Xpensia' : t(key);
  }
  return result;
};

// Navigation items that appear in the header
export const getNavItems = (t?: (key: string) => string) => {
  const tr = t || ((key: string) => key);
  const items = [
    {
      title: tr("nav.home"),
      path: "/home",
      icon: "Home",
      description: tr("nav.desc.home"),
    },
    {
      title: tr("nav.smartEntry"),
      path: "/import-transactions",
      icon: "Upload",
      description: tr("nav.desc.smartEntry"),
    },
    {
      title: tr("nav.transactions"),
      path: "/transactions",
      icon: "List",
      description: tr("nav.desc.transactions"),
    },
    {
      title: tr("nav.analytics"),
      path: "/analytics",
      icon: "PieChart",
      description: tr("nav.desc.analytics"),
    },
    {
      title: tr("nav.budget"),
      path: "/budget",
      icon: "Scale",
      description: tr("nav.desc.budget"),
    },
    {
      title: tr("nav.smsReview"),
      path: "/sms-review",
      icon: "Mail",
      description: tr("nav.desc.smsReview"),
      mobileOnly: true,
    },
    {
      title: tr("nav.exchangeRates"),
      path: "/exchange-rates",
      icon: "ArrowLeftRight",
      description: tr("nav.desc.exchangeRates"),
    },
    {
      title: tr("nav.settings"),
      path: "/settings",
      icon: "Settings",
      description: tr("nav.desc.settings"),
    },
    {
      title: tr("nav.feedback"),
      path: "__feedback__",
      icon: "Mail",
      description: tr("nav.desc.feedback"),
      mobileOnly: true,
    },
    {
      title: tr("nav.profile"),
      path: "/profile",
      icon: "User",
      description: tr("nav.desc.profile"),
    },
    {
      title: tr("nav.about"),
      path: "/about",
      icon: "Info",
      description: tr("nav.desc.about"),
      mobileOnly: true,
    },
  ];

  return items;
};
