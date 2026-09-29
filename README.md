# DeratPro – landing page

Landing page pentru **DeratPro**, o firmă fictivă de deratizare, dezinsecție și dezinfecție din București și Ilfov. Proiect realizat pentru task-ul de Junior Fullstack de la EMIR.

**Demo live:** https://deratpro-five.vercel.app

## Cum rulezi proiectul

Ai nevoie de Node.js 20 sau mai nou.

```bash
npm install
npm run dev
```

Site-ul pornește pe [http://localhost:3000](http://localhost:3000).

Alte comenzi:

```bash
npm run build   # build de productie
npm start       # ruleaza build-ul de productie
npm run lint    # verificare ESLint
```

## Stack

| Tehnologie | De ce |
|---|---|
| **Next.js 16** (App Router) + **React 19** | Pagina e generată static la build, deci HTML-ul complet ajunge direct în browser (bun pentru SEO și primul afișaj). Am optimizări incluse pentru imagini (`next/image`) și fonturi (`next/font`), iar deploy-ul pe Vercel e direct. |
| **TypeScript** | Tipuri pentru date (servicii, avantaje, pași) și pentru componente. Greșelile apar la scriere, nu în browser. |
| **Tailwind CSS v4** | Designul din Stitch a fost exportat tot în Tailwind. Culorile și fonturile sunt definite o singură dată, în `@theme`, și refolosite peste tot. |
| **Three.js** + **@react-three/fiber** | Animația din hero. Fiber îmi permite să scriu scena ca pe o componentă React. |
| **lucide-react** | Iconițe line-art, în același stil cu designul. |
| **Vercel** | Hosting gratuit, cu deploy automat la fiecare push pe GitHub. |

Formularul de contact are validare scrisă de mână, cu `useState`. Pentru trei câmpuri nu merita o librărie.

## Design: Google Stitch

Designul a fost generat cu **[Google Stitch](https://stitch.withgoogle.com)**, pornind de la un design de inspirație de pe Dribbble: [PureClean – Professional Cleaning Service Landing Page](https://dribbble.com/shots/27012712-Professional-Cleaning-Service-Landing-Page) (Adrian Gancarek). Am atașat o captură a lui la prompt.

Promptul inițial:

```
vreau un landing page pt DeratPro, o firma de deratizare, dezinsectie si dezinfectie pt case si firme. sa inspire incredere si sa aduca cereri de oferta
stilul inspirat din designul atasat: hero inchis la culoare, restul paginii deschis, bej/alb cald. culori verde inchis, crem si galben ca accent pt butoane si cateva cuvinte din titluri scrise in italic galben. font modern, titluri mari, mult spatiu liber, colturi usor rotunjite
sectiuni:
1. hero pe fundal verde foarte inchis, cu loc pt o animatie 3d in loc de poza. navbar sus cu logo, linkuri si buton "Cere o oferta". titlu mare cu un cuvant in italic galben, un text scurt si butonul principal. sub hero un rand cu 4 avantaje mici cu iconite
2. servicii - 3 carduri: deratizare, dezinsectie, dezinfectie, fiecare cu iconita, titlu si descriere scurta
3. de ce DeratPro - interventie rapida, substante avizate, personal autorizat, garantie. si cateva cifre mari gen 97% clienti multumiti
4. cum functioneaza - 3 pasi numerotati: ne suni, evaluare, interventie
5. contact - formular cu nume, telefon, mesaj si langa el telefon, email, program
footer simplu. textele in romana. vreau si varianta de mobil
```

Prima variantă a ieșit prea încărcată: badge-uri deasupra secțiunilor, prețuri și liste pe carduri, un font monospace și mai multe secțiuni decât cele cerute. Așa că am refăcut promptul de la zero, mai strict:

```
vreau un landing page pt DeratPro, o firma de deratizare, dezinsectie si dezinfectie pt case si firme. sa inspire incredere si sa aduca cereri de oferta

stilul inspirat din designul atasat (PureClean): hero inchis la culoare, restul paginii deschis, crem/alb cald. culori verde oliv inchis, crem si galben mustar ca accent pt butoane. doar 2 fonturi: unul sans modern pt text si un serif italic doar pt 1-2 cuvinte accentuate din titluri. fara font monospace. titluri mari, text lizibil, descrieri scurte, mult spatiu liber, colturi usor rotunjite. fara poze cu gandaci sau soareci, fara termenul DDD, fara badge-uri si etichete in chenar deasupra sectiunilor

doar 5 sectiuni:
1. hero pe fundal verde oliv foarte inchis. navbar simplu sus cu logo, linkuri spre sectiuni si buton "Cere o oferta". pe desktop text in stanga si in dreapta un spatiu gol pt o animatie 3d pe care o fac eu (nu pune nimic acolo). titlu scurt cu un cuvant in italic, un rand de text si butonul principal
2. servicii - 3 carduri pe desktop unul langa altul: deratizare, dezinsectie, dezinfectie. fiecare doar cu iconita, titlu si 2 randuri descriere. fara preturi, liste sau butoane
3. de ce DeratPro - 4 avantaje cu iconite: interventie rapida, substante avizate, personal autorizat, garantie. sub ele un singur rand cu 3 cifre
4. cum functioneaza - 3 pasi numerotati, pe desktop pe orizontala: ne suni, evaluare, interventie
5. contact - formular doar cu nume, telefon si mesaj, iar langa el telefon, email si program

footer simplu. textele in romana

vreau varianta de desktop care sa foloseasca toata latimea ecranului si varianta de mobil unde totul e pe o coloana
```

Apoi am mai trimis câteva prompturi scurte de corectură: navbar-ul pe tabletă, butonul de ofertă, textele prea mici și secțiunea hero. Designul din Stitch a fost punctul de plecare. În implementare am schimbat mai multe lucruri, de exemplu:
- am adăugat fotografia din hero și animația;
- am adăugat tema dark;
- am mutat butonul de ofertă într-unul plutitor;
- am adăugat pe fiecare card de serviciu ce tratăm și unde intervenim;
- am adăugat certificările și zona deservită.

Paleta finală: verde închis `#0F2318`, crem `#F2ECDF` și muștar `#E5A93C`. Fonturile sunt **Plus Jakarta Sans** pentru text și **Playfair Display** italic pentru cuvintele accentuate.

## Structura

```
app/
  layout.tsx        fonturi, metadate, tema salvata (fara "clipire" la incarcare)
  page.tsx          pagina: pune sectiunile una sub alta
  globals.css       culorile si fonturile (@theme), tema dark, animatiile la scroll
  icon.svg          favicon (logo-ul)
components/
  Navbar.tsx        meniu, cu hamburger pe telefon si tableta
  Hero.tsx          sectiunea hero
  HeroClean.tsx     incarca animatia three.js abia dupa ce pagina e afisata
  HeroCleanScene.tsx  animatia three.js (shadere, masca, nebulizatorul)
  HeroHint.tsx      indiciul "trece cu mouse-ul" (doar pe calculator)
  Services.tsx      cele 3 servicii
  WhyUs.tsx         avantaje, cifre si certificari
  Stats.tsx, CountUp.tsx   cifrele care "numara" cand apar pe ecran
  HowItWorks.tsx    cei 3 pasi
  Contact.tsx       formularul, cu validare si confirmare
  Footer.tsx
  FloatingOffer.tsx butonul plutitor "Ofertă"
  ThemeToggle.tsx   comutatorul light/dark
  RevealOnScroll.tsx  aparitia elementelor la scroll
data/
  date.ts           toate textele (servicii, avantaje, pasi, contact), cu tipuri
```

Fiecare secțiune are componenta ei, iar textele stau separat, în `data/date.ts`, și sunt afișate cu `.map()`. Ca să schimbi un serviciu sau un pas, modifici doar datele.

## Animația din hero

Ideea: firma curăță, deci poza din hero **se curăță** sub ochii vizitatorului.

- **Pe calculator:** poza apare murdară, cu praf, pete și o tentă cenușie. Se curăță pe unde treci cu mouse-ul, cu scântei mici pe urma cursorului. Ce ștergi rămâne curat până la refresh.
- **Pe telefon și tabletă:** hero-ul pornește verde închis. Din colțul din stânga-sus intră lancea unui **nebulizator** (construit din forme simple în Three.js, fără model descărcat). Lancea pulverizează ceață pe diagonală, iar unde se așază ceața apare poza. Animația rulează o singură dată, cam 6–7 secunde.

Cum funcționează tehnic:
- Murdăria e calculată **o singură dată** într-o textură. Să calculez petele pentru fiecare pixel la fiecare cadru era prea greu pentru telefoane.
- Zona curățată e o **mască** desenată direct pe placa video, cu „ștampile” moi de burete sau de ceață.
- Shader-ul de la fiecare cadru doar amestecă poza murdară cu cea curată, după mască. Tot el desenează stratul verde care păstrează textul lizibil.
- Canvas-ul desenează **doar când se mișcă ceva** (`frameloop="demand"`) și se oprește complet când hero-ul iese din ecran.
- Three.js se încarcă separat, **după** ce pagina e afișată. Pe telefon randez la rezoluție mai mică și la ~30 de cadre pe secundă.
- Dacă ai setat „reducerea animațiilor” în sistem, poza se vede direct, fără efect.

## Decizii și compromisuri

- **Animații diferite pe calculator și pe telefon.** Pe telefon, ștersul cu degetul se confunda cu scroll-ul paginii și era greu de folosit, așa că acolo animația e automată. Înainte de nebulizator am încercat o ștergere automată simplă și un trafalet, dar trafaletul ducea cu gândul la zugrăvit, nu la dezinfecție.
- **Performance ~75 pe mobil în Lighthouse.** Scorul mai mic vine din Total Blocking Time (~1 s): încărcarea Three.js și pregătirea shaderelor pe un telefon slab simulat. Am testat o variantă cu animația pornită cu câteva secunde mai târziu. Scorul creștea, dar hero-ul rămânea prea mult timp gol, așa că am ales experiența vizuală. Accessibility, Best Practices și SEO sunt la 100.
- **Formularul nu trimite nimic.** Validează numele, telefonul (format românesc: `07xxxxxxxx` sau `+407xxxxxxxx`) și mesajul, apoi afișează confirmarea. Pentru un site real ar trebui un backend sau un serviciu de email (de exemplu Resend sau Formspree), plus protecție anti-spam.
- **Next.js în loc de Vite.** Am pornit cu Vite, apoi am trecut pe Next.js pentru HTML generat la build, optimizarea automată a imaginilor și a fonturilor și favicon-ul generat din SVG.
- **Tema dark.** Respectă setarea sistemului, iar alegerea se salvează în browser. Tema se aplică înainte să apară pagina, ca să nu „clipească” din alb în negru.
- **Accesibilitate.** Contrast verificat, erorile din formular sunt anunțate cititoarelor de ecran (`aria-live`, `aria-invalid`), meniul mobil se închide cu Escape, iar animațiile respectă „reduce motion”.
- **Firma e fictivă.** Telefonul, emailul, cifrele și certificările sunt exemple, iar link-urile spre rețelele sociale duc nicăieri (`#`).

## Resurse

- Inspirație design: [PureClean](https://dribbble.com/shots/27012712-Professional-Cleaning-Service-Landing-Page), de Adrian Gancarek
- Fotografia din hero: *[de completat: sursa și licența fotografiei]*
- Iconițe: [Lucide](https://lucide.dev)
- Fonturi: Plus Jakarta Sans și Playfair Display (Google Fonts, prin `next/font`)
- Logo-ul și favicon-ul: desenate în SVG pentru proiect
