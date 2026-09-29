import { navLinks, contactInfo } from "@/data/date"

export default function Footer() {
    return (
        <footer>
            <a href="#">
                Derat<span>Pro</span>
            </a>

            <nav aria-label="Navigare footer">
                {navLinks.map(l => (
                    <a key={l.href} href={l.href}>{l.label}</a>
                ))}
            </nav>

            <a href={contactInfo.phoneHref}>{contactInfo.phoneDisplay}</a>

            <p>© 2026 DeratPro. Toate drepturile rezervate.</p>
        </footer>
    )
}