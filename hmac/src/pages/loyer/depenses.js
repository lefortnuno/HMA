import { useState, useEffect } from "react";
import axios from "../../contexts/api/axios";
import GetUserData from "../../contexts/api/udata";
import Template from "../../components/template/template";
import Header from "../../components/header/header";
import Sidebar from "../../components/sidebar/sidebar";
import { toast } from "react-toastify";
import { BsCurrencyExchange, BsPlus, BsFillTrashFill } from "react-icons/bs";
import ApartSelect, {
  useAppartements,
  getSelectedBienId,
  setSelectedBienId,
  KINYA,
} from "../../components/appart/apart.select";
import "./loyer.css";

const MOIS_LABELS = ["","Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
const CATEGORIES = ["Réparation","Entretien","Charges","Fournitures","Salaires","Autre"];

function formatDate(str) {
  if (!str) return "—";
  const d = new Date(str);
  if (isNaN(d)) return "—";
  return `${d.getDate()} ${MOIS_LABELS[d.getMonth() + 1]} ${d.getFullYear()}`;
}

function initForm(now) {
  return { description: "", montant: "", categorie: "Autre", date: now.toISOString().split("T")[0] };
}

export default function Depenses() {
  const u_info = GetUserData();
  const now = new Date();
  const apparts = useAppartements();
  const [bienId, setBienId] = useState(getSelectedBienId());
  const current = apparts.find((a) => a.id === bienId) || KINYA;
  const [mois, setMois] = useState(now.getMonth() + 1);
  const [annee, setAnnee] = useState(now.getFullYear());
  const [depenses, setDepenses] = useState([]);
  const [form, setForm] = useState(initForm(now));
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchDepenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mois, annee, bienId]);

  function changeAppart(id) {
    setBienId(id);
    setSelectedBienId(id);
  }

  function fetchDepenses() {
    axios
      .get(`loyer/depenses?mois=${mois}&annee=${annee}&bienId=${bienId}`, u_info.opts)
      .then((r) => setDepenses(r.data || []))
      .catch(() => setDepenses([]));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.description.trim()) return toast.warning("Description requise");
    if (!form.montant || form.montant <= 0) return toast.warning("Montant invalide");
    setSaving(true);
    axios
      .post("loyer/depenses", { ...form, mois, annee, montant: +form.montant, bienId }, u_info.opts)
      .then(() => {
        toast.success("Dépense ajoutée");
        setForm(initForm(now));
        setShowModal(false);
        fetchDepenses();
      })
      .catch(() => toast.error("Erreur d'enregistrement"))
      .finally(() => setSaving(false));
  }

  function handleDelete(id) {
    axios
      .delete(`loyer/depenses/${id}`, u_info.opts)
      .then(() => {
        toast.success("Dépense supprimée");
        fetchDepenses();
      })
      .catch(() => toast.error("Erreur de suppression"));
  }

  const totalMois = depenses.reduce((s, d) => s + (+d.montant || 0), 0);
  const annees = [2023, 2024, 2025, 2026, 2027];

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
                  <BsCurrencyExchange /> Dépenses Immobilier
                </h1>
                <p className="text-muted small mb-0">
                  {current.nom} · {MOIS_LABELS[mois]} {annee} — Total : <span className="fw-bold text-danger">{totalMois.toLocaleString()} Ar</span>
                </p>
              </div>
              <div className="d-flex gap-2 align-items-center flex-wrap">
                <ApartSelect list={apparts} value={bienId} onChange={changeAppart} />
                <select className="form-select form-select-sm" style={{ width: "auto" }} value={mois} onChange={(e) => setMois(+e.target.value)}>
                  {MOIS_LABELS.slice(1).map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                </select>
                <select className="form-select form-select-sm" style={{ width: "auto" }} value={annee} onChange={(e) => setAnnee(+e.target.value)}>
                  {annees.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
                <button
                  className="btn btn-primary btn-sm d-flex align-items-center gap-1"
                  onClick={() => { setForm(initForm(now)); setShowModal(true); }}
                >
                  <BsPlus size={16} /> Ajouter
                </button>
              </div>
            </div>

            {/* Liste dépenses */}
            <div className="card-pro p-0">
              <div className="p-3 border-bottom d-flex justify-content-between align-items-center">
                <h6 className="fw-bold mb-0">
                  Dépenses de {MOIS_LABELS[mois]} {annee}
                </h6>
                <span className="fw-bold text-danger">{totalMois.toLocaleString()} Ar</span>
              </div>
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead style={{ background: "#f8fafc" }}>
                    <tr>
                      <th style={{ fontSize: "0.73rem", color: "#64748b" }}>Date</th>
                      <th style={{ fontSize: "0.73rem", color: "#64748b" }}>Description</th>
                      <th style={{ fontSize: "0.73rem", color: "#64748b" }}>Catégorie</th>
                      <th style={{ fontSize: "0.73rem", color: "#64748b" }}>Montant</th>
                      <th style={{ fontSize: "0.73rem", color: "#64748b" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {depenses.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center text-muted py-5">
                          <div className="mb-2">Aucune dépense pour ce mois</div>
                          <button className="btn btn-sm btn-primary" onClick={() => { setForm(initForm(now)); setShowModal(true); }}>
                            <BsPlus /> Ajouter
                          </button>
                        </td>
                      </tr>
                    ) : (
                      depenses.map((d) => (
                        <tr key={d.id}>
                          <td style={{ fontSize: "0.875rem" }}>{formatDate(d.date)}</td>
                          <td style={{ fontSize: "0.875rem" }}>{d.description}</td>
                          <td>
                            <span style={{ fontSize: "0.75rem", background: "#f1f5f9", color: "#475569", borderRadius: 6, padding: "2px 8px" }}>
                              {d.categorie}
                            </span>
                          </td>
                          <td className="fw-bold text-danger" style={{ fontSize: "0.875rem" }}>
                            {(+d.montant).toLocaleString()} Ar
                          </td>
                          <td>
                            <button className="btn btn-outline-danger btn-sm" onClick={() => handleDelete(d.id)}>
                              <BsFillTrashFill />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </main>
        </div>
      </div>

      {/* ── Modal ajout dépense ── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="modal-content-pro"
            style={{ maxWidth: 480 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header-pro">
              <h6><BsCurrencyExchange className="me-2" />Nouvelle dépense — {MOIS_LABELS[mois]} {annee}</h6>
              <button className="btn-close" onClick={() => setShowModal(false)} />
            </div>
            <form onSubmit={handleSubmit} className="p-4">
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label">Description *</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Ex: Réparation toiture"
                    autoFocus
                  />
                </div>
                <div className="col-sm-6">
                  <label className="form-label">Montant (Ar) *</label>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    value={form.montant}
                    onChange={(e) => setForm({ ...form, montant: e.target.value })}
                    min={0}
                    placeholder="0"
                  />
                </div>
                <div className="col-sm-6">
                  <label className="form-label">Catégorie</label>
                  <select className="form-select form-select-sm" value={form.categorie}
                    onChange={(e) => setForm({ ...form, categorie: e.target.value })}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="col-sm-6">
                  <label className="form-label">Date</label>
                  <input type="date" className="form-control form-control-sm"
                    value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </div>
              </div>
              <div className="d-flex justify-content-end gap-2 mt-4">
                <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setShowModal(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                  {saving ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Template>
  );
}
