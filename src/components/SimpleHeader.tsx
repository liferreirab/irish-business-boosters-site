import Link from "next/link";
import { ArrowLeft, TrendingUp } from "lucide-react";

export default function SimpleHeader({
  back,
  cta,
}: {
  back?: { href: string; label: string };
  cta?: { href: string; label: string };
}) {
  return (
    <header className="sticky top-0 z-50 border-b border-ink/5 bg-cream/80 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <TrendingUp className="text-coral" size={22} strokeWidth={2.5} />
          <span className="font-display text-lg leading-none">
            <span className="brand-accent">Irish</span>{" "}
            <span className="font-bold text-ink">Business Boosters</span>
          </span>
        </Link>
        {back && (
          <Link href={back.href} className="flex items-center gap-1.5 text-sm font-medium text-ink/70 transition-colors hover:text-coral">
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">{back.label}</span>
          </Link>
        )}
        {cta && (
          <Link
            href={cta.href}
            className="hidden rounded-full bg-coral px-5 py-2.5 text-sm font-semibold text-cream shadow-[0_8px_24px_-8px_rgba(216,90,48,0.55)] transition-colors hover:bg-coral-hover sm:inline-flex"
          >
            {cta.label}
          </Link>
        )}
      </div>
    </header>
  );
}
