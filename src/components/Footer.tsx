import { TrendingUp } from "lucide-react";

const SERVICE_LINKS = [
  "Social Media",
  "Paid Advertising",
  "Website Creation",
  "Content Production",
];

const COMPANY_LINKS = [
  { label: "About Us", href: "#about" },
  { label: "Why Us", href: "#why-us" },
  { label: "Contact", href: "#contact" },
];

export default function Footer() {
  return (
    <footer className="relative border-t border-ink/10 bg-cream-deep/40">
      <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="text-coral" size={24} strokeWidth={2.5} />
              <span className="font-display text-xl leading-none">
                <span className="brand-accent">Irish</span>{" "}
                <span className="font-bold text-ink">Business Boosters</span>
              </span>
            </div>
            <p className="mt-5 max-w-sm font-display text-2xl italic leading-snug text-ink/80">
              Let&apos;s grow together.
            </p>
          </div>

          <div>
            <p className="overline mb-5">Services</p>
            <ul className="space-y-3 text-sm text-body">
              {SERVICE_LINKS.map((s) => (
                <li key={s}>
                  <a href="#services" className="transition-colors hover:text-coral">
                    {s}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="overline mb-5">Company</p>
            <ul className="space-y-3 text-sm text-body">
              {COMPANY_LINKS.map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="transition-colors hover:text-coral">
                    {l.label}
                  </a>
                </li>
              ))}
              <li>
                <a
                  href="mailto:hello@irishbusinessboosters.com"
                  className="transition-colors hover:text-coral"
                >
                  hello@irishbusinessboosters.com
                </a>
              </li>
              <li className="text-mid-grey">Waterford, Ireland</li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-ink/10 pt-8 text-xs text-mid-grey sm:flex-row">
          <p>&copy; {new Date().getFullYear()} Irish Business Boosters. All rights reserved.</p>
          <p>Waterford, Ireland</p>
        </div>
      </div>
    </footer>
  );
}
