import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import WhyUs from "@/components/WhyUs";
import Services from "@/components/Services";
import Results from "@/components/Results";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": "https://irishbusinessboosters.com/#business",
  name: "Irish Business Boosters",
  description:
    "Full-service digital marketing agency for small and medium-sized businesses in Ireland. Social media management, paid advertising, website creation, and content production based in Waterford.",
  url: "https://irishbusinessboosters.com",
  email: "hello@irishbusinessboosters.com",
  image: "https://irishbusinessboosters.com/hero-image.png",
  logo: "https://irishbusinessboosters.com/hero-image.png",
  priceRange: "$$",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Waterford",
    addressCountry: "IE",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 52.2593,
    longitude: -7.1101,
  },
  areaServed: [
    { "@type": "Country", name: "Ireland" },
    { "@type": "City", name: "Waterford" },
  ],
  sameAs: [],
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Digital Marketing Services",
    itemListElement: [
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Social Media Management",
          description:
            "Instagram and Facebook management — strategy, copywriting, scheduling, and community management.",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Paid Advertising",
          description:
            "Meta Ads and Google Ads — campaign setup, targeting, creative, and ongoing optimisation.",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Website Creation",
          description:
            "Professional websites built to convert — fast, mobile-first, and tailored to your business.",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Content Production",
          description:
            "Photo and video content creation on-site — Reels, testimonials, brand storytelling.",
        },
      },
    ],
  },
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="grain-overlay" />
      <Navbar />
      <main>
        <Hero />
        <About />
        <WhyUs />
        <Services />
        <Results />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
