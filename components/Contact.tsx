"use client"
import { Phone, Mail, Clock } from "lucide-react"
import {contactInfo} from "../data/date"
import { useState } from "react"
import { ChangeEvent, SubmitEvent } from "react"
interface Form{
    nume: string,
    telefon: string,
    mesaj: string
}
export default function Contact(){
    const [form, setForm] = useState<Form>({nume: "", telefon: "", mesaj: ""})
    const [error, setError] = useState<Form>({nume: "", telefon: "", mesaj:""})
    const [sent, setSent] = useState(false)
    const validate = ({nume, telefon, mesaj}:Form): Form => {
        const errors: Form = {nume: "", telefon: "", mesaj: ""}

        if(nume.trim().length < 2){
            errors.nume = "Introdu numele tău (minimum 2 caractere)."
        }

        const phone = telefon.replace(/[\s-]/g, "")
        if(!/^(\+40|0)7\d{8}$/.test(phone)){
            errors.telefon = "Numărul nu pare valid. Exemplu: 0720 000 000."
        }

        if(mesaj.trim().length < 10){
            errors.mesaj = "Descrie pe scurt problema (minimum 10 caractere)."
        }

        return errors
    }
    const handleChange = (e : ChangeEvent<HTMLInputElement | HTMLTextAreaElement>)=>{
        setSent(false)
        const {name, value} = e.target
        setForm(prev => ({ ...prev, [name]: value }))
    }
    const handleSubmit = (e:SubmitEvent<HTMLFormElement>)=>{
        e.preventDefault()
        const found = validate(form)
        setError(found)
        const hasErrors = Object.values(found).some(msg => msg !== "")
        if(hasErrors) return
        setSent(true)
        setForm({nume: "", telefon: "", mesaj: ""})
    }
    // clasele unui camp: contur rosu cand are eroare, mustar la focus altfel
    const fieldClass = (field: keyof Form) =>
        `w-full rounded-xl border bg-white dark:bg-forest-deep px-4 py-3.5 text-base outline-none transition placeholder:text-typography-muted/60 focus:ring-2 ${
            error[field]
                ? "border-red-600 focus:border-red-600 focus:ring-red-600/20"
                : "border-sand-dark focus:border-mustard focus:ring-mustard/30"
        }`

    return(
        <section id="contact" className="bg-sand-light py-20 lg:py-28">
            <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
                <div>
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-forest dark:text-white text-balance text-center sm:text-left mb-6">
                        Suntem aici să te <span className="font-serif font-semibold italic text-mustard">ajutăm</span>
                    </h2>
                    <p className="text-lg text-typography-muted leading-relaxed max-w-md mb-12 lg:mb-20">
                        Scapă de dăunători rapid și în deplină siguranță. Contactează echipa DeratPro pentru o estimare gratuită și programare imediată.
                    </p>

                    <address className="not-italic space-y-8">
                        <div className="flex items-start gap-5">
                            <div className="w-14 h-14 shrink-0 rounded-2xl bg-forest dark:bg-forest-surface text-mustard flex items-center justify-center">
                                <Phone size={24} aria-hidden="true" />
                            </div>
                            <div>
                                <p className="text-base font-bold uppercase tracking-wider text-typography-muted mb-1">Telefon urgențe</p>
                                <a href={contactInfo.phoneHref} className="text-3xl font-extrabold text-forest dark:text-white hover:text-mustard-hover transition-colors">
                                    {contactInfo.phoneDisplay}
                                </a>
                            </div>
                        </div>

                        <div className="flex items-start gap-5">
                            <div className="w-14 h-14 shrink-0 rounded-2xl bg-forest dark:bg-forest-surface text-mustard flex items-center justify-center">
                                <Mail size={24} aria-hidden="true" />
                            </div>
                            <div>
                                <p className="text-base font-bold uppercase tracking-wider text-typography-muted mb-1">Email suport</p>
                                <a href={`mailto:${contactInfo.email}`} className="text-xl font-semibold text-forest dark:text-white hover:text-mustard-hover transition-colors">
                                    {contactInfo.email}
                                </a>
                            </div>
                        </div>

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
                    </address>
                </div>

                <div className="bg-sand dark:bg-forest-surface rounded-3xl p-6 sm:p-10 border border-sand-dark shadow-lg">
                    <h3 className="text-2xl font-bold mb-2">Solicită intervenție</h3>
                    <p className="text-base text-typography-muted mb-8">
                        Completează datele de mai jos și un specialist te va contacta în cel mai scurt timp.
                    </p>

                    <form noValidate onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="nume" className="block text-base font-bold mb-2">Nume și prenume</label>
                            <input name="nume" value={form.nume} onChange={handleChange} type="text" id="nume" placeholder="Ex: Alexandru Popescu" autoComplete="name"
                                aria-invalid={error.nume ? true : undefined}
                                aria-describedby={error.nume ? "nume-error" : undefined}
                                className={fieldClass("nume")}/>
                            {error.nume && <p id="nume-error" className="mt-2 text-sm font-medium text-red-700">{error.nume}</p>}
                        </div>

                        <div>
                            <label htmlFor="tel" className="block text-base font-bold mb-2">Număr de telefon</label>
                            <input name="telefon" value={form.telefon} onChange={handleChange} type="tel" id="tel" placeholder="Ex: 0720 000 000" autoComplete="tel"
                                aria-invalid={error.telefon ? true : undefined}
                                aria-describedby={error.telefon ? "telefon-error" : undefined}
                                className={fieldClass("telefon")}/>
                            {error.telefon && <p id="telefon-error" className="mt-2 text-sm font-medium text-red-700">{error.telefon}</p>}
                        </div>

                        <div>
                            <label htmlFor="mesaj" className="block text-base font-bold mb-2">Mesaj / Detalii problemă</label>
                            <textarea name="mesaj" value={form.mesaj} onChange={handleChange} rows={4} id="mesaj" placeholder="Descrie pe scurt tipul dăunătorilor și suprafața aproximativă..."
                                aria-invalid={error.mesaj ? true : undefined}
                                aria-describedby={error.mesaj ? "mesaj-error" : undefined}
                                className={`${fieldClass("mesaj")} resize-none`}/>
                            {error.mesaj && <p id="mesaj-error" className="mt-2 text-sm font-medium text-red-700">{error.mesaj}</p>}
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
        </section>
    )
}
