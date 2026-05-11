import { useState, useEffect, useCallback } from "react";
import axios from "../../contexts/api/axios";
import GetUserData from "../../contexts/api/udata";
import Template from "../../components/template/template";
import Header from "../../components/header/header";
import Sidebar from "../../components/sidebar/sidebar";
import { toast } from "react-toastify";
import { BsCashStack, BsPlus, BsFillTrashFill, BsChevronLeft, BsChevronRight, BsCalendar3 } from "react-icons/bs";
import "../loyer/loyer.css";
import "./finance.css";

const MOIS_FR = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const MOIS_COURT = ["","Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];

function getWeekBounds(date) {
  const d = new Date(date);
  const day = d.getDay();
  const mon = new Date(d);
  mon.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  mon.setHours(0, 0, 0, 0);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  return { start: mon, end: sun };
}

function toISO(d) { return d.toISOString().split("T")[0]; }

function fmt(d) {
  return `${String(d.getDate()).padStart(2, "0")} ${MOIS_FR[d.getMonth()].slice(0, 4)} ${d.getFullYear()}`;
}

function semaineDuMois(day) { return Math.min(Math.ceil(day / 7), 5); }

export default function FinanceDepenses() {
  const u_info = GetUserData();
  const [refDate,    setRefDate]   = useState(new Date());
  const [depenses,   setDepenses]  = useState([]);
  const [loading,    setLoading]   = useState(true);
  const [showModal,  setShowModal] = useState(false);
  const [form,       setForm]      = useState({ nom: "", montant: "" });
  const [saving,     setSaving]    = useState(false);

  const { start, end } = getWeekBounds(refDate);

  const fetch = useCallback(() => {
    setLoading(true);
    axios.get(`finance/depenses?start=${toISO(start)}&end=${toISO(end)}&userId=${u_info.u_id}`, u_info.opts)
      .then(r  => setDepenses(r.data || []))
      .catch(() => setDepenses([]))
      .finally(() => setLoading(false));
  }, [toISO(start), toISO(end)]);

  useEffect(() => { fetch(); }, [toISO(start)]);

  function goWeek(delta) {
    const d = new Date(refDate);
    d.setDate(d.getDate() + delta * 7);
    setRefDate(d);
  }

  function goToday() { setRefDate(new Date()); }

  function openModal() { setForm({ nom: "", montant: "" }); setShowModal(true); }

  function handleAdd(e) {
    e.preventDefault();
    if (!form.nom.trim())    return toast.warning("Nom de la dépense requis");
    if (!form.montant || +form.montant <= 0) return toast.warning("Montant invalide");
    setSaving(true);
    const now = new Date();
    const pad = n => String(n).padStart(2, "0");
    const date_depense  = toISO(now);
    const heure_depense = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    const mois    = now.getMonth() + 1;
    const annee   = now.getFullYear();
    const semaine = semaineDuMois(now.getDate());
    axios.post("finance/depenses", { userId: u_info.u_id, nom: form.nom, montant: +form.montant, date_depense, heure_depense, semaine, mois, annee }, u_info.opts)
      .then(() => { toast.success("Dépense ajoutée"); setShowModal(false); fetch(); })
      .catch(() => toast.error("Erreur"))
      .finally(() => setSaving(false));
  }

  function handleDelete(id) {
    axios.delete(`finance/depenses/${id}?userId=${u_info.u_id}`, u_info.opts)
      .then(() => { toast.success("Supprimée"); fetch(); })
      .catch(() => toast.error("Erreur"));
  }

  const total = depenses.reduce((s, d) => s + (+d.montant || 0), 0);
  const isCurrentWeek = toISO(start) === toISO(getWeekBounds(new Date()).start);

  return (
    <Template>
      <Header />
      <div className="container-fluid flex-grow-1">
        <div className="row g-0">
          <Sidebar />
          <main className="col-md-9 ms-sm-auto col-lg-10 px-md-4 main">

            <div className="page-header">
              <div>
                <h1 className="page-title"><BsCashStack /> Dépenses</h1>
                <p className="text-muted small mb-0">
                  Semaine du <strong>{fmt(start)}</strong> au <strong>{fmt(end)}</strong>
                </p>
              </div>
              <div className="d-flex gap-2 align-items-center flex-wrap">
                <div className="week-nav">
                  <button className="week-nav-btn" onClick={() => goWeek(-1)}><BsChevronLeft size={12} /></button>
                  <button className={`week-nav-btn ${isCurrentWeek ? "active" : ""}`} onClick={goToday}>
                    <BsCalendar3 size={12} className="me-1" />Cette semaine
                  </button>
                  <button className="week-nav-btn" onClick={() => goWeek(1)}><BsChevronRight size={12} /></button>
                </div>
                <button className="btn btn-primary btn-sm d-flex align-items-center gap-1" onClick={openModal}>
                  <BsPlus size={16} /> Ajouter
                </button>
              </div>
            </div>

            <div className="card-pro p-0">
              <div className="week-header d-flex justify-content-between align-items-center">
                <span>
                  {MOIS_COURT[start.getMonth()+1]} {start.getDate()} — {MOIS_COURT[end.getMonth()+1]} {end.getDate()} {end.getFullYear()}
                </span>
                <span className="fw-bold text-danger">{total.toLocaleString()} Ar · {depenses.length} dépense{depenses.length > 1 ? "s" : ""}</span>
              </div>

              {loading ? (
                <div className="text-center py-5 text-muted" style={{ fontSize: "0.85rem" }}>Chargement…</div>
              ) : depenses.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <p className="mb-2">Aucune dépense cette semaine</p>
                  <button className="btn btn-sm btn-primary" onClick={openModal}><BsPlus /> Ajouter</button>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead style={{ background: "#f8fafc" }}>
                      <tr>
                        <th style={{ fontSize: "0.73rem", color: "#64748b" }}>Nom</th>
                        <th style={{ fontSize: "0.73rem", color: "#64748b" }}>Montant</th>
                        <th style={{ fontSize: "0.73rem", color: "#64748b" }}>Date</th>
                        <th style={{ fontSize: "0.73rem", color: "#64748b" }}>Heure</th>
                        <th style={{ fontSize: "0.73rem", color: "#64748b" }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {depenses.map(d => (
                        <tr key={d.id}>
                          <td className="fw-semibold" style={{ fontSize: "0.875rem" }}>{d.nom}</td>
                          <td className="fw-bold text-danger" style={{ fontSize: "0.875rem" }}>{(+d.montant).toLocaleString()} Ar</td>
                          <td style={{ fontSize: "0.8rem", color: "#64748b" }}>
                            {new Date(d.date_depense + "T00:00:00").toLocaleDateString("fr-FR")}
                          </td>
                          <td style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                            {d.heure_depense ? d.heure_depense.slice(0, 5) : "—"}
                          </td>
                          <td>
                            <button className="btn btn-outline-danger btn-sm" onClick={() => handleDelete(d.id)}><BsFillTrashFill /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </main>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content-pro" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header-pro">
              <h6><BsCashStack className="me-2" />Nouvelle dépense</h6>
              <button className="btn-close" onClick={() => setShowModal(false)} />
            </div>
            <form onSubmit={handleAdd} className="p-4">
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label">Nom de la dépense *</label>
                  <input type="text" className="form-control form-control-sm" value={form.nom}
                    onChange={e => setForm({ ...form, nom: e.target.value })}
                    placeholder="Ex: Courses, Transport, Restaurant…" autoFocus />
                </div>
                <div className="col-12">
                  <label className="form-label">Montant (Ar) *</label>
                  <input type="number" className="form-control form-control-sm" value={form.montant}
                    onChange={e => setForm({ ...form, montant: e.target.value })} min={1} placeholder="0" />
                </div>
              </div>
              <div className="d-flex justify-content-end gap-2 mt-4">
                <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setShowModal(false)}>Annuler</button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                  {saving ? "Enregistrement..." : "Ajouter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Template>
  );
}
