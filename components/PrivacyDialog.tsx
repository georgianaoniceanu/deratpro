import type { MouseEvent, Ref } from "react"
import { X } from "lucide-react"
import { contactInfo } from "../data/date"

// fereastra cu Politica de confidentialitate, deschisa din formularul de contact (dialogRef.current.showModal()).
// <dialog> e accesibil din start: se inchide cu Escape, tine focusul inauntru si e anuntat corect de cititoarele de ecran.
// vizitatorul citeste politica fara sa paraseasca pagina, deci nu pierde ce a completat in formular
export default function PrivacyDialog({ ref }: { ref: Ref<HTMLDialogElement> }) {
    // click pe fundalul intunecat (in afara casetei) inchide fereastra
    function closeOnBackdrop(e: MouseEvent<HTMLDialogElement>) {
        if (e.target === e.currentTarget) e.currentTarget.close()
    }

    return (
        <dialog
            ref={ref}
            aria-labelledby="privacy-title"
            onClick={closeOnBackdrop}
            className="m-auto w-[calc(100%-2rem)] max-w-xl max-h-[85vh] rounded-2xl bg-sand-light text-typography shadow-2xl backdrop:bg-black/60 backdrop:backdrop-blur-sm"
        >
            <div className="p-6 sm:p-8">
                <div className="flex items-start justify-between gap-4 mb-6">
                    <h2 id="privacy-title" className="text-2xl font-extrabold tracking-tight text-forest dark:text-white">
                        Politica de confidențialitate
                    </h2>
                    {/* form method="dialog": butonul inchide fereastra fara JavaScript suplimentar */}
                    <form method="dialog">
                        <button
                            aria-label="Închide"
                            className="w-10 h-10 shrink-0 flex items-center justify-center rounded-xl border border-sand-dark hover:border-mustard/60 hover:text-[#9A6410] dark:hover:text-mustard transition-colors"
                        >
                            <X size={20} aria-hidden="true" />
                        </button>
                    </form>
                </div>

                <div className="space-y-5 text-base leading-relaxed text-typography-muted">
                    <section>
                        <h3 className="font-bold text-typography mb-1">Ce date colectăm</h3>
                        <p>Prin formularul de contact colectăm doar ce ne trimiți: numele, numărul de telefon și mesajul despre problema ta.</p>
                    </section>

                    <section>
                        <h3 className="font-bold text-typography mb-1">De ce le folosim</h3>
                        <p>Doar ca să te contactăm pentru estimarea și programarea intervenției cerute. Nu le folosim pentru reclame și nu le vindem nimănui.</p>
                    </section>

                    <section>
                        <h3 className="font-bold text-typography mb-1">Cât timp le păstrăm</h3>
                        <p>Cât este necesar pentru a răspunde cererii și pentru garanția lucrării, apoi le ștergem.</p>
                    </section>

                    <section>
                        <h3 className="font-bold text-typography mb-1">Drepturile tale</h3>
                        <p>
                            Poți cere oricând să vezi, să corectezi sau să ștergi datele tale, scriindu-ne la{" "}
                            <a href={`mailto:${contactInfo.email}`} className="font-semibold text-[#9A6410] dark:text-mustard underline underline-offset-2">
                                {contactInfo.email}
                            </a>
                            .
                        </p>
                    </section>
                </div>

                <form method="dialog" className="mt-8">
                    <button className="w-full py-3.5 bg-mustard hover:bg-mustard-hover text-forest font-bold rounded-xl transition">
                        Am înțeles
                    </button>
                </form>
            </div>
        </dialog>
    )
}
