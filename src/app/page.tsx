import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import WhyUs from "@/components/WhyUs";
import Services from "@/components/Services";
import Results from "@/components/Results";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
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
