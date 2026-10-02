"use client";

import { useState, FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, AlertTriangle, Info, Loader2 } from "lucide-react";
import { trackPixel } from "@/lib/metaPixel";

// Supabase Edge Function: saves the lead, runs the automatic check, emails us.
const CHECK_ENDPOINT = "https://tbgxeqauakiydzwmqyyf.supabase.co/functions/v1/check";

type Ask = "website" | "business";

type KeywordCopy = {
  overline: string;
  title: string;
  intro: string;
  ask: Ask;
  businessLabel?: string;
  automatic: boolean;
  loading?: string;
};

const COPY: Record<string, KeywordCopy> = {
  sydney: {
    overline: "Free website check",
    title: "Is your website really yours?",
    intro: "Pop in your website and we'll check who it's registered with, when it renews and a few things customers notice straight away. Takes about 20 seconds.",
    ask: "website",
    automatic: true,
    loading: "Checking your website and domain…",
  },
  phone: {
    overline: "The 3-second phone test",
    title: "Does your website pass the phone test?",
    intro: "Pop in your website and we'll run it through Google's own phone test. Takes up to a minute.",
    ask: "website",
    automatic: true,
    loading: "Running the phone test… this can take up to a minute.",
  },
  open: {
    overline: "Free Google check",
    title: "What is Google telling people about you?",
    intro: "Tell us your business name and town. We'll check your Google listing (opening hours, status, photos, reviews) and email you what we find.",
    ask: "business",
    automatic: false,
  },
  mick: {
    overline: "Free online check",
    title: "What do people see when they look you up?",
    intro: "Tell us your business name and town. We'll search for you like a customer would and email you what they see.",
    ask: "business",
    automatic: false,
  },
  tag: {
    overline: "Free online check",
    title: "Can people tag your business?",
    intro: "Tell us your business name and town. We'll check whether people can find and tag you when they recommend you, and email you what we find.",
    ask: "business",
    automatic: false,
  },
  xmas: {
    overline: "Free page check",
    title: "When did your page last say something?",
    intro: "Tell us your business name and town. We'll have a look at what customers see on your pages and email you what we find.",
    ask: "business",
    automatic: false,
  },
  sunday: {
    overline: "5 free post ideas",
    title: "Posts that take 10 minutes, not a Sunday",
    intro: "Tell us what kind of business you have and where. We'll email you 5 post ideas you can use this week.",
    ask: "business",
    businessLabel: "What kind of business is it?",
    automatic: false,
  },
  roll: {
    overline: "3 free post ideas",
    title: "Turn your camera roll into posts",
    intro: "Tell us what kind of work you do. We'll email you 3 post ideas made from photos you probably already have.",
    ask: "business",
    businessLabel: "What kind of work do you do?",
    automatic: false,
  },
  reply: {
    overline: "Free message check",
    title: "How fast do you reply?",
    intro: "Tell us your business page name. We'll check how your messages are set up and email you how to make sure you never miss a customer again.",
    ask: "business",
    businessLabel: "Your business page name",
    automatic: false,
  },
  hire: {
    overline: "Free Instagram check",
    title: "What is your Instagram missing?",
    intro: "Tell us your business's Instagram. We'll have a proper look (bio, posts, how easy it is to contact you) and email you exactly what's missing and how to fix it.",
    ask: "business",
    businessLabel: "Your Instagram @ (or business name)",
    automatic: false,
  },
  grid: {
    overline: "Your own 6×5 grid",
    title: "30 post ideas made for your business",
    intro: "Not a café, salon or trade? Tell us what you do and where. We'll fill in a 6×5 grid just for you and email it over.",
    ask: "business",
    businessLabel: "What kind of business is it?",
    automatic: false,
  },
};

const DEFAULT_COPY: KeywordCopy = {
  overline: "Free online check",
  title: "How does your business look online?",
  intro: "Tell us your business name and town and we'll email you an honest look at what customers see.",
  ask: "business",
  automatic: false,
};

type Finding = { level: "good" | "warn" | "info"; title: string; detail: string };

type State =
  | { step: "form" }
  | { step: "checking" }
  | { step: "results"; leadId: string; automatic: boolean; findings: Finding[] }
  | { step: "call-sent" };

export default function CheckForm() {
  const params = useSearchParams();
  const keyword = (params.get("k") ?? "").toLowerCase();
  const channel = params.get("ch") ?? "ig";
  const copy = COPY[keyword] ?? DEFAULT_COPY;

  const [state, setState] = useState<State>({ step: "form" });
  const [error, setError] = useState<string | null>(null);
  const [sendingCall, setSendingCall] = useState(false);
  const [firstName, setFirstName] = useState("");

  const handleCheck = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const data = Object.fromEntries(new FormData(e.currentTarget));
    setFirstName(String(data.name ?? "").split(" ")[0]);
    setState({ step: "checking" });
    try {
      const res = await fetch(CHECK_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, action: "check", keyword, ch: channel }),
      });
      const body = await res.json();
      if (!res.ok || !body.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
      trackPixel("Lead", { content_name: "check_form", keyword });
      setState({ step: "results", leadId: body.leadId, automatic: body.automatic, findings: body.findings ?? [] });
    } catch {
      setState({ step: "form" });
      setError("Sorry, something went wrong. Please check your details and try again.");
    }
  };

  const handleCall = async (e: FormEvent<HTMLFormElement>, leadId: string) => {
    e.preventDefault();
    if (sendingCall) return;
    setSendingCall(true);
    const preference = String(new FormData(e.currentTarget).get("preference") ?? "");
    try {
      const res = await fetch(CHECK_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "call", leadId, preference }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      trackPixel("Schedule", { content_name: "check_call_request" });
      setState({ step: "call-sent" });
    } catch {
      setError("Sorry, that didn't go through. Please try again or email hello@irishbusinessboosters.com.");
    } finally {
      setSendingCall(false);
    }
  };

  if (state.step === "checking") {
    return (
      <section className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <Loader2 className="animate-spin text-coral" size={40} />
        <p className="mt-6 font-display text-2xl text-ink">
          {copy.automatic ? copy.loading : "Sending your details…"}
        </p>
      </section>
    );
  }

  if (state.step === "call-sent") {
    return (
      <section className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-teal/20 text-teal-deep">
          <CheckCircle2 size={32} />
        </div>
        <h1 className="mt-6 font-display text-3xl font-bold text-ink">Brilliant, we&apos;ll be in touch!</h1>
        <p className="mt-3 max-w-md text-lg text-body">
          We&apos;ll get back to you within one working day to set up your free 15-minute chat.
        </p>
      </section>
    );
  }

  if (state.step === "results") {
    const warnings = state.findings.filter((f) => f.level === "warn").length;
    return (
      <section className="pt-6">
        <p className="overline mb-3">{copy.overline}</p>
        {state.automatic ? (
          <>
            <h1 className="font-display text-3xl font-bold leading-tight text-ink sm:text-4xl">
              {firstName ? `${firstName}, here's` : "Here's"} what we found
            </h1>
            <p className="mt-4 text-lg text-body">
              {warnings === 0
                ? "Good news: nothing major jumped out. Here's the detail."
                : `We spotted ${warnings} thing${warnings > 1 ? "s" : ""} worth fixing. None of them are hard to sort.`}
            </p>
            <ul className="mt-8 flex flex-col gap-3">
              {state.findings.map((f, i) => (
                <li key={i} className="flex gap-4 rounded-2xl bg-white/70 p-5 shadow-sm">
                  <span className="mt-0.5 shrink-0">
                    {f.level === "good" ? (
                      <CheckCircle2 className="text-teal-deep" size={22} />
                    ) : f.level === "warn" ? (
                      <AlertTriangle className="text-coral" size={22} />
                    ) : (
                      <Info className="text-mid-grey" size={22} />
                    )}
                  </span>
                  <div>
                    <p className="font-semibold text-ink">{f.title}</p>
                    <p className="mt-1 text-body">{f.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <>
            <h1 className="font-display text-3xl font-bold leading-tight text-ink sm:text-4xl">
              Thanks{firstName ? `, ${firstName}` : ""}! We&apos;re on it.
            </h1>
            <p className="mt-4 text-lg text-body">
              We&apos;ll email you within one working day. Keep an eye on your inbox (and your spam folder, just in case).
            </p>
          </>
        )}

        <div className="mt-10 rounded-3xl bg-ink p-6 sm:p-8">
          <h2 className="font-display text-2xl font-semibold text-cream">Want us to walk you through it?</h2>
          <p className="mt-2 text-cream/70">
            Free 15-minute chat, no pressure. We&apos;ll show you exactly what we&apos;d change.
          </p>
          <form onSubmit={(e) => handleCall(e, state.leadId)} className="mt-5 flex flex-col gap-3 sm:flex-row">
            <input
              name="preference"
              placeholder="When suits you? e.g. Tuesday morning"
              className="flex-1 rounded-xl border border-cream/15 bg-cream/5 px-4 py-3 text-cream placeholder:text-cream/40 focus:border-teal focus:outline-none"
            />
            <button
              type="submit"
              disabled={sendingCall}
              className="rounded-full bg-coral px-7 py-3 text-sm font-semibold text-cream transition-colors hover:bg-coral-hover disabled:opacity-70"
            >
              {sendingCall ? "Sending..." : "Yes, book my chat"}
            </button>
          </form>
          {error && <p role="alert" className="mt-3 text-sm text-coral-soft">{error}</p>}
        </div>
      </section>
    );
  }

  return (
    <section className="pt-6">
      <p className="overline mb-3">{copy.overline}</p>
      <h1 className="font-display text-3xl font-bold leading-tight text-ink sm:text-5xl">{copy.title}</h1>
      <p className="mt-5 max-w-2xl text-lg leading-relaxed text-body">{copy.intro}</p>

      <form onSubmit={handleCheck} className="relative mt-10 grid grid-cols-1 gap-4 rounded-3xl bg-white/70 p-6 shadow-sm sm:grid-cols-2 sm:p-8">
        {/* Honeypot: hidden from people, bots fill it in. */}
        <input type="text" name="fax" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 opacity-0" />

        {copy.ask === "website" ? (
          <Field className="sm:col-span-2" label="Your website" name="website" placeholder="e.g. mybusiness.ie" required inputMode="url" />
        ) : (
          <>
            <Field label={copy.businessLabel ?? "Business name"} name="business" required />
            <Field label="Town" name="town" />
          </>
        )}
        <Field label="Your first name" name="name" required autoComplete="given-name" />
        <Field label="Email" name="email" type="email" required autoComplete="email" />
        <Field className="sm:col-span-2" label="Phone (optional)" name="phone" type="tel" autoComplete="tel" />

        {error && <p role="alert" className="text-sm text-coral sm:col-span-2">{error}</p>}

        <button
          type="submit"
          className="mt-2 rounded-full bg-coral px-7 py-3.5 text-sm font-semibold text-cream shadow-[0_8px_24px_-8px_rgba(216,90,48,0.55)] transition-colors hover:bg-coral-hover sm:col-span-2"
        >
          {copy.automatic ? "Check it now" : "Send"}
        </button>
        <p className="text-xs text-mid-grey sm:col-span-2">
          We&apos;ll only use your details for this check and to follow up about it. No spam, ever.
        </p>
      </form>
    </section>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = false,
  placeholder,
  autoComplete,
  inputMode,
  className = "",
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: "url" | "text";
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={`check-${name}`} className="mb-2 block text-xs font-semibold uppercase tracking-widest text-mid-grey">
        {label}
      </label>
      <input
        id={`check-${name}`}
        type={type}
        name={name}
        required={required}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        className="w-full rounded-xl border border-ink/15 bg-cream px-4 py-3 text-ink placeholder:text-mid-grey/70 focus:border-teal focus:outline-none"
      />
    </div>
  );
}
