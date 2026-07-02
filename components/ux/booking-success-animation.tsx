"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";

export function BookingSuccessAnimation() {
  return (
    <div className="relative flex h-16 w-16 items-center justify-center">
      <motion.span
        className="absolute h-16 w-16 rounded-full bg-success/15"
        initial={{ scale: 0.65, opacity: 0 }}
        animate={{ scale: [0.65, 1.12, 1], opacity: [0, 1, 0.7] }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      />
      <motion.div
        className="relative flex h-12 w-12 items-center justify-center rounded-full bg-success text-white shadow-soft"
        initial={{ scale: 0.4, rotate: -18 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 420, damping: 24 }}
      >
        <motion.div initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.18, duration: 0.3 }}>
          <Check className="h-6 w-6" aria-hidden />
        </motion.div>
      </motion.div>
    </div>
  );
}
