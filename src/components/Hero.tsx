"use client";

import { motion } from "framer-motion";
import AnimatedButton from "./ui/AnimatedButton";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export default function Hero() {
  return (
    <section
      id="home"
      className="relative flex min-h-screen items-center overflow-hidden pt-28"
    >
      {/* ambient blobs */}
      <div className="blob animate-float-slow h-[26rem] w-[26rem] bg-coral/15 -left-32 top-10" />
      <div className="blob animate-float-slower h-[22rem] w-[22rem] bg-teal/20 right-[-6rem] top-1/3" />

      <div className="relative mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-12 px-6 lg:grid-cols-2 lg:px-8">
        {/* Left — copy */}
        <div className="relative z-10">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="overline mb-5"
          >
            Digital marketing for Irish SMEs
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-display text-4xl font-bold leading-[1.12] text-ink sm:text-5xl lg:text-6xl"
          >
            We take the{" "}
            <span className="brand-accent">marketing headache</span> off
            your plate.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-6 max-w-lg text-lg leading-relaxed text-body"
          >
            Social media, paid ads, websites, and content — all handled by
            one local team, with no jargon and a clear focus on bringing more
            customers through your door.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            <AnimatedButton href="#contact" variant="primary">
              Get a Free Consultation
            </AnimatedButton>
            <AnimatedButton href="#services" variant="secondary" icon={false}>
              See Our Services
            </AnimatedButton>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-14 flex items-center gap-3 text-sm text-mid-grey"
          >
            <span className="h-px w-10 bg-mid-grey/40" />
            Based in Waterford, Ireland
          </motion.div>
        </div>

        {/* Right — hero image */}
        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
          {/* decorative accent ring behind image */}
          <div className="absolute -bottom-5 -right-5 h-full w-full rounded-[2rem] border-2 border-coral/25" />
          {/* teal dot accent */}
          <div className="absolute -top-4 -left-4 h-14 w-14 rounded-full bg-teal/30 blur-md" />

          {/* image container */}
          <div className="relative overflow-hidden rounded-[2rem] shadow-[0_32px_80px_-20px_rgba(44,44,42,0.32)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`${BASE_PATH}/hero-image.png`}
              alt="Irish Business Boosters team working with a local client"
              width={720}
              height={480}
              fetchPriority="high"
              className="h-auto w-full object-cover object-center"
              style={{ aspectRatio: "4/3" }}
            />
            {/* subtle gradient overlay at bottom for polish */}
            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-ink/10 to-transparent" />
          </div>

          {/* floating badge */}
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className="absolute -bottom-6 left-6 flex items-center gap-3 rounded-full bg-cream px-5 py-3 shadow-[0_8px_30px_-8px_rgba(44,44,42,0.22)]"
          >
            <span className="h-2.5 w-2.5 rounded-full bg-teal" />
            <span className="font-sans text-sm font-semibold text-ink">
              One team. Real results.
            </span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
