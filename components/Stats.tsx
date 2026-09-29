import {stats} from "../data/date"
export default function Stats(){
    return(
        <ul>
            {stats.map(d => (
                <li key={d.label}>
                    <p>{d.value}</p>
                    <p>{d.label}</p>
                </li>
            ))}
        </ul>
    )
}