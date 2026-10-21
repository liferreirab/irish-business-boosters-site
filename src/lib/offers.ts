// Paid offers shown on /work-with-us and sold through /start/<slug>.
// Each request goes to the site-lead Edge Function (same as the contact form).

// Stripe Payment Links. While a link is null the customer is told
// we'll email a secure card payment link instead.
export const PAYMENT_LINKS: Record<string, string | null> = {
  healthcheck: "https://buy.stripe.com/5kQfZg43XbjT2rn33YefC00",
  session: "https://buy.stripe.com/aFa8wO43XfA99TP8oiefC01",
  diagnostic: "https://buy.stripe.com/5kQ28q7g9gEd6HDgUOefC02",
  coaching: "https://buy.stripe.com/8x228q7g9ew5d61gUOefC03",
};

export type Question =
  | { kind: "text"; name: string; label: string; required?: boolean; placeholder?: string; type?: string; autoComplete?: string }
  | { kind: "textarea"; name: string; label: string; required?: boolean; placeholder?: string }
  | { kind: "select"; name: string; label: string; options: string[] };

export type Offer = {
  slug: string;
  name: string;
  price: string;
  tagline: string;
  audience: string;
  body: string;
  includes: string[];
  note?: string;
  delivery: string;
  cta: string;
  questions: Question[];
};

const GOALS = [
  "More walk-in customers",
  "More bookings or enquiries",
  "More people knowing who we are",
  "Selling online",
  "Not sure yet",
];

const INSTAGRAM: Question = { kind: "text", name: "instagram", label: "Your Instagram @", required: true, placeholder: "@yourbusiness" };
const BUSINESS: Question = { kind: "text", name: "business", label: "Business name", required: true };
const TOWN: Question = { kind: "text", name: "town", label: "Town", required: true };
const GOAL: Question = { kind: "select", name: "goal", label: "What do you want most from social media?", options: GOALS };

export const OFFERS: Offer[] = [
  {
    slug: "healthcheck",
    name: "Instagram Health Check",
    price: "€29",
    tagline: "Know exactly what to fix, in plain English.",
    audience: "For owners who post but don't see much coming back.",
    body: "We go through your Instagram the way a new customer would and send you a clear report: what's working, what's costing you customers, and what to post next.",
    includes: [
      "A score out of 100, broken down by bio, posts, Reels and contact options",
      "The 3 things that will make the biggest difference",
      "5 post ideas made for your business",
      "A simple 30-day plan you can follow yourself",
    ],
    note: "Book the Full Business Diagnostic within 30 days and the €29 comes off.",
    delivery: "Your report lands in your inbox within 2 working days of payment.",
    cta: "Get my Health Check",
    questions: [
      INSTAGRAM,
      { kind: "text", name: "business", label: "What kind of business is it?", required: true, placeholder: "e.g. café, hair salon, plumber" },
      TOWN,
      GOAL,
      { kind: "select", name: "frequency", label: "How often do you post right now?", options: ["Most days", "About once a week", "A couple of times a month", "Hardly ever"] },
      { kind: "textarea", name: "frustration", label: "What's the most frustrating thing about your Instagram?", placeholder: "Optional, but it helps us focus the report" },
    ],
  },
  {
    slug: "diagnostic",
    name: "Full Business Diagnostic",
    price: "€297",
    tagline: "The complete picture of how your business shows up online.",
    audience: "For businesses ready to invest and wanting a proper plan.",
    body: "A deep look at everything a customer sees before they choose you: your social media, your Google listing, your website and the local competition. Then we sit down with you and go through it.",
    includes: [
      "Instagram and Facebook in depth: content, Reels, bio, messages",
      "Your Google listing, reviews and website",
      "How you compare with 3 local competitors",
      "A 90-day action plan in order of priority",
      "A 45-minute call where we walk you through it all",
    ],
    note: "Sign up for monthly management within 30 days and the full €297 comes off your first month.",
    delivery: "Once you've paid, we'll email you within one working day to pick a time for your call.",
    cta: "Book my Diagnostic",
    questions: [
      BUSINESS,
      TOWN,
      INSTAGRAM,
      { kind: "text", name: "site", label: "Website (if you have one)", placeholder: "e.g. mybusiness.ie" },
      GOAL,
      { kind: "textarea", name: "context", label: "Anything we should know?", placeholder: "What's going well, what isn't, what you've tried" },
    ],
  },
  {
    slug: "session",
    name: "Strategy Session",
    price: "€120",
    tagline: "One hour, your questions, a clear direction.",
    audience: "For owners with a specific question or a decision to make.",
    body: "A 1:1 video call to sort out whatever's on your mind: what to post, which platform to focus on, ads, your website. You leave with a plan, not homework you don't understand.",
    includes: [
      "60 minutes on Google Meet",
      "We look at your accounts before the call",
      "A written summary with your next steps",
    ],
    delivery: "Once you've paid, we'll email you within one working day with times for your session.",
    cta: "Book my Session",
    questions: [
      BUSINESS,
      { kind: "text", name: "instagram", label: "Your Instagram @", placeholder: "@yourbusiness" },
      { kind: "textarea", name: "topic", label: "What would you like to sort out?", required: true },
    ],
  },
  {
    slug: "coaching",
    name: "30-Day Coaching",
    price: "€497",
    tagline: "Learn to do your own social media, properly.",
    audience: "For owners who want to do it themselves, with backup.",
    body: "For owners who'd rather do it themselves but want someone in their corner. Over 4 weeks we build your plan together and help you get into a rhythm that fits your week.",
    includes: [
      "4 weekly 1:1 sessions on Google Meet",
      "Your own 30-day content plan",
      "Feedback on your posts between sessions",
      "Simple templates for captions and Reels",
    ],
    delivery: "Once you've paid, we'll email you within one working day to book your first session.",
    cta: "Start my Coaching",
    questions: [
      BUSINESS,
      TOWN,
      INSTAGRAM,
      GOAL,
      { kind: "textarea", name: "context", label: "Where are you at with your social media right now?" },
    ],
  },
];

export function getOffer(slug: string) {
  return OFFERS.find((o) => o.slug === slug);
}
