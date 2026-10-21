"use client";

import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Lightbulb } from "lucide-react";

// Illustrative Health Check report (clearly labelled as a sample).
const SCORE = 64;
const AREAS = [
  { label: "Bio & profile", value: 8 },
  { label: "Posting rhythm", value: 4 },
  { label: "Reels", value: 5 },
  { label: "Easy to contact", value: 9 },
];

const R = 52;
const C = 2 * Math.PI * R;
const EASE = [0.16, 1, 0.3, 1] as const;

export default function ReportMockup() {
  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="absolute -bottom-5 -right-5 h-full w-full rounded-[2rem] border-2 border-coral/25" />
      <div className="absolute -left-6 -top-6 h-20 w-20 rounded-full bg-teal/30 blur-xl" />

      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.9, delay: 0.25, ease: EASE }}
        className="relative overflow-hidden rounded-[2rem] bg-white p-6 shadow-[0_32px_80px_-20px_rgba(44,44,42,0.32)] sm:p-7"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-mid-grey">Instagram Health Check</p>
            <p className="mt-1 font-display text-lg font-semibold text-ink">@yourbusiness</p>
          </div>
          <span className="rounded-full bg-cream px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-widest text-mid-grey">Sample</span>
        </div>

        <div className="mt-6 flex items-center gap-6">
          <div className="relative h-32 w-32 shrink-0">
            <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
              <circle cx="60" cy="60" r={R} fill="none" stroke="var(--color-cream-deep)" strokeWidth="10" />
              <motion.circle
                cx="60"
                cy="60"
                r={R}
                fill="none"
                stroke="var(--color-coral)"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={C}
                initial={{ strokeDashoffset: C }}
                animate={{ strokeDashoffset: C * (1 - SCORE / 100) }}
                transition={{ duration: 1.6, delay: 0.7, ease: EASE }}
              />
            </svg>
            <div className="absolute inset-0 grid place-items-center text-center">
              <div>
                <p className="font-display text-4xl font-bold leading-none text-ink">{SCORE}</p>
                <p className="mt-1 text-[0.65rem] font-semibold uppercase tracking-widest text-mid-grey">out of 100</p>
              </div>
            </div>
          </div>

          <ul className="flex flex-1 flex-col gap-3">
            {AREAS.map((a, i) => (
              <li key={a.label}>
                <div className="flex justify-between text-xs font-medium text-body">
                  <span>{a.label}</span>
                  <span className="text-mid-grey">{a.value}/10</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-cream-deep">
                  <motion.div
                    className={`h-full rounded-full ${a.value >= 7 ? "bg-teal-deep" : "bg-coral"}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${a.value * 10}%` }}
                    transition={{ duration: 1.1, delay: 0.9 + i * 0.12, ease: EASE }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 space-y-2.5 border-t border-ink/10 pt-5">
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 1.5 }}
            className="flex items-start gap-3 rounded-xl bg-coral/[0.07] p-3"
          >
            <AlertTriangle className="mt-0.5 shrink-0 text-coral" size={16} />
            <p className="text-sm text-ink">
              <b className="mr-1">Fix first:</b>3 weeks between posts. People check if you&apos;re still open.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 1.7 }}
            className="flex items-start gap-3 rounded-xl bg-teal/10 p-3"
          >
            <CheckCircle2 className="mt-0.5 shrink-0 text-teal-deep" size={16} />
            <p className="text-sm text-ink">
              <b className="mr-1">Working well:</b>booking link and phone right in your bio.
            </p>
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: [0, -6, 0] }}
        transition={{ opacity: { delay: 2, duration: 0.5 }, y: { delay: 2, repeat: Infinity, duration: 4, ease: "easeInOut" } }}
        className="absolute -bottom-6 left-6 flex items-center gap-2.5 rounded-full bg-ink px-5 py-3 shadow-[0_8px_30px_-8px_rgba(44,44,42,0.4)]"
      >
        <Lightbulb className="text-teal" size={16} />
        <span className="text-sm font-semibold text-cream">+ 5 post ideas made for you</span>
      </motion.div>
    </div>
  );
}
