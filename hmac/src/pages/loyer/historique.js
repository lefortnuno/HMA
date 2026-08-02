import { useState, useEffect } from "react";
import axios from "../../contexts/api/axios";
import GetUserData from "../../contexts/api/udata";
import Template from "../../components/template/template";
import Header from "../../components/header/header";
import Sidebar from "../../components/sidebar/sidebar";
import {
  BsClockHistory, BsBoxArrowInRight, BsBoxArrowLeft, BsArrowLeftRight,
  BsCashCoin, BsPlusCircle, BsPencilSquare, BsSearch,
  BsCheckCircleFill, BsHourglassSplit, BsExclamationCircleFill, BsXCircleFill,
  BsJournalText,
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

const TAILLES_PAGE = [8, 10, 20, 50, 100];

/* ── Filtre en cartes, sur le modèle de la page Utilisateurs ──
   Un clic filtre, un second clic (ou la carte "tout") revient au complet. */
function CartesFiltre({ cartes, valeur, onChange }) {
  return (
    <div className="row g-3 mb-4">
      {cartes.map(({ cle, n, libelle, icone, couleur, accent }) => {
        const actif = valeur === cle;
        const basculer = () => onChange(actif ? cartes[0].cle : cle);
        return (
          <div className="col-6 col-md-4 col-xl" key={cle}>
            <div
              className="stat-card"
              role="button"
              tabIndex={0}
              title={cle === cartes[0].cle ? "Tout afficher" : `N'afficher que : ${libelle}`}
              onClick={basculer}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  basculer();
                }
              }}
              style={{
                cursor: "pointer",
                border: `2px solid ${actif ? accent : "transparent"}`,
                boxShadow: actif ? `0 4px 14px ${accent}33` : undefined,
                transition: "all 0.15s ease",
              }}
            >
              <div className={`stat-icon ${couleur}`}>{icone}</div>
              <div className="stat-content">
                <h3>{n}</h3>
                <p>{libelle}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Navigation de pages, alignée sur celle de la page Utilisateurs.
function Pagination({ page, nbPages, onChange }) {
  if (nbPages <= 1) return null;
  const pages = Array.from({ length: nbPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === nbPages || Math.abs(p - page) <= 1
  );
  return (
    <div className="d-flex align-items-center gap-1 flex-wrap justify-content-end">
      <button
        className="btn btn-outline-secondary btn-sm"
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
        title="Page précédente"
      >
        ‹
      </button>
      {pages.map((p, i) => (
        <span key={p} className="d-flex align-items-center gap-1">
          {i > 0 && pages[i - 1] !== p - 1 && (
            <span className="text-muted px-1" style={{ fontSize: "0.75rem" }}>…</span>
          )}
          <button
            className={`btn btn-sm ${page === p ? "btn-primary" : "btn-outline-secondary"}`}
            onClick={() => onChange(p)}
          >
            {p}
          </button>
        </span>
      ))}
      <button
        className="btn btn-outline-secondary btn-sm"
        disabled={page === nbPages}
        onClick={() => onChange(page + 1)}
        title="Page suivante"
      >
        ›
      </button>
    </div>
  );
}

// Pied de tableau : rappel du décompte à gauche, navigation à droite.
function PiedTableau({ page, nbPages, total, unite, onChange }) {
  if (total === 0) return null;
  return (
    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 px-3 py-2 border-top">
      <small className="text-muted" style={{ fontSize: "0.76rem" }}>
        {total} {unite}{total > 1 ? "s" : ""}
        {nbPages > 1 && ` · page ${page} sur ${nbPages}`}
      </small>
      <Pagination page={page} nbPages={nbPages} onChange={onChange} />
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
  const [parPage, setParPage] = useState(8);
  const [pagePaiements, setPagePaiements] = useState(1);
  const [pageJournal, setPageJournal] = useState(1);
  const [pageOccupation, setPageOccupation] = useState(1);

  // Tout changement de filtre ramène en première page.
  useEffect(() => {
    setPagePaiements(1);
    setPageJournal(1);
    setPageOccupation(1);
  }, [recherche, filtreStatut, filtreMois, filtreAction, parPage, vue, annee, bienId]);

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

  // Base commune : recherche + mois. Les compteurs des cartes s'appuient
  // dessus, pour rester cohérents avec les autres filtres actifs.
  const paiementsBase = paiements.filter((p) => {
    if (filtreMois !== "TOUS" && String(p.mois) !== String(filtreMois)) return false;
    return corresp(`${p.nom} ${p.prenom || ""}`) || corresp(p.chambre);
  });
  const paiementsFiltres = paiementsBase.filter(
    (p) => filtreStatut === "TOUS" || p.statut === filtreStatut
  );
  const compteStatut = (cle) => paiementsBase.filter((p) => p.statut === cle).length;

  const journalFiltre = journal.filter((j) => {
    if (filtreMois !== "TOUS" && String(j.mois) !== String(filtreMois)) return false;
    return corresp(j.locataireNom) || corresp(j.chambre) || corresp(j.auteurNom);
  });

  const occupationBase = histo.filter(
    (h) => corresp(`${h.nom} ${h.prenom || ""}`) || corresp(h.chambre)
  );
  const occupationFiltree = occupationBase.filter(
    (h) => filtreAction === "TOUTES" || h.action === filtreAction
  );
  const compteAction = (cle) => occupationBase.filter((h) => h.action === cle).length;

  const totalPaye = paiementsFiltres
    .filter((p) => p.statut === "PAYE" || p.statut === "PARTIEL")
    .reduce((s, p) => s + (p.montantLoyer || 0) + (p.montantJIRAMA || 0), 0);

  // Découpage en pages
  const pages = (liste, page) => ({
    nbPages: Math.max(1, Math.ceil(liste.length / parPage)),
    visibles: liste.slice((page - 1) * parPage, page * parPage),
  });
  const vuePaiements = pages(paiementsFiltres, pagePaiements);
  const vueJournal = pages(journalFiltre, pageJournal);
  const vueOccupation = pages(occupationFiltree, pageOccupation);

  const filtreActif =
    recherche || filtreStatut !== "TOUS" || filtreMois !== "TOUS" || filtreAction !== "TOUTES";

  const cartesPaiements = [
    { cle: "TOUS", n: paiementsBase.length, libelle: "Paiements", icone: <BsCashCoin />, couleur: "blue", accent: "#2563eb" },
    { cle: "PAYE", n: compteStatut("PAYE"), libelle: "Payés", icone: <BsCheckCircleFill />, couleur: "green", accent: "#16a34a" },
    { cle: "PARTIEL", n: compteStatut("PARTIEL"), libelle: "Partiels", icone: <BsHourglassSplit />, couleur: "amber", accent: "#d97706" },
    { cle: "DOUTE", n: compteStatut("DOUTE"), libelle: "En doute", icone: <BsExclamationCircleFill />, couleur: "yellow", accent: "#a16207" },
    { cle: "IMPAYE", n: compteStatut("IMPAYE"), libelle: "Impayés", icone: <BsXCircleFill />, couleur: "red", accent: "#dc2626" },
  ];

  const cartesOccupation = [
    { cle: "TOUTES", n: occupationBase.length, libelle: "Mouvements", icone: <BsArrowLeftRight />, couleur: "blue", accent: "#2563eb" },
    { cle: "ENTREE", n: compteAction("ENTREE"), libelle: "Entrées", icone: <BsBoxArrowInRight />, couleur: "green", accent: "#16a34a" },
    { cle: "SORTIE", n: compteAction("SORTIE"), libelle: "Sorties", icone: <BsBoxArrowLeft />, couleur: "red", accent: "#dc2626" },
    { cle: "MODIFICATION", n: compteAction("MODIFICATION"), libelle: "Changements", icone: <BsArrowLeftRight />, couleur: "amber", accent: "#d97706" },
  ];

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

            {/* Cartes-filtres : même principe que la page Utilisateurs */}
            {vue === "PAIEMENTS" ? (
              <CartesFiltre cartes={cartesPaiements} valeur={filtreStatut} onChange={setFiltreStatut} />
            ) : (
              <CartesFiltre cartes={cartesOccupation} valeur={filtreAction} onChange={setFiltreAction} />
            )}

            {/* Recherche, taille de page et filtre mensuel */}
            <div className="d-flex gap-2 mb-3 flex-wrap align-items-center">
              <div className="input-group input-group-sm" style={{ width: 260 }}>
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

              <select
                className="form-select form-select-sm"
                style={{ width: "auto", fontSize: "0.82rem" }}
                value={parPage}
                onChange={(e) => setParPage(+e.target.value)}
                title="Nombre de lignes affichées par page"
              >
                {TAILLES_PAGE.map((n) => (
                  <option key={n} value={n}>{n} par page</option>
                ))}
              </select>

              {vue === "PAIEMENTS" && (
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
              )}

              {filtreActif && (
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
                <div className="table-pro mb-4">
                  <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 px-3 py-3 border-bottom">
                    <h6 className="fw-bold mb-0 d-flex align-items-center gap-2">
                      <BsCashCoin style={{ color: "#2563eb" }} />
                      Paiements enregistrés — {annee}
                    </h6>
                    <span className="fw-bold text-success" style={{ fontSize: "0.9rem" }}>
                      {totalPaye.toLocaleString()} Ar encaissés
                    </span>
                  </div>
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead>
                        <tr>
                          <th>Ch.</th>
                          <th>Locataire</th>
                          <th>Mois</th>
                          <th>Loyer</th>
                          <th>JIRAMA</th>
                          <th>Statut</th>
                          <th>Date de paiement</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paiementsFiltres.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="text-center text-muted py-4" style={{ fontSize: "0.85rem" }}>
                              {filtreActif
                                ? "Aucun paiement ne correspond à ces filtres"
                                : `Aucun paiement enregistré pour ${annee}`}
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
                                <td className="fw-semibold">
                                  {p.nom} {p.prenom}
                                </td>
                                <td>{MOIS_FULL[p.mois - 1]}</td>
                                <td>{(p.montantLoyer || 0).toLocaleString()}</td>
                                <td>{(p.montantJIRAMA || 0).toLocaleString()}</td>
                                <td>
                                  <span
                                    className="rounded-pill px-2 py-1 fw-semibold"
                                    style={{ background: st.bg, color: st.color, fontSize: "0.72rem" }}
                                  >
                                    {st.label}
                                  </span>
                                </td>
                                <td style={{ whiteSpace: "nowrap" }}>
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
                  <PiedTableau
                    page={pagePaiements}
                    nbPages={vuePaiements.nbPages}
                    total={paiementsFiltres.length}
                    unite="ligne"
                    onChange={setPagePaiements}
                  />
                </div>

                {/* Journal des saisies */}
                <div className="table-pro">
                  <div className="px-3 py-3 border-bottom">
                    <h6 className="fw-bold mb-0 d-flex align-items-center gap-2">
                      <BsJournalText style={{ color: "#7c3aed" }} /> Journal des saisies
                    </h6>
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
                    <>
                      <div className="table-responsive">
                        <table className="table table-hover mb-0">
                          <thead>
                            <tr>
                              <th>Quand</th>
                              <th>Action</th>
                              <th>Locataire</th>
                              <th>Mois</th>
                              <th>Montant</th>
                              <th>Par</th>
                            </tr>
                          </thead>
                          <tbody>
                            {vueJournal.visibles.map((j) => (
                              <tr key={j.id}>
                                <td style={{ whiteSpace: "nowrap" }}>{formatDateTime(j.dateAction)}</td>
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
                                <td>
                                  <span className={j.etage === "1ER" ? "badge-1er" : "badge-rdc"}>{j.chambre}</span>{" "}
                                  <span className="fw-semibold">{j.locataireNom}</span>
                                </td>
                                <td>{MOIS_FULL[j.mois - 1]}</td>
                                <td>
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
                      <PiedTableau
                        page={pageJournal}
                        nbPages={vueJournal.nbPages}
                        total={journalFiltre.length}
                        unite="saisie"
                        onChange={setPageJournal}
                      />
                    </>
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
              <div className="table-pro mb-4">
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Action</th>
                        <th>Locataire</th>
                        <th>Chambre</th>
                        <th>Détails</th>
                      </tr>
                    </thead>
                    <tbody>
                      {occupationFiltree.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center text-muted py-4" style={{ fontSize: "0.85rem" }}>
                            Aucun mouvement ne correspond à ces filtres
                          </td>
                        </tr>
                      ) : (
                        vueOccupation.visibles.map((h) => {
                          const a = ACTIONS[h.action] || ACTIONS.MODIFICATION;
                          return (
                            <tr key={h.id}>
                              <td style={{ whiteSpace: "nowrap" }}>{formatDateTime(h.dateAction)}</td>
                              <td>
                                <span
                                  className="d-inline-flex align-items-center gap-1 rounded-3 px-2 py-1 fw-semibold"
                                  style={{ background: a.bg, color: a.color, fontSize: "0.75rem" }}
                                >
                                  <a.Icon size={12} /> {a.label}
                                </span>
                              </td>
                              <td className="fw-semibold">
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
                        })
                      )}
                    </tbody>
                  </table>
                </div>
                <PiedTableau
                  page={pageOccupation}
                  nbPages={vueOccupation.nbPages}
                  total={occupationFiltree.length}
                  unite="mouvement"
                  onChange={setPageOccupation}
                />
              </div>
            )}
          </main>
        </div>
      </div>
    </Template>
  );
}
