import { useState, useEffect } from "react";
import axios from "../../contexts/api/axios";
import GetUserData from "../../contexts/api/udata";
import Template from "../../components/template/template";
import Header from "../../components/header/header";
import Sidebar from "../../components/sidebar/sidebar";
import { toast } from "react-toastify";
import {
  BsBell,
  BsCheckLg,
  BsXLg,
  BsPlusCircle,
  BsPencilSquare,
  BsTrash,
  BsHourglassSplit,
  BsCheckCircleFill,
  BsXCircleFill,
} from "react-icons/bs";
import { SkLocataires } from "../../components/skeleton/skeleton";
import "../loyer/loyer.css";
import { formatDateHeure as formatDateTime, MOIS_LONG as MOIS_FULL } from "../../config/dates";

const ACTIONS = {
  AJOUT:        { label: "Ajout",        color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0", Icon: BsPlusCircle },
  MODIFICATION: { label: "Modification", color: "#d97706", bg: "#fffbeb", border: "#fde68a", Icon: BsPencilSquare },
  SUPPRESSION:  { label: "Suppression",  color: "#dc2626", bg: "#fef2f2", border: "#fecaca", Icon: BsTrash },
};

const STATUTS = {
  EN_ATTENTE: { label: "En attente", color: "#d97706", bg: "#fffbeb", Icon: BsHourglassSplit },
  APPROUVE:   { label: "Approuvée",  color: "#16a34a", bg: "#f0fdf4", Icon: BsCheckCircleFill },
  REFUSE:     { label: "Refusée",    color: "#dc2626", bg: "#fef2f2", Icon: BsXCircleFill },
};


// Champs affichés dans le diff, par type d'entité.
// Ils doivent couvrir TOUT ce que le serveur enregistre dans avant/apres :
// un champ oublié ici ne s'affiche pas, et une modification qui ne porte que
// sur lui donne un tableau vide — l'admin approuverait alors à l'aveugle.
const CHAMPS_LOCATAIRE = [
  ["nom", "Nom"],
  ["prenom", "Prénom"],
  ["chambre", "Chambre"],
  ["etage", "Étage"],
  ["loyer", "Loyer (Ar)"],
  ["caution", "Caution (Ar)"],
  ["tel", "Téléphone"],
  ["email", "Email"],
  ["dateEntree", "Date d'entrée"],
  ["jourPaiement", "Jour de paiement"],
  ["modePaiement", "Sens du règlement"],
  ["jiramaForfait", "Forfait JIRAMA (Ar)"],
  ["messengerId", "Lien Messenger"],
  ["photo", "Photo"],
  ["actif", "Actif"],
];

const CHAMPS_PAIEMENT = [
  ["volet", "Concerne"],
  ["mois", "Mois"],
  ["annee", "Année"],
  ["montantLoyer", "Loyer payé (Ar)"],
  ["statut", "Statut du loyer"],
  ["montantJIRAMA", "JIRAMA payé (Ar)"],
  ["statutJIRAMA", "Statut JIRAMA"],
  ["datePaiement", "Date de paiement"],
];

// Un locataire ne modifie que son identité et son avatar.
const CHAMPS_COMPTE = [
  ["idPS", "Identifiant"],
  ["nom", "Nom"],
  ["prenom", "Prénom"],
  ["photo", "Photo de profil"],
];

// Demande de réinitialisation de code, faite depuis l écran de connexion.
const CHAMPS_ACCES = [
  ["idPS", "Identifiant"],
  ["nom", "Nom"],
  ["prenom", "Prénom"],
  ["motif", "Motif"],
];

// Proposition de règle de la politique interne.
const CHAMPS_REGLEMENT = [
  ["titre", "Titre"],
  ["texte", "Explication"],
  ["icone", "Illustration"],
  ["actif", "Publiée"],
];

function champsDe(entite) {
  if (entite === "PAIEMENT") return CHAMPS_PAIEMENT;
  if (entite === "COMPTE") return CHAMPS_COMPTE;
  if (entite === "REGLEMENT") return CHAMPS_REGLEMENT;
  if (entite === "ACCES") return CHAMPS_ACCES;
  return CHAMPS_LOCATAIRE;
}

// Identifiants techniques et champs déjà repris dans l'en-tête de la carte :
// les répéter dans le tableau n'apprendrait rien.
const CHAMPS_TECHNIQUES = [
  "id", "locataireId", "factureId", "bienId", "auteurId",
  "locataireNom", "chambre", "etage", "declareParLocataire",
];

/**
 * Libellé d'un champ inconnu du catalogue ci-dessus.
 *
 * Filet de sécurité : le jour où le serveur enregistrera un champ de plus,
 * il s'affichera avec un libellé approximatif plutôt que de disparaître
 * silencieusement du tableau.
 */
function libelleBrut(champ) {
  const mots = champ.replace(/([a-z0-9])([A-Z])/g, "$1 $2").toLowerCase();
  return mots.charAt(0).toUpperCase() + mots.slice(1);
}

const STATUTS_LISIBLES = {
  PAYE: "Payé",
  PARTIEL: "Partiel",
  DOUTE: "Doute — à confirmer",
  IMPAYE: "Impayé",
};

function fmtVal(champ, v) {
  if (v === null || v === undefined || v === "") return "—";
  if (champ === "actif") return Number(v) ? "Oui" : "Non";
  // Une photo est une data URL de plusieurs milliers de caractères :
  // on n'affiche que le fait qu'elle change.
  if (champ === "photo") return "Photo définie";
  if (["loyer", "caution", "montantLoyer", "montantJIRAMA", "jiramaForfait"].includes(champ))
    return Number(v).toLocaleString();
  if (champ === "mois") return MOIS_FULL[Number(v) - 1] || String(v);
  if (champ === "dateEntree" || champ === "datePaiement") return String(v).split("T")[0];
  if (champ === "statut" || champ === "statutJIRAMA")
    return STATUTS_LISIBLES[String(v)] || String(v);
  if (champ === "modePaiement")
    return String(v).toUpperCase() === "AVANCE" ? "D'avance" : "Après consommation";
  if (champ === "volet") return String(v) === "JIRAMA" ? "Eau & électricité" : "Loyer";
  if (champ === "jourPaiement") return `le ${v} du mois`;
  return String(v);
}

function estDifferent(champ, a, b) {
  return fmtVal(champ, a) !== fmtVal(champ, b);
}

/**
 * Détail d'une demande.
 *
 * On ne compare un avant et un après que si la demande porte réellement les
 * deux. Une demande de réinitialisation de code, par exemple, est bien une
 * MODIFICATION mais n'a pas d'état antérieur à montrer : on liste alors
 * simplement ce qu'elle contient, au lieu de n'afficher rien du tout.
 */
function DiffTable({ demande }) {
  const { action, avant, apres } = demande;
  const CHAMPS = champsDe(demande.entite);
  const estDiff = action === "MODIFICATION" && !!avant && !!apres;
  const colonneAvant = estDiff || action === "SUPPRESSION";
  const colonneValeur = action !== "SUPPRESSION";

  // Au catalogue de l'entité, on ajoute tout champ present dans la demande
  // mais non répertorié : mieux vaut un libellé approximatif qu'une ligne
  // manquante, surtout quand elle est la seule à avoir changé.
  const connus = CHAMPS.map(([c]) => c);
  const supplementaires = [
    ...new Set([...Object.keys(avant || {}), ...Object.keys(apres || {})]),
  ]
    .filter((c) => !connus.includes(c) && !CHAMPS_TECHNIQUES.includes(c))
    .map((c) => [c, libelleBrut(c)]);
  const CATALOGUE = [...CHAMPS, ...supplementaires];

  const rows = estDiff
    ? CATALOGUE.filter(([c]) => estDifferent(c, avant[c], apres[c]))
    : CATALOGUE.filter(([c]) => {
        const src = action === "SUPPRESSION" ? avant : apres || avant;
        return src && src[c] !== null && src[c] !== undefined && src[c] !== "";
      });

  if (rows.length === 0)
    return <p className="text-muted small mb-0">Aucun détail disponible.</p>;

  return (
    <div className="table-responsive">
      <table className="table table-sm mb-0" style={{ fontSize: "0.82rem" }}>
        <thead>
          <tr>
            <th style={{ fontSize: "0.7rem", color: "#64748b", width: "30%" }}>Champ</th>
            {colonneAvant && (
              <th style={{ fontSize: "0.7rem", color: "#64748b" }}>Avant</th>
            )}
            {colonneValeur && (
              <th style={{ fontSize: "0.7rem", color: "#64748b" }}>
                {estDiff ? "Après" : "Valeur"}
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map(([champ, label]) => (
            <tr key={champ}>
              <td className="text-muted">{label}</td>
              {colonneAvant && (
                <td style={estDiff ? { color: "#b91c1c", textDecoration: "line-through" } : {}}>
                  {fmtVal(champ, avant?.[champ])}
                </td>
              )}
              {colonneValeur && (
                <td className="fw-semibold" style={estDiff ? { color: "#15803d" } : {}}>
                  {fmtVal(champ, (apres || avant)?.[champ])}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Notifications() {
  const u_info = GetUserData();
  const isAdmin = String(u_info.u_karazana) === "1";
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deciding, setDeciding] = useState(null); // id en cours de décision
  const [filtre, setFiltre] = useState("EN_ATTENTE");

  useEffect(() => {
    fetchDemandes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function fetchDemandes(silent = false) {
    if (!silent) setLoading(true);
    axios
      .get("loyer/validations", u_info.opts)
      .then((r) => setDemandes(r.data || []))
      .catch(() => setDemandes([]))
      .finally(() => {
        if (!silent) setLoading(false);
      });
  }

  function decider(id, decision) {
    setDeciding(id);
    axios
      .post(`loyer/validations/${id}/decision`, { decision }, u_info.opts)
      .then(() => {
        toast.success(decision === "APPROUVE" ? "Demande approuvée ✓" : "Demande refusée");
        fetchDemandes(true);
      })
      .catch((err) =>
        toast.error(err.response?.data?.message || "Erreur lors de la décision")
      )
      .finally(() => setDeciding(null));
  }

  const enAttente = demandes.filter((d) => d.statut === "EN_ATTENTE");
  const affichees = filtre === "TOUTES" ? demandes : demandes.filter((d) => d.statut === filtre);

  return (
    <Template>
      <Header />
      <div className="container-fluid flex-grow-1">
        <div className="row g-0">
          <Sidebar />
          <main className="col-md-9 ms-sm-auto col-lg-10 px-md-4 main">
            <div className="page-header">
              <div>
                <h1 className="page-title">
                  <BsBell /> Notifications
                </h1>
                <p className="text-muted small mb-0">
                  {isAdmin
                    ? `Demandes des utilisateurs à valider — ${enAttente.length} en attente`
                    : "Le suivi de vos demandes envoyées à l'admin"}
                </p>
              </div>
              <div className="d-flex gap-1">
                {["EN_ATTENTE", "APPROUVE", "REFUSE", "TOUTES"].map((f) => (
                  <button
                    key={f}
                    className="btn btn-sm"
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      background: filtre === f ? "#2563eb" : "#f1f5f9",
                      color: filtre === f ? "#fff" : "#475569",
                      borderRadius: 8,
                    }}
                    onClick={() => setFiltre(f)}
                  >
                    {f === "EN_ATTENTE" ? `En attente (${enAttente.length})` : f === "APPROUVE" ? "Approuvées" : f === "REFUSE" ? "Refusées" : "Toutes"}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <SkLocataires />
            ) : affichees.length === 0 ? (
              <div className="card-pro text-center py-5">
                <BsBell size={36} color="#cbd5e1" className="mb-2" />
                <p className="text-muted mb-0">
                  {filtre === "EN_ATTENTE"
                    ? "Aucune demande en attente. Tout est à jour ! 🎉"
                    : "Aucune demande dans cette catégorie."}
                </p>
              </div>
            ) : (
              <div className="row g-3 mb-4">
                {affichees.map((d) => {
                  const a = ACTIONS[d.action] || ACTIONS.MODIFICATION;
                  const s = STATUTS[d.statut] || STATUTS.EN_ATTENTE;
                  const src = d.apres || d.avant || {};
                  const estPaiement = d.entite === "PAIEMENT";
                  const estCompte = d.entite === "COMPTE";
                  const estRegle = d.entite === "REGLEMENT";
                  const estAcces = d.entite === "ACCES";
                  const typeLabel = estPaiement
                    ? "paiement"
                    : estCompte
                      ? "compte"
                      : estRegle
                        ? "politique interne"
                        : estAcces
                          ? "accès"
                          : "locataire";
                  const cible = estPaiement
                    ? `${src.locataireNom || "?"}${src.chambre ? ` (ch. ${src.chambre})` : ""} · ${MOIS_FULL[Number(src.mois) - 1] || ""} ${src.annee || ""}`
                    : estAcces
                      ? src.nom || src.idPS || ""
                      : estRegle
                      ? src.titre || ""
                      : d.action === "AJOUT" ? d.apres?.nom : d.avant?.nom || d.apres?.nom || "";
                  return (
                    <div className="col-12 col-lg-6" key={d.id}>
                      <div
                        className="card-pro p-0 h-100"
                        style={{ borderTop: `3px solid ${a.color}`, overflow: "hidden" }}
                      >
                        {/* En-tête */}
                        <div
                          className="px-3 py-2 d-flex justify-content-between align-items-center flex-wrap gap-1"
                          style={{ background: a.bg, borderBottom: `1px solid ${a.border}` }}
                        >
                          <span
                            className="d-inline-flex align-items-center gap-1 fw-bold"
                            style={{ color: a.color, fontSize: "0.85rem" }}
                          >
                            <a.Icon size={14} /> {a.label} — {typeLabel} {cible && <strong>{cible}</strong>}
                          </span>
                          <span
                            className="d-inline-flex align-items-center gap-1 rounded-pill px-2 py-0"
                            style={{ background: s.bg, color: s.color, fontSize: "0.72rem", fontWeight: 700 }}
                          >
                            <s.Icon size={11} /> {s.label}
                          </span>
                        </div>

                        {/* Meta */}
                        <div className="px-3 pt-2 d-flex justify-content-between flex-wrap" style={{ fontSize: "0.75rem", color: "#64748b" }}>
                          <span>
                            Par <strong>{d.auteurNom}</strong> · {formatDateTime(d.dateDemande)}
                          </span>
                          {d.statut !== "EN_ATTENTE" && (
                            <span>
                              {d.statut === "APPROUVE" ? "Approuvée" : "Refusée"} par <strong>{d.decideurNom}</strong> · {formatDateTime(d.dateDecision)}
                            </span>
                          )}
                        </div>

                        {/* Diff avant/après */}
                        <div className="p-3">
                          <DiffTable demande={d} />
                          {/* Approuver coupe l'accès : mieux vaut le dire avant. */}
                          {estAcces && d.statut === "EN_ATTENTE" && (
                            <div
                              className="rounded-3 p-2 mt-3"
                              style={{ background: "#fffbeb", border: "1px solid #fde68a" }}
                            >
                              <small style={{ fontSize: "0.75rem", color: "#92400e" }}>
                                Approuver rendra son code actuel inutilisable. Transmettez-lui
                                ensuite un nouveau code avec le bouton <strong>Accès</strong>,
                                qui réapparaîtra sur sa ligne dans la page Utilisateurs.
                              </small>
                            </div>
                          )}
                        </div>

                        {/* Actions admin */}
                        {isAdmin && d.statut === "EN_ATTENTE" && (
                          <div
                            className="px-3 py-2 d-flex justify-content-end gap-2"
                            style={{ background: "#f8fafc", borderTop: "1px solid #e2e8f0" }}
                          >
                            <button
                              className="btn btn-sm d-flex align-items-center gap-1 fw-semibold"
                              style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 8 }}
                              disabled={deciding === d.id}
                              onClick={() => decider(d.id, "REFUSE")}
                            >
                              <BsXLg size={12} /> Refuser
                            </button>
                            <button
                              className="btn btn-sm d-flex align-items-center gap-1 fw-semibold"
                              style={{ background: "#16a34a", color: "#fff", borderRadius: 8 }}
                              disabled={deciding === d.id}
                              onClick={() => decider(d.id, "APPROUVE")}
                            >
                              <BsCheckLg size={12} /> {deciding === d.id ? "..." : "Approuver"}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      </div>
    </Template>
  );
}
