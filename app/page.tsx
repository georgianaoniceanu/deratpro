import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import WhyUs from "@/components/WhyUs";
import HowItWorks from "@/components/HowItWorks";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      {/* site-ul, ca un card mare peste fundal; margini mici pe telefon, mai mari pe ecrane late */}
      <div className="relative z-10 p-3 sm:p-6 lg:p-10 xl:p-12">
        <div
          className="mx-auto max-w-[1440px] overflow-hidden rounded-2xl sm:rounded-3xl shadow-2xl shadow-black/15 ring-1 ring-black/5 dark:ring-white/10"
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
