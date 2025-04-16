// 📁 Path: src/context/transaction-builder.tsx (🆕 New)

import React, { createContext, useContext, useState } from "react";
import { TransactionDraft } from "../types/transaction";

interface BuilderContextType {
  draft: TransactionDraft | null;
  setDraft: (t: TransactionDraft | null) => void;
  clearDraft: () => void;
}

const TransactionBuilderContext = createContext<BuilderContextType | undefined>(undefined);

export const TransactionBuilderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [draft, setDraft] = useState<TransactionDraft | null>(null);

  const clearDraft = () => setDraft(null);

  return (
    <TransactionBuilderContext.Provider value={{ draft, setDraft, clearDraft }}>
      {children}
    </TransactionBuilderContext.Provider>
  );
};

export const useTransactionBuilder = () => {
  const ctx = useContext(TransactionBuilderContext);
  if (!ctx) throw new Error("useTransactionBuilder must be used within TransactionBuilderProvider");
  return ctx;
};
