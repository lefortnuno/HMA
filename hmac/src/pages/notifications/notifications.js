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

const MOIS_FR = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];

function formatDateTime(str) {
  if (!str) return "—";
  const d = new Date(str);
  if (isNaN(d)) return "—";
  return `${d.getDate()} ${MOIS_FR[d.getMonth()]} ${d.getFullYear()} à ${String(d.getHours()).padStart(2, "0")}h${String(d.getMinutes()).padStart(2, "0")}`;
}

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

// Champs affichés dans le diff, avec libellés lisibles.
const CHAMPS = [
  ["nom", "Nom"],
  ["prenom", "Prénom"],
  ["chambre", "Chambre"],
  ["etage", "Étage"],
  ["loyer", "Loyer (Ar)"],
  ["caution", "Caution (Ar)"],
  ["tel", "Téléphone"],
  ["email", "Email"],
  ["dateEntree", "Date d'entrée"],
  ["actif", "Actif"],
];

function fmtVal(champ, v) {
  if (v === null || v === undefined || v === "") return "—";
  if (champ === "actif") return Number(v) ? "Oui" : "Non";
  if (champ === "loyer" || champ === "caution") return Number(v).toLocaleString();
  if (champ === "dateEntree") return String(v).split("T")[0];
  return String(v);
}

function estDifferent(champ, a, b) {
  return fmtVal(champ, a) !== fmtVal(champ, b);
}

// Tableau avant/après : en MODIFICATION seuls les champs modifiés ressortent.
function DiffTable({ demande }) {
  const { action, avant, apres } = demande;
  const rows =
    action === "MODIFICATION"
      ? CHAMPS.filter(([c]) => avant && apres && estDifferent(c, avant[c], apres[c]))
      : CHAMPS.filter(([c]) => {
          const src = action === "AJOUT" ? apres : avant;
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
            {action !== "AJOUT" && (
              <th style={{ fontSize: "0.7rem", color: "#64748b" }}>Avant</th>
            )}
            {action !== "SUPPRESSION" && (
              <th style={{ fontSize: "0.7rem", color: "#64748b" }}>
                {action === "AJOUT" ? "Valeur" : "Après"}
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map(([champ, label]) => (
            <tr key={champ}>
              <td className="text-muted">{label}</td>
              {action !== "AJOUT" && (
                <td style={action === "MODIFICATION" ? { color: "#b91c1c", textDecoration: "line-through" } : {}}>
                  {fmtVal(champ, avant?.[champ])}
                </td>
              )}
              {action !== "SUPPRESSION" && (
                <td className="fw-semibold" style={action === "MODIFICATION" ? { color: "#15803d" } : {}}>
                  {fmtVal(champ, apres?.[champ])}
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
                  const cible =
                    d.action === "AJOUT" ? d.apres?.nom : d.avant?.nom || d.apres?.nom || "";
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
                            <a.Icon size={14} /> {a.label} — locataire {cible && <strong>{cible}</strong>}
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
