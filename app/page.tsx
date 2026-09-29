import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import WhyUs from "@/components/WhyUs";
import HowItWorks from "@/components/HowItWorks";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import Bubbles from "@/components/Bubbles";

export default function Home() {
  return (
    <>
      {/* fundalul cu bule, fixat in spatele intregului site */}
      <Bubbles />

      {/* site-ul, ca un card mare peste fundal; margini mici pe telefon, mai mari pe ecrane late */}
      <div className="relative z-10 px-4 pb-4 pt-24 sm:p-12 sm:pt-20 lg:p-24 xl:p-32">
        <div
          data-site
          className="mx-auto max-w-[1440px] overflow-hidden rounded-2xl sm:rounded-3xl shadow-2xl shadow-black/15 ring-1 ring-black/5"
        >
          <Navbar />
          <main>
            <Hero />
            <Services />
            <WhyUs />
            <HowItWorks />
            <Contact />
          </main>
          <Footer />
        </div>
      </div>
    </>
  );
}
