import {
  BsHouseGear,
  BsBasket3,
  BsSendCheck,
  BsGraphUpArrow,
  BsThreeDots,
} from "react-icons/bs";

/**
 * Nature des sorties d'argent.
 *
 * « Dépenses immobilières » ne couvrait qu'un cas. Il faut aussi loger le
 * quotidien, les fonds envoyés à la famille à l'étranger et, demain, les
 * investissements.
 *
 * La distinction qui compte n'est pas le libellé mais `impacte` : une charge
 * de la résidence grève son résultat, un envoi familial n'est pas une charge
 * — c'est une part du bénéfice qu'on en sort. Les confondre ferait fondre le
 * résultat de la maison alors qu'elle n'a rien coûté de plus.
 *
 * Doit rester aligné sur hmas/utils/sorties.js, qui fait foi côté serveur.
 */
export const TYPES = {
  IMMOBILIER: {
    label: "Immobilier",
    court: "Immo",
    Icone: BsHouseGear,
    couleur: "#2563eb",
    fond: "#eff6ff",
    bordure: "#bfdbfe",
    impacte: true,
    aide: "Charges de la résidence : elles pèsent sur le bénéfice du mois.",
    categories: ["Réparation", "Entretien", "Charges", "Fournitures", "Salaires", "Autre"],
  },
  QUOTIDIEN: {
    label: "Quotidien",
    court: "Quotidien",
    Icone: BsBasket3,
    couleur: "#0891b2",
    fond: "#ecfeff",
    bordure: "#a5f3fc",
    impacte: true,
    aide: "Dépenses courantes liées à la marche de la maison.",
    categories: ["Courses", "Transport", "Communication", "Petit matériel", "Autre"],
  },
  FAMILLE: {
    label: "Envoi famille",
    court: "Famille",
    Icone: BsSendCheck,
    couleur: "#7c3aed",
    fond: "#f5f3ff",
    bordure: "#ddd6fe",
    impacte: false,
    beneficiaireRequis: true,
    aide: "Fonds envoyés aux proches. Ce n'est pas une charge de la maison mais une part du bénéfice qu'on en sort, le résultat de la résidence reste donc inchangé.",
    categories: ["Frère / Sœur", "Parents", "Aide ponctuelle", "Frais de transfert", "Autre"],
  },
  INVESTISSEMENT: {
    label: "Investissement",
    court: "Invest.",
    Icone: BsGraphUpArrow,
    couleur: "#ea580c",
    fond: "#fff7ed",
    bordure: "#fed7aa",
    impacte: false,
    aide: "Argent placé ailleurs plutôt que dépensé. N'entre pas dans le résultat de la résidence.",
    categories: ["Terrain", "Travaux", "Matériel", "Placement", "Autre"],
  },
  AUTRE: {
    label: "Autre",
    court: "Autre",
    Icone: BsThreeDots,
    couleur: "#64748b",
    fond: "#f8fafc",
    bordure: "#e2e8f0",
    impacte: true,
    aide: "Tout ce qui n'entre dans aucune des natures ci-dessus.",
    categories: ["Autre"],
  },
};

export const ORDRE_TYPES = ["IMMOBILIER", "QUOTIDIEN", "FAMILLE", "INVESTISSEMENT", "AUTRE"];

/** Nature d'une ligne, avec repli sur la nature historique. */
export const typeDe = (d) => TYPES[d?.type] || TYPES.IMMOBILIER;
