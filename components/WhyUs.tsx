import { advantages } from "../data/date"
import Stats from "./Stats"
export default function WhyUs(){
    return(
        <section id="de-ce-noi">
            <h2>De ce să alegi DeratPro?</h2>
            <ul>
                {advantages.map(a => (
                    <li key={a.title}>
                        <h3>{a.title}</h3>
                        <p>{a.description}</p>
                    </li>
                ))}
            </ul>
            <Stats></Stats>
        </section>
    )
}