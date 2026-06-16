import type { Metadata } from "next";
import { Lora, Work_Sans } from "next/font/google";
import "./globals.css";

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["500", "600", "700"],
});

const workSans = Work_Sans({
  variable: "--font-work-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const BASE_URL = "https://irishbusinessboosters.com";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Irish Business Boosters | Digital Marketing Agency Waterford, Ireland",
    template: "%s | Irish Business Boosters",
  },
  description:
    "Digital marketing agency based in Waterford, Ireland. We help local Irish SMEs grow online with social media management, paid ads (Meta & Google), website creation, and content production. No jargon — just real results.",
  keywords: [
    "digital marketing agency Waterford",
    "digital marketing Ireland",
    "social media management Ireland",
    "Google Ads Ireland",
    "Meta Ads Ireland",
    "website design Waterford",
    "small business marketing Ireland",
    "SME marketing Ireland",
    "content creation Waterford",
    "Irish business marketing",
    "local marketing agency Ireland",
  ],
  authors: [{ name: "Irish Business Boosters", url: BASE_URL }],
  creator: "Irish Business Boosters",
  publisher: "Irish Business Boosters",
  alternates: {
    canonical: BASE_URL,
  },
  openGraph: {
    type: "website",
    url: BASE_URL,
    siteName: "Irish Business Boosters",
    title: "Irish Business Boosters | Digital Marketing Agency Waterford",
    description:
      "Social media, paid ads, websites and content — all handled by one local team in Waterford. No jargon, just real growth for your Irish business.",
    images: [
      {
        url: "/hero-image.png",
        width: 1200,
        height: 630,
        alt: "Irish Business Boosters — Digital Marketing Agency Waterford, Ireland",
      },
    ],
    locale: "en_IE",
  },
  twitter: {
    card: "summary_large_image",
    title: "Irish Business Boosters | Digital Marketing Agency Waterford",
    description:
      "Social media, paid ads, websites and content — all handled by one local team in Waterford, Ireland.",
    images: ["/hero-image.png"],
  },
  verification: {
    google: "lSniQTzNQ4vT1rW-C4xFHNA3uK67GetwoUgPdqblgMQ",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en-IE"
      className={`${lora.variable} ${workSans.variable} h-full scroll-smooth antialiased`}
    >
      <body className="min-h-full flex flex-col bg-cream text-ink font-sans">
        {children}
      </body>
    </html>
  );
}
