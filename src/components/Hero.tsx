"use client";

import { motion } from "framer-motion";
import AnimatedButton from "./ui/AnimatedButton";
import HeroScene from "./HeroScene";

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

        {/* 3D scene */}
        <div className="relative h-[22rem] lg:h-[32rem]">
          <HeroScene />
        </div>
      </div>
    </section>
  );
}
