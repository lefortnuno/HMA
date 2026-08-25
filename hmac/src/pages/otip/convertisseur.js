import { useState, useEffect, useCallback } from "react";
import axios from "../../contexts/api/axios";
import GetUserData from "../../contexts/api/udata";
import {
  BsCurrencyExchange, BsXLg, BsArrowRepeat, BsInfoCircle, BsExclamationTriangle,
} from "react-icons/bs";
import { formatDateHeure } from "../../config/dates";
import { Sk } from "../../components/skeleton/skeleton";

/**
 * Convertisseur ariary / euro / dirham, plus l'ancien franc malgache.
 *
 * MODULE TEMPORAIRE (voir budget.otip.js).
 *
 * Les quatre champs sont équivalents : on tape dans celui qu'on veut, les
 * trois autres suivent. C'est le point de la demande — on raisonne tantôt en
 * ariary, tantôt en dirhams, et on ne veut pas se demander quel champ est
 * « l'entrée ».
 *
 * Le franc malgache n'est pas une devise cotée : il vaut exactement 5 ariary
 * depuis le changement de monnaie. C'est une multiplication, pas un taux, et
 * elle ne dépend d'aucun service extérieur.
 */

const FMG_PAR_ARIARY = 5;

// L'ordre d'affichage. `cle` sert aussi de code de devise côté serveur.
// Pas de drapeaux : Windows ne rend pas les emoji de pays et les affiche
// en paires de lettres, ce qui passe pour un defaut. Le code de la devise
// dit la meme chose, et se lit partout.
const DEVISES = [
  { cle: "MGA", label: "Ariary", symbole: "Ar", code: "MGA" },
  { cle: "FMG", label: "Franc malgache", symbole: "FMG", code: "FMG", derive: true },
  { cle: "EUR", label: "Euro", symbole: "€", code: "EUR" },
  { cle: "MAD", label: "Dirham marocain", symbole: "DH", code: "MAD" },
];

// Un montant se saisit avec une virgule ou un point, et parfois avec des
// espaces : on accepte les trois plutôt que de refuser la saisie.
const versNombre = (t) => {
  const n = Number(String(t).replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
};

const afficher = (v, decimales) =>
  v === null || v === undefined
    ? ""
    : Number(v).toLocaleString("fr-FR", {
        minimumFractionDigits: 0,
        maximumFractionDigits: decimales,
      });

export default function Convertisseur({ onClose }) {
  const u_info = GetUserData();
  const [taux, setTaux] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(false);
  // Montant de référence, exprimé en euros — pivot de toutes les conversions.
  const [enEuros, setEnEuros] = useState(0);
  // Champ en cours de frappe : on n'y réécrit pas la valeur formatée, sinon
  // le curseur saute et « 1 0 0 0 » devient impossible à taper.
  const [saisie, setSaisie] = useState({ cle: "MGA", texte: "" });

  const charger = useCallback(
    (forcer = false) => {
      if (forcer) setChargement(true);
      axios
        .get("otip/taux", u_info.opts)
        .then((r) => {
          setTaux(r.data);
          setErreur(false);
        })
        .catch(() => setErreur(true))
        .finally(() => setChargement(false));
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    []
  );

  useEffect(() => {
    charger();
  }, [charger]);

  // Échap referme, comme partout ailleurs dans l'application.
  useEffect(() => {
    const k = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);

  const t = taux?.taux || null;

  /** Valeur d'une devise, à partir du pivot en euros. */
  function valeurDe(cle) {
    if (!t) return null;
    if (cle === "EUR") return enEuros;
    if (cle === "FMG") return enEuros * t.MGA * FMG_PAR_ARIARY;
    return enEuros * t[cle];
  }

  /** Une frappe dans n'importe quel champ redéfinit le pivot. */
  function saisir(cle, texte) {
    setSaisie({ cle, texte });
    const n = versNombre(texte);
    if (n === null || !t) return;
    if (cle === "EUR") setEnEuros(n);
    else if (cle === "FMG") setEnEuros(n / FMG_PAR_ARIARY / t.MGA);
    else setEnEuros(n / t[cle]);
  }

  const decimalesDe = (cle) => (cle === "EUR" ? 2 : cle === "MAD" ? 2 : 0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content-pro"
        style={{ maxWidth: 520 }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titre-convertisseur"
      >
        <div className="modal-header-pro">
          <h6 id="titre-convertisseur">
            <BsCurrencyExchange className="me-2" /> Convertisseur
          </h6>
          <button className="btn-close" aria-label="Fermer" onClick={onClose} />
        </div>

        <div className="p-4">
          <p className="text-muted mb-3" style={{ fontSize: "0.8rem" }}>
            Saisissez un montant dans n'importe quel champ : les trois autres
            se mettent à jour.
          </p>

          {chargement ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[1, 2, 3, 4].map((i) => (
                <Sk key={i} w="100%" h={42} className="sk-btn" />
              ))}
            </div>
          ) : erreur && !t ? (
            <div
              className="p-3 rounded-3 d-flex gap-2 align-items-start"
              style={{ background: "#fef2f2", border: "1px solid #fecaca" }}
            >
              <BsExclamationTriangle size={16} style={{ color: "#dc2626", flex: "0 0 auto", marginTop: 2 }} />
              <div>
                <div className="fw-semibold" style={{ fontSize: "0.85rem", color: "#991b1b" }}>
                  Taux indisponibles
                </div>
                <small className="text-muted" style={{ fontSize: "0.78rem" }}>
                  Le service de change n'a pas répondu.{" "}
                  <button
                    className="btn btn-link btn-sm p-0 align-baseline"
                    onClick={() => charger(true)}
                  >
                    Réessayer
                  </button>
                </small>
              </div>
            </div>
          ) : (
            <>
              <div className="otip-conv-grille">
                {DEVISES.map(({ cle, label, symbole, code, derive }) => {
                  const enFrappe = saisie.cle === cle;
                  const valeur = enFrappe
                    ? saisie.texte
                    : afficher(valeurDe(cle), decimalesDe(cle));
                  return (
                    <label key={cle} className="otip-conv-champ">
                      <span className="otip-conv-label">
                        <span className="otip-conv-code">{code}</span> {label}
                        {derive && <em className="otip-conv-derive">= Ar × 5</em>}
                      </span>
                      <span className="otip-conv-saisie">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={valeur}
                          onChange={(e) => saisir(cle, e.target.value)}
                          onFocus={(e) => e.target.select()}
                          placeholder="0"
                          aria-label={`Montant en ${label}`}
                        />
                        <span className="otip-conv-symbole">{symbole}</span>
                      </span>
                    </label>
                  );
                })}
              </div>

              {/* D'où viennent les chiffres : un convertisseur sans source
                  vérifiable n'inspire pas confiance. */}
              <div className="otip-conv-source mt-3">
                <BsInfoCircle size={13} style={{ flex: "0 0 auto", marginTop: 2 }} />
                <div>
                  {taux?.approximatif ? (
                    <span className="text-warning-emphasis">
                      Taux de repli approximatifs, le service n'a pas répondu.
                    </span>
                  ) : (
                    <>
                      1 € = {afficher(t.MGA, 0)} Ar = {afficher(t.MAD, 2)} DH
                      <span className="d-block">
                        Source : {taux.source}
                        {taux.maj ? ` · mis à jour le ${formatDateHeure(taux.maj)}` : ""}
                        {taux.perime ? " · dernier relevé connu" : ""}
                      </span>
                    </>
                  )}
                </div>
                <button
                  className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1 ms-auto"
                  onClick={() => charger(true)}
                  title="Récupérer les taux les plus récents"
                >
                  <BsArrowRepeat size={12} /> Actualiser
                </button>
              </div>
            </>
          )}

          <div className="d-flex justify-content-end mt-4">
            <button
              className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-1"
              onClick={onClose}
            >
              <BsXLg /> Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
