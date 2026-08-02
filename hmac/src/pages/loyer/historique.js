import { useState, useEffect } from "react";
import axios from "../../contexts/api/axios";
import GetUserData from "../../contexts/api/udata";
import Template from "../../components/template/template";
import Header from "../../components/header/header";
import Sidebar from "../../components/sidebar/sidebar";
import {
  BsClockHistory, BsBoxArrowInRight, BsBoxArrowLeft, BsArrowLeftRight,
  BsCashCoin, BsPlusCircle, BsPencilSquare, BsSearch,
} from "react-icons/bs";
import { SkLocataires } from "../../components/skeleton/skeleton";
import ApartSelect, {
  useAppartements,
  getSelectedBienId,
  setSelectedBienId,
} from "../../components/appart/apart.select";
import "./loyer.css";

const MOIS_FR = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
const MOIS_FULL = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const ANNEES = [2025, 2026, 2027];

function formatDateTime(str) {
  if (!str) return "—";
  const d = new Date(str);
  if (isNaN(d)) return "—";
  return `${d.getDate()} ${MOIS_FR[d.getMonth()]} ${d.getFullYear()} à ${String(d.getHours()).padStart(2, "0")}h${String(d.getMinutes()).padStart(2, "0")}`;
}

function formatDate(str) {
  if (!str) return "—";
  const d = new Date(str);
  if (isNaN(d)) return "—";
  return `${d.getDate()} ${MOIS_FR[d.getMonth()]} ${d.getFullYear()}`;
}

const ACTIONS = {
  ENTREE: { label: "Entrée", color: "#16a34a", bg: "#f0fdf4", Icon: BsBoxArrowInRight },
  SORTIE: { label: "Sortie", color: "#dc2626", bg: "#fef2f2", Icon: BsBoxArrowLeft },
  MODIFICATION: { label: "Changement", color: "#d97706", bg: "#fffbeb", Icon: BsArrowLeftRight },
};

const STATUTS = {
  PAYE: { label: "Payé", color: "#16a34a", bg: "#f0fdf4" },
  PARTIEL: { label: "Partiel", color: "#d97706", bg: "#fffbeb" },
  DOUTE: { label: "Doute", color: "#854d0e", bg: "#fef9c3" },
  IMPAYE: { label: "Impayé", color: "#dc2626", bg: "#fef2f2" },
};

const PAR_PAGE = 12;

// Pagination réutilisée par les trois tableaux.
function Pagination({ page, nbPages, onChange }) {
  if (nbPages <= 1) return null;
  const pages = Array.from({ length: nbPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === nbPages || Math.abs(p - page) <= 1
  );
  return (
    <div className="d-flex align-items-center gap-1 flex-wrap">
      <button
        className="btn btn-sm btn-outline-secondary py-0 px-2"
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
      >
        ‹
      </button>
      {pages.map((p, i) => (
        <span key={p} className="d-flex align-items-center gap-1">
          {i > 0 && pages[i - 1] !== p - 1 && (
            <span className="text-muted" style={{ fontSize: "0.75rem" }}>…</span>
          )}
          <button
            className={`btn btn-sm py-0 px-2 ${page === p ? "btn-primary" : "btn-outline-secondary"}`}
            onClick={() => onChange(p)}
          >
            {p}
          </button>
        </span>
      ))}
      <button
        className="btn btn-sm btn-outline-secondary py-0 px-2"
        disabled={page === nbPages}
        onClick={() => onChange(page + 1)}
      >
        ›
      </button>
    </div>
  );
}

export default function Historique() {
  const u_info = GetUserData();
  const [bienId, setBienId] = useState(getSelectedBienId());
  const apparts = useAppartements(bienId, setBienId);
  const [vue, setVue] = useState("PAIEMENTS"); // PAIEMENTS | OCCUPATION
  const [annee, setAnnee] = useState(new Date().getFullYear());
  const [recherche, setRecherche] = useState("");

  // Filtres et pagination, propres à chaque tableau.
  const [filtreStatut, setFiltreStatut] = useState("TOUS");
  const [filtreMois, setFiltreMois] = useState("TOUS");
  const [filtreAction, setFiltreAction] = useState("TOUTES");
  const [pagePaiements, setPagePaiements] = useState(1);
  const [pageJournal, setPageJournal] = useState(1);
  const [pageOccupation, setPageOccupation] = useState(1);

  // Tout changement de filtre ramène en première page.
  useEffect(() => {
    setPagePaiements(1);
    setPageJournal(1);
    setPageOccupation(1);
  }, [recherche, filtreStatut, filtreMois, filtreAction, vue, annee, bienId]);

  const [histo, setHisto] = useState([]);
  const [paiements, setPaiements] = useState([]);
  const [journal, setJournal] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const requetes =
      vue === "OCCUPATION"
        ? [
            axios
              .get(`loyer/historique?bienId=${bienId}`, u_info.opts)
              .then((r) => setHisto(r.data || []))
              .catch(() => setHisto([])),
          ]
        : [
            axios
              .get(`loyer/paiements/detail?annee=${annee}&bienId=${bienId}`, u_info.opts)
              .then((r) => setPaiements(r.data || []))
              .catch(() => setPaiements([])),
            axios
              .get(`loyer/paiements/historique?annee=${annee}`, u_info.opts)
              .then((r) => setJournal(r.data || []))
              .catch(() => setJournal([])),
          ];
    Promise.all(requetes).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vue, annee, bienId]);

  function changeAppart(id) {
    setBienId(id);
    setSelectedBienId(id);
  }

  const corresp = (txt) =>
    !recherche || String(txt || "").toLowerCase().includes(recherche.toLowerCase());

  const paiementsFiltres = paiements.filter((p) => {
    if (filtreStatut !== "TOUS" && p.statut !== filtreStatut) return false;
    if (filtreMois !== "TOUS" && String(p.mois) !== String(filtreMois)) return false;
    return corresp(`${p.nom} ${p.prenom || ""}`) || corresp(p.chambre);
  });

  const journalFiltre = journal.filter((j) => {
    if (filtreMois !== "TOUS" && String(j.mois) !== String(filtreMois)) return false;
    return corresp(j.locataireNom) || corresp(j.chambre) || corresp(j.auteurNom);
  });

  const occupationFiltree = histo.filter((h) => {
    if (filtreAction !== "TOUTES" && h.action !== filtreAction) return false;
    return corresp(`${h.nom} ${h.prenom || ""}`) || corresp(h.chambre);
  });

  const totalPaye = paiementsFiltres
    .filter((p) => p.statut === "PAYE" || p.statut === "PARTIEL")
    .reduce((s, p) => s + (p.montantLoyer || 0) + (p.montantJIRAMA || 0), 0);

  // Découpage en pages
  const pages = (liste, page) => ({
    nbPages: Math.max(1, Math.ceil(liste.length / PAR_PAGE)),
    visibles: liste.slice((page - 1) * PAR_PAGE, page * PAR_PAGE),
  });
  const vuePaiements = pages(paiementsFiltres, pagePaiements);
  const vueJournal = pages(journalFiltre, pageJournal);
  const vueOccupation = pages(occupationFiltree, pageOccupation);

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
                  <BsClockHistory /> Historique
                </h1>
                <p className="text-muted small mb-0">
                  {vue === "PAIEMENTS"
                    ? "Tous les paiements enregistrés — pour vérifier une attribution"
                    : "Qui a occupé quelle chambre, et quand"}
                </p>
              </div>
              <div className="d-flex gap-2 align-items-center flex-wrap">
                <ApartSelect list={apparts} value={bienId} onChange={changeAppart} />
                {vue === "PAIEMENTS" && (
                  <select
                    className="form-select form-select-sm"
                    style={{ width: "auto" }}
                    value={annee}
                    onChange={(e) => setAnnee(+e.target.value)}
                  >
                    {ANNEES.map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>
                )}
              </div>
            </div>

            {/* Sélecteur de vue */}
            <div className="d-flex gap-1 mb-3 flex-wrap">
              {[
                { cle: "PAIEMENTS", label: "Paiements de loyer", Icon: BsCashCoin },
                { cle: "OCCUPATION", label: "Occupation des chambres", Icon: BsArrowLeftRight },
              ].map(({ cle, label, Icon }) => {
                const actif = vue === cle;
                return (
                  <button
                    key={cle}
                    className="btn btn-sm d-flex align-items-center gap-2 fw-semibold"
                    style={{
                      background: actif ? "#2563eb" : "#f1f5f9",
                      color: actif ? "#fff" : "#475569",
                      borderRadius: 8,
                      fontSize: "0.82rem",
                    }}
                    onClick={() => setVue(cle)}
                  >
                    <Icon size={14} /> {label}
                  </button>
                );
              })}
            </div>

            {/* Recherche et filtres */}
            <div className="d-flex gap-2 mb-3 flex-wrap align-items-center">
              <div className="input-group input-group-sm" style={{ maxWidth: 280 }}>
                <span className="input-group-text bg-white border-end-0">
                  <BsSearch size={13} style={{ color: "#94a3b8" }} />
                </span>
                <input
                  type="text"
                  className="form-control border-start-0 ps-0"
                  placeholder="Rechercher un locataire, une chambre…"
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                  style={{ fontSize: "0.82rem" }}
                />
              </div>

              {vue === "PAIEMENTS" ? (
                <>
                  <select
                    className="form-select form-select-sm"
                    style={{ width: "auto", fontSize: "0.82rem" }}
                    value={filtreStatut}
                    onChange={(e) => setFiltreStatut(e.target.value)}
                    title="Filtrer par statut"
                  >
                    <option value="TOUS">Tous les statuts</option>
                    {Object.entries(STATUTS).map(([cle, s]) => (
                      <option key={cle} value={cle}>{s.label}</option>
                    ))}
                  </select>
                  <select
                    className="form-select form-select-sm"
                    style={{ width: "auto", fontSize: "0.82rem" }}
                    value={filtreMois}
                    onChange={(e) => setFiltreMois(e.target.value)}
                    title="Filtrer par mois"
                  >
                    <option value="TOUS">Tous les mois</option>
                    {MOIS_FULL.map((m, i) => (
                      <option key={i + 1} value={i + 1}>{m}</option>
                    ))}
                  </select>
                </>
              ) : (
                <select
                  className="form-select form-select-sm"
                  style={{ width: "auto", fontSize: "0.82rem" }}
                  value={filtreAction}
                  onChange={(e) => setFiltreAction(e.target.value)}
                  title="Filtrer par type de mouvement"
                >
                  <option value="TOUTES">Toutes les actions</option>
                  {Object.entries(ACTIONS).map(([cle, a]) => (
                    <option key={cle} value={cle}>{a.label}</option>
                  ))}
                </select>
              )}

              {(recherche ||
                filtreStatut !== "TOUS" ||
                filtreMois !== "TOUS" ||
                filtreAction !== "TOUTES") && (
                <button
                  className="btn btn-sm btn-outline-secondary py-0 px-2"
                  style={{ fontSize: "0.75rem" }}
                  onClick={() => {
                    setRecherche("");
                    setFiltreStatut("TOUS");
                    setFiltreMois("TOUS");
                    setFiltreAction("TOUTES");
                  }}
                >
                  ✕ Réinitialiser
                </button>
              )}
            </div>

            {loading ? (
              <SkLocataires />
            ) : vue === "PAIEMENTS" ? (
              <>
                {/* Paiements enregistrés */}
                <div className="card-pro p-0 mb-4">
                  <div className="p-3 border-bottom d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <h6 className="fw-bold mb-0">
                      Paiements enregistrés — {annee}
                      <span className="text-muted fw-normal ms-2" style={{ fontSize: "0.78rem" }}>
                        {paiementsFiltres.length} ligne{paiementsFiltres.length > 1 ? "s" : ""}
                      </span>
                    </h6>
                    <span className="fw-bold text-success">{totalPaye.toLocaleString()} Ar encaissés</span>
                  </div>
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead style={{ background: "#f8fafc" }}>
                        <tr>
                          <th style={{ fontSize: "0.73rem", color: "#64748b" }}>Ch.</th>
                          <th style={{ fontSize: "0.73rem", color: "#64748b" }}>Locataire</th>
                          <th style={{ fontSize: "0.73rem", color: "#64748b" }}>Mois</th>
                          <th style={{ fontSize: "0.73rem", color: "#64748b" }}>Loyer</th>
                          <th style={{ fontSize: "0.73rem", color: "#64748b" }}>JIRAMA</th>
                          <th style={{ fontSize: "0.73rem", color: "#64748b" }}>Statut</th>
                          <th style={{ fontSize: "0.73rem", color: "#64748b" }}>Date de paiement</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paiementsFiltres.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="text-center text-muted py-4" style={{ fontSize: "0.85rem" }}>
                              Aucun paiement enregistré pour {annee}
                            </td>
                          </tr>
                        ) : (
                          vuePaiements.visibles.map((p) => {
                            const st = STATUTS[p.statut] || STATUTS.IMPAYE;
                            return (
                              <tr key={p.id}>
                                <td>
                                  <span className={p.etage === "1ER" ? "badge-1er" : "badge-rdc"}>
                                    {p.chambre}
                                  </span>
                                </td>
                                <td className="fw-semibold" style={{ fontSize: "0.85rem" }}>
                                  {p.nom} {p.prenom}
                                </td>
                                <td style={{ fontSize: "0.83rem" }}>{MOIS_FULL[p.mois - 1]}</td>
                                <td style={{ fontSize: "0.83rem" }}>{(p.montantLoyer || 0).toLocaleString()}</td>
                                <td style={{ fontSize: "0.83rem" }}>{(p.montantJIRAMA || 0).toLocaleString()}</td>
                                <td>
                                  <span
                                    className="rounded-pill px-2 fw-semibold"
                                    style={{ background: st.bg, color: st.color, fontSize: "0.72rem" }}
                                  >
                                    {st.label}
                                  </span>
                                </td>
                                <td style={{ fontSize: "0.82rem", whiteSpace: "nowrap" }}>
                                  {formatDate(p.datePaiement)}
                                  {p.jourPaiement && (
                                    <span className="text-muted ms-1" style={{ fontSize: "0.7rem" }}>
                                      (habituel : le {p.jourPaiement})
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Journal des saisies */}
                <div className="card-pro p-0">
                  <div className="p-3 border-bottom">
                    <h6 className="fw-bold mb-0">Journal des saisies</h6>
                    <small className="text-muted" style={{ fontSize: "0.75rem" }}>
                      Qui a enregistré ou modifié quel paiement, et quand
                    </small>
                  </div>
                  {journalFiltre.length === 0 ? (
                    <p className="text-muted text-center py-4 mb-0" style={{ fontSize: "0.83rem" }}>
                      Aucune saisie journalisée pour {annee}.<br />
                      <small>Le journal enregistre les paiements à partir de maintenant.</small>
                    </p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover mb-0">
                        <thead style={{ background: "#f8fafc" }}>
                          <tr>
                            <th style={{ fontSize: "0.73rem", color: "#64748b" }}>Quand</th>
                            <th style={{ fontSize: "0.73rem", color: "#64748b" }}>Action</th>
                            <th style={{ fontSize: "0.73rem", color: "#64748b" }}>Locataire</th>
                            <th style={{ fontSize: "0.73rem", color: "#64748b" }}>Mois</th>
                            <th style={{ fontSize: "0.73rem", color: "#64748b" }}>Montant</th>
                            <th style={{ fontSize: "0.73rem", color: "#64748b" }}>Par</th>
                          </tr>
                        </thead>
                        <tbody>
                          {vueJournal.visibles.map((j) => (
                            <tr key={j.id}>
                              <td style={{ fontSize: "0.82rem", whiteSpace: "nowrap" }}>
                                {formatDateTime(j.dateAction)}
                              </td>
                              <td>
                                <span
                                  className="d-inline-flex align-items-center gap-1 rounded-3 px-2 py-1 fw-semibold"
                                  style={
                                    j.action === "AJOUT"
                                      ? { background: "#f0fdf4", color: "#16a34a", fontSize: "0.72rem" }
                                      : { background: "#fffbeb", color: "#d97706", fontSize: "0.72rem" }
                                  }
                                >
                                  {j.action === "AJOUT" ? <BsPlusCircle size={11} /> : <BsPencilSquare size={11} />}
                                  {j.action === "AJOUT" ? "Ajout" : "Modif."}
                                </span>
                              </td>
                              <td style={{ fontSize: "0.84rem" }}>
                                <span className={j.etage === "1ER" ? "badge-1er" : "badge-rdc"}>{j.chambre}</span>{" "}
                                <span className="fw-semibold">{j.locataireNom}</span>
                              </td>
                              <td style={{ fontSize: "0.82rem" }}>{MOIS_FULL[j.mois - 1]}</td>
                              <td style={{ fontSize: "0.82rem" }}>
                                {((j.montantLoyer || 0) + (j.montantJIRAMA || 0)).toLocaleString()} Ar
                                {j.avant && (
                                  <span className="text-muted ms-1" style={{ fontSize: "0.72rem" }}>
                                    (avant : {((j.avant.montantLoyer || 0) + (j.avant.montantJIRAMA || 0)).toLocaleString()})
                                  </span>
                                )}
                              </td>
                              <td className="text-muted" style={{ fontSize: "0.8rem" }}>
                                {j.auteurNom || "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            ) : histo.length === 0 ? (
              <div className="card-pro text-center py-5">
                <p className="text-muted mb-0">
                  Aucun mouvement enregistré pour l'instant.<br />
                  <small>Les entrées, sorties et changements de chambre apparaîtront ici automatiquement.</small>
                </p>
              </div>
            ) : (
              <div className="card-pro p-0 mb-4">
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead style={{ background: "#f8fafc" }}>
                      <tr>
                        <th style={{ fontSize: "0.73rem", color: "#64748b" }}>Date</th>
                        <th style={{ fontSize: "0.73rem", color: "#64748b" }}>Action</th>
                        <th style={{ fontSize: "0.73rem", color: "#64748b" }}>Locataire</th>
                        <th style={{ fontSize: "0.73rem", color: "#64748b" }}>Chambre</th>
                        <th style={{ fontSize: "0.73rem", color: "#64748b" }}>Détails</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vueOccupation.visibles.map((h) => {
                          const a = ACTIONS[h.action] || ACTIONS.MODIFICATION;
                          return (
                            <tr key={h.id}>
                              <td style={{ fontSize: "0.83rem", whiteSpace: "nowrap" }}>
                                {formatDateTime(h.dateAction)}
                              </td>
                              <td>
                                <span
                                  className="d-inline-flex align-items-center gap-1 rounded-3 px-2 py-1 fw-semibold"
                                  style={{ background: a.bg, color: a.color, fontSize: "0.75rem" }}
                                >
                                  <a.Icon size={12} /> {a.label}
                                </span>
                              </td>
                              <td className="fw-semibold" style={{ fontSize: "0.85rem" }}>
                                {h.nom} {h.prenom}
                              </td>
                              <td>
                                <span className={h.etage === "1ER" ? "badge-1er" : "badge-rdc"}>
                                  {h.chambre}
                                </span>
                              </td>
                              <td className="text-muted" style={{ fontSize: "0.82rem" }}>
                                {h.details}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
                {vueOccupation.nbPages > 1 && (
                  <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 p-3 border-top">
                    <small className="text-muted" style={{ fontSize: "0.75rem" }}>
                      {occupationFiltree.length} mouvement{occupationFiltree.length > 1 ? "s" : ""} ·
                      page {pageOccupation} sur {vueOccupation.nbPages}
                    </small>
                    <Pagination page={pageOccupation} nbPages={vueOccupation.nbPages} onChange={setPageOccupation} />
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </Template>
  );
}
