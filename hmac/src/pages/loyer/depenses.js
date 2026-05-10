import { useState, useEffect } from "react";
import axios from "../../contexts/api/axios";
import GetUserData from "../../contexts/api/udata";
import Template from "../../components/template/template";
import Header from "../../components/header/header";
import Sidebar from "../../components/sidebar/sidebar";
import { toast } from "react-toastify";
import { BsCurrencyExchange, BsPlus, BsFillTrashFill } from "react-icons/bs";
import "./loyer.css";

const MOIS_LABELS = ["","Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
const CATEGORIES = ["Réparation","Entretien","Charges","Fournitures","Salaires","Autre"];

export default function Depenses() {
  const u_info = GetUserData();
  const now = new Date();
  const [mois, setMois] = useState(now.getMonth() + 1);
  const [annee, setAnnee] = useState(now.getFullYear());
  const [depenses, setDepenses] = useState([]);
  const [form, setForm] = useState({
    description: "",
    montant: "",
    categorie: "Autre",
    date: now.toISOString().split("T")[0],
  });
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchDepenses();
  }, [mois, annee]);

  function fetchDepenses() {
    axios
      .get(`loyer/depenses?mois=${mois}&annee=${annee}`, u_info.opts)
      .then((r) => setDepenses(r.data || []))
      .catch(() => setDepenses([]));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.description.trim()) return toast.warning("Description requise");
    if (!form.montant || form.montant <= 0) return toast.warning("Montant invalide");
    setSaving(true);
    axios
      .post("loyer/depenses", { ...form, mois, annee, montant: +form.montant }, u_info.opts)
      .then(() => {
        toast.success("Dépense ajoutée");
        setForm({ description: "", montant: "", categorie: "Autre", date: now.toISOString().split("T")[0] });
        setShowForm(false);
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
                  {MOIS_LABELS[mois]} {annee} — Total : {totalMois.toLocaleString()} Ar
                </p>
              </div>
              <div className="d-flex gap-2">
                <select className="form-select form-select-sm" style={{ width: "auto" }} value={mois} onChange={(e) => setMois(+e.target.value)}>
                  {MOIS_LABELS.slice(1).map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                </select>
                <select className="form-select form-select-sm" style={{ width: "auto" }} value={annee} onChange={(e) => setAnnee(+e.target.value)}>
                  {annees.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
                <button className="btn btn-primary btn-sm d-flex align-items-center gap-1" onClick={() => setShowForm(!showForm)}>
                  <BsPlus size={16} /> Ajouter
                </button>
              </div>
            </div>

            {/* Formulaire ajout */}
            {showForm && (
              <div className="card-pro mb-4">
                <h6 className="fw-bold mb-3">Nouvelle dépense — {MOIS_LABELS[mois]} {annee}</h6>
                <form onSubmit={handleSubmit}>
                  <div className="row g-3">
                    <div className="col-sm-5">
                      <label className="form-label">Description *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        placeholder="Ex: Réparation toiture"
                      />
                    </div>
                    <div className="col-sm-3">
                      <label className="form-label">Montant (Ar) *</label>
                      <input
                        type="number"
                        className="form-control"
                        value={form.montant}
                        onChange={(e) => setForm({ ...form, montant: e.target.value })}
                        min={0}
                        placeholder="0"
                      />
                    </div>
                    <div className="col-sm-2">
                      <label className="form-label">Catégorie</label>
                      <select className="form-select" value={form.categorie} onChange={(e) => setForm({ ...form, categorie: e.target.value })}>
                        {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="col-sm-2">
                      <label className="form-label">Date</label>
                      <input type="date" className="form-control" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                    </div>
                    <div className="col-12 d-flex justify-content-end gap-2">
                      <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setShowForm(false)}>Annuler</button>
                      <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                        {saving ? "..." : "Enregistrer"}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}

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
                        <td colSpan={5} className="text-center text-muted py-4">
                          Aucune dépense pour ce mois
                        </td>
                      </tr>
                    ) : (
                      depenses.map((d) => (
                        <tr key={d.id}>
                          <td style={{ fontSize: "0.875rem" }}>{d.date}</td>
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
    </Template>
  );
}
