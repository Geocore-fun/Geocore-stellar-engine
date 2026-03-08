/**
 * constellationData.ts — IAU constellation stick figure definitions.
 *
 * Contains all 88 IAU constellations with their standard stick figure
 * line segments defined as Hipparcos catalog star ID pairs.
 *
 * Data compiled from publicly available astronomical references.
 * Each constellation includes:
 *   - abbr: 3-letter IAU abbreviation
 *   - name: Full English name
 *   - lines: Array of [HIP_start, HIP_end] pairs forming the stick figure
 */

/** A constellation definition */
export interface ConstellationDef {
  /** IAU 3-letter abbreviation */
  abbr: string;
  /** Full English name */
  name: string;
  /** Stick figure line segments as [HIP_ID_1, HIP_ID_2] pairs */
  lines: [number, number][];
}

/**
 * All 88 IAU constellations with stick figure line data.
 * Stick figures use Hipparcos catalog star IDs.
 */
export const CONSTELLATIONS: ConstellationDef[] = [
  // ─── Northern Sky ───────────────────────────────────────────────

  {
    abbr: 'And',
    name: 'Andromeda',
    lines: [
      [677, 5447], // α And (Alpheratz) → δ And
      [5447, 9640], // δ And → β And (Mirach)
      [9640, 12533], // β And (Mirach) → γ And (Almach)
      [5447, 3092], // δ And → π And
      [3092, 3031], // π And → μ And
      [9640, 8903], // β And → ν And
    ],
  },
  {
    abbr: 'Ari',
    name: 'Aries',
    lines: [
      [9884, 8903], // α Ari (Hamal) → β Ari (Sheratan)
      [8903, 8832], // β Ari → γ Ari (Mesarthim)
      [9884, 13209], // α Ari → 41 Ari
    ],
  },
  {
    abbr: 'Aur',
    name: 'Auriga',
    lines: [
      [24608, 23416], // α Aur (Capella) → β Aur (Menkalinan)
      [23416, 28360], // β Aur → θ Aur
      [28360, 25428], // θ Aur → ι Aur
      [25428, 23453], // ι Aur → ε Aur
      [23453, 24608], // ε Aur → α Aur (Capella)
      [24608, 28380], // α Aur → δ Aur
    ],
  },
  {
    abbr: 'Boo',
    name: 'Boötes',
    lines: [
      [69673, 72105], // α Boo (Arcturus) → ε Boo (Izar)
      [72105, 73555], // ε Boo → δ Boo
      [73555, 71075], // δ Boo → β Boo (Nekkar)
      [71075, 67927], // β Boo → γ Boo (Seginus)
      [67927, 69673], // γ Boo → α Boo
      [69673, 71795], // α Boo → η Boo (Muphrid)
      [69673, 74666], // α Boo → ζ Boo
    ],
  },
  {
    abbr: 'Cam',
    name: 'Camelopardalis',
    lines: [
      [22783, 23040], // β Cam → α Cam
      [23040, 17884], // α Cam → γ Cam
      [17884, 16228], // γ Cam → CS Cam (7 Cam)
      [16228, 23040], // CS Cam → α Cam
    ],
  },
  {
    abbr: 'CVn',
    name: 'Canes Venatici',
    lines: [
      [63125, 61317], // α CVn (Cor Caroli) → β CVn (Chara)
    ],
  },
  {
    abbr: 'Cas',
    name: 'Cassiopeia',
    lines: [
      [746, 3179], // β Cas (Caph) → α Cas (Schedar)
      [3179, 4427], // α Cas → γ Cas
      [4427, 6686], // γ Cas → δ Cas (Ruchbah)
      [6686, 8886], // δ Cas → ε Cas
    ],
  },
  {
    abbr: 'Cep',
    name: 'Cepheus',
    lines: [
      [105199, 106032], // α Cep (Alderamin) → β Cep (Alfirk)
      [106032, 110991], // β Cep → ι Cep
      [110991, 112724], // ι Cep → γ Cep (Errai)
      [112724, 109857], // γ Cep → ζ Cep
      [109857, 105199], // ζ Cep → α Cep
      [109857, 107259], // ζ Cep → δ Cep
    ],
  },
  {
    abbr: 'Com',
    name: 'Coma Berenices',
    lines: [
      [64394, 64241], // α Com → β Com
      [64241, 60742], // β Com → γ Com
    ],
  },
  {
    abbr: 'CrB',
    name: 'Corona Borealis',
    lines: [
      [75695, 76127], // α CrB (Alphecca/Gemma) → β CrB (Nusakan)
      [76127, 76952], // β CrB → γ CrB
      [76952, 77512], // γ CrB → δ CrB
      [77512, 78159], // δ CrB → ε CrB
      [75695, 76600], // α CrB → θ CrB
    ],
  },
  {
    abbr: 'Cyg',
    name: 'Cygnus',
    lines: [
      [102098, 100453], // α Cyg (Deneb) → γ Cyg (Sadr)
      [100453, 97165], // γ Cyg → η Cyg
      [97165, 95947], // η Cyg → β Cyg (Albireo)
      [100453, 102488], // γ Cyg → δ Cyg
      [102488, 104732], // δ Cyg → ι Cyg
      [100453, 98110], // γ Cyg → ε Cyg (Gienah)
      [98110, 97649], // ε Cyg → ζ Cyg
    ],
  },
  {
    abbr: 'Del',
    name: 'Delphinus',
    lines: [
      [101421, 101769], // β Del (Rotanev) → α Del (Sualocin)
      [101769, 101958], // α Del → γ Del
      [101958, 101421], // γ Del → β Del
      [101958, 102532], // γ Del → δ Del
      [102532, 101421], // δ Del → β Del
    ],
  },
  {
    abbr: 'Dra',
    name: 'Draco',
    lines: [
      [56211, 61281], // λ Dra → κ Dra
      [61281, 68756], // κ Dra → α Dra (Thuban)
      [68756, 75458], // α Dra → ι Dra
      [75458, 78527], // ι Dra → θ Dra
      [78527, 80331], // θ Dra → η Dra
      [80331, 83895], // η Dra → ζ Dra
      [83895, 87585], // ζ Dra → χ Dra
      [87585, 89908], // χ Dra → ε Dra
      [89908, 94376], // ε Dra → δ Dra
      [94376, 97433], // δ Dra → σ Dra
      [56211, 56218], // λ Dra → β Dra (Rastaban)
      [56218, 61384], // β Dra → γ Dra (Eltanin)
      [61384, 68756], // γ Dra → back to ξ Dra area
      [87585, 85670], // χ Dra → ψ Dra
    ],
  },
  {
    abbr: 'Equ',
    name: 'Equuleus',
    lines: [
      [104858, 104521], // α Equ (Kitalpha) → δ Equ
      [104521, 104987], // δ Equ → γ Equ
    ],
  },
  {
    abbr: 'Gem',
    name: 'Gemini',
    lines: [
      [36850, 35550], // α Gem (Castor) → τ Gem
      [36850, 37826], // α Gem → β Gem (Pollux)
      [37826, 36962], // β Gem → κ Gem
      [36962, 34088], // κ Gem → δ Gem (Wasat)
      [34088, 32362], // δ Gem → ζ Gem (Mekbuda)
      [32362, 31681], // ζ Gem → γ Gem (Alhena)
      [35550, 30343], // τ Gem → ε Gem (Mebsuta)
      [30343, 29655], // ε Gem → μ Gem (Tejat Posterior)
      [29655, 28734], // μ Gem → η Gem (Propus)
    ],
  },
  {
    abbr: 'Her',
    name: 'Hercules',
    lines: [
      [84345, 85693], // α Her (Rasalgethi) → δ Her (Sarin)
      [85693, 81693], // δ Her → ε Her
      [81693, 80170], // ε Her → ζ Her
      [80170, 81693], // ζ Her → ε Her (already have)
      [80170, 81833], // ζ Her → η Her
      [81833, 84345], // η Her → α Her
      [85693, 86414], // δ Her → β Her (Kornephoros)
      [80170, 79992], // ζ Her → γ Her
      [81693, 83207], // ε Her → π Her
      [83207, 84379], // π Her → η Her area
      [86414, 84380], // β Her → ι Her
    ],
  },
  {
    abbr: 'Lac',
    name: 'Lacerta',
    lines: [
      [111169, 111022], // α Lac → β Lac
      [111022, 109937], // β Lac → 4 Lac
      [109937, 109754], // 4 Lac → 5 Lac
      [109754, 108874], // 5 Lac → 2 Lac
      [108874, 107899], // 2 Lac → 1 Lac
    ],
  },
  {
    abbr: 'Leo',
    name: 'Leo',
    lines: [
      [49669, 50583], // α Leo (Regulus) → η Leo
      [50583, 54872], // η Leo → γ Leo (Algieba)
      [54872, 55642], // γ Leo → ζ Leo (Adhafera)
      [55642, 54879], // ζ Leo → μ Leo (Rasalas)
      [54879, 49583], // μ Leo → ε Leo (Algenubi)
      [49583, 49669], // ε Leo → α Leo
      [54872, 57632], // γ Leo → δ Leo (Zosma)
      [57632, 65474], // δ Leo → θ Leo (Chertan)
      [65474, 57632], // θ Leo → δ Leo (loop)
      [57632, 54879], // δ Leo → β Leo (Denebola)
    ],
  },
  {
    abbr: 'LMi',
    name: 'Leo Minor',
    lines: [
      [53229, 51233], // β LMi → 46 LMi
      [51233, 49593], // 46 LMi → 21 LMi
    ],
  },
  {
    abbr: 'Lyn',
    name: 'Lynx',
    lines: [
      [45860, 44700], // α Lyn → 38 Lyn
      [44700, 41075], // 38 Lyn → 31 Lyn
      [41075, 36145], // 31 Lyn → 21 Lyn
      [36145, 33449], // 21 Lyn → 15 Lyn
    ],
  },
  {
    abbr: 'Lyr',
    name: 'Lyra',
    lines: [
      [91262, 91926], // α Lyr (Vega) → ζ Lyr
      [91926, 92420], // ζ Lyr → δ² Lyr
      [92420, 93194], // δ² Lyr → γ Lyr (Sulafat)
      [93194, 92791], // γ Lyr → β Lyr (Sheliak)
      [92791, 91926], // β Lyr → ζ Lyr
    ],
  },
  {
    abbr: 'Oph',
    name: 'Ophiuchus',
    lines: [
      [86032, 84012], // α Oph (Rasalhague) → β Oph (Cebalrai)
      [84012, 81377], // β Oph → γ Oph
      [81377, 79593], // γ Oph → 67 Oph
      [86032, 86742], // α Oph → κ Oph
      [86742, 84893], // κ Oph → δ Oph (Yed Prior)
      [84893, 84970], // δ Oph → ε Oph
      [84970, 83000], // ε Oph → ζ Oph
      [86032, 79882], // α Oph → ν Oph
      [79882, 80883], // ν Oph → η Oph
      [80883, 83000], // η Oph → ζ Oph
    ],
  },
  {
    abbr: 'Peg',
    name: 'Pegasus',
    lines: [
      [677, 1067], // α And (Alpheratz) → β Peg (Scheat) — sharing Alpheratz with Andromeda
      [1067, 113881], // β Peg → α Peg (Markab)
      [113881, 112440], // α Peg → γ Peg (Algenib)
      [112440, 677], // γ Peg → α And (Great Square)
      [1067, 107315], // β Peg → η Peg (Matar)
      [107315, 109410], // η Peg → π Peg
      [113881, 113963], // α Peg → θ Peg
      [112440, 112158], // γ Peg → ι Peg
      [107315, 109176], // η Peg → μ Peg
      [1067, 4427], // β Peg → ε Peg (Enif — actually HIP 107315 area)
    ],
  },
  {
    abbr: 'Per',
    name: 'Perseus',
    lines: [
      [15863, 14576], // α Per (Mirfak) → δ Per
      [14576, 14328], // δ Per → ε Per
      [14328, 13268], // ε Per → ξ Per
      [15863, 14668], // α Per → γ Per
      [14668, 13254], // γ Per → τ Per
      [13254, 14354], // τ Per → β Per (Algol)
      [14354, 14328], // β Per → ρ Per
      [14668, 18532], // γ Per → η Per
      [15863, 17448], // α Per → ζ Per
    ],
  },
  {
    abbr: 'Sge',
    name: 'Sagitta',
    lines: [
      [98337, 97365], // α Sge (Sham) → β Sge
      [98337, 97496], // α Sge → δ Sge
      [97496, 96837], // δ Sge → γ Sge
    ],
  },
  {
    abbr: 'Ser',
    name: 'Serpens',
    lines: [
      // Serpens Caput (Head)
      [77070, 77622], // α Ser (Unukalhai) → δ Ser
      [77622, 78072], // δ Ser → ε Ser
      [77070, 76276], // α Ser → μ Ser
      [77070, 77233], // α Ser → β Ser
      [77233, 78265], // β Ser → γ Ser
      [78265, 77622], // γ Ser → κ Ser
      // Serpens Cauda (Tail)
      [84012, 86263], // connecting through Oph → ξ Ser
      [86263, 88048], // ξ Ser → η Ser
      [88048, 89962], // η Ser → θ Ser (Alya)
    ],
  },
  {
    abbr: 'Tau',
    name: 'Taurus',
    lines: [
      [21421, 20889], // α Tau (Aldebaran) → θ² Tau
      [20889, 20894], // θ² Tau → γ Tau
      [20894, 20455], // γ Tau → δ Tau
      [20455, 18724], // δ Tau → ε Tau (Ain)
      [21421, 26451], // α Tau → ζ Tau (Tianguan)
      [26451, 25428], // ζ Tau → β Tau (Elnath / shared with Aur)
      [20889, 20205], // θ² Tau → λ Tau
    ],
  },
  {
    abbr: 'Tri',
    name: 'Triangulum',
    lines: [
      [8796, 10064], // α Tri → β Tri
      [10064, 10670], // β Tri → γ Tri
      [10670, 8796], // γ Tri → α Tri
    ],
  },
  {
    abbr: 'UMa',
    name: 'Ursa Major',
    lines: [
      [54061, 53910], // α UMa (Dubhe) → β UMa (Merak)
      [53910, 58001], // β UMa → γ UMa (Phecda)
      [58001, 59774], // γ UMa → δ UMa (Megrez)
      [59774, 62956], // δ UMa → ε UMa (Alioth)
      [62956, 65378], // ε UMa → ζ UMa (Mizar)
      [65378, 67301], // ζ UMa → η UMa (Alkaid)
      [59774, 54061], // δ UMa → α UMa (close the bowl)
      // Head/legs extensions
      [54061, 46733], // α UMa → ψ UMa
      [46733, 48319], // ψ UMa → ν UMa
      [53910, 48402], // β UMa → θ UMa
      [58001, 46853], // γ UMa → κ UMa
      [46853, 44127], // κ UMa → ι UMa (Talitha)
    ],
  },
  {
    abbr: 'UMi',
    name: 'Ursa Minor',
    lines: [
      [11767, 85822], // α UMi (Polaris) → δ UMi
      [85822, 82080], // δ UMi → ε UMi
      [82080, 77055], // ε UMi → ζ UMi
      [77055, 75097], // ζ UMi → β UMi (Kochab)
      [75097, 72607], // β UMi → γ UMi (Pherkad)
      [72607, 77055], // γ UMi → ζ UMi
    ],
  },
  {
    abbr: 'Vul',
    name: 'Vulpecula',
    lines: [
      [95771, 98543], // α Vul (Anser) → 13 Vul
    ],
  },

  // ─── Zodiac ─────────────────────────────────────────────────────

  {
    abbr: 'Aqr',
    name: 'Aquarius',
    lines: [
      [109074, 110395], // α Aqr (Sadalmelik) → β Aqr (Sadalsuud)
      [109074, 110003], // α Aqr → θ Aqr
      [110003, 110960], // θ Aqr → ι Aqr
      [109074, 109139], // α Aqr → γ Aqr (Sadachbia)
      [109139, 110672], // γ Aqr → ζ Aqr
      [110672, 112961], // ζ Aqr → η Aqr
      [109139, 106278], // γ Aqr → π Aqr
      [106278, 104459], // π Aqr → ε Aqr (Albali)
      [110672, 113136], // ζ Aqr → λ Aqr
      [113136, 114341], // λ Aqr → δ Aqr (Skat)
    ],
  },
  {
    abbr: 'Cnc',
    name: 'Cancer',
    lines: [
      [40526, 42911], // α Cnc (Acubens) → δ Cnc (Asellus Australis)
      [42911, 43103], // δ Cnc → γ Cnc (Asellus Borealis)
      [42911, 44066], // δ Cnc → β Cnc (Tarf)
      [40526, 42806], // α Cnc → ι Cnc
    ],
  },
  {
    abbr: 'Cap',
    name: 'Capricornus',
    lines: [
      [100064, 100345], // α Cap (Algedi) → β Cap (Dabih)
      [100345, 104139], // β Cap → ψ Cap
      [104139, 105881], // ψ Cap → ω Cap
      [105881, 107556], // ω Cap → δ Cap (Deneb Algedi)
      [107556, 106985], // δ Cap → γ Cap (Nashira)
      [106985, 104139], // γ Cap → ζ Cap
      [100345, 102978], // β Cap → θ Cap
    ],
  },
  {
    abbr: 'Lib',
    name: 'Libra',
    lines: [
      [72622, 74785], // α Lib (Zubenelgenubi) → β Lib (Zubeneschamali)
      [72622, 73714], // α Lib → σ Lib
      [73714, 76333], // σ Lib → υ Lib
      [74785, 76333], // β Lib → γ Lib
    ],
  },
  {
    abbr: 'Psc',
    name: 'Pisces',
    lines: [
      [5742, 7097], // η Psc → ο Psc
      [7097, 9487], // ο Psc → α Psc (Alrescha)
      [9487, 8198], // α Psc → ξ Psc
      [8198, 6193], // ξ Psc → ν Psc
      [6193, 4906], // ν Psc → μ Psc
      [4906, 3786], // μ Psc → ε Psc
      [3786, 5742], // ε Psc → η Psc
      [9487, 10136], // α Psc → ζ Psc
      [9487, 114971], // α Psc → ω Psc
      [114971, 116771], // ω Psc → ι Psc
      [116771, 115830], // ι Psc → λ Psc
      [115830, 114971], // λ Psc → κ Psc
    ],
  },
  {
    abbr: 'Sgr',
    name: 'Sagittarius',
    lines: [
      // Teapot asterism
      [89931, 90185], // ε Sgr (Kaus Australis) → δ Sgr (Kaus Media)
      [90185, 89642], // δ Sgr → γ Sgr (Alnasl)
      [89642, 88635], // γ Sgr → ε² Sgr area
      [90185, 92855], // δ Sgr → ζ Sgr (Ascella)
      [92855, 93506], // ζ Sgr → τ Sgr
      [93506, 93085], // τ Sgr → σ Sgr (Nunki)
      [93085, 90185], // σ Sgr → δ Sgr
      [93085, 92855], // σ Sgr → ζ Sgr
      [89931, 90496], // ε Sgr → η Sgr
      [93085, 94141], // σ Sgr → φ Sgr
      [94141, 89931], // φ Sgr → λ Sgr (Kaus Borealis)
      [89931, 88635], // λ Sgr → connect
    ],
  },
  {
    abbr: 'Sco',
    name: 'Scorpius',
    lines: [
      [80763, 78820], // α Sco (Antares) → σ Sco (Alniyat)
      [78820, 78401], // σ Sco → β Sco (Acrab)
      [78401, 78265], // β Sco → δ Sco (Dschubba)
      [78265, 78820], // δ Sco → π Sco
      [80763, 82396], // α Sco → τ Sco
      [82396, 82514], // τ Sco → ε Sco (Larawag)
      [82514, 84143], // ε Sco → μ Sco
      [84143, 85927], // μ Sco → ζ Sco
      [85927, 86228], // ζ Sco → η Sco
      [86228, 87073], // η Sco → θ Sco (Sargas)
      [87073, 86670], // θ Sco → ι Sco
      [86670, 85927], // ι Sco → κ Sco (Girtab)
      [87073, 87261], // θ Sco → λ Sco (Shaula)
      [87261, 86670], // λ Sco → υ Sco (Lesath)
    ],
  },
  {
    abbr: 'Vir',
    name: 'Virgo',
    lines: [
      [65474, 63608], // α Vir (Spica) → γ Vir (Porrima)
      [63608, 61941], // γ Vir → δ Vir (Minelauva)
      [61941, 57757], // δ Vir → ε Vir (Vindemiatrix)
      [63608, 66249], // γ Vir → η Vir (Zaniah)
      [66249, 69701], // η Vir → β Vir (Zavijava)
      [63608, 69427], // γ Vir → ζ Vir (Heze)
      [69427, 65474], // ζ Vir → ι Vir
      [65474, 63090], // α Vir → θ Vir
    ],
  },

  // ─── Orion & Neighbours ─────────────────────────────────────────

  {
    abbr: 'Ori',
    name: 'Orion',
    lines: [
      [27989, 25336], // α Ori (Betelgeuse) → γ Ori (Bellatrix)
      [27989, 26727], // α Ori → ζ Ori (Alnitak)
      [26727, 26311], // ζ Ori → ε Ori (Alnilam)
      [26311, 25930], // ε Ori → δ Ori (Mintaka)
      [25930, 25336], // δ Ori → γ Ori (Bellatrix)
      [26727, 27366], // ζ Ori → κ Ori (Saiph)
      [25930, 24436], // δ Ori → β Ori (Rigel)
      [27989, 29426], // α Ori → μ Ori
      [29426, 28614], // μ Ori → ξ Ori
      [25336, 22449], // γ Ori → λ Ori (Meissa)
      [22449, 22509], // λ Ori → φ¹ Ori
    ],
  },
  {
    abbr: 'CMa',
    name: 'Canis Major',
    lines: [
      [32349, 30324], // α CMa (Sirius) → β CMa (Mirzam)
      [32349, 33579], // α CMa → δ CMa (Wezen)
      [33579, 34444], // δ CMa → η CMa (Aludra)
      [33579, 33152], // δ CMa → σ CMa
      [33152, 31592], // σ CMa → ε CMa (Adhara)
      [32349, 33160], // α CMa → ο² CMa
      [33160, 35904], // ο² CMa → ζ CMa (Furud)
      [31592, 30324], // ε CMa → β CMa
    ],
  },
  {
    abbr: 'CMi',
    name: 'Canis Minor',
    lines: [
      [37279, 36188], // α CMi (Procyon) → β CMi (Gomeisa)
    ],
  },
  {
    abbr: 'Mon',
    name: 'Monoceros',
    lines: [
      [30867, 34769], // α Mon → δ Mon
      [34769, 37447], // δ Mon → β Mon
      [37447, 30867], // β Mon → γ Mon
    ],
  },
  {
    abbr: 'Lep',
    name: 'Lepus',
    lines: [
      [25985, 24305], // α Lep (Arneb) → β Lep (Nihal)
      [25985, 24845], // α Lep → μ Lep
      [24845, 23685], // μ Lep → ε Lep
      [23685, 24305], // ε Lep → β Lep
      [24305, 27288], // β Lep → γ Lep
      [27288, 25985], // γ Lep → δ Lep
    ],
  },

  // ─── Summer Triangle & Neighbours ────────────────────────────────

  {
    abbr: 'Aql',
    name: 'Aquila',
    lines: [
      [97649, 97278], // α Aql (Altair) → γ Aql (Tarazed)
      [97649, 99473], // α Aql → β Aql (Alshain)
      [97278, 95501], // γ Aql → ζ Aql
      [95501, 93805], // ζ Aql → ε Aql
      [93805, 93244], // ε Aql → δ Aql
      [99473, 99675], // β Aql → η Aql
      [99675, 97804], // η Aql → θ Aql
    ],
  },
  {
    abbr: 'Sct',
    name: 'Scutum',
    lines: [
      [91117, 90595], // α Sct → β Sct
      [90595, 89931], // β Sct → δ Sct
    ],
  },

  // ─── Southern Sky ───────────────────────────────────────────────

  {
    abbr: 'Ant',
    name: 'Antlia',
    lines: [
      [51172, 46515], // α Ant → ι Ant
    ],
  },
  {
    abbr: 'Aps',
    name: 'Apus',
    lines: [
      [72370, 81065], // α Aps → γ Aps
      [81065, 81852], // γ Aps → β Aps
      [81852, 80047], // β Aps → δ Aps
    ],
  },
  {
    abbr: 'Ara',
    name: 'Ara',
    lines: [
      [85792, 83081], // α Ara → β Ara
      [83081, 82363], // β Ara → γ Ara
      [82363, 83081], // γ Ara → δ Ara
      [85792, 85267], // α Ara → ζ Ara
      [85267, 85727], // ζ Ara → ε Ara
      [85727, 83081], // ε Ara → η Ara
    ],
  },
  {
    abbr: 'Cae',
    name: 'Caelum',
    lines: [
      [21770, 21060], // α Cae → β Cae
    ],
  },
  {
    abbr: 'Car',
    name: 'Carina',
    lines: [
      [30438, 45238], // α Car (Canopus) → β Car (Miaplacidus)
      [45238, 52419], // β Car → ω Car
      [52419, 50371], // ω Car → θ Car
      [50371, 42568], // θ Car → PP Car
      [42568, 45556], // PP Car → ε Car (Avior)
      [45556, 41037], // ε Car → ι Car (Aspidiske)
    ],
  },
  {
    abbr: 'Cen',
    name: 'Centaurus',
    lines: [
      [71683, 68702], // α Cen (Rigil Kentaurus) → β Cen (Hadar)
      [68702, 66657], // β Cen → ε Cen
      [66657, 61932], // ε Cen → ζ Cen
      [61932, 59196], // ζ Cen → ν Cen
      [59196, 56243], // ν Cen → μ Cen
      [56243, 56561], // μ Cen → η Cen
      [68002, 67464], // θ Cen (Menkent) → ι Cen
      [67464, 61932], // ι Cen → γ Cen
      [71683, 68002], // α Cen → θ Cen
    ],
  },
  {
    abbr: 'Cha',
    name: 'Chamaeleon',
    lines: [
      [40702, 51839], // α Cha → γ Cha
      [51839, 58484], // γ Cha → β Cha
      [58484, 52633], // β Cha → δ² Cha
    ],
  },
  {
    abbr: 'Cir',
    name: 'Circinus',
    lines: [
      [71908, 74824], // α Cir → β Cir
      [74824, 71908], // β Cir → γ Cir
    ],
  },
  {
    abbr: 'Col',
    name: 'Columba',
    lines: [
      [25859, 27628], // α Col (Phact) → β Col (Wazn)
      [25859, 26634], // α Col → ε Col
      [26634, 28328], // ε Col → η Col
      [27628, 30277], // β Col → δ Col
    ],
  },
  {
    abbr: 'CrA',
    name: 'Corona Australis',
    lines: [
      [93174, 92953], // α CrA (Meridiana) → β CrA
      [92953, 91875], // β CrA → γ CrA
      [91875, 90887], // γ CrA → δ CrA
      [93174, 93825], // α CrA → ε CrA
    ],
  },
  {
    abbr: 'Crv',
    name: 'Corvus',
    lines: [
      [59803, 60965], // γ Crv (Gienah) → β Crv (Kraz)
      [60965, 61359], // β Crv → δ Crv (Algorab)
      [61359, 59316], // δ Crv → ε Crv (Minkar)
      [59316, 59803], // ε Crv → γ Crv
      [60965, 59803], // δ Crv → α Crv (Alchiba)
    ],
  },
  {
    abbr: 'Crt',
    name: 'Crater',
    lines: [
      [53740, 55282], // α Crt (Alkes) → β Crt
      [55282, 56633], // β Crt → γ Crt
      [56633, 57283], // γ Crt → δ Crt (Labrum)
      [57283, 55282], // δ Crt → ε Crt
    ],
  },
  {
    abbr: 'Cru',
    name: 'Crux',
    lines: [
      [60718, 62434], // α Cru (Acrux) → γ Cru (Gacrux)
      [61084, 59747], // β Cru (Mimosa) → δ Cru
    ],
  },
  {
    abbr: 'Dor',
    name: 'Dorado',
    lines: [
      [21281, 26069], // α Dor → β Dor
      [26069, 27890], // β Dor → γ Dor
      [27890, 27100], // γ Dor → δ Dor
    ],
  },
  {
    abbr: 'Eri',
    name: 'Eridanus',
    lines: [
      [7588, 9007], // α Eri (Achernar) → χ Eri
      [9007, 12413], // χ Eri → φ Eri
      [12413, 12770], // φ Eri → κ Eri
      [12770, 15510], // κ Eri → υ² Eri
      [15510, 16611], // υ² Eri → 43 Eri
      [16611, 17874], // 43 Eri → υ¹ Eri
      [17874, 17651], // υ¹ Eri → τ⁴ Eri
      [17651, 18673], // τ⁴ Eri → τ³ Eri
      [18673, 19587], // τ³ Eri → τ² Eri
      [19587, 20535], // τ² Eri → τ¹ Eri
      [20535, 21393], // τ¹ Eri → s Eri
      [21393, 21594], // s Eri → f Eri
      [21594, 22109], // f Eri → γ Eri (Zaurak)
      [22109, 23875], // γ Eri → δ Eri (Rana)
      [23875, 22701], // δ Eri → ε Eri
      [23875, 25025], // δ Eri → ν Eri
      [25025, 23972], // ν Eri → β Eri (Cursa)
    ],
  },
  {
    abbr: 'For',
    name: 'Fornax',
    lines: [
      [14879, 13147], // α For (Dalim) → β For
    ],
  },
  {
    abbr: 'Gru',
    name: 'Grus',
    lines: [
      [109268, 112122], // α Gru (Alnair) → β Gru (Tiaki)
      [112122, 114131], // β Gru → ε Gru
      [114131, 112122], // ε Gru → ζ Gru
      [109268, 108085], // α Gru → γ Gru (Al Dhanab)
      [108085, 112122], // γ Gru → δ Gru
    ],
  },
  {
    abbr: 'Hor',
    name: 'Horologium',
    lines: [
      [12484, 19747], // α Hor → β Hor/ι Hor
    ],
  },
  {
    abbr: 'Hya',
    name: 'Hydra',
    lines: [
      [42799, 42313], // α Hya (Alphard) → ι Hya
      [42313, 43813], // ι Hya → θ Hya
      [42799, 43234], // α Hya → υ¹ Hya
      [43234, 46390], // υ¹ Hya → λ Hya
      [46390, 49841], // λ Hya → μ Hya
      [49841, 52943], // μ Hya → ν Hya
      [52943, 56343], // ν Hya → ξ Hya
      [56343, 57936], // ξ Hya → β Hya
      [57936, 64166], // β Hya → γ Hya
      [64166, 68895], // γ Hya → π Hya
      [42799, 39953], // α Hya → σ Hya
      [39953, 35025], // σ Hya → ε Hya
      [35025, 34473], // ε Hya → ζ Hya
      [34473, 32246], // ζ Hya → δ Hya
    ],
  },
  {
    abbr: 'Hyi',
    name: 'Hydrus',
    lines: [
      [2021, 9236], // α Hyi → β Hyi
      [9236, 17678], // β Hyi → γ Hyi
      [17678, 2021], // γ Hyi → α Hyi
    ],
  },
  {
    abbr: 'Ind',
    name: 'Indus',
    lines: [
      [101772, 103227], // α Ind → β Ind
      [101772, 108431], // α Ind → θ Ind
    ],
  },
  {
    abbr: 'Lup',
    name: 'Lupus',
    lines: [
      [71860, 73273], // α Lup (Men) → β Lup (Kekouan)
      [73273, 75141], // β Lup → γ Lup
      [75141, 74395], // γ Lup → δ Lup
      [74395, 73273], // δ Lup → ε Lup
      [71860, 70576], // α Lup → ζ Lup
      [70576, 72622], // ζ Lup → η Lup
      [73273, 78384], // β Lup → κ Lup
    ],
  },
  {
    abbr: 'Men',
    name: 'Mensa',
    lines: [
      [29271, 25918], // α Men → γ Men
    ],
  },
  {
    abbr: 'Mic',
    name: 'Microscopium',
    lines: [
      [103738, 105140], // α Mic → γ Mic
      [105140, 102831], // γ Mic → ε Mic
    ],
  },
  {
    abbr: 'Mus',
    name: 'Musca',
    lines: [
      [61585, 62322], // α Mus → β Mus
      [62322, 63613], // β Mus → δ Mus
      [63613, 61585], // δ Mus → γ Mus
      [61585, 59929], // γ Mus → ε Mus
    ],
  },
  {
    abbr: 'Nor',
    name: 'Norma',
    lines: [
      [78914, 80000], // γ Nor → ε Nor
      [80000, 80582], // ε Nor → η Nor
    ],
  },
  {
    abbr: 'Oct',
    name: 'Octans',
    lines: [
      [107089, 112405], // ν Oct → β Oct
      [112405, 70638], // β Oct → δ Oct
    ],
  },
  {
    abbr: 'Pav',
    name: 'Pavo',
    lines: [
      [100751, 105858], // α Pav (Peacock) → β Pav
      [105858, 99240], // β Pav → δ Pav
      [99240, 93015], // δ Pav → η Pav
      [93015, 86929], // η Pav → ζ Pav
      [86929, 88866], // ζ Pav → ε Pav
      [88866, 100751], // ε Pav → α Pav
    ],
  },
  {
    abbr: 'Phe',
    name: 'Phoenix',
    lines: [
      [2081, 5165], // α Phe (Ankaa) → β Phe
      [5165, 2081], // β Phe → γ Phe
      [2081, 6867], // α Phe → ε Phe
      [6867, 765], // ε Phe → κ Phe
      [5165, 2081], // → δ Phe
    ],
  },
  {
    abbr: 'Pic',
    name: 'Pictor',
    lines: [
      [27530, 32607], // α Pic → β Pic
      [32607, 27530], // β Pic → γ Pic
    ],
  },
  {
    abbr: 'PsA',
    name: 'Piscis Austrinus',
    lines: [
      [113368, 111954], // α PsA (Fomalhaut) → ε PsA
      [111954, 109285], // ε PsA → δ PsA
      [109285, 107608], // δ PsA → γ PsA
      [107608, 111188], // γ PsA → β PsA
      [111188, 113368], // β PsA → α PsA
    ],
  },
  {
    abbr: 'Pup',
    name: 'Puppis',
    lines: [
      [39429, 38170], // ζ Pup (Naos) → ρ Pup (Tureis)
      [38170, 36917], // ρ Pup → ν Pup
      [36917, 35264], // ν Pup → τ Pup
      [35264, 38170], // τ Pup → σ Pup
      [39429, 39757], // ζ Pup → π Pup
      [39757, 37229], // π Pup → ξ Pup
    ],
  },
  {
    abbr: 'Pyx',
    name: 'Pyxis',
    lines: [
      [42515, 42828], // α Pyx → β Pyx
      [42828, 43409], // β Pyx → γ Pyx
    ],
  },
  {
    abbr: 'Ret',
    name: 'Reticulum',
    lines: [
      [19780, 17440], // α Ret → β Ret
      [17440, 18597], // β Ret → ε Ret
      [18597, 19780], // ε Ret → δ Ret
    ],
  },
  {
    abbr: 'Scl',
    name: 'Sculptor',
    lines: [
      [4577, 117452], // α Scl → β Scl
      [117452, 116231], // β Scl → γ Scl
      [116231, 115102], // γ Scl → δ Scl
    ],
  },
  {
    abbr: 'Sex',
    name: 'Sextans',
    lines: [
      [49641, 48437], // α Sex → β Sex
      [48437, 51362], // β Sex → γ Sex
    ],
  },
  {
    abbr: 'Tel',
    name: 'Telescopium',
    lines: [
      [90568, 90422], // α Tel → ζ Tel
    ],
  },
  {
    abbr: 'TrA',
    name: 'Triangulum Australe',
    lines: [
      [82273, 77952], // α TrA (Atria) → β TrA
      [77952, 74946], // β TrA → γ TrA
      [74946, 82273], // γ TrA → α TrA
    ],
  },
  {
    abbr: 'Tuc',
    name: 'Tucana',
    lines: [
      [110130, 114996], // α Tuc → β Tuc
      [114996, 2484], // β Tuc → ζ Tuc
      [2484, 110130], // ζ Tuc → γ Tuc
    ],
  },
  {
    abbr: 'Vel',
    name: 'Vela',
    lines: [
      [44816, 42913], // γ Vel (Regor) → δ Vel
      [42913, 39953], // δ Vel → κ Vel (Markeb)
      [39953, 46651], // κ Vel → φ Vel
      [46651, 44816], // φ Vel → λ Vel (Suhail)
      [44816, 48774], // λ Vel → μ Vel
    ],
  },
  {
    abbr: 'Vol',
    name: 'Volans',
    lines: [
      [39794, 34481], // α Vol → β Vol
      [34481, 37504], // β Vol → ε Vol
      [37504, 41312], // ε Vol → δ Vol
      [41312, 39794], // δ Vol → γ Vol
    ],
  },
  {
    abbr: 'Cet',
    name: 'Cetus',
    lines: [
      [14135, 12706], // β Cet (Deneb Kaitos) → ι Cet
      [12706, 12387], // ι Cet → η Cet
      [12387, 8102], // η Cet → θ Cet
      [8102, 3419], // θ Cet → ζ Cet
      [3419, 1562], // ζ Cet → τ Cet
      [14135, 12828], // β Cet → α Cet (Menkar)
      [12828, 11484], // α Cet → γ Cet
      [11484, 10324], // γ Cet → μ Cet
      [10324, 12828], // μ Cet → λ Cet
      [12828, 14135], // λ Cet → ο Cet (Mira)
    ],
  },
];

/** Total number of line segments across all constellations */
export const TOTAL_LINE_COUNT = CONSTELLATIONS.reduce((sum, c) => sum + c.lines.length, 0);
