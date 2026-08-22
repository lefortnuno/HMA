"use strict";
/**
 * Taux de change pour le convertisseur du budget OTIP.
 *
 * MODULE TEMPORAIRE (voir utils/otip.js).
 *
 * Deux raisons de passer par le serveur plutot que d'appeler l'API depuis le
 * navigateur :
 *
 *  · La politique de securite du site n'autorise le navigateur a contacter
 *    que ses propres domaines. Un appel direct vers un service de change
 *    serait bloque.
 *
 *  · Un cache partage. Les taux ne bougent qu'une fois par jour : les
 *    redemander a chaque ouverture de la fenetre serait du gaspillage, et
 *    rendrait le convertisseur dependant de la latence d'un tiers.
 *
 * En cas de panne du fournisseur, les derniers taux connus sont renvoyes avec
 * leur date : un convertisseur qui affiche des chiffres d'hier vaut mieux
 * qu'un convertisseur qui n'affiche rien.
 */

// Fournisseur public, sans cle, qui couvre l'ariary (MGA) et le dirham (MAD).
// Google ne publie pas d'API de change utilisable.
const SOURCE = "https://open.er-api.com/v6/latest/EUR";
const DUREE_CACHE = 6 * 3600 * 1000; // 6 h : les taux sont quotidiens
const DELAI_MAX = 8000;

// Repli si le service n'a jamais repondu depuis le demarrage. Ordres de
// grandeur d'aout 2026, clairement signales comme approximatifs.
const REPLI = { EUR: 1, MGA: 5045, MAD: 10.79 };

let cache = null; // { taux, maj, source, obtenuLe }
let enCours = null; // requete partagee, pour ne pas en lancer dix a la fois

async function interroger() {
  const ctrl = new AbortController();
  const minuteur = setTimeout(() => ctrl.abort(), DELAI_MAX);
  try {
    const rep = await fetch(SOURCE, { signal: ctrl.signal });
    if (!rep.ok) throw new Error("HTTP " + rep.status);
    const j = await rep.json();
    const r = j.rates || {};
    if (!r.MGA || !r.MAD) throw new Error("devises manquantes");
    return {
      taux: { EUR: 1, MGA: Number(r.MGA), MAD: Number(r.MAD) },
      maj: j.time_last_update_utc || null,
      source: "open.er-api.com",
      obtenuLe: new Date().toISOString(),
      approximatif: false,
    };
  } finally {
    clearTimeout(minuteur);
  }
}

/**
 * Taux courants, depuis le cache quand il est frais.
 *
 * Ne rejette jamais : l'appelant recoit toujours de quoi convertir.
 */
async function getTaux() {
  const frais = cache && Date.now() - Date.parse(cache.obtenuLe) < DUREE_CACHE;
  if (frais) return { ...cache, cache: true };

  // Une seule requete sortante, meme si plusieurs onglets demandent en meme
  // temps : les suivants attendent le resultat de la premiere.
  if (!enCours) {
    enCours = interroger()
      .then((r) => {
        cache = r;
        return r;
      })
      .catch(() => null)
      .finally(() => {
        enCours = null;
      });
  }
  const frais2 = await enCours;
  if (frais2) return { ...frais2, cache: false };

  // Le service n'a pas repondu : derniers taux connus, ou repli.
  if (cache) return { ...cache, cache: true, perime: true };
  return {
    taux: REPLI,
    maj: null,
    source: "valeurs de repli",
    obtenuLe: new Date().toISOString(),
    approximatif: true,
    cache: false,
  };
}

module.exports = { getTaux, REPLI, SOURCE };
