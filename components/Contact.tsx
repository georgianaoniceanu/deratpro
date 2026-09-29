"use client"
import {contactInfo} from "../data/date"
import { useState } from "react"
import { ChangeEvent } from "react"
interface Form{
    nume: string,
    telefon: string,
    mesaj: string
}
export default function Contact(){
    const [form, setForm] = useState<Form>({nume: "", telefon: "", mesaj: ""})
    const handleChange = (e : ChangeEvent<HTMLInputElement | HTMLTextAreaElement>)=>{
        const {name, value} = e.target
        setForm(prev => ({ ...prev, [name]: value }))
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
            <form>
                <h3>Solicită intervenție</h3>
                <p>Completează datele de mai jos și un specialist te va contacta în cel mai scurt timp.</p>
                <label htmlFor="nume">Nume și prenume</label>
                <input name="nume" value={form.nume} onChange={} type="text" id="nume" placeholder="Ex: Alexandru Popescu" autoComplete="name"/>
                <label htmlFor="tel">Număr de telefon</label>
                <input name="telefon" value={form.telefon} type="tel" id="tel" placeholder="Ex: 0720 000 000" autoComplete="tel"/>
                <label htmlFor="mesaj">Mesaj / Detalii problemă</label>
                <textarea name="mesaj" value={form.mesaj} rows={4} id="mesaj" placeholder="Descrie pe scurt tipul dăunătorilor și suprafața aproximativă..."/>
                <button type="submit">Trimite cererea</button>
            </form>
        </section>
    )
}
