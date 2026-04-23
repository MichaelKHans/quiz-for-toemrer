# 📜 Projekt Log - Tømrer Quiz

Her trackes alle ændringer, forbedringer og rettelser foretaget i projektet.

## [v4.4.2] - 2026-04-23
### 🚀 Tilføjet
- **Pixabay Billedmotor:** Migreret fra LoremFlickr til Pixabay API. Dette sikrer 100% stabile, faste og professionelle bygge-billeder, der aldrig ændrer sig uventet.
- **Synligheds-kontrol (Live Mode Forberedelse):** Lærere kan nu nemt 'Skjule' eller 'Gøre Synlig' quizzer fra forsiden med et enkelt klik i oversigten, så de kan gemmes til live-undervisning (f.eks. Kahoot-style).
- **Hurtig-Gem:** Tilføjet en fast 'Gem alle ændringer' knap i toppen af admin-panelet for bedre workflow.

### 🔧 Rettet
- **Design:** Lysnet 'mood-billederne' på forside-kortene markant for bedre visuelt udtryk.

---

## [v4.3.1] - 2026-04-22
### 🚀 Tilføjet
- **AI-Scenarier:** Nyt felt i AI-generatoren til specifikke ønsker og scenarier, hvilket giver langt mere præcise og fagrelevante quizzer.
- **Billed-synergi:** AI'en foreslår nu automatisk søgeord i både dansk og engelsk, der passer til emnet.

## [v4.3.0] - 2026-04-22
### 🚀 Tilføjet
- **Katte-sikring:** Implementeret avancerede fallbacks i billedmotoren. Hvis et specifikt ord ikke findes, vises generelle bygge-billeder fremfor den klassiske "kat".
- **Bredere Søgealgoritme:** Billedsøgningen bruger nu op til 4 tags for at sikre bedre match.

---

## [v4.2.0] - 2026-04-22
### 🚀 Tilføjet
- **Dansk Billed-søgning:** Nyt felt i editoren der automatisk oversætter danske ord til engelsk for at finde relevante billeder.
- **Massiv Fagordbog:** Tilføjet over 50 tømrer-faglige termer (trapper, vinduer, byggeplads, isolering mv.) til den interne oversætter.
- **Dansk Hukommelse:** Systemet gemmer nu dine danske søgeord, så du altid kan se hvad du søgte på sidst.

---

## [v4.1.0] - 2026-04-22
### 🚀 Tilføjet
- **Ren Cloud-synkronisering:** Quiz-indhold hentes nu udelukkende fra Firebase. Lokal lagring bruges nu kun til elevernes egne resultater.
- **Admin Loading State:** Tilføjet visuel indikator ("Henter data..."), når admin-panelet åbnes, så man altid ved, at man redigerer den nyeste version.

### 🔧 Rettet
- **Synkroniserings-fejl:** Løst problem hvor rettelser foretaget på én computer ikke dukkede op på en anden pga. lokal caching.
- **Image Lock Sync:** URL'er til de låste billeder gemmes nu direkte i skyen og synkroniseres på tværs af alle enheder.
- **Scroll-hukommelse:** Fikset fejl hvor admin-panelet "hoppede" eller nulstillede scroll-positionen ved rettelser eller billed-skift. Bruger nu `requestAnimationFrame` for stabil visning.

---

## [v4.0.0] - 2026-04-21
### 🚀 Tilføjet
- **UX Stabilisering:** Implementeret scroll-hukommelse i admin-panelet, så man ikke mister sin position ved rettelser.
- **Visuel Kontrast:** Forbedret synlighed af knapper og slette-funktioner.

---

## [v3.4.0] - 2026-04-21
### 🚀 Tilføjet
- **Power AI Prompt:** Ny kommando til ChatGPT der tvinger den til at lave quizzer på svendeprøve-niveau.
- **Teknisk Dybde:** AI'en bedes nu om realistiske distraktorer (forkerte svar) og obligatoriske faglige begrundelser (`rationale`).

### 🔧 Rettet
- **Robust Import:** Import-funktionen i admin-panelet er nu fejltolerant. Den kan håndtere hvis AI'en bruger andre navne for felterne (som f.eks. `answers` i stedet for `options`).
- **Fix:** Rettet fejlen `Cannot read properties of undefined (reading 'map')` ved import af AI-quizzer.

---

## [v3.3.1] - 2026-04-21
### 🔧 Rettet
- **Caching:** Tvungen versions-opdatering for at sikre, at alle brugere ser nyeste funktioner med det samme.

---

## [v3.3.0] - 2026-04-21
### 🚀 Tilføjet
- **Firebase integration:** Systemet kører nu 100% i skyen.
- **Nyt Design:** Dashboard-kort har fået dynamiske baggrundsbilleder.

---

*Denne log opdateres løbende ved hver ændring.*
