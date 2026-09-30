"use client"
import { Phone, Mail, Clock, MapPin } from "lucide-react"
import {contactInfo} from "../data/date"
import { useRef, useState } from "react"
import type { ChangeEvent, CSSProperties, FocusEvent, SubmitEvent } from "react"
// regulile de validare stau separat, in lib/validate.ts, ca sa poata fi testate automat
import { validate, validateConsent, type Form } from "../lib/validate"
import PrivacyDialog from "./PrivacyDialog"
// id-ul din pagina al fiecarui camp (pentru label si pentru mutarea cursorului la primul camp gresit)
const fieldIds: Record<keyof Form, string> = { nume: "nume", telefon: "tel", mesaj: "mesaj" }

export default function Contact(){
    const [form, setForm] = useState<Form>({nume: "", telefon: "", mesaj: ""})
    const [error, setError] = useState<Form>({nume: "", telefon: "", mesaj:""})
    const [sent, setSent] = useState(false)
    // bifa de acord cu Politica de confidentialitate (obligatorie) si eroarea ei
    const [consent, setConsent] = useState(false)
    const [consentError, setConsentError] = useState("")
    const privacyRef = useRef<HTMLDialogElement>(null)
    const handleChange = (e : ChangeEvent<HTMLInputElement | HTMLTextAreaElement>)=>{
        setSent(false)
        const name = e.target.name as keyof Form
        const next = { ...form, [name]: e.target.value }
        setForm(next)
        // daca acest camp are deja o eroare, o verificam din nou la fiecare tasta, ca sa dispara imediat ce e corect
        if(error[name]) setError(prev => ({ ...prev, [name]: validate(next)[name] }))
    }
    // cand vizitatorul iese dintr-un camp in care a scris ceva, il verificam imediat (doar pe el), nu abia la trimitere.
    // un camp lasat gol nu primeste eroare aici: poate doar a trecut prin el; golurile le semnalam la "Trimite"
    const handleBlur = (e : FocusEvent<HTMLInputElement | HTMLTextAreaElement>)=>{
        const name = e.target.name as keyof Form
        if(form[name].trim() === "") return
        setError(prev => ({ ...prev, [name]: validate(form)[name] }))
    }
    const handleConsent = (e : ChangeEvent<HTMLInputElement>)=>{
        setSent(false)
        setConsent(e.target.checked)
        // eroarea dispare imediat ce bifeaza
        if(consentError) setConsentError(validateConsent(e.target.checked))
    }
    const handleSubmit = (e:SubmitEvent<HTMLFormElement>)=>{
        e.preventDefault()
        const found = validate(form)
        setError(found)
        const foundConsent = validateConsent(consent)
        setConsentError(foundConsent)
        // primul camp gresit, in ordinea din formular: ducem cursorul acolo, ca vizitatorul sa stie de unde sa inceapa
        // (il aducem in mijlocul ecranului, ca sa nu ramana ascuns sub navbar-ul lipit sus)
        const firstInvalid = (["nume", "telefon", "mesaj"] as const).find(field => found[field] !== "")
        if(firstInvalid){
            const input = document.getElementById(fieldIds[firstInvalid])
            input?.focus({ preventScroll: true })
            input?.scrollIntoView({ block: "center", behavior: "smooth" })
            return
        }
        // campurile sunt corecte, dar lipseste bifa: ducem cursorul la ea
        if(foundConsent){
            document.getElementById("acord")?.focus()
            return
        }
        setSent(true)
        setForm({nume: "", telefon: "", mesaj: ""})
        setConsent(false)
    }
    // clasele unui camp: contur rosu cand are eroare, mustar la focus altfel
    const fieldClass = (field: keyof Form) =>
        `w-full rounded-xl border bg-white dark:bg-forest-deep px-4 py-3.5 text-base outline-none transition placeholder:text-typography-muted/80 focus:ring-2 ${
            error[field]
                ? "border-red-600 focus:border-red-600 focus:ring-red-600/20"
                : "border-sand-dark focus:border-mustard focus:ring-mustard/30"
        }`

    return(
        <section id="contact" className="bg-sand-light py-20 lg:py-28">
            <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
                <div data-reveal>
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-forest dark:text-white text-balance text-center sm:text-left mb-6">
                        {/* pe fundal deschis, mustarul e prea slab ca contrast; folosim un auriu mai inchis */}
                        Suntem aici să te <span className="font-serif font-semibold italic text-[#9A6410] dark:text-mustard">ajutăm</span>
                    </h2>
                    <p className="text-lg text-typography-muted leading-relaxed max-w-md mb-12 lg:mb-20">
                        Scapă de dăunători rapid și în deplină siguranță. Contactează echipa DeratPro pentru o estimare gratuită și programare imediată.
                    </p>

                    <address className="not-italic space-y-8">
                        {/* telefonul si emailul: tot randul (iconita + text) e link, ca in footer */}
                        <a href={contactInfo.phoneHref} className="group flex items-start gap-5 w-fit">
                            <span className="w-14 h-14 shrink-0 rounded-2xl bg-forest dark:bg-forest-surface text-mustard flex items-center justify-center transition-transform group-hover:scale-105">
                                <Phone size={24} aria-hidden="true" />
                            </span>
                            <span>
                                <span className="block text-base font-bold uppercase tracking-wider text-typography-muted mb-1">Telefon urgențe</span>
                                <span className="text-3xl font-extrabold text-forest dark:text-white group-hover:text-mustard-hover transition-colors">
                                    {contactInfo.phoneDisplay}
                                </span>
                            </span>
                        </a>

                        <a href={`mailto:${contactInfo.email}`} className="group flex items-start gap-5 w-fit">
                            <span className="w-14 h-14 shrink-0 rounded-2xl bg-forest dark:bg-forest-surface text-mustard flex items-center justify-center transition-transform group-hover:scale-105">
                                <Mail size={24} aria-hidden="true" />
                            </span>
                            <span>
                                <span className="block text-base font-bold uppercase tracking-wider text-typography-muted mb-1">Email suport</span>
                                <span className="text-xl font-semibold text-forest dark:text-white group-hover:text-mustard-hover transition-colors">
                                    {contactInfo.email}
                                </span>
                            </span>
                        </a>

                        <div className="flex items-start gap-5">
                            <div className="w-14 h-14 shrink-0 rounded-2xl bg-forest dark:bg-forest-surface text-mustard flex items-center justify-center">
                                <Clock size={24} aria-hidden="true" />
                            </div>
                            <div>
                                <p className="text-base font-bold uppercase tracking-wider text-typography-muted mb-1">Program de lucru</p>
                                <p className="text-lg font-medium text-forest dark:text-gray-200">{contactInfo.schedule}</p>
                                <p className="text-lg font-bold text-forest dark:text-white mt-1">Intervenții de urgență non-stop</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-5">
                            <div className="w-14 h-14 shrink-0 rounded-2xl bg-forest dark:bg-forest-surface text-mustard flex items-center justify-center">
                                <MapPin size={24} aria-hidden="true" />
                            </div>
                            <div>
                                <p className="text-base font-bold uppercase tracking-wider text-typography-muted mb-1">Zonă deservită</p>
                                <p className="text-lg font-semibold text-forest dark:text-white">{contactInfo.area}</p>
                            </div>
                        </div>
                    </address>
                </div>

                <div data-reveal style={{ "--reveal-delay": "150ms" } as CSSProperties} className="bg-sand dark:bg-forest-surface rounded-3xl p-6 sm:p-10 border border-sand-dark shadow-lg">
                    <h3 className="text-2xl font-bold mb-2">Solicită intervenție</h3>
                    <p className="text-base text-typography-muted mb-8">
                        Completează datele de mai jos și un specialist te va contacta în cel mai scurt timp.
                    </p>

                    <form noValidate onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="nume" className="block text-base font-bold mb-2">Nume și prenume</label>
                            <input name="nume" value={form.nume} onChange={handleChange} onBlur={handleBlur} type="text" id="nume" placeholder="Ex: Alexandru Popescu" autoComplete="name"
                                aria-invalid={error.nume ? true : undefined}
                                aria-describedby={error.nume ? "nume-error" : undefined}
                                className={fieldClass("nume")}/>
                            {error.nume && <p id="nume-error" className="mt-2 text-sm font-medium text-red-700 dark:text-red-400">{error.nume}</p>}
                        </div>

                        <div>
                            <label htmlFor="tel" className="block text-base font-bold mb-2">Număr de telefon</label>
                            <input name="telefon" value={form.telefon} onChange={handleChange} onBlur={handleBlur} type="tel" id="tel" placeholder="Ex: 0720 000 000" autoComplete="tel"
                                aria-invalid={error.telefon ? true : undefined}
                                aria-describedby={error.telefon ? "telefon-error" : undefined}
                                className={fieldClass("telefon")}/>
                            {error.telefon && <p id="telefon-error" className="mt-2 text-sm font-medium text-red-700 dark:text-red-400">{error.telefon}</p>}
                        </div>

                        <div>
                            <label htmlFor="mesaj" className="block text-base font-bold mb-2">Mesaj / Detalii problemă</label>
                            <textarea name="mesaj" value={form.mesaj} onChange={handleChange} onBlur={handleBlur} rows={4} id="mesaj" placeholder="Descrie pe scurt tipul dăunătorilor și suprafața aproximativă..."
                                aria-invalid={error.mesaj ? true : undefined}
                                aria-describedby={error.mesaj ? "mesaj-error" : undefined}
                                className={`${fieldClass("mesaj")} resize-none`}/>
                            {error.mesaj && <p id="mesaj-error" className="mt-2 text-sm font-medium text-red-700 dark:text-red-400">{error.mesaj}</p>}
                        </div>

                        {/* acordul cu Politica de confidentialitate: obligatoriu, pentru ca formularul colecteaza date personale.
                            politica se deschide intr-o fereastra peste pagina, ca vizitatorul sa nu piarda ce a completat */}
                        <div>
                            <div className="flex items-start gap-3">
                                <input type="checkbox" id="acord" name="acord" checked={consent} onChange={handleConsent}
                                    // numele complet pentru cititoarele de ecran: butonul din eticheta nu intra in numele bifei
                                    aria-label="Sunt de acord cu prelucrarea datelor mele conform Politicii de confidențialitate"
                                    aria-invalid={consentError ? true : undefined}
                                    aria-describedby={consentError ? "acord-error" : undefined}
                                    className={`mt-1 w-5 h-5 shrink-0 rounded accent-forest dark:accent-mustard cursor-pointer ${consentError ? "outline-2 outline-red-600 outline-offset-2" : ""}`}/>
                                <label htmlFor="acord" className="text-base text-typography-muted leading-relaxed cursor-pointer">
                                    Sunt de acord cu prelucrarea datelor mele conform{" "}
                                    <button type="button" onClick={() => privacyRef.current?.showModal()}
                                        className="font-semibold text-[#9A6410] dark:text-mustard underline underline-offset-2 hover:no-underline">
                                        Politicii de confidențialitate
                                    </button>
                                    .
                                </label>
                            </div>
                            {consentError && <p id="acord-error" className="mt-2 text-sm font-medium text-red-700 dark:text-red-400">{consentError}</p>}
                        </div>

                        <button type="submit" className="w-full py-4 bg-mustard hover:bg-mustard-hover text-forest font-bold rounded-xl transition hover:-translate-y-0.5">
                            Trimite cererea
                        </button>

                        <div aria-live="polite">
                            {sent && (
                                <p className="rounded-xl bg-forest/5 dark:bg-white/5 px-4 py-3 text-base font-medium text-forest dark:text-gray-100">
                                    Mulțumim! Am primit cererea ta și te sunăm în cel mai scurt timp.
                                </p>
                            )}
                        </div>
                    </form>
                </div>
            </div>

            <PrivacyDialog ref={privacyRef} />
        </section>
    )
}
