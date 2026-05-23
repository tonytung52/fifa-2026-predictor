const TEAMS = [
  // Group A
  { id: "usa", name: "United States", code: "USA", group: "A", conf: "CONCACAF", ratingOffense: 86, ratingDefense: 84, ratingMidfield: 85, starPlayer: "Christian Pulisic", flag: "🇺🇸" },
  { id: "colombia", name: "Colombia", code: "COL", group: "A", conf: "CONMEBOL", ratingOffense: 88, ratingDefense: 85, ratingMidfield: 87, starPlayer: "Luis Díaz", flag: "🇨🇴" },
  { id: "poland", name: "Poland", code: "POL", group: "A", conf: "UEFA", ratingOffense: 80, ratingDefense: 79, ratingMidfield: 80, starPlayer: "Robert Lewandowski", flag: "🇵🇱" },
  { id: "mali", name: "Mali", code: "MLI", group: "A", conf: "CAF", ratingOffense: 75, ratingDefense: 77, ratingMidfield: 76, starPlayer: "Yves Bissouma", flag: "🇲🇱" },

  // Group B
  { id: "canada", name: "Canada", code: "CAN", group: "B", conf: "CONCACAF", ratingOffense: 82, ratingDefense: 79, ratingMidfield: 80, starPlayer: "Alphonso Davies", flag: "🇨🇦" },
  { id: "switzerland", name: "Switzerland", code: "SUI", group: "B", conf: "UEFA", ratingOffense: 83, ratingDefense: 84, ratingMidfield: 83, starPlayer: "Granit Xhaka", flag: "🇨🇭" },
  { id: "iraq", name: "Iraq", code: "IRQ", group: "B", conf: "AFC", ratingOffense: 74, ratingDefense: 72, ratingMidfield: 73, starPlayer: "Aymen Hussein", flag: "🇮🇶" },
  { id: "egypt", name: "Egypt", code: "EGY", group: "B", conf: "CAF", ratingOffense: 83, ratingDefense: 79, ratingMidfield: 80, starPlayer: "Mohamed Salah", flag: "🇪🇬" },

  // Group C
  { id: "mexico", name: "Mexico", code: "MEX", group: "C", conf: "CONCACAF", ratingOffense: 83, ratingDefense: 82, ratingMidfield: 82, starPlayer: "Santiago Giménez", flag: "🇲🇽" },
  { id: "denmark", name: "Denmark", code: "DEN", group: "C", conf: "UEFA", ratingOffense: 84, ratingDefense: 84, ratingMidfield: 85, starPlayer: "Christian Eriksen", flag: "🇩🇰" },
  { id: "uzbekistan", name: "Uzbekistan", code: "UZB", group: "C", conf: "AFC", ratingOffense: 75, ratingDefense: 76, ratingMidfield: 76, starPlayer: "Eldor Shomurodov", flag: "🇺🇿" },
  { id: "senegal", name: "Senegal", code: "SEN", group: "C", conf: "CAF", ratingOffense: 84, ratingDefense: 83, ratingMidfield: 82, starPlayer: "Sadio Mané", flag: "🇸🇳" },

  // Group D
  { id: "argentina", name: "Argentina", code: "ARG", group: "D", conf: "CONMEBOL", ratingOffense: 94, ratingDefense: 90, ratingMidfield: 92, starPlayer: "Lionel Messi", flag: "🇦🇷" },
  { id: "ukraine", name: "Ukraine", code: "UKR", group: "D", conf: "UEFA", ratingOffense: 82, ratingDefense: 81, ratingMidfield: 82, starPlayer: "Artem Dovbyk", flag: "🇺🇦" },
  { id: "qatar", name: "Qatar", code: "QAT", group: "D", conf: "AFC", ratingOffense: 76, ratingDefense: 73, ratingMidfield: 75, starPlayer: "Akram Afif", flag: "🇶🇦" },
  { id: "algeria", name: "Algeria", code: "ALG", group: "D", conf: "CAF", ratingOffense: 81, ratingDefense: 79, ratingMidfield: 81, starPlayer: "Riyad Mahrez", flag: "🇩🇿" },

  // Group E
  { id: "brazil", name: "Brazil", code: "BRA", group: "E", conf: "CONMEBOL", ratingOffense: 93, ratingDefense: 89, ratingMidfield: 90, starPlayer: "Vinícius Júnior", flag: "🇧🇷" },
  { id: "croatia", name: "Croatia", code: "CRO", group: "E", conf: "UEFA", ratingOffense: 86, ratingDefense: 85, ratingMidfield: 89, starPlayer: "Luka Modrić", flag: "🇭🇷" },
  { id: "turkey", name: "Turkey", code: "TUR", group: "E", conf: "UEFA", ratingOffense: 83, ratingDefense: 80, ratingMidfield: 84, starPlayer: "Arda Güler", flag: "🇹🇷" },
  { id: "ivorycoast", name: "Ivory Coast", code: "CIV", group: "E", conf: "CAF", ratingOffense: 81, ratingDefense: 80, ratingMidfield: 81, starPlayer: "Franck Kessié", flag: "🇨🇮" },

  // Group F
  { id: "france", name: "France", code: "FRA", group: "F", conf: "UEFA", ratingOffense: 95, ratingDefense: 91, ratingMidfield: 93, starPlayer: "Kylian Mbappé", flag: "🇫🇷" },
  { id: "uruguay", name: "Uruguay", code: "URU", group: "F", conf: "CONMEBOL", ratingOffense: 89, ratingDefense: 86, ratingMidfield: 87, starPlayer: "Federico Valverde", flag: "🇺🇾" },
  { id: "southkorea", name: "South Korea", code: "KOR", group: "F", conf: "AFC", ratingOffense: 83, ratingDefense: 78, ratingMidfield: 80, starPlayer: "Son Heung-min", flag: "🇰🇷" },
  { id: "cameroon", name: "Cameroon", code: "CMR", group: "F", conf: "CAF", ratingOffense: 79, ratingDefense: 78, ratingMidfield: 78, starPlayer: "Bryan Mbeumo", flag: "🇨🇲" },

  // Group G
  { id: "england", name: "England", code: "ENG", group: "G", conf: "UEFA", ratingOffense: 94, ratingDefense: 89, ratingMidfield: 93, starPlayer: "Jude Bellingham", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { id: "ecuador", name: "Ecuador", code: "ECU", group: "G", conf: "CONMEBOL", ratingOffense: 81, ratingDefense: 84, ratingMidfield: 81, starPlayer: "Piero Hincapié", flag: "🇪🇨" },
  { id: "japan", name: "Japan", code: "JPN", group: "G", conf: "AFC", ratingOffense: 85, ratingDefense: 82, ratingMidfield: 86, starPlayer: "Kaoru Mitoma", flag: "🇯🇵" },
  { id: "southafrica", name: "South Africa", code: "RSA", group: "G", conf: "CAF", ratingOffense: 74, ratingDefense: 75, ratingMidfield: 75, starPlayer: "Percy Tau", flag: "🇿🇦" },

  // Group H
  { id: "spain", name: "Spain", code: "ESP", group: "H", conf: "UEFA", ratingOffense: 93, ratingDefense: 90, ratingMidfield: 95, starPlayer: "Lamine Yamal", flag: "🇪🇸" },
  { id: "austria", name: "Austria", code: "AUT", group: "H", conf: "UEFA", ratingOffense: 82, ratingDefense: 82, ratingMidfield: 83, starPlayer: "David Alaba", flag: "🇦🇹" },
  { id: "australia", name: "Australia", code: "AUS", group: "H", conf: "AFC", ratingOffense: 78, ratingDefense: 79, ratingMidfield: 78, starPlayer: "Harry Souttar", flag: "🇦🇺" },
  { id: "nigeria", name: "Nigeria", code: "NGA", group: "H", conf: "CAF", ratingOffense: 84, ratingDefense: 78, ratingMidfield: 79, starPlayer: "Victor Osimhen", flag: "🇳🇬" },

  // Group I
  { id: "portugal", name: "Portugal", code: "POR", group: "I", conf: "UEFA", ratingOffense: 92, ratingDefense: 87, ratingMidfield: 91, starPlayer: "Bruno Fernandes", flag: "🇵🇹" },
  { id: "sweden", name: "Sweden", code: "SWE", group: "I", conf: "UEFA", ratingOffense: 83, ratingDefense: 80, ratingMidfield: 81, starPlayer: "Viktor Gyökeres", flag: "🇸🇪" },
  { id: "iran", name: "Iran", code: "IRN", group: "I", conf: "AFC", ratingOffense: 79, ratingDefense: 77, ratingMidfield: 77, starPlayer: "Mehdi Taremi", flag: "🇮🇷" },
  { id: "morocco", name: "Morocco", code: "MAR", group: "I", conf: "CAF", ratingOffense: 86, ratingDefense: 87, ratingMidfield: 86, starPlayer: "Achraf Hakimi", flag: "🇲🇦" },

  // Group J
  { id: "italy", name: "Italy", code: "ITA", group: "J", conf: "UEFA", ratingOffense: 87, ratingDefense: 89, ratingMidfield: 88, starPlayer: "Nicolò Barella", flag: "🇮🇹" },
  { id: "paraguay", name: "Paraguay", code: "PAR", group: "J", conf: "CONMEBOL", ratingOffense: 78, ratingDefense: 81, ratingMidfield: 78, starPlayer: "Miguel Almirón", flag: "🇵🇾" },
  { id: "jordan", name: "Jordan", code: "JOR", group: "J", conf: "AFC", ratingOffense: 75, ratingDefense: 72, ratingMidfield: 73, starPlayer: "Mousa Al-Tamari", flag: "🇯🇴" },
  { id: "tunisia", name: "Tunisia", code: "TUN", group: "J", conf: "CAF", ratingOffense: 76, ratingDefense: 78, ratingMidfield: 77, starPlayer: "Ellyes Skhiri", flag: "🇹🇳" },

  // Group K
  { id: "germany", name: "Germany", code: "GER", group: "K", conf: "UEFA", ratingOffense: 91, ratingDefense: 88, ratingMidfield: 92, starPlayer: "Florian Wirtz", flag: "🇩🇪" },
  { id: "chile", name: "Chile", code: "CHI", group: "K", conf: "CONMEBOL", ratingOffense: 79, ratingDefense: 80, ratingMidfield: 80, starPlayer: "Alexis Sánchez", flag: "🇨🇱" },
  { id: "jamaica", name: "Jamaica", code: "JAM", group: "K", conf: "CONCACAF", ratingOffense: 77, ratingDefense: 74, ratingMidfield: 75, starPlayer: "Leon Bailey", flag: "🇯🇲" },
  { id: "newzealand", name: "New Zealand", code: "NZL", group: "K", conf: "OFC", ratingOffense: 72, ratingDefense: 71, ratingMidfield: 71, starPlayer: "Chris Wood", flag: "🇳🇿" },

  // Group L
  { id: "netherlands", name: "Netherlands", code: "NED", group: "L", conf: "UEFA", ratingOffense: 89, ratingDefense: 89, ratingMidfield: 90, starPlayer: "Virgil van Dijk", flag: "🇳🇱" },
  { id: "belgium", name: "Belgium", code: "BEL", group: "L", conf: "UEFA", ratingOffense: 88, ratingDefense: 83, ratingMidfield: 87, starPlayer: "Kevin De Bruyne", flag: "🇧🇪" },
  { id: "panama", name: "Panama", code: "PAN", group: "L", conf: "CONCACAF", ratingOffense: 76, ratingDefense: 75, ratingMidfield: 75, starPlayer: "Adalberto Carrasquilla", flag: "🇵🇦" },
  { id: "costarica", name: "Costa Rica", code: "CRC", group: "L", conf: "CONCACAF", ratingOffense: 77, ratingDefense: 78, ratingMidfield: 77, starPlayer: "Joel Campbell", flag: "🇨🇷" }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TEAMS };
}
