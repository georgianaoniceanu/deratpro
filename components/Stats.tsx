import {stats} from "../data/date"
import CountUp from "./CountUp"
export default function Stats(){
    return(
        <ul className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats.map(d => (
                <li
                    key={d.label}
                    // card separat, verde inchis, cu o lumina discreta in coltul din dreapta sus
                    className="rounded-2xl p-8 lg:p-10 text-white shadow-lg bg-forest bg-[radial-gradient(circle_at_100%_0%,rgba(229,169,60,0.14),transparent_60%)]"
                >
                    <p className="text-5xl lg:text-6xl font-extrabold tracking-tight text-mustard mb-2">
                        <CountUp value={d.value} />
                    </p>
                    <p className="text-base font-medium text-gray-200">{d.label}</p>
                </li>
            ))}
        </ul>
    )
}
