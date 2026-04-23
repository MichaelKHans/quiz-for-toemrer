# 📜 Projekt Log - Tømrer Quiz

Her trackes alle ændringer, forbedringer og rettelser foretaget i projektet.

## [v4.8.0] - 2026-04-23
### 🚀 Tilføjet
- **Den Store Kahoot-Opgradering:** Live-modulet er nu komplet med fuldskærms-layout, timer og lydeffekter.
- **Podium & Vinder-fejring:** Automatisk beregning af top 3 spillere og visning på et flot podium ved quiz-afslutning.
- **Multimedia:** Tilføjet lydeffekter for rigtige/forkerte svar og spændingsmusik under nedtælling.
- **Mobile-First Design:** Gigantiske, farvekoordinerede svarknapper til eleverne for bedre spiloplevelse på mobilen.
- **Lærer-Dashboard:** Genskabt lærerens spil-view med gigantiske spørgsmål og billeder til projektor-brug.
- **Firebase Live-Sync:** Sessioner oprettes nu direkte i Firebase Realtime Database under `live_sessions/`.

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
