"use client";

import { useEffect } from "react";
import { DemoProvider, useDemo } from "@/components/demo/demo-provider";
import { DemoOnboarding } from "@/components/demo/demo-onboarding";
import { DemoDashboard } from "@/components/demo/demo-dashboard";
import { DemoModal } from "@/components/demo/demo-modal";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";

function DemoContent() {
  const { currentStep, isRunning, setIsRunning } = useDemo();

  useEffect(() => {
    // Запускаем демо автоматически при монтировании
    setIsRunning(true);
  }, [setIsRunning]);

  const stepComponents = {
    onboarding: <DemoOnboarding />,
    dashboard: <DemoDashboard />,
    complete: <DemoModal />,
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Overlay для блокировки взаимодействия */}
      {isRunning && <div className="fixed inset-0 z-50 pointer-events-none" />}

      {/* Контент демо */}
      <AnimatePresence mode="wait">
        {currentStep === "onboarding" && (
          <motion.div
            key="onboarding"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {stepComponents.onboarding}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Дашборд показывается после онбординга и остается видимым */}
      {(currentStep === "dashboard" || currentStep === "complete") && (
        <motion.div
          key="dashboard"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: currentStep === "complete" ? 0.3 : 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {stepComponents.dashboard}
        </motion.div>
      )}

      {/* Модалка показывается поверх дашборда */}
      {currentStep === "complete" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {stepComponents.complete}
        </div>
      )}
    </div>
  );
}

export default function DemoPage() {
  return (
    <DemoProvider>
      <DemoContent />
    </DemoProvider>
  );
}
