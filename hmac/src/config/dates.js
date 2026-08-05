/**
 * Dates de l'application.
 *
 * Deux natures bien distinctes, à ne surtout pas confondre :
 *
 *  · Les DATES CALENDAIRES — entrée d'un locataire, date de règlement, mois
 *    de facture. « Payé le 15 août » est le 15 août, à Tananarive comme à
 *    Casablanca. Elles ne se convertissent pas : elles se lisent telles quelles.
 *
 *  · Les INSTANTS — journal des saisies, demandes de validation, création de
 *    compte. Ceux-là sont stockés en UTC et s'affichent dans le fuseau du
 *    logement, quel que soit l'endroit d'où l'on consulte.
 *
 * Madagascar est à UTC+3 toute l'année, sans heure d'été : le décalage est
 * fixe et jamais ambigu.
 */

export const FUSEAU_LOGEMENT = "Indian/Antananarivo";

const MOIS_COURT = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];

/**
 * Date du jour au format AAAA-MM-JJ, dans le fuseau du logement.
 *
 * `toISOString()` convertit d'abord en UTC : passé 21 h à Tananarive, il
 * renvoyait la veille. Et le propriétaire au Maroc n'obtenait pas la même
 * date par défaut que le gestionnaire sur place.
 */
export function dateDuJour(fuseau = FUSEAU_LOGEMENT) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: fuseau,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date()); // en-CA donne directement AAAA-MM-JJ
}

/** Même chose pour une date donnée, et non plus le jour courant. */
export function versDateISO(date, fuseau = FUSEAU_LOGEMENT) {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d)) return "";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: fuseau,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/**
 * AAAA-MM-JJ lu sur le calendrier de l'objet Date lui-même, sans conversion.
 *
 * À réserver aux dates construites par arithmétique locale — bornes de semaine,
 * début de mois — où le jour voulu est déjà celui que porte l'objet. Les faire
 * passer par un fuseau les décalerait d'un jour.
 */
export function versDateISOLocale(d) {
  if (!(d instanceof Date) || isNaN(d)) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Le jour courant à Tananarive, rendu comme objet Date à minuit local.
 *
 * Sert de point de départ aux calculs de période (semaine, mois) pour qu'ils
 * suivent le calendrier du logement et non celui du navigateur.
 */
export function aujourdhuiLocal() {
  const [a, m, j] = dateDuJour().split("-").map(Number);
  return new Date(a, m - 1, j);
}

/**
 * L'instant présent décomposé dans le fuseau du logement.
 *
 * Renvoie { date, heure, annee, mois, jour } — de quoi horodater une saisie
 * sans jamais repasser par l'heure du navigateur.
 */
export function maintenantLocal() {
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone: FUSEAU_LOGEMENT,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const v = (t) => p.find((x) => x.type === t)?.value || "00";
  // Intl rend parfois minuit « 24 » ; on le ramène à 00.
  const h = v("hour") === "24" ? "00" : v("hour");
  return {
    date: `${v("year")}-${v("month")}-${v("day")}`,
    heure: `${h}:${v("minute")}:${v("second")}`,
    annee: Number(v("year")),
    mois: Number(v("month")),
    jour: Number(v("day")),
  };
}

/**
 * Date calendaire lisible : « 15 Aoû 2026 ».
 *
 * On découpe la chaîne plutôt que de la faire passer par un objet Date : une
 * date seule n'a pas d'heure, et l'interpréter comme un instant la ferait
 * basculer d'un jour selon le fuseau du navigateur.
 */
export function formatDate(valeur) {
  if (!valeur) return "—";
  const brut = String(valeur).split("T")[0];
  const [a, m, j] = brut.split("-").map(Number);
  if (!a || !m || !j) return "—";
  return `${j} ${MOIS_COURT[m - 1]} ${a}`;
}

/** Instant lisible dans le fuseau du logement : « 15 Aoû 2026 à 09h30 ». */
export function formatDateHeure(valeur) {
  if (!valeur) return "—";
  const d = new Date(valeur);
  if (isNaN(d)) return "—";
  const p = new Intl.DateTimeFormat("fr-FR", {
    timeZone: FUSEAU_LOGEMENT,
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const v = (t) => p.find((x) => x.type === t)?.value || "";
  return `${Number(v("day"))} ${MOIS_COURT[Number(v("month")) - 1]} ${v("year")} à ${v("hour")}h${v("minute")}`;
}
