export type NavLink = {
  label: string
  href: string
}

export type Service = {
  title: string
  description: string
  targets: string[] // ce tratam
  places: string[] // unde intervenim
}

export type Advantage = {
  title: string
  description: string
}

export type Stat = {
  value: string
  label: string
}

export type Step = {
  title: string
  description: string
}

export type ContactInfo = {
  phoneDisplay: string
  phoneHref: string
  email: string
  schedule: string
  area: string
}

export const navLinks: NavLink[] = [
  { label: 'Servicii', href: '#servicii' },
  { label: 'De ce noi', href: '#de-ce-noi' },
  { label: 'Cum funcționează', href: '#cum-functioneaza' },
  { label: 'Contact', href: '#contact' },
]

export const services: Service[] = [
  {
    title: 'Deratizare',
    description: 'Eliminăm șoarecii și șobolanii cu stații de momire sigure și monitorizate.',
    targets: ['șoareci', 'șobolani', 'cârtițe'],
    places: ['case', 'blocuri', 'depozite', 'restaurante'],
  },
  {
    title: 'Dezinsecție',
    description: 'Scăpăm locuința sau afacerea de gândaci, ploșnițe, furnici și alte insecte.',
    targets: ['gândaci', 'ploșnițe', 'purici', 'viespi'],
    places: ['apartamente', 'hoteluri', 'restaurante', 'birouri'],
  },
  {
    title: 'Dezinfecție',
    description: 'Igienizăm suprafețele și aerul, eliminând bacteriile, virusurile și mucegaiul.',
    targets: ['bacterii', 'virusuri', 'mucegai'],
    places: ['clinici', 'școli', 'birouri', 'spații comerciale'],
  },
]

export const advantages: Advantage[] = [
  {
    title: 'Intervenție rapidă',
    description: 'Ajungem la tine în maximum 2 ore de la apel.',
  },
  {
    title: 'Substanțe avizate',
    description: 'Produse sigure pentru oameni și animale de companie.',
  },
  {
    title: 'Personal autorizat',
    description: 'Specialiști certificați, instruiți constant.',
  },
  {
    title: 'Garanție inclusă',
    description: 'Revenim gratuit dacă problema reapare în 30 de zile.',
  },
]

export const stats: Stat[] = [
  { value: '98%', label: 'Rată de succes la prima intervenție' },
  { value: '10.000+', label: 'Spații protejate și igienizate' },
  { value: '30 zile', label: 'Garanție la fiecare tratament' },
]

export const steps: Step[] = [
  {
    title: 'Ne suni și evaluăm',
    description: 'Ne spui problema, iar noi îți oferim o estimare gratuită.',
  },
  {
    title: 'Intervenim',
    description: 'Aplicăm tratamentul potrivit, rapid și discret.',
  },
  {
    title: 'Spațiu curat, garantat',
    description: 'Primești proces verbal, recomandări și garanția lucrării.',
  },
]

export const contactInfo: ContactInfo = {
  phoneDisplay: '0720 000 000',
  phoneHref: 'tel:0720000000',
  email: 'contact@deratpro.ro',
  schedule: 'Luni–Vineri 07:00–22:00, Sâmbătă–Duminică 08:00–20:00',
  area: 'București și Ilfov',
}
