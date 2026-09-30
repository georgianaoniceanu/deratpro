import { describe, expect, it } from "vitest"
import { validate, type Form } from "./validate"

// un formular completat corect; in fiecare test schimbam doar campul verificat
const valid: Form = { nume: "Alexandru Popescu", telefon: "0720 000 000", mesaj: "Am gândaci în bucătărie." }

describe("validate", () => {
    it("nu întoarce nicio eroare pentru un formular completat corect", () => {
        expect(validate(valid)).toEqual({ nume: "", telefon: "", mesaj: "" })
    })

    it("întoarce erori pentru toate câmpurile când formularul e gol", () => {
        const errors = validate({ nume: "", telefon: "", mesaj: "" })
        expect(errors.nume).not.toBe("")
        expect(errors.telefon).not.toBe("")
        expect(errors.mesaj).not.toBe("")
    })
})

describe("nume", () => {
    it("respinge un nume mai scurt de 3 caractere", () => {
        expect(validate({ ...valid, nume: "Al" }).nume).not.toBe("")
    })

    it("acceptă un nume de exact 3 caractere", () => {
        expect(validate({ ...valid, nume: "Ana" }).nume).toBe("")
    })

    it("nu numără spațiile de la început și de la sfârșit", () => {
        expect(validate({ ...valid, nume: "   Al   " }).nume).not.toBe("")
    })
})

describe("telefon", () => {
    it.each(["0720000000", "0720 000 000", "0720-000-000", "+40720000000", "+40 720 000 000"])(
        "acceptă formatul românesc: %s",
        telefon => {
            expect(validate({ ...valid, telefon }).telefon).toBe("")
        }
    )

    it.each([
        ["prea scurt", "0720 000"],
        ["prea lung", "0720 000 0000"],
        ["nu e număr de mobil (nu începe cu 07)", "0620 000 000"],
        ["conține litere", "0720 abc 000"],
        ["prefix de altă țară", "+44720000000"],
    ])("respinge un număr %s: %s", (_motiv, telefon) => {
        expect(validate({ ...valid, telefon }).telefon).not.toBe("")
    })
})

describe("mesaj", () => {
    it("respinge un mesaj mai scurt de 10 caractere", () => {
        expect(validate({ ...valid, mesaj: "Gândaci!" }).mesaj).not.toBe("")
    })

    it("acceptă un mesaj de exact 10 caractere", () => {
        expect(validate({ ...valid, mesaj: "1234567890" }).mesaj).toBe("")
    })
})
