import {stats} from "../data/date"
export default function Stats(){
    return(
        <ul className="mt-16 bg-forest text-white rounded-3xl p-10 lg:p-14 shadow-xl grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x divide-white/10">
            {stats.map(d => (
                <li key={d.label} className="flex flex-col items-center text-center px-4 pt-6 first:pt-0 md:pt-0">
                    <p className="text-5xl lg:text-6xl font-extrabold tracking-tight text-mustard mb-2">{d.value}</p>
                    <p className="text-base font-medium text-gray-200">{d.label}</p>
                </li>
            ))}
        </ul>
    )
}
