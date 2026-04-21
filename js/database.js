/**
 * database.js
 * Central database for alle quizzer.
 */

window.QUIZ_DATABASE = {
  "categories": [
    {
      "id": "svampe",
      "title": "Svampe",
      "description": "Lær om svampe i byggeriet."
    },
    {
      "id": "arbejdsmiljoe",
      "title": "Arbejdsmiljø & Sikkerhed",
      "description": "Lær om sikkerhed på pladsen."
    }
  ],
  "quizzes": [
    {
      "id": "sikkerhed-og-logistik",
      "categoryId": "arbejdsmiljoe",
      "title": "Sikkerhed & Logistik",
      "description": "Fokus på byggepladsindretning, spærrejsning og risikovurdering.",
      "moodKeywords": "construction-safety,logistics",
      "moodImageLock": 1001,
      "questions": [
        {
          "question": "Hvordan prioriteres placeringen af oplagspladsen til hanebåndsspær på indretningsplanen mest sikkert?",
          "options": [
            "Placeres så kranen kan løfte dem direkte fra stakken til monteringsstedet uden at svinge over mandskab eller adgangsveje.",
            "Placeres tættest muligt på bygningen, så man manuelt kan rette på spærene, mens de hænger i kranen.",
            "Placeres samlet ét sted på grunden for at spare plads, selvom kranen derved skal arbejde tæt på dens maksimale rækkevidde."
          ],
          "correctIndex": 0,
          "rationale": "Korrekt. Minimering af kransving over færdselsarealer er afgørende for at mindske risikoen ved et eventuelt brud på løftegrej. Manuel styring af kranlast og arbejde ved max-rækkevidde er farligt."
        },
        {
          "question": "Hvem må i praksis foretage ændringer i indretningsplanens fællesområder, hvis en leverance kræver mere plads?",
          "options": [
            "Den enkelte entreprenør, så længe de hurtigt rydder op igen efter aflæsning.",
            "Kun arbejdsmiljøkoordinatoren eller byggeledelsen efter en vurdering af konsekvenserne for de øvrige firmaer.",
            "Kranføreren og den modtagende håndværker, da de har det bedste overblik over den aktuelle situation."
          ],
          "correctIndex": 1,
          "rationale": "Korrekt. Selvtægt på fællesområder skaber kaos i logistikken og kan blokere for redningsveje eller skabe farer for andre faggrupper."
        },
        {
          "question": "Under rejsning af de første hanebåndsspær er der endnu ikke monteret permanent afstivning. Hvordan sikres spærene mod væltning (domino-effekt)?",
          "options": [
            "Ved at lade kranen holde det sidst rejste spær under spænding, indtil det næste er klar til montering.",
            "Ved at sømme spærene hurtigt sammen med et enkelt bræt i toppen (rygningen) og stole på spærenes egenvægt.",
            "Ved brug af midlertidige skråafstivere og vandrette lægter, der fastgøres forsvarligt til en stabil del af bygningen eller terrænet."
          ],
          "correctIndex": 2,
          "rationale": "Korrekt. Midlertidig afstivning skal kunne optage vindlasten. En kran må aldrig bruges som statisk afstivning, og egenvægt sikrer ikke mod sidetryk."
        },
        {
          "question": "Arbejd tilsynet kræver faldsikring ved 2 meter. Hvornår bør man etablere sikring ved spærrejsning, selvom faldhøjden er lavere?",
          "options": [
            "Hvis der arbejdes over spidse genstande, armeringsjern eller materialer, der øger skadesrisikoen ved et fald.",
            "Kun hvis man arbejder alene på pladsen og ingen kan hjælpe, hvis man falder.",
            "Hvis man vurderer, at det tager kortere tid at montere sikringen end selve opgaven."
          ],
          "correctIndex": 0,
          "rationale": "Korrekt. Risikoen vurderes ikke kun på højde, men også på underlagets farlighed. Sikkerhed gælder uanset tidspres eller om man arbejder alene."
        },
        {
          "question": "En mobilkran skal opstilles til spærrejsning. Hvordan er den største risiko ved underlaget tæt på en nystøbt sokkel?",
          "options": [
            "At kranens vibrationer gør betonen i den nye sokkel porøs eller revner den.",
            "At jordtrykket fra kranens støtteben får soklen eller udgravningen til at skride sammen, så kranen vælter.",
            "At støttebenene laver mærker i terrænet, som er svære at udbedre for anlægsgartneren."
          ],
          "correctIndex": 1,
          "rationale": "Korrekt. Der skal holdes en sikkerhedsafstand til skråninger og udgravninger for at undgå jordbrud under kranens enorme tryk."
        },
        {
          "question": "Du opdager en lille 'vabe' (slidskade) på en løftestrop til spærene. Hvad gør du?",
          "options": [
            "Kasserer stroppen med det samme og destruerer den, så den ikke kan genbruges ved en fejl.",
            "Bruger den kun til de letteste spær og markerer den med tape, så man ved, den er svag.",
            "Binder en knude over det beskadigede sted for at forstærke stroppen."
          ],
          "correctIndex": 0,
          "rationale": "Korrekt. En beskadiget strop kan sprænge uden varsel. Man må aldrig bruge ødelagte stropper til 'lette' løft, og knuder nedsætter styrken fatalt."
        },
        {
          "question": "Hvorfor skal 'Plan for Sikkerhed og Sundhed' (PSS) indeholde en tidsplan over de forskellige faggruppers arbejde?",
          "options": [
            "For at undgå, at farlige arbejdsopgaver (f.eks. kranarbejde) foregår direkte over andre håndværkere.",
            "For at bygherren kan give dagbøder, hvis tømreren ikke er færdig med spærene til tiden.",
            "For at sikre, at der er nok parkeringspladser til alle biler på de travle dage."
          ],
          "correctIndex": 0,
          "rationale": "Korrekt. Tidsplanen er et vigtigt værktøj i PSS'en til at adskille farlige processer i tid, så faggrupperne ikke udgør en fare for hinanden."
        },
        {
          "question": "Hvordan sikres adgangsvejen for gående bedst på en plads med meget kran- og maskinkørsel?",
          "options": [
            "Ved at udlevere gule veste til alle og lære dem at have øjenkontakt med maskinførerne.",
            "Ved fysisk adskillelse med afspærring eller hegn, så gående aldrig skal krydse maskinernes faste ruter.",
            "Ved at opsætte skilte med 'Gående forbudt', når kranen er i gang, og ophæve det igen bagefter."
          ],
          "correctIndex": 1,
          "rationale": "Korrekt. Fysisk adskillelse er den mest pålidelige metode. Øjenkontakt svigter i blinde vinkler, og skiftende skiltning skaber forvirring."
        },
        {
          "question": "Hvad er den største risiko ved at placere skurvogne og velfærd tæt på byggegruben for at spare plads?",
          "options": [
            "Risikoen for at vognene skrider ned i gruben ved kraftigt regnvejr eller pga. vægten fra kraner i nærheden.",
            "At støv fra udgravningen gør frokoststuen beskidt og ødelægger indeklimaet.",
            "At de ansatte får for kort vej til arbejdet og glemmer at varme musklerne op."
          ],
          "correctIndex": 0,
          "rationale": "Korrekt. Midlertidige installationer som tunge skurvogne kræver stabilt underlag og stor sikkerhedsafstand til udgravninger for at undgå jordskred."
        },
        {
          "question": "Hvilken fejl begås oftest ved risikovurdering af spærrejsning med hanebåndsspær?",
          "options": [
            "Man glemmer at vurdere vægten af de søm, der skal bruges til fastgørelse.",
            "Man overvurderer kranførerens evne til at se alle håndværkere på taget.",
            "Man undervurderer vindens magt på de store spærflader og glemmer at fastsætte en maksimal vindhastighed for løftet."
          ],
          "correctIndex": 2,
          "rationale": "Korrekt. Et hanebåndsspær fungerer som et enormt sejl. Mange ulykker sker, fordi man ikke har taget højde for pludselige vindstød under løftet."
        },
        {
          "question": "Under spærrejsningen opstår der tvivl om signalgivningen til kranføreren. Hvad er den korrekte procedure?",
          "options": [
            "Alle på holdet råber og vinker, så kranføreren har mest muligt information fra alle vinkler.",
            "Kranføreren stopper alt arbejde, indtil der er udpeget én person som ansvarlig signalgiver med de korrekte tegn.",
            "Kranføreren kører efter eget skøn, da han har det bedste overblik fra kabinen."
          ],
          "correctIndex": 1,
          "rationale": "Korrekt. Kun én udpeget person må dirigere kranen. Flere signalgivere eller at køre efter 'eget skøn' fører til forvirring og potentielle klemulykker."
        },
        {
          "question": "I risikovurderingen for hanebåndsspær skal der tages stilling til 'nedstyrtning af genstande'. Hvilken forebyggelse er mest effektiv?",
          "options": [
            "At alle bærer hjelm og kigger op, når de hører kranen bevæge sig.",
            "At binde alt værktøj fast til tømrernes bælter med snore.",
            "Etablering af en afspærret sikkerhedszone under arbejdsområdet, hvor adgang er strengt forbudt under løft."
          ],
          "correctIndex": 2,
          "rationale": "Korrekt. Den sikreste metode er at forhindre, at der overhovedet er mennesker i nedfaldszonen. En hjelm redder dig ikke fra et nedstyrtende spær."
        },
        {
          "question": "Hvilken betydning har placeringen af containeren til byggeaffald på indretningsplanen?",
          "options": [
            "Den skal stå skjult bag skurvognene, så pladsen ser pæn og ryddelig ud for forbipasserende.",
            "Den skal placeres så tømnings-lastbilen ikke skal bakke ind gennem områder med gående trafik.",
            "Den skal placeres midt i byggefeltet, så håndværkerne skal gå kortest muligt med affaldet."
          ],
          "correctIndex": 1,
          "rationale": "Korrekt. Bakning med store køretøjer har massive blinde vinkler og er en af de hyppigste årsager til alvorlige påkørselsulykker."
        },
        {
          "question": "Ved montering af spær på remmen bruges ofte vinkelbeslag. Hvad er en kritisk sikkerhedsfejl her?",
          "options": [
            "At bruge almindelige skruer i stedet for de foreskrevne kamsøm eller beslagskruer.",
            "At montere beslagene på indersiden af spæret i stedet for ydersiden.",
            "At bruge beslag, der har ligget ude i regnvejr og er blevet våde."
          ],
          "correctIndex": 0,
          "rationale": "Korrekt. Almindelige skruer kan knække (sprødt brud) under den store forskydning fra vindlasten. Kamsøm og beslagskruer kan derimod tåle trækket."
        },
        {
          "question": "Efter 2 dage med indretning og risikovurdering: Hvad er det vigtigste dokument at have ved hånden, når spærrejsning starter?",
          "options": [
            "Kranførerens certifikat og kranens synsbog.",
            "Byggetilladelsen fra kommunen.",
            "Den specifikke risikovurdering for løftet, som alle involverede har fået instruktion i."
          ],
          "correctIndex": 2,
          "rationale": "Korrekt. En plan er kun noget værd, hvis holdet kender den. Instruktionen sikrer, at alle kender risici og ansvarsfordeling, før kranen løfter."
        }
      ]
    },
    {
      "id": "aegte-hussvamp",
      "categoryId": "svampe",
      "title": "Ægte Hussvamp",
      "description": "Lær om byggebranchens mest frygtede svamp og hvordan den behandles.",
      "moodKeywords": "dry-rot,fungi",
      "moodImageLock": 1002,
      "questions": [
        {
          "question": "Hvad er den mest unikke egenskab ved Ægte Hussvamp sammenlignet med andre trænedbrydende svampe?",
          "options": ["Den kan transportere vand over store afstande via tykke myceliestrenge.", "Den lever udelukkende af at nedbryde beton og mursten.", "Den trives kun, når træet er 100% under vand."],
          "correctIndex": 0,
          "rationale": "Korrekt. Ægte hussvamp kan hente vand flere meter væk gennem sine strenge for at fugte tørt træ op. Derfor er den så farlig og svær at stoppe."
        },
        {
          "question": "I casen findes svampen i fodremmen. Hvordan adskiller behandlingen af Ægte Hussvamp sig drastisk fra andre svampe?",
          "options": ["Man behøver kun at skrabe svampen af og male over med træbeskyttelse.", "Man skal fjerne puds, og murværket skal varmebehandles eller kemisk behandles i en sikkerhedszone.", "Man skal fjerne taget på bygningen for at give den sollys."],
          "correctIndex": 1,
          "rationale": "Korrekt. Da svampen gror gennem murværk for at finde træ og vand, kræver lovgivningen en meget aggressiv behandling af selve murværket."
        },
        {
          "question": "Hvilke miljøforhold trives Ægte Hussvamp bedst under?",
          "options": ["Direkte sollys og stærk træk.", "Stillestående, fugtig luft og moderat træfugt (ca. 20-30%).", "Frostgrader og meget høje temperaturer (over 40 grader)."],
          "correctIndex": 1,
          "rationale": "Korrekt. Den hader træk! Den trives bedst i lukkede rum med stillestående luft, som fx i krybekældre eller bag paneler."
        },
        {
          "question": "Hvilken type råd forårsager Ægte Hussvamp på selve træværket?",
          "options": ["Brunmuld, hvor træet sprækker i store terninger og kan knuses til støv.", "Hvidmuld, hvor træet bliver trevlet og blødt.", "Den skaber ikke råd, den misfarver kun overfladen."],
          "correctIndex": 0,
          "rationale": "Korrekt. Den nedbryder træets cellulose, hvilket efterlader ligninen. Dette får træet til at sprække i dybe, karakteristiske terninger (brunmuld)."
        }
      ]
    },
    {
      "id": "gul-toemmersvamp",
      "categoryId": "svampe",
      "title": "Gul Tømmersvamp",
      "description": "Fokus på kældersvampen og dens påvirkning af bjælkelag.",
      "moodKeywords": "fungi,decay",
      "moodImageLock": 1003,
      "questions": [
        {
          "question": "Svampen er fundet i bjælkelaget. Hvad er oftest den primære årsag til Gul Tømmersvamp?",
          "options": ["At der har været en kortvarig, lille lækage for 10 år siden.", "At der er en høj og kronisk fugtpåvirkning, fx fra utætte rør, opstigende grundfugt eller indtrængende vand.", "At rummet bliver opvarmet for meget om vinteren."],
          "correctIndex": 1,
          "rationale": "Korrekt. Gul tømmersvamp kaldes også 'kældersvamp' og kræver høj fugtighed (ofte over 30% træfugt) for at overleve."
        },
        {
          "question": "Hvordan ser myceliet fra Gul Tømmersvamp typisk ud, når man opdager det?",
          "options": ["Som et stort, tykt hvidmuld skum, der ligner vat.", "Som tynde, trådlignende strenge, der starter lyse men hurtigt bliver mørkebrune/sorte.", "Som små, grønne og lodne pletter på overfladen af træet."],
          "correctIndex": 1,
          "rationale": "Korrekt. De tynde mørkebrune til sorte strenge, der spreder sig rod-agtigt, er et klassisk kendetegn."
        },
        {
          "question": "Skal murværk omkring skaden varmebehandles eller kemisk renses, som ved Ægte Hussvamp?",
          "options": ["Nej, det er oftest nok at fjerne fugtkilden og udskifte det nedbrudte træ.", "Ja, den er præcis lige så aggressiv i murværk som Ægte Hussvamp.", "Ja, men kun hvis der er tapet på væggen."],
          "correctIndex": 0,
          "rationale": "Korrekt. Gul tømmersvamp kan vokse på murværk, men kan ikke overleve uden direkte fugtkilde. Stopper man fugten, dør svampen."
        },
        {
          "question": "Hvilken skade gør den ved træet i bjælkelaget?",
          "options": ["Træet bliver ekstremt hårdt og kan ikke saves i.", "Den laver overfladiske pletter, men ødelægger ikke bæreevnen.", "Den forårsager brunmuld, og træet mister hurtigt sin bæreevne."],
          "correctIndex": 2,
          "rationale": "Korrekt. Ligesom hussvampen danner den brunmuld, og bjælkerne kan hurtigt blive livsfarlige på grund af manglende styrke."
        }
      ]
    },
    {
      "id": "alternaria",
      "categoryId": "svampe",
      "title": "Alternaria (Skimmel)",
      "description": "Lær om skimmelsvamp på indvendige kviste og overflader.",
      "moodKeywords": "mold,fungi",
      "moodImageLock": 1004,
      "questions": [
        {
          "question": "I finder Alternaria indvendigt på tagkvistene. Hvilken type svamp er dette?",
          "options": ["En trænedbrydende svamp.", "En skimmelsvamp.", "En mørkfarvet hussvamp."],
          "correctIndex": 1,
          "rationale": "Korrekt. Alternaria er en udbredt skimmelsvamp. Den lever af overfladisk organisk materiale og fugt."
        },
        {
          "question": "Hvorfor opstår Alternaria netop ofte på indvendige sider af kviste eller ved vinduesrammer?",
          "options": ["Fordi solen skinner direkte på dem, og svampen elsker varme.", "Fordi det ofte er kuldebroer, hvor den varme, fugtige indeluft kondenserer og skaber overfladefugt.", "Fordi træet i kviste altid er af dårligere kvalitet."],
          "correctIndex": 1,
          "rationale": "Korrekt. Skimmelsvamp kræver ikke gennemvådt træ, men trives perfekt på kondensvand på kolde flader."
        },
        {
          "question": "Hvilke typiske symptomer kan Alternaria forårsage hos mennesker?",
          "options": ["Allergiske reaktioner, astma, irriterede øjne og luftvejsproblemer.", "Forhøjet blodtryk og mavesår.", "Hårtab og nedsat hørelse."],
          "correctIndex": 0,
          "rationale": "Korrekt. Alternaria spreder sporer og mykotoksiner, som ofte trigger allergi og astma."
        },
        {
          "question": "Hvordan udbedres og forebygges dette angreb på kvisten bedst muligt?",
          "options": ["Man dækker det med plastik.", "Overfladerne afrenses/desinficeres, og fremadrettet sikres bedre ventilation og opvarmning.", "Man skifter hele kvistens konstruktion."],
          "correctIndex": 1,
          "rationale": "Korrekt. Skimmelsvamp er kun på overfladen og skal afrenses. For at det ikke kommer igen, skal kondens-cyklussen brydes."
        }
      ]
    },
    {
      "id": "cladosporium",
      "categoryId": "svampe",
      "title": "Cladosporium (Skimmel)",
      "description": "Forstå de sorte prikker og pletter på lofter og kolde overflader.",
      "moodKeywords": "mold,fungi",
      "moodImageLock": 1005,
      "questions": [
        {
          "question": "Svampen er fundet på loftrummet. Hvad er det primære kendetegn ved dens påvirkning af spærene?",
          "options": ["Den nedbryder lynhurtigt træets bæreevne.", "Den laver hvide, vat-lignende tråde.", "Den skaber misfarvninger (ofte små sorte prikker), men nedbryder IKKE træets bæreevne."],
          "correctIndex": 2,
          "rationale": "Korrekt. Cladosporium er en skimmelsvamp. Den æder kun overfladisk næring og fugt, og rører ikke ved træets strukturelle styrke."
        },
        {
          "question": "Hvad er den mest sandsynlige årsag til, at skimmelsvamp som Cladosporium opstår på et koldt loftrum?",
          "options": ["At fugtig varme fra beboelsen trænger op (manglende/utæt dampspærre) og kondenserer på det kolde undertag.", "At der er for mange udluftningsventiler i gavlene.", "At tagstenene er blevet for varme om sommeren."],
          "correctIndex": 0,
          "rationale": "Korrekt. Damp fra mennesker stiger op i det kolde loftrum og skaber kondens."
        },
        {
          "question": "Hvordan spreder svampen sig, og hvorfor kan den gøre håndværkerne syge under renoveringen?",
          "options": ["Den afgiver en usynlig, giftig gasart.", "Den spreder sig via mikroskopiske sporer i luften, som indåndes og skaber irritation i luftvejene.", "Den smitter ved direkte hudkontakt."],
          "correctIndex": 1,
          "rationale": "Korrekt. Skimmelsvampe kaster millioner af luftbårne sporer. Ved nedrivning hvirvles de op (kræver P3 støvmaske)."
        },
        {
          "question": "Hvordan forebygger man bedst skimmelsvamp på kolde lofter i forbindelse med renoveringen?",
          "options": ["Ved at sørge for en fuldstændig tæt dampspærre ned mod beboelsen og tilstrækkelig ventilation af tagrummet.", "Ved at male hele loftrummet med sort maling.", "Ved at lukke alle huller og udluftninger helt til."],
          "correctIndex": 0,
          "rationale": "Korrekt. Tæt dampspærre holder fugten inde i huset, og ventilation på loftet fjerner den fugt, der alligevel slipper derop."
        }
      ]
    },
    {
      "id": "hvid-toemmersvamp",
      "categoryId": "svampe",
      "title": "Hvid Tømmersvamp",
      "description": "Svampen under badeværelset og i lukkede konstruktioner.",
      "moodKeywords": "fungi,mold",
      "moodImageLock": 1006,
      "questions": [
        {
          "question": "I finder skaden under badeværelsesgulvet. Hvorfor er netop denne placering typisk for Hvid Tømmersvamp?",
          "options": ["Den elsker fliser og klinker at vokse på.", "Den trives i skjulte, lukkede konstruktioner med konstant og høj fugtpåvirkning (fx en utæt faldstamme).", "Den vokser kun i rum med gulvvarme."],
          "correctIndex": 1,
          "rationale": "Korrekt. Hvid tømmersvamp foretrækker meget vådt træ og findes oftest under bad, flade tage and i utætte krybekældre."
        },
        {
          "question": "Selvom navnet er 'Hvid Tømmersvamp', hvilken farve har selve råddet i træet så?",
          "options": ["Det er hvidmuld (lyst og trevlet).", "Det er grønt og slimet.", "Det er brunmuld (mørkt og sprækker i terninger)."],
          "correctIndex": 2,
          "rationale": "Korrekt. Navnet 'hvid' kommer fra svampens mycelium og frugtlegemer, men den forårsager brunmuld."
        },
        {
          "question": "Hvordan ser frugtlegemet på Hvid Tømmersvamp ofte ud, når man fjerner gulvet?",
          "options": ["Som en stor brun paddehat med hat og stok.", "Som et fladt, hvidt/cremefarvet lag med fine porer, der ligger smurt ud på træet.", "Som lange, gule rødder, der hænger ned fra loftet."],
          "correctIndex": 1,
          "rationale": "Korrekt. Frugtlegemet sidder ofte klemt fast i revnerne på træet eller bagsiden af brædderne som et hvidligt, blødt lag."
        },
        {
          "question": "Hvad er den afgørende udbedring for at stoppe angrebet?",
          "options": ["At sprøjte med klorin og lade gulvet ligge.", "At stoppe fugtkilden (reparere afløbet), fjerne det nedbrudte træ og sørge for udtørring af konstruktionen.", "At udskifte alt træ i en radius af 5 meter og mure området til."],
          "correctIndex": 1,
          "rationale": "Korrekt. Hvid Tømmersvamp dør, når den udtørres. Reparation af fugtkilden og udskiftning af sygt træ er vejen frem."
        }
      ]
    },
    {
      "id": "korkhat",
      "categoryId": "svampe",
      "title": "Korkhat",
      "description": "Den lumske svamp der æder tagkonstruktioner indefra.",
      "moodKeywords": "fungi,rot",
      "moodImageLock": 1007,
      "questions": [
        {
          "question": "I finder Korkhat i tagets spær. Hvad er helt specielt ved denne svamps krav til temperatur?",
          "options": ["Den dør øjeblikkeligt, hvis temperaturen kommer over 20 grader.", "Den kan tåle meget høje temperaturer (op til 60-70 grader) og trives i direkte opvarmede zoner som mørke tage.", "Den trives kun, hvis det fryser mindst en gang om måneden."],
          "correctIndex": 1,
          "rationale": "Korrekt. Korkhatte vokser ofte på sydvendte vinduer og tagkonstruktioner, fordi de kan klare de ekstreme temperaturer fra solen."
        },
        {
          "question": "Hvad er en anden meget speciel overlevelsesmekanisme, som Korkhatten har i forhold til vand?",
          "options": ["Den overlever perioder med total udtørring ved at gå i dvale og vågner lynhurtigt til live, når det regner igen.", "Den suger vand ind fra luften og kan leve udelukkende af luftfugtighed.", "Den skal have frisk vand hver dag."],
          "correctIndex": 0,
          "rationale": "Korrekt. Den er tilpasset miljøer, der skifter mellem at være plaskvåde (regn) og knastørre (sommersol)."
        },
        {
          "question": "Hvorfor gør Korkhat til en 'lumsk' og farlig svamp for en tømrer at overse i et tag?",
          "options": ["Den lugter voldsomt af parfume.", "Den forårsager ofte et kraftigt 'indvendigt' råd. Træets overflade kan se sund ud, men indeni er det helt formuldet.", "Den skal skifte farve, så den ligner sundt egetræ."],
          "correctIndex": 1,
          "rationale": "Korrekt. Fordi overfladen på taget ofte tørrer hurtigt ud i solen, mens kernen forbliver våd, rådner træet indefra."
        },
        {
          "question": "Hvor har svampen fået sit navn 'Korkhat' fra?",
          "options": ["Fordi den dufter ligesom korkproppen i en vinflaske.", "Fordi dens frugtlegemer (svampehattene) føles seje og korkagtige, ofte med små lameller på undersiden.", "Fordi den kun angriber kork-gulve."],
          "correctIndex": 1,
          "rationale": "Korrekt. Frugtlegemerne er brune/gule, har lameller og er meget hårde/seje at røre ved (som kork)."
        }
      ]
    }
  ]
};
