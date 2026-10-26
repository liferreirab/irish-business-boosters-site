"use client";

import Reveal from "./ui/Reveal";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const story = [
  "My journey in social media started seven years ago, and since then, I’ve had the opportunity to help businesses grow, connect with their audiences and make more of their online presence.",
  "Living in Ireland has given me a different perspective on running a business, and I’ve seen how challenging it can be for small business owners to juggle everything — especially marketing.",
  "That’s why I created Irish Business Boosters: to help small businesses across Ireland show up online with more confidence, a clearer strategy and content that actually connects with people.",
  "I believe good marketing doesn’t have to be complicated, overwhelming or out of reach for small businesses.",
  "Behind IBB, there’s a real person who cares about helping your business move forward — and I’m so glad you’re here! 💛",
];

export default function MeetEli() {
  return (
    <section
      id="meet-eli"
      className="relative overflow-hidden bg-cream-deep/40 py-28 lg:py-36"
    >
      <div className="absolute -right-40 top-1/3 h-[26rem] w-[26rem] rounded-full bg-coral/10 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <Reveal y={36}>
              <div className="relative mx-auto max-w-sm lg:max-w-none">
                <div className="absolute -bottom-5 -left-5 h-full w-full rounded-[2rem] border-2 border-coral/25" />
                <div className="absolute -top-4 -right-4 h-14 w-14 rounded-full bg-teal/30 blur-md" />
                <div className="relative overflow-hidden rounded-[2rem] shadow-[0_32px_80px_-20px_rgba(44,44,42,0.32)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`${BASE_PATH}/eli.jpg`}
                    alt="Eli, founder of Irish Business Boosters"
                    width={960}
                    height={1440}
                    loading="lazy"
                    className="h-auto w-full object-cover"
                    style={{ aspectRatio: "2/3" }}
                  />
                </div>
              </div>
            </Reveal>
          </div>

          <div className="lg:col-span-7">
            <Reveal>
              <p className="overline mb-4">Meet the Founder</p>
              <h2 className="font-display text-3xl font-bold leading-tight text-ink sm:text-4xl lg:text-5xl">
                Hi, I&apos;m <span className="brand-accent">Eli</span> 👋
              </h2>
              <p className="mt-4 font-display text-xl font-semibold text-body">
                The person behind Irish Business Boosters.
              </p>
            </Reveal>

            {story.map((paragraph, i) => (
              <Reveal key={i} delay={0.1 + i * 0.05}>
                <p className="mt-5 max-w-xl text-lg leading-relaxed text-body">
                  {paragraph}
                </p>
              </Reveal>
            ))}

            <Reveal delay={0.4}>
              <p className="mt-8 max-w-xl border-t border-ink/10 pt-6 font-display text-lg font-semibold text-ink">
                Thanks for being part of this journey.
              </p>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
