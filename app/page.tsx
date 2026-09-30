import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import WhyUs from "@/components/WhyUs";
import HowItWorks from "@/components/HowItWorks";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import RevealOnScroll from "@/components/RevealOnScroll";
import FloatingOffer from "@/components/FloatingOffer";

export default function Home() {
  return (
    <>
      {/* site-ul pe toata latimea ecranului (overflow-x-clip: nimic nu poate crea scroll pe orizontala) */}
      <div className="relative z-10 overflow-x-clip">
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

      {/* butonul "Oferta" care pluteste in coltul ecranului si ramane la scroll */}
      <FloatingOffer />

      {/* activeaza animatiile de aparitie la scroll (elementele cu data-reveal) */}
      <RevealOnScroll />
    </>
  );
}
