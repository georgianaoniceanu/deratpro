import {services} from "../data/date"
export default function Services(){
    return(
        <section id="servicii">
            <h2>Serviciile noastre</h2>
            <ul>
                {services.map(s => (
                    <li key={s.title}>
                        <h3>{s.title}</h3>
                        <p>{s.description}</p>
                    </li>
                ))}
            </ul>
        </section>
    )
}