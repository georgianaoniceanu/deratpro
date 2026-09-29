import { contactInfo } from "@/data/date"

export default function Hero() {
    return (
        <section id="hero">
            <h1>Cu DeratPro, spațiile tale rămân <span>curate</span></h1>
            <p>Servicii complete de deratizare, dezinsecție și dezinfecție pentru locuințe și spații comerciale. Intervenții rapide, sigure și garantate.</p>
            <a href="#contact">Solicită ofertă gratuită</a>
            <a href={contactInfo.phoneHref}>Urgențe: {contactInfo.phoneDisplay}</a>
        </section>
    )
}