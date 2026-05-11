import { useState, useEffect, useCallback } from "react";
import axios from "../../contexts/api/axios";
import GetUserData from "../../contexts/api/udata";
import Template from "../../components/template/template";
import Header from "../../components/header/header";
import Sidebar from "../../components/sidebar/sidebar";
import { toast } from "react-toastify";
import {
  BsStarFill, BsCashStack, BsPlus, BsFillTrashFill, BsPencilSquare,
  BsChevronLeft, BsChevronRight, BsCalendar3, BsSearch,
} from "react-icons/bs";
import { SkLocataires } from "../../components/skeleton/skeleton";
import "../loyer/loyer.css";
import "./finance.css";

const MOIS_LABELS = ["","Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
const MOIS_FR     = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const ANNEES      = [2023, 2024, 2025, 2026, 2027];

function fmtDate(dt) {
  if (!dt) return "—";
  const s = String(dt).replace(" ", "T");
  const d = new Date(s.includes("T") ? s : s + "T12:00:00");
  if (isNaN(d.getTime())) return "—";
  return `${String(d.getDate()).padStart(2, "0")} ${MOIS_LABELS[d.getMonth() + 1]} ${d.getFullYear()}`;
}
function fmtTime(dt) {
  if (!dt) return "—";
  const d = new Date(dt);
  const p = n => String(n).padStart(2, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())}`;
}
function fmtShort(d) {
  return `${String(d.getDate()).padStart(2, "0")} ${MOIS_LABELS[d.getMonth() + 1]}`;
}
function getWeekBounds(date) {
  const d   = new Date(date);
  const day = d.getDay();
  const mon = new Date(d);
  mon.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  mon.setHours(0, 0, 0, 0);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  sun.setHours(23, 59, 59, 999);
  return { start: mon, end: sun };
}
// local date to avoid UTC offset storing wrong day (toISOString gives UTC)
function toISO(d) {
  const p = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
function semaineDuMois(day) { return Math.min(Math.ceil(day / 7), 5); }

const TH = { fontSize: "0.73rem", color: "#64748b" };
const TD = { fontSize: "0.875rem" };
const TS = { fontSize: "0.78rem", color: "#94a3b8", whiteSpace: "nowrap" };

export default function FinanceCasuel() {
  const u_info = GetUserData();
  const now    = new Date();

  // ── Casuel ───────────────────────────────────────────────────
  const [refDateC,     setRefDateC]     = useState(new Date());
  const [casuel,       setCasuel]       = useState([]);
  const [loadingC,     setLoadingC]     = useState(true);
  const [showCasModal, setShowCasModal] = useState(false);
  const [editCas,      setEditCas]      = useState(null);
  const [casForm,      setCasForm]      = useState({ nom: "", montant: "" });
  const [savingC,      setSavingC]      = useState(false);
  const [searchCas,    setSearchCas]    = useState("");

  // ── Dépenses ─────────────────────────────────────────────────
  const [refDateD,     setRefDateD]     = useState(new Date());
  const [depenses,     setDepenses]     = useState([]);
  const [loadingD,     setLoadingD]     = useState(true);
  const [showDepModal, setShowDepModal] = useState(false);
  const [editDep,      setEditDep]      = useState(null);
  const [depForm,      setDepForm]      = useState({ nom: "", montant: "" });
  const [savingD,      setSavingD]      = useState(false);
  const [searchDep,    setSearchDep]    = useState("");

  // ── Derived ──────────────────────────────────────────────────
  const moisC  = refDateC.getMonth() + 1;
  const anneeC = refDateC.getFullYear();
  const { start: wStartC, end: wEndC } = getWeekBounds(refDateC);
  const { start: startD,  end: endD  } = getWeekBounds(refDateD);

  useEffect(() => { fetchCasuel(); }, [moisC, anneeC]);

  const fetchDep = useCallback(() => {
    setLoadingD(true);
    axios
      .get(`finance/depenses?start=${toISO(startD)}&end=${toISO(endD)}&userId=${u_info.u_id}`, u_info.opts)
      .then(r  => setDepenses(r.data || []))
      .catch(() => setDepenses([]))
      .finally(() => setLoadingD(false));
  }, [toISO(startD), toISO(endD)]);

  useEffect(() => { fetchDep(); }, [toISO(startD)]);

  function fetchCasuel() {
    setLoadingC(true);
    axios
      .get(`finance/casuel?mois=${moisC}&annee=${anneeC}&userId=${u_info.u_id}`, u_info.opts)
      .then(r  => setCasuel(r.data || []))
      .catch(() => setCasuel([]))
      .finally(() => setLoadingC(false));
  }

  // ── Casuel navigation ────────────────────────────────────────
  function goWeekC(delta) {
    const d = new Date(refDateC);
    d.setDate(d.getDate() + delta * 7);
    setRefDateC(d);
  }
  function goTodayC() { setRefDateC(new Date()); }
  function jumpTo(newMois, newAnnee) { setRefDateC(new Date(newAnnee, newMois - 1, 1)); }

  // ── Dépenses navigation ──────────────────────────────────────
  function goWeekD(delta) {
    const d = new Date(refDateD);
    d.setDate(d.getDate() + delta * 7);
    setRefDateD(d);
  }
  function goTodayD() { setRefDateD(new Date()); }

  // ── Casuel handlers ──────────────────────────────────────────
  function openCasModal(item = null) {
    setEditCas(item);
    setCasForm(item ? { nom: item.nom, montant: item.montant } : { nom: "", montant: "" });
    setShowCasModal(true);
  }
  function handleCasSubmit(e) {
    e.preventDefault();
    if (!casForm.nom.trim())                    return toast.warning("Nom requis");
    if (!casForm.montant || +casForm.montant <= 0) return toast.warning("Montant invalide");
    setSavingC(true);
    const req$ = editCas
      ? axios.put(`finance/casuel/${editCas.id}`, { userId: u_info.u_id, nom: casForm.nom, montant: +casForm.montant }, u_info.opts)
      : axios.post("finance/casuel", { userId: u_info.u_id, nom: casForm.nom, montant: +casForm.montant, date_casuel: toISO(new Date()), mois: moisC, annee: anneeC }, u_info.opts);
    req$
      .then(() => { toast.success(editCas ? "Casuel modifié" : "Casuel ajouté"); setShowCasModal(false); fetchCasuel(); })
      .catch(() => toast.error("Erreur"))
      .finally(() => setSavingC(false));
  }
  function handleCasDelete(id) {
    axios.delete(`finance/casuel/${id}?userId=${u_info.u_id}`, u_info.opts)
      .then(() => { toast.success("Supprimé"); fetchCasuel(); })
      .catch(() => toast.error("Erreur"));
  }

  // ── Dépenses handlers ────────────────────────────────────────
  function openDepModal(item = null) {
    setEditDep(item);
    setDepForm(item ? { nom: item.nom, montant: item.montant } : { nom: "", montant: "" });
    setShowDepModal(true);
  }
  function handleDepSubmit(e) {
    e.preventDefault();
    if (!depForm.nom.trim())                    return toast.warning("Nom de la dépense requis");
    if (!depForm.montant || +depForm.montant <= 0) return toast.warning("Montant invalide");
    setSavingD(true);
    if (editDep) {
      axios.put(`finance/depenses/${editDep.id}`, { userId: u_info.u_id, nom: depForm.nom, montant: +depForm.montant }, u_info.opts)
        .then(() => { toast.success("Dépense modifiée"); setShowDepModal(false); fetchDep(); })
        .catch(() => toast.error("Erreur"))
        .finally(() => setSavingD(false));
    } else {
      const n   = new Date();
      const pad = x => String(x).padStart(2, "0");
      axios.post("finance/depenses", {
        userId: u_info.u_id, nom: depForm.nom, montant: +depForm.montant,
        date_depense:  toISO(n),
        heure_depense: `${pad(n.getHours())}:${pad(n.getMinutes())}:${pad(n.getSeconds())}`,
        semaine: semaineDuMois(n.getDate()),
        mois:    n.getMonth() + 1,
        annee:   n.getFullYear(),
      }, u_info.opts)
        .then(() => { toast.success("Dépense ajoutée"); setShowDepModal(false); fetchDep(); })
        .catch(() => toast.error("Erreur"))
        .finally(() => setSavingD(false));
    }
  }
  function handleDepDelete(id) {
    axios.delete(`finance/depenses/${id}?userId=${u_info.u_id}`, u_info.opts)
      .then(() => { toast.success("Supprimée"); fetchDep(); })
      .catch(() => toast.error("Erreur"));
  }

  // ── Filtered data ────────────────────────────────────────────
  const filteredCasuel = casuel
    .filter(c => { const d = new Date(c.created_at); return d >= wStartC && d <= wEndC; })
    .filter(c => !searchCas || c.nom.toLowerCase().includes(searchCas.toLowerCase()));

  const filteredDep = depenses
    .filter(d => !searchDep || d.nom.toLowerCase().includes(searchDep.toLowerCase()));

  const totalC  = filteredCasuel.reduce((s, c) => s + (+c.montant || 0), 0);
  const totalD  = filteredDep.reduce((s, d) => s + (+d.montant || 0), 0);
  const isNowC  = toISO(wStartC) === toISO(getWeekBounds(now).start);
  const isNowD  = toISO(startD)  === toISO(getWeekBounds(now).start);

  return (
    <Template>
      <Header />
      <div className="container-fluid flex-grow-1">
        <div className="row g-0">
          <Sidebar />
          <main className="col-md-9 ms-sm-auto col-lg-10 px-md-4 main">

            <div className="page-header">
              <div>
                <h1 className="page-title"><BsStarFill /> Casuel &amp; Dépenses</h1>
                <p className="text-muted small mb-0">
                  Revenus occasionnels et dépenses variables — {MOIS_LABELS[moisC]} {anneeC}
                </p>
              </div>
              <div className="d-flex gap-2 align-items-center flex-wrap">
                <select className="form-select form-select-sm" style={{ width: "auto" }}
                  value={moisC} onChange={e => jumpTo(+e.target.value, anneeC)}>
                  {MOIS_LABELS.slice(1).map((m, i) => (
                    <option key={i + 1} value={i + 1}>{m}</option>
                  ))}
                </select>
                <select className="form-select form-select-sm" style={{ width: "auto" }}
                  value={anneeC} onChange={e => jumpTo(moisC, +e.target.value)}>
                  {ANNEES.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                <button
                  className="btn btn-warning btn-sm d-flex align-items-center gap-1 text-white"
                  onClick={openCasModal}
                >
                  <BsPlus size={16} /> Casuel
                </button>
                <button
                  className="btn btn-primary btn-sm d-flex align-items-center gap-1"
                  onClick={openDepModal}
                >
                  <BsPlus size={16} /> Dépense
                </button>
              </div>
            </div>

            <div className="row g-3">
              {/* ── Colonne Casuel ── */}
              <div className="col-lg-6">
                <div className="card-pro p-0 h-100">
                  <div className="card-header-finance">
                    <div className="chf-left">
                      <h6 className="fw-bold mb-0" style={{ color: "#f59e0b" }}>
                        <BsStarFill className="me-1" />Casuel
                      </h6>
                      <span className="fw-bold" style={{ color: "#f59e0b", fontSize: "0.85rem" }}>
                        {totalC.toLocaleString()} Ar
                      </span>
                    </div>
                    <div className="chf-right">
                      <div className="input-group input-group-sm chf-search">
                        <span className="input-group-text bg-white border-end-0 py-0">
                          <BsSearch size={12} style={{ color: "#94a3b8" }} />
                        </span>
                        <input type="text" className="form-control border-start-0 ps-0"
                          placeholder="Rechercher…" value={searchCas}
                          onChange={e => setSearchCas(e.target.value)}
                          style={{ fontSize: "0.78rem" }} />
                      </div>
                      <div className="week-nav">
                        <button className="week-nav-btn" onClick={() => goWeekC(-1)}>
                          <BsChevronLeft size={11} />
                        </button>
                        <button className={`week-nav-btn ${isNowC ? "active" : ""}`} onClick={goTodayC}>
                          <BsCalendar3 size={11} className="me-1" />
                          {fmtShort(wStartC)}–{fmtShort(wEndC)}
                        </button>
                        <button className="week-nav-btn" onClick={() => goWeekC(1)}>
                          <BsChevronRight size={11} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {loadingC ? <SkLocataires /> : filteredCasuel.length === 0 ? (
                    <div className="text-center py-5 text-muted">
                      <p className="mb-2" style={{ fontSize: "0.85rem" }}>
                        {casuel.length === 0 ? "Aucun casuel ce mois" : "Aucun casuel cette semaine"}
                      </p>
                      {casuel.length === 0 && (
                        <button className="btn btn-sm btn-warning text-white" onClick={openCasModal}>
                          <BsPlus /> Ajouter
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="table-responsive finance-tbl-wrap">
                      <table className="table table-hover mb-0">
                        <thead style={{ background: "#f8fafc" }}>
                          <tr>
                            <th style={TH}>Source</th>
                            <th style={TH}>Montant</th>
                            <th style={TH}>Date</th>
                            <th style={TH}>Heure</th>
                            <th style={TH}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredCasuel.map(c => (
                            <tr key={c.id}>
                              <td className="fw-semibold" style={TD} title={c.nom}>{c.nom}</td>
                              <td className="fw-bold" style={{ ...TD, color: "#f59e0b" }}>
                                {(+c.montant).toLocaleString()} Ar
                              </td>
                              <td style={TS}>{fmtDate(c.created_at)}</td>
                              <td style={TS}>{fmtTime(c.created_at)}</td>
                              <td className="text-nowrap">
                                <button className="btn btn-outline-primary btn-sm me-1"
                                  onClick={() => openCasModal(c)}>
                                  <BsPencilSquare />
                                </button>
                                <button className="btn btn-outline-danger btn-sm"
                                  onClick={() => handleCasDelete(c.id)}>
                                  <BsFillTrashFill />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Colonne Dépenses ── */}
              <div className="col-lg-6">
                <div className="card-pro p-0 h-100">
                  <div className="card-header-finance">
                    <div className="chf-left">
                      <h6 className="fw-bold mb-0 text-danger">
                        <BsCashStack className="me-1" />Dépenses
                      </h6>
                      <span className="fw-bold text-danger" style={{ fontSize: "0.85rem" }}>
                        {totalD.toLocaleString()} Ar
                      </span>
                    </div>
                    <div className="chf-right">
                      <div className="input-group input-group-sm chf-search">
                        <span className="input-group-text bg-white border-end-0 py-0">
                          <BsSearch size={12} style={{ color: "#94a3b8" }} />
                        </span>
                        <input type="text" className="form-control border-start-0 ps-0"
                          placeholder="Rechercher…" value={searchDep}
                          onChange={e => setSearchDep(e.target.value)}
                          style={{ fontSize: "0.78rem" }} />
                      </div>
                      <div className="week-nav">
                        <button className="week-nav-btn" onClick={() => goWeekD(-1)}>
                          <BsChevronLeft size={11} />
                        </button>
                        <button className={`week-nav-btn ${isNowD ? "active" : ""}`} onClick={goTodayD}>
                          <BsCalendar3 size={11} className="me-1" />
                          {fmtShort(startD)}–{fmtShort(endD)}
                        </button>
                        <button className="week-nav-btn" onClick={() => goWeekD(1)}>
                          <BsChevronRight size={11} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {loadingD ? <SkLocataires /> : filteredDep.length === 0 ? (
                    <div className="text-center py-5 text-muted">
                      <p className="mb-2" style={{ fontSize: "0.85rem" }}>Aucune dépense cette semaine</p>
                      <button className="btn btn-sm btn-primary" onClick={openDepModal}>
                        <BsPlus /> Ajouter
                      </button>
                    </div>
                  ) : (
                    <div className="table-responsive finance-tbl-wrap">
                      <table className="table table-hover mb-0">
                        <thead style={{ background: "#f8fafc" }}>
                          <tr>
                            <th style={TH}>Nom</th>
                            <th style={TH}>Montant</th>
                            <th style={TH}>Date</th>
                            <th style={TH}>Heure</th>
                            <th style={TH}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredDep.map(d => (
                            <tr key={d.id}>
                              <td className="fw-semibold" style={TD} title={d.nom}>{d.nom}</td>
                              <td className="fw-bold text-danger" style={TD}>
                                {(+d.montant).toLocaleString()} Ar
                              </td>
                              <td style={TS}>{fmtDate(d.date_depense)}</td>
                              <td style={TS}>{d.heure_depense ? d.heure_depense.slice(0, 5) : "—"}</td>
                              <td className="text-nowrap">
                                <button className="btn btn-outline-primary btn-sm me-1"
                                  onClick={() => openDepModal(d)}>
                                  <BsPencilSquare />
                                </button>
                                <button className="btn btn-outline-danger btn-sm"
                                  onClick={() => handleDepDelete(d.id)}>
                                  <BsFillTrashFill />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </main>
        </div>
      </div>

      {/* ── Modal Casuel ── */}
      {showCasModal && (
        <div className="modal-overlay" onClick={() => setShowCasModal(false)}>
          <div className="modal-content-pro" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header-pro">
              <h6>
                <BsStarFill className="me-2" />
                {editCas ? "Modifier le casuel" : `Nouveau casuel — ${MOIS_LABELS[moisC]} ${anneeC}`}
              </h6>
              <button className="btn-close" onClick={() => setShowCasModal(false)} />
            </div>
            <form onSubmit={handleCasSubmit} className="p-4">
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label">Source *</label>
                  <input type="text" className="form-control form-control-sm" value={casForm.nom}
                    onChange={e => setCasForm({ ...casForm, nom: e.target.value })}
                    placeholder="Ex: Bonus, Vente, Cadeau…" autoFocus />
                </div>
                <div className="col-12">
                  <label className="form-label">Montant (Ar) *</label>
                  <input type="number" className="form-control form-control-sm" value={casForm.montant}
                    onChange={e => setCasForm({ ...casForm, montant: e.target.value })} min={1} placeholder="0" />
                </div>
              </div>
              <div className="d-flex justify-content-end gap-2 mt-4">
                <button type="button" className="btn btn-outline-secondary btn-sm"
                  onClick={() => setShowCasModal(false)}>Annuler</button>
                <button type="submit" className="btn btn-warning btn-sm text-white" disabled={savingC}>
                  {savingC ? "Enregistrement..." : editCas ? "Modifier" : "Ajouter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Dépense ── */}
      {showDepModal && (
        <div className="modal-overlay" onClick={() => setShowDepModal(false)}>
          <div className="modal-content-pro" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header-pro">
              <h6>
                <BsCashStack className="me-2" />
                {editDep ? "Modifier la dépense" : "Nouvelle dépense"}
              </h6>
              <button className="btn-close" onClick={() => setShowDepModal(false)} />
            </div>
            <form onSubmit={handleDepSubmit} className="p-4">
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label">Nom *</label>
                  <input type="text" className="form-control form-control-sm" value={depForm.nom}
                    onChange={e => setDepForm({ ...depForm, nom: e.target.value })}
                    placeholder="Ex: Courses, Transport, Restaurant…" autoFocus />
                </div>
                <div className="col-12">
                  <label className="form-label">Montant (Ar) *</label>
                  <input type="number" className="form-control form-control-sm" value={depForm.montant}
                    onChange={e => setDepForm({ ...depForm, montant: e.target.value })} min={1} placeholder="0" />
                </div>
              </div>
              <div className="d-flex justify-content-end gap-2 mt-4">
                <button type="button" className="btn btn-outline-secondary btn-sm"
                  onClick={() => setShowDepModal(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={savingD}>
                  {savingD ? "Enregistrement..." : editDep ? "Modifier" : "Ajouter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Template>
  );
}
