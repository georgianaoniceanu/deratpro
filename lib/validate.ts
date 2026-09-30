// validarea formularului de contact, separata de componenta ca sa poata fi testata singura (vezi validate.test.ts)

export interface Form {
    nume: string
    telefon: string
    mesaj: string
}

// primeste valorile din formular si intoarce un mesaj de eroare pentru fiecare camp ("" = campul e corect)
export function validate({ nume, telefon, mesaj }: Form): Form {
    const errors: Form = { nume: "", telefon: "", mesaj: "" }

    if (nume.trim().length < 3) {
        errors.nume = "Introdu numele tău (minimum 3 caractere)."
    }

    // acceptam spatii si liniute intre cifre (0720 000 000, 0720-000-000), apoi verificam formatul:
    // 07 + 8 cifre, sau +40 7 + 8 cifre
    const phone = telefon.replace(/[\s-]/g, "")
    if (!/^(\+40|0)7\d{8}$/.test(phone)) {
        errors.telefon = "Numărul nu pare valid. Exemplu: 0720 000 000."
    }

    if (mesaj.trim().length < 10) {
        errors.mesaj = "Descrie pe scurt problema (minimum 10 caractere)."
    }

    return errors
}

// bifa de acord cu Politica de confidentialitate: obligatorie, pentru ca formularul colecteaza date personale (GDPR)
export function validateConsent(accepted: boolean): string {
    return accepted ? "" : "Pentru a trimite cererea, trebuie să fii de acord cu Politica de confidențialitate."
}
