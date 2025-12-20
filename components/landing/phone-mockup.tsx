"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PhoneMockupProps {
  className?: string;
}

export function PhoneMockup({ className }: PhoneMockupProps) {
  return (
    <motion.div
      className={cn("relative z-20", className)}
      initial={{ opacity: 0, scale: 0.8, rotateY: -15 }}
      animate={{ opacity: 1, scale: 1, rotateY: 0 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      style={{
        perspective: "1000px",
        transformStyle: "preserve-3d",
      }}
    >
      {/* Floating animation */}
      <motion.div
        animate={{
          y: [0, -20, 0],
          rotateX: [0, 5, 0],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="relative"
        style={{
          transformStyle: "preserve-3d",
        }}
      >
        {/* Phone frame */}
        <div
          className="relative w-[280px] h-[560px] mx-auto rounded-[3rem] bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-2 shadow-2xl"
          style={{
            boxShadow:
              "0 20px 60px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(255, 255, 255, 0.1)",
            backgroundColor: "rgb(24, 24, 27)",
          }}
        >
          {/* Notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl z-10" />

          {/* Screen */}
          <div
            className="relative w-full h-full rounded-[2.5rem] bg-zinc-950 overflow-hidden"
            style={{ backgroundColor: "rgb(9, 9, 11)" }}
          >
            {/* Screen content mockup */}
            <div className="absolute inset-0 p-6 flex flex-col gap-4">
              {/* Status bar */}
              <div className="flex justify-between items-center text-white/60 text-xs">
                <span>9:41</span>
                <div className="flex gap-1">
                  <div className="w-4 h-2 border border-white/60 rounded-sm" />
                  <div className="w-6 h-2 border border-white/60 rounded-sm" />
                </div>
              </div>

              {/* App header */}
              <div className="mt-4">
                <div className="h-8 bg-emerald-500/20 rounded-lg mb-4" />
                <div className="h-4 bg-white/10 rounded w-2/3" />
              </div>

              {/* Cards */}
              <div className="flex flex-col gap-3 mt-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-20 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-xl border border-emerald-500/20 backdrop-blur-sm"
                  >
                    <div className="p-3 flex items-center justify-between">
                      <div className="flex flex-col gap-2">
                        <div className="h-2 bg-emerald-400/30 rounded w-24" />
                        <div className="h-2 bg-white/20 rounded w-16" />
                      </div>
                      <div className="h-6 w-6 bg-emerald-500/30 rounded" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom gradient overlay */}
              <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-zinc-900 to-transparent" />
            </div>

            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none rounded-[2.5rem]" />
          </div>

          {/* Home indicator */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/20 rounded-full" />
        </div>
      </motion.div>
    </motion.div>
  );
}
