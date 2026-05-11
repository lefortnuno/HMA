import { useState, useEffect } from "react";
import axios from "../../contexts/api/axios";
import GetUserData from "../../contexts/api/udata";
import Template from "../../components/template/template";
import Header from "../../components/header/header";
import Sidebar from "../../components/sidebar/sidebar";
import { toast } from "react-toastify";
import {
  BsGraphUp, BsGraphDown, BsPlus, BsPencilSquare, BsFillTrashFill,
  BsChevronLeft, BsChevronRight, BsCalendar3, BsSearch,
} from "react-icons/bs";
import { SkLocataires } from "../../components/skeleton/skeleton";
import "../loyer/loyer.css";
import "./finance.css";

const MOIS_LABELS = ["","Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
const ANNEES      = [2023, 2024, 2025, 2026, 2027];

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

const TH = { fontSize: "0.73rem", color: "#64748b" };
const TD = { fontSize: "0.875rem" };
const TS = { fontSize: "0.78rem", color: "#94a3b8", whiteSpace: "nowrap" };

export default function FinanceRevenus() {
  const u_info = GetUserData();
  const now    = new Date();

  const [refDate, setRefDate] = useState(now);
  const { start: wS, end: wE } = getWeekBounds(refDate);
  const mois  = refDate.getMonth() + 1;
  const annee = refDate.getFullYear();

  // ── Revenus ──────────────────────────────────────────────────
  const [revenus,       setRevenus]       = useState([]);
  const [loadingR,      setLoadingR]      = useState(true);
  const [showRevModal,  setShowRevModal]  = useState(false);
  const [editRev,       setEditRev]       = useState(null);
  const [revForm,       setRevForm]       = useState({ nom: "", montant: "", est_epargne: false });
  const [savingR,       setSavingR]       = useState(false);
  const [searchRev,     setSearchRev]     = useState("");

  // ── Charges ──────────────────────────────────────────────────
  const [charges,       setCharges]       = useState([]);
  const [loadingC,      setLoadingC]      = useState(true);
  const [showCharModal, setShowCharModal] = useState(false);
  const [editChar,      setEditChar]      = useState(null);
  const [charForm,      setCharForm]      = useState({ nom: "", montant: "" });
  const [savingC,       setSavingC]       = useState(false);
  const [searchChar,    setSearchChar]    = useState("");

  useEffect(() => { fetchRevenus(); fetchCharges(); }, [mois, annee]);

  function fetchRevenus() {
    setLoadingR(true);
    axios.get(`finance/revenus?mois=${mois}&annee=${annee}&userId=${u_info.u_id}`, u_info.opts)
      .then(r  => setRevenus(r.data || []))
      .catch(() => setRevenus([]))
      .finally(() => setLoadingR(false));
  }
  function fetchCharges() {
    setLoadingC(true);
    axios.get(`finance/charges?mois=${mois}&annee=${annee}&userId=${u_info.u_id}`, u_info.opts)
      .then(r  => setCharges(r.data || []))
      .catch(() => setCharges([]))
      .finally(() => setLoadingC(false));
  }

  function goWeek(delta) {
    const d = new Date(refDate);
    d.setDate(d.getDate() + delta * 7);
    setRefDate(d);
  }
  function goToday() { setRefDate(new Date()); }
  function jumpTo(newMois, newAnnee) { setRefDate(new Date(newAnnee, newMois - 1, 1)); }

  const isCurrentWeek = getWeekBounds(now).start.getTime() === wS.getTime();

  const filteredRevenus = revenus
    .filter(r => { const d = new Date(r.created_at); return d >= wS && d <= wE; })
    .filter(r => !searchRev || r.nom.toLowerCase().includes(searchRev.toLowerCase()));
  const filteredCharges = charges
    .filter(c => { const d = new Date(c.created_at); return d >= wS && d <= wE; })
    .filter(c => !searchChar || c.nom.toLowerCase().includes(searchChar.toLowerCase()));

  const totalR = filteredRevenus.reduce((s, r) => s + (+r.montant || 0), 0);
  const totalC = filteredCharges.reduce((s, c) => s + (+c.montant || 0), 0);

  // ── Revenus handlers ─────────────────────────────────────────
  function openAddRev()   { setEditRev(null); setRevForm({ nom: "", montant: "", est_epargne: false }); setShowRevModal(true); }
  function openEditRev(r) { setEditRev(r);    setRevForm({ nom: r.nom, montant: r.montant, est_epargne: !!r.est_epargne }); setShowRevModal(true); }
  function handleRevSubmit(e) {
    e.preventDefault();
    if (!revForm.nom.trim())    return toast.warning("Nom requis");
    if (revForm.montant === "") return toast.warning("Montant requis");
    setSavingR(true);
    const p = { ...revForm, mois, annee, userId: u_info.u_id };
    (editRev
      ? axios.put(`finance/revenus/${editRev.id}`, p, u_info.opts)
      : axios.post("finance/revenus", p, u_info.opts))
      .then(() => { toast.success(editRev ? "Revenu modifié" : "Revenu ajouté"); setShowRevModal(false); fetchRevenus(); })
      .catch(() => toast.error("Erreur"))
      .finally(() => setSavingR(false));
  }
  function handleRevDelete(id) {
    axios.delete(`finance/revenus/${id}?userId=${u_info.u_id}`, u_info.opts)
      .then(() => { toast.success("Supprimé"); fetchRevenus(); })
      .catch(() => toast.error("Erreur"));
  }

  // ── Charges handlers ─────────────────────────────────────────
  function openAddChar()   { setEditChar(null); setCharForm({ nom: "", montant: "" }); setShowCharModal(true); }
  function openEditChar(c) { setEditChar(c);    setCharForm({ nom: c.nom, montant: c.montant }); setShowCharModal(true); }
  function handleCharSubmit(e) {
    e.preventDefault();
    if (!charForm.nom.trim())    return toast.warning("Nom requis");
    if (charForm.montant === "") return toast.warning("Montant requis");
    setSavingC(true);
    const p = { ...charForm, mois, annee, userId: u_info.u_id };
    (editChar
      ? axios.put(`finance/charges/${editChar.id}`, p, u_info.opts)
      : axios.post("finance/charges", p, u_info.opts))
      .then(() => { toast.success(editChar ? "Charge modifiée" : "Charge ajoutée"); setShowCharModal(false); fetchCharges(); })
      .catch(() => toast.error("Erreur"))
      .finally(() => setSavingC(false));
  }
  function handleCharDelete(id) {
    axios.delete(`finance/charges/${id}?userId=${u_info.u_id}`, u_info.opts)
      .then(() => { toast.success("Supprimée"); fetchCharges(); })
      .catch(() => toast.error("Erreur"));
  }

  function CardHeader({ title, total, colorClass, Icon, search, setSearch, isActive }) {
    return (
      <div className="card-header-finance">
        <div className="chf-left">
          <h6 className={`fw-bold mb-0 ${colorClass}`}>
            <Icon className="me-1" />{title}
          </h6>
          <span className={`fw-bold ${colorClass}`} style={{ fontSize: "0.85rem" }}>
            {total.toLocaleString()} Ar
          </span>
        </div>
        <div className="chf-right">
          <div className="input-group input-group-sm chf-search">
            <span className="input-group-text bg-white border-end-0 py-0">
              <BsSearch size={12} style={{ color: "#94a3b8" }} />
            </span>
            <input type="text" className="form-control border-start-0 ps-0"
              placeholder="Rechercher…" value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ fontSize: "0.78rem" }} />
          </div>
          <div className="week-nav">
            <button className="week-nav-btn" onClick={() => goWeek(-1)}>
              <BsChevronLeft size={11} />
            </button>
            <button className={`week-nav-btn ${isActive ? "active" : ""}`} onClick={goToday}>
              <BsCalendar3 size={11} className="me-1" />
              {fmtShort(wS)}–{fmtShort(wE)}
            </button>
            <button className="week-nav-btn" onClick={() => goWeek(1)}>
              <BsChevronRight size={11} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Template>
      <Header />
      <div className="container-fluid flex-grow-1">
        <div className="row g-0">
          <Sidebar />
          <main className="col-md-9 ms-sm-auto col-lg-10 px-md-4 main">

            <div className="page-header">
              <div>
                <h1 className="page-title"><BsGraphUp /> Revenus &amp; Charges</h1>
                <p className="text-muted small mb-0">
                  Revenus fixes et charges mensuelles — {MOIS_LABELS[mois]} {annee}
                </p>
              </div>
              <div className="d-flex gap-2 align-items-center flex-wrap">
                <select className="form-select form-select-sm" style={{ width: "auto" }}
                  value={mois} onChange={e => jumpTo(+e.target.value, annee)}>
                  {MOIS_LABELS.slice(1).map((m, i) => (
                    <option key={i + 1} value={i + 1}>{m}</option>
                  ))}
                </select>
                <select className="form-select form-select-sm" style={{ width: "auto" }}
                  value={annee} onChange={e => jumpTo(mois, +e.target.value)}>
                  {ANNEES.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                <button className="btn btn-success btn-sm d-flex align-items-center gap-1" onClick={openAddRev}>
                  <BsPlus size={16} /> Revenu
                </button>
                <button className="btn btn-danger btn-sm d-flex align-items-center gap-1" onClick={openAddChar}>
                  <BsPlus size={16} /> Charge
                </button>
              </div>
            </div>

            <div className="row g-3">
              {/* ── Revenus ── */}
              <div className="col-lg-6">
                {loadingR ? <SkLocataires /> : (
                  <div className="card-pro p-0 h-100">
                    <CardHeader
                      title="Revenus fixes" total={totalR}
                      colorClass="text-success" Icon={BsGraphUp}
                      search={searchRev} setSearch={setSearchRev}
                      isActive={isCurrentWeek}
                    />
                    {filteredRevenus.length === 0 ? (
                      <div className="text-center py-4 text-muted" style={{ fontSize: "0.85rem" }}>
                        {revenus.length === 0 ? "Aucun revenu ce mois" : "Aucune entrée cette semaine"}
                        {revenus.length === 0 && (
                          <div className="mt-2">
                            <button className="btn btn-sm btn-success" onClick={openAddRev}>
                              <BsPlus /> Ajouter
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="table-responsive finance-tbl-wrap">
                        <table className="table table-hover mb-0">
                          <thead style={{ background: "#f8fafc" }}>
                            <tr>
                              <th style={TH}>Nom</th>
                              <th style={TH}>Montant</th>
                              <th style={TH}>Type</th>
                              <th style={TH}>Date</th>
                              <th style={TH}>Heure</th>
                              <th style={TH}></th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredRevenus.map(r => (
                              <tr key={r.id}>
                                <td className="fw-semibold" style={TD} title={r.nom}>{r.nom}</td>
                                <td className="fw-bold text-success" style={TD}>{(+r.montant).toLocaleString()} Ar</td>
                                <td>
                                  {r.est_epargne
                                    ? <span className="finance-epargne-badge">Épargne</span>
                                    : <span style={{ fontSize: "0.73rem", color: "#94a3b8" }}>Revenu</span>}
                                </td>
                                <td style={TS}>{fmtDate(r.created_at)}</td>
                                <td style={TS}>{fmtTime(r.created_at)}</td>
                                <td>
                                  <button className="btn btn-outline-primary btn-sm me-1" onClick={() => openEditRev(r)}>
                                    <BsPencilSquare />
                                  </button>
                                  <button className="btn btn-outline-danger btn-sm" onClick={() => handleRevDelete(r.id)}>
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
                )}
              </div>

              {/* ── Charges ── */}
              <div className="col-lg-6">
                {loadingC ? <SkLocataires /> : (
                  <div className="card-pro p-0 h-100">
                    <CardHeader
                      title="Charges fixes" total={totalC}
                      colorClass="text-danger" Icon={BsGraphDown}
                      search={searchChar} setSearch={setSearchChar}
                      isActive={isCurrentWeek}
                    />
                    {filteredCharges.length === 0 ? (
                      <div className="text-center py-4 text-muted" style={{ fontSize: "0.85rem" }}>
                        {charges.length === 0 ? "Aucune charge ce mois" : "Aucune entrée cette semaine"}
                        {charges.length === 0 && (
                          <div className="mt-2">
                            <button className="btn btn-sm btn-danger" onClick={openAddChar}>
                              <BsPlus /> Ajouter
                            </button>
                          </div>
                        )}
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
                            {filteredCharges.map(c => (
                              <tr key={c.id}>
                                <td className="fw-semibold" style={TD} title={c.nom}>{c.nom}</td>
                                <td className="fw-bold text-danger" style={TD}>{(+c.montant).toLocaleString()} Ar</td>
                                <td style={TS}>{fmtDate(c.created_at)}</td>
                                <td style={TS}>{fmtTime(c.created_at)}</td>
                                <td>
                                  <button className="btn btn-outline-primary btn-sm me-1" onClick={() => openEditChar(c)}>
                                    <BsPencilSquare />
                                  </button>
                                  <button className="btn btn-outline-danger btn-sm" onClick={() => handleCharDelete(c.id)}>
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
                )}
              </div>
            </div>

          </main>
        </div>
      </div>

      {/* ── Modal Revenu ── */}
      {showRevModal && (
        <div className="modal-overlay" onClick={() => setShowRevModal(false)}>
          <div className="modal-content-pro" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header-pro">
              <h6>
                <BsGraphUp className="me-2" />
                {editRev ? "Modifier le revenu" : `Nouveau revenu — ${MOIS_LABELS[mois]} ${annee}`}
              </h6>
              <button className="btn-close" onClick={() => setShowRevModal(false)} />
            </div>
            <form onSubmit={handleRevSubmit} className="p-4">
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label">Nom *</label>
                  <input type="text" className="form-control form-control-sm" value={revForm.nom}
                    onChange={e => setRevForm({ ...revForm, nom: e.target.value })}
                    placeholder="Ex: Salaire, Loyer perçu…" autoFocus />
                </div>
                <div className="col-12">
                  <label className="form-label">Montant (Ar) *</label>
                  <input type="number" className="form-control form-control-sm" value={revForm.montant}
                    onChange={e => setRevForm({ ...revForm, montant: e.target.value })} min={0} placeholder="0" />
                </div>
                <div className="col-12">
                  <div className="form-check">
                    <input type="checkbox" className="form-check-input" id="epargneCheck"
                      checked={revForm.est_epargne}
                      onChange={e => setRevForm({ ...revForm, est_epargne: e.target.checked })} />
                    <label className="form-check-label" htmlFor="epargneCheck" style={{ fontSize: "0.85rem" }}>
                      C'est l'épargne (report du mois précédent)
                    </label>
                  </div>
                </div>
              </div>
              <div className="d-flex justify-content-end gap-2 mt-4">
                <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setShowRevModal(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn btn-success btn-sm" disabled={savingR}>
                  {savingR ? "Enregistrement..." : editRev ? "Modifier" : "Ajouter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Charge ── */}
      {showCharModal && (
        <div className="modal-overlay" onClick={() => setShowCharModal(false)}>
          <div className="modal-content-pro" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header-pro">
              <h6>
                <BsGraphDown className="me-2" />
                {editChar ? "Modifier la charge" : `Nouvelle charge — ${MOIS_LABELS[mois]} ${annee}`}
              </h6>
              <button className="btn-close" onClick={() => setShowCharModal(false)} />
            </div>
            <form onSubmit={handleCharSubmit} className="p-4">
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label">Nom *</label>
                  <input type="text" className="form-control form-control-sm" value={charForm.nom}
                    onChange={e => setCharForm({ ...charForm, nom: e.target.value })}
                    placeholder="Ex: Loyer, Wifi, Électricité…" autoFocus />
                </div>
                <div className="col-12">
                  <label className="form-label">Montant (Ar) *</label>
                  <input type="number" className="form-control form-control-sm" value={charForm.montant}
                    onChange={e => setCharForm({ ...charForm, montant: e.target.value })} min={0} placeholder="0" />
                </div>
              </div>
              <div className="d-flex justify-content-end gap-2 mt-4">
                <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setShowCharModal(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn btn-danger btn-sm" disabled={savingC}>
                  {savingC ? "Enregistrement..." : editChar ? "Modifier" : "Ajouter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Template>
  );
}
