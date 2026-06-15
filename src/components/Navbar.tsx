"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, Menu, X } from "lucide-react";

const LINKS = [
  { href: "#about", label: "About" },
  { href: "#services", label: "Services" },
  { href: "#why-us", label: "Why Us" },
  { href: "#contact", label: "Contact" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
  }, [open]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <motion.div
        animate={{
          backgroundColor: scrolled
            ? "rgba(241,239,232,0.85)"
            : "rgba(241,239,232,0)",
          boxShadow: scrolled
            ? "0 8px 30px -12px rgba(44,44,42,0.18)"
            : "0 0 0 rgba(0,0,0,0)",
        }}
        transition={{ duration: 0.3 }}
        className="backdrop-blur-md"
      >
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 lg:px-8">
          <a href="#home" className="flex items-center gap-2">
            <TrendingUp className="text-coral" size={24} strokeWidth={2.5} />
            <span className="font-display text-xl leading-none">
              <span className="brand-accent">Irish</span>{" "}
              <span className="font-bold text-ink">Business Boosters</span>
            </span>
          </a>

          <div className="hidden items-center gap-9 lg:flex">
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="font-sans text-sm font-medium text-ink/80 transition-colors hover:text-coral"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="hidden lg:block">
            <motion.a
              href="#contact"
              whileHover={{ y: -2, scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="inline-flex items-center rounded-full bg-coral px-5 py-2.5 font-sans text-sm font-semibold text-cream shadow-[0_8px_24px_-8px_rgba(216,90,48,0.55)] transition-colors hover:bg-coral-hover"
            >
              Get a Free Consultation
            </motion.a>
          </div>

          <button
            aria-label="Toggle menu"
            onClick={() => setOpen((v) => !v)}
            className="grid h-10 w-10 place-items-center rounded-full border border-ink/15 text-ink lg:hidden"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </nav>
      </motion.div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden border-t border-ink/10 bg-cream/95 backdrop-blur-md lg:hidden"
          >
            <div className="flex flex-col gap-1 px-6 py-6">
              {LINKS.map((link, i) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-lg px-3 py-3 font-display text-2xl text-ink transition-colors hover:bg-cream-deep hover:text-coral"
                >
                  {link.label}
                </motion.a>
              ))}
              <a
                href="#contact"
                onClick={() => setOpen(false)}
                className="mt-3 inline-flex items-center justify-center rounded-full bg-coral px-5 py-3.5 font-sans text-sm font-semibold text-cream"
              >
                Get a Free Consultation
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
