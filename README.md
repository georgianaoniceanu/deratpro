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

## Design: de la Dribbble la Google Stitch

**1. Inspirația.** Am căutat pe Dribbble landing page-uri pentru firme de curățenie și am ales [PureClean – Professional Cleaning Service Landing Page](https://dribbble.com/shots/27012712-Professional-Cleaning-Service-Landing-Page) (Adrian Gancarek). Mi-au plăcut hero-ul închis la culoare, restul paginii în tonuri calde, deschise, și cuvintele accentuate în italic. E un stil curat, care inspiră încredere, adică exact ce trebuie să transmită o firmă de dezinsecție.

**2. Tool-ul de design AI: [Google Stitch](https://stitch.withgoogle.com).** Am scris promptul pentru DeratPro și am atașat o captură cu designul PureClean, ca Stitch să aibă o direcție vizuală clară.

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

**3. Iterația.** Prima variantă avea o direcție bună, dar mai multe probleme: o cutie „interactive 3D viewport” în hero, titluri scrise Cu Fiecare Cuvânt Cu Majusculă, galben greu de citit pe fundal deschis, o secțiune de servicii slabă și un navbar stricat pe tabletă și telefon. Al doilea prompt:

```
arata bine, mai am cateva modificari:

- in hero scoate cutia cu interactive 3d viewport. lasa doar spatiu liber pe fundal, fara chenar, ca animatia sa se imbine cu fundalul. pe mobil spatiul pt animatie sa fie mai mic sau in spatele textului
- titlurile scrise normal, doar prima litera mare (Spatii curate si fara daunatori, nu Spatii Curate Si Fara Daunatori)
- cuvantul in italic galben pastreaza-l doar in hero si la contact. in restul titlurilor fara italic
- pe fundal deschis cuvintele accentuate sa fie verde inchis, nu galben, ca sa se citeasca bine
- la de ce DeratPro avantajele fara carduri, doar iconita, titlu si text, ca sa arate diferit de servicii
- la cum functioneaza toti cei 3 pasi la fel si legati cu o linie intre ei
- la contact scoate adresa si textul mic cu autorizatiile
- titlurile sa nu se rupa urat pe 2 randuri

sectiunea de servicii nu arata bine, vreau sa o refac:
- titlu mai scurt, pe un singur rand, de ex "Serviciile noastre", cu un subtitlu scurt dedesubt
- titlul si subtitlul aliniate la stanga, la fel ca textul din carduri, nu centrate
- in carduri iconita mai mare, titlul mai mare si textul descrierii mai mare si mai inchis la culoare
- descrierile de aceeasi lungime, maxim 2 randuri, ca toate cardurile sa arate egal
- mai putin spatiu intre titlul sectiunii si carduri

navbarul nu merge pe tableta si telefon: pe tableta linkurile se rup pe 2 randuri si se suprapun, iar pe telefon dispar complet. vreau:
- sub 1024px linkurile ascunse si in locul lor o iconita de meniu hamburger
- la apasare un meniu care se deschide de sus sau pe tot ecranul, cu linkurile mari, butonul Cere o oferta si telefonul
- in navbar pe mobil raman doar logo-ul, butonul Cere o oferta si iconita de meniu
- arata-mi si cum arata meniul deschis pe telefon
```

**4. Din design în site funcțional.** Codul exportat din Stitch a fost doar referință, nu l-am copiat. Am luat din el paleta, fonturile, ierarhia și spațierile, apoi am construit pagina de la zero:
- câte o componentă pentru fiecare secțiune, cu textele separate în `data/date.ts`;
- layout responsive, verificat pe telefon, tabletă și desktop, plus meniu hamburger sub 1024px;
- formular cu validare reală și mesaj de confirmare;
- accesibilitate (contrast, etichete, `aria-*`, navigare din tastatură) și SEO (metadate, `lang="ro"`).

Am schimbat și adăugat față de design:
- fotografia din hero și animația Three.js;
- tema dark;
- butonul de ofertă mutat într-unul plutitor, care apare doar când hero-ul și formularul nu sunt pe ecran;
- pe fiecare card de serviciu, ce tratăm și unde intervenim;
- zona deservită și cifrele care „numără” când apar pe ecran;
- apariția lină a secțiunilor la scroll.

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
  WhyUs.tsx         avantaje si cifre
  Stats.tsx, CountUp.tsx   cifrele care "numara" cand apar pe ecran
  HowItWorks.tsx    cei 3 pasi
  Contact.tsx       formularul, cu validare si confirmare
  Footer.tsx        navigare, contact si retele sociale
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

### Cum am ajuns aici

1. **Bule de săpun.** Prima animație erau bule de săpun irizate care urcau lent și se spărgeau la hover sau la atingere. Am pus-o apoi pe toată pagina, în fundal, în spatele site-ului. Am renunțat la ea din trei motive:
   - era un efect decorativ, fără legătură cu deratizarea sau dezinsecția;
   - animația Three.js nu mai era în hero, cum cere tema;
   - concura cu efectul de ștergere. Am vrut o singură animație „wow”, care să spună povestea firmei, cu restul paginii în liniște în jurul ei.
2. **Ștergerea murdăriei cu mouse-ul sau degetul.** Pe calculator a mers bine de la început. Pe telefon, în schimb, avea două probleme: se bloca pe telefoanele mai slabe, iar ștersul cu degetul se confunda cu scroll-ul paginii. Am optimizat-o mult (murdăria calculată o singură dată, masca pe placa video, desenare doar la nevoie), dar interacțiunea cu degetul rămânea incomodă.
3. **Ștergeri automate pe telefon.** Am încercat pe telefon o ștergere automată: întâi un traseu în zigzag (arăta ca un șarpe și nu era intuitiv), apoi o bandă lată care curăța toată poza, apoi un trafalet 3D pe diagonală. Trafaletul arăta bine, dar ducea cu gândul la zugrăvit, nu la ce face firma.
4. **Nebulizatorul (varianta finală, pe telefon).** Nebulizarea e chiar tehnica folosită la dezinfecție și dezinsecție, deci animația arată meseria firmei. Pe calculator a rămas ștergerea cu mouse-ul, care e interactivă și funcționează bine acolo.

### Cum funcționează tehnic

- Murdăria e calculată **o singură dată** într-o textură. Să calculez petele pentru fiecare pixel la fiecare cadru era prea greu pentru telefoane.
- Zona curățată e o **mască** desenată direct pe placa video, cu „ștampile” moi de burete sau de ceață.
- Shader-ul de la fiecare cadru doar amestecă poza murdară cu cea curată, după mască. Tot el desenează stratul verde care păstrează textul lizibil.
- Canvas-ul desenează **doar când se mișcă ceva** (`frameloop="demand"`) și se oprește complet când hero-ul iese din ecran.
- Three.js se încarcă separat, **după** ce pagina e afișată. Pe telefon randez la rezoluție mai mică și la ~30 de cadre pe secundă.
- Dacă ai setat „reducerea animațiilor” în sistem, poza se vede direct, fără efect.

## Performanță (Lighthouse)

Măsurat pe site-ul de pe Vercel:

| | Performance | Accessibility | Best Practices | SEO |
|---|---|---|---|---|
| **Desktop** | 97 | 100 | 100 | 100 |
| **Mobil** | 75 | 100 | 100 | 100 |

Scorul mai mic pe mobil vine din animația Three.js. Pe un telefon slab simulat, încărcarea librăriei și compilarea shaderelor blochează pagina ~1 s (Total Blocking Time). Pe desktop, aceeași animație blochează doar ~150 ms.

Ca să reduc costul, Three.js se încarcă abia după ce pagina e afișată. Canvas-ul desenează doar când se mișcă ceva, iar pe telefon randez la rezoluție mai mică și la ~30 de cadre pe secundă.

**Compromisul:** dacă porneam animația cu câteva secunde mai târziu, scorul creștea. În schimb, pe telefon hero-ul rămânea gol prea mult timp. Am ales animația la timp și un scor mai mic pe mobil.

## Decizii și compromisuri

- **O singură animație, legată de mesaj.** Am renunțat la bulele de săpun, deși arătau bine, ca să rămână un singur efect principal, în hero, care spune povestea „spațiile tale rămân curate”.
- **Animații diferite pe calculator și pe telefon.** Pe calculator, ștersul cu mouse-ul e interactiv și merge fluid. Pe telefon, ștersul cu degetul se confunda cu scroll-ul și se bloca pe telefoanele slabe, așa că acolo animația e automată (nebulizatorul) și rulează o singură dată. Compromisul: pe telefon vizitatorul doar privește, nu interacționează.
- **Forme 3D simple în loc de modele descărcate.** Lancea nebulizatorului e construită din câțiva cilindri și un con în Three.js. Un model de pe Sketchfab ar fi avut câțiva MB, ar fi încetinit încărcarea pe telefon și ar fi cerut atribuirea autorului.
- **Performance mai mic pe mobil, în schimbul animației.** Detalii în secțiunea [Performanță (Lighthouse)](#performanță-lighthouse).
- **Formularul nu trimite nimic.** Validează numele, telefonul (format românesc: `07xxxxxxxx` sau `+407xxxxxxxx`) și mesajul, apoi afișează confirmarea. Pentru un site real ar trebui un backend sau un serviciu de email (de exemplu Resend sau Formspree), plus protecție anti-spam.
- **Next.js în loc de Vite.** Am pornit cu Vite, apoi am trecut pe Next.js pentru HTML generat la build, optimizarea automată a imaginilor și a fonturilor și favicon-ul generat din SVG.
- **Tema dark.** Respectă setarea sistemului, iar alegerea se salvează în browser. Tema se aplică înainte să apară pagina, ca să nu „clipească” din alb în negru.
- **Accesibilitate.** Contrast verificat, erorile din formular sunt anunțate cititoarelor de ecran (`aria-live`, `aria-invalid`), meniul mobil se închide cu Escape, iar animațiile respectă „reduce motion”.
- **Firma e fictivă.** Telefonul, emailul și cifrele sunt exemple, iar link-urile spre rețelele sociale duc la paginile principale ale Instagram, Facebook și TikTok.

## Resurse

- Inspirație design: [PureClean](https://dribbble.com/shots/27012712-Professional-Cleaning-Service-Landing-Page), de Adrian Gancarek
- Fotografia din hero: [Pexels – „A person in white coverall cleaning the black table”](https://www.pexels.com/photo/a-person-in-white-coverall-cleaning-the-black-table-4098322/), cu licența Pexels (gratuită, fără atribuire obligatorie). Am decupat-o pe orizontală și am comprimat-o pentru web.
- Iconițe: [Lucide](https://lucide.dev)
- Fonturi: Plus Jakarta Sans și Playfair Display (Google Fonts, prin `next/font`)
- Logo-ul și favicon-ul: desenate în SVG pentru proiect
