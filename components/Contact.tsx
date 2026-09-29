"use client"
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
    const validate = ({nume, telefon, mesaj}:Form) => {
        if(nume.trim().length < 2){
            setError({...error, nume: "Numele are sub 2 caractere"})
        } else if(telefon.trim() !== "^(\+40|0)7\d{8}"){
            setError({...error, telefon: "Telefonul e in format gresit. Corect: 0720 000 000"})
        } else if(mesaj.trim().length < 10){
            setError({...error, mesaj: "Mesajul are sub 10 caractere"})
        }
        return error
    }
    const handleChange = (e : ChangeEvent<HTMLInputElement | HTMLTextAreaElement>)=>{
        const {name, value} = e.target
        setForm(prev => ({ ...prev, [name]: value }))
    }
    const handleSubmit = (e:SubmitEvent<HTMLFormElement>)=>{
        e.preventDefault()
        const found = validate(form)
        setError(found)
        const hasErrors = Object.values(found).some(msg => msg !== "")
        if(hasErrors) return
        console.log("Formular valid: ", form)
    }
    return(
        <section id="contact">
            <div>
                <h2>Suntem aici să te ajutăm</h2>
                <p>Scapă de dăunători rapid și în deplină siguranță. Contactează-ne pentru o estimare gratuită.</p>

                <address>
                    <p>Telefon urgențe</p>
                    <a href={contactInfo.phoneHref}>{contactInfo.phoneDisplay}</a>

                    <p>Email</p>
                    <a href={`mailto:${contactInfo.email}`}>{contactInfo.email}</a>

                    <p>Program</p>
                    <p>{contactInfo.schedule}</p>
                </address>
            </div>
            <form noValidate onSubmit={handleSubmit}>
                <h3>Solicită intervenție</h3>
                <p>Completează datele de mai jos și un specialist te va contacta în cel mai scurt timp.</p>
                <label htmlFor="nume">Nume și prenume</label>
                <input name="nume" value={form.nume} onChange={handleChange} type="text" id="nume" placeholder="Ex: Alexandru Popescu" autoComplete="name"
                    aria-invalid={error.nume ? true : undefined}
                    aria-describedby={error.nume ? "nume-error" : undefined}/>
                {error.nume && <p id="nume-error">{error.nume}</p>}

                <label htmlFor="tel">Număr de telefon</label>
                <input name="telefon" value={form.telefon} onChange={handleChange} type="tel" id="tel" placeholder="Ex: 0720 000 000" autoComplete="tel"
                    aria-invalid={error.telefon ? true : undefined}
                    aria-describedby={error.telefon ? "telefon-error" : undefined}/>
                {error.telefon && <p id="telefon-error">{error.telefon}</p>}

                <label htmlFor="mesaj">Mesaj / Detalii problemă</label>
                <textarea name="mesaj" value={form.mesaj} onChange={handleChange} rows={4} id="mesaj" placeholder="Descrie pe scurt tipul dăunătorilor și suprafața aproximativă..."
                    aria-invalid={error.mesaj ? true : undefined}
                    aria-describedby={error.mesaj ? "mesaj-error" : undefined}/>
                {error.mesaj && <p id="mesaj-error">{error.mesaj}</p>}
                <button type="submit">Trimite cererea</button>
            </form>
        </section>
    )
}
