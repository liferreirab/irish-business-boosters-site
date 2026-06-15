"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";

interface AnimatedButtonProps {
  href: string;
  children: ReactNode;
  variant?: Variant;
  className?: string;
  icon?: boolean;
}

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-coral text-cream shadow-[0_8px_24px_-8px_rgba(216,90,48,0.55)] hover:bg-coral-hover",
  secondary:
    "bg-transparent text-ink border-2 border-ink hover:bg-ink hover:text-cream",
  ghost:
    "bg-cream text-coral border-2 border-coral hover:bg-coral hover:text-cream",
};

export default function AnimatedButton({
  href,
  children,
  variant = "primary",
  className = "",
  icon = true,
}: AnimatedButtonProps) {
  return (
    <motion.a
      href={href}
      whileHover={{ y: -3, scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      className={`group inline-flex items-center gap-2 rounded-full px-7 py-3.5 font-sans text-sm font-semibold tracking-wide transition-colors duration-300 ${variantStyles[variant]} ${className}`}
    >
      <span>{children}</span>
      {icon && (
        <span className="relative grid h-4 w-4 place-items-center overflow-hidden">
          <ArrowRight
            size={16}
            className="absolute transition-transform duration-300 ease-out group-hover:translate-x-6 group-hover:-translate-y-6"
          />
          <ArrowRight
            size={16}
            className="absolute -translate-x-6 translate-y-6 transition-transform duration-300 ease-out group-hover:translate-x-0 group-hover:translate-y-0"
          />
        </span>
      )}
    </motion.a>
  );
}
