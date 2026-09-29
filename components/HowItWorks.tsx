import { steps } from "../data/date"
export default function HowItWorks(){
    return(
        <section id="cum-functioneaza">
            <h2>Cum decurge intervenția</h2>
            <ul>
                {steps.map(s=> (
                    <li key={s.title}>
                        <h3>{s.title}</h3>
                        <p>{s.description}</p>
                    </li>
                ))}
            </ul>
        </section>
    )
}