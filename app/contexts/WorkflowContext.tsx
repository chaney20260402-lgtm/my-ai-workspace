// contexts/WorkflowContext.tsx
'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface WorkflowContextType {
  hasUnsavedChanges: boolean;
  setHasUnsavedChanges: (value: boolean) => void;
  saveWorkflow: (() => Promise<void>) | null;
  registerSaveWorkflow: (fn: () => Promise<void>) => void;
  clearSaveWorkflow: () => void;
  navigateAfterSave: (() => void) | null;
  registerNavigateAfterSave: (fn: () => void) => void;
  clearNavigateAfterSave: () => void;
}

const WorkflowContext = createContext<WorkflowContextType | undefined>(undefined);

export function WorkflowProvider({ children }: { children: ReactNode }) {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveWorkflowFn, setSaveWorkflowFn] = useState<(() => Promise<void>) | null>(null);
  const [navigateAfterSaveFn, setNavigateAfterSaveFn] = useState<(() => void) | null>(null);

  const registerSaveWorkflow = useCallback((fn: () => Promise<void>) => {
    setSaveWorkflowFn(() => fn);
  }, []);

  const clearSaveWorkflow = useCallback(() => {
    setSaveWorkflowFn(null);
  }, []);

  const registerNavigateAfterSave = useCallback((fn: () => void) => {
    setNavigateAfterSaveFn(() => fn);
  }, []);

  const clearNavigateAfterSave = useCallback(() => {
    setNavigateAfterSaveFn(null);
  }, []);

  const saveWorkflow = useCallback(async () => {
    if (saveWorkflowFn) {
      await saveWorkflowFn();
    }
  }, [saveWorkflowFn]);

  return (
    <WorkflowContext.Provider
      value={{
        hasUnsavedChanges,
        setHasUnsavedChanges,
        saveWorkflow,
        registerSaveWorkflow,
        clearSaveWorkflow,
        navigateAfterSave: navigateAfterSaveFn,
        registerNavigateAfterSave,
        clearNavigateAfterSave,
      }}
    >
      {children}
    </WorkflowContext.Provider>
  );
}

export function useWorkflow() {
  const context = useContext(WorkflowContext);
  if (!context) {
    throw new Error('useWorkflow must be used within a WorkflowProvider');
  }
  return context;
}