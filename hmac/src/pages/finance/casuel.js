import { useState, useEffect } from "react";
import axios from "../../contexts/api/axios";
import GetUserData from "../../contexts/api/udata";
import Template from "../../components/template/template";
import Header from "../../components/header/header";
import Sidebar from "../../components/sidebar/sidebar";
import { toast } from "react-toastify";
import { BsStarFill, BsPlus, BsFillTrashFill } from "react-icons/bs";
import { SkLocataires } from "../../components/skeleton/skeleton";
import "../loyer/loyer.css";
import "./finance.css";

const MOIS_LABELS = ["","Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
const ANNEES = [2023, 2024, 2025, 2026, 2027];

function toISO(d) { return d.toISOString().split("T")[0]; }

export default function FinanceCasuel() {
  const u_info  = GetUserData();
  const now     = new Date();
  const [mois,      setMois]      = useState(now.getMonth() + 1);
  const [annee,     setAnnee]     = useState(now.getFullYear());
  const [casuel,    setCasuel]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form,      setForm]      = useState({ nom: "", montant: "" });
  const [saving,    setSaving]    = useState(false);

  useEffect(() => { fetchData(); }, [mois, annee]);

  function fetchData() {
    setLoading(true);
    axios.get(`finance/casuel?mois=${mois}&annee=${annee}&userId=${u_info.u_id}`, u_info.opts)
      .then(r  => setCasuel(r.data || []))
      .catch(() => setCasuel([]))
      .finally(() => setLoading(false));
  }

  function openModal() { setForm({ nom: "", montant: "" }); setShowModal(true); }

  function handleAdd(e) {
    e.preventDefault();
    if (!form.nom.trim())   return toast.warning("Nom requis");
    if (!form.montant || +form.montant <= 0) return toast.warning("Montant invalide");
    setSaving(true);
    const date_casuel = toISO(new Date());
    axios.post("finance/casuel", {
      userId: u_info.u_id, nom: form.nom, montant: +form.montant,
      date_casuel, mois, annee
    }, u_info.opts)
      .then(() => { toast.success("Casuel ajouté"); setShowModal(false); fetchData(); })
      .catch(() => toast.error("Erreur"))
      .finally(() => setSaving(false));
  }

  function handleDelete(id) {
    axios.delete(`finance/casuel/${id}?userId=${u_info.u_id}`, u_info.opts)
      .then(() => { toast.success("Supprimé"); fetchData(); })
      .catch(() => toast.error("Erreur"));
  }

  const total = casuel.reduce((s, c) => s + (+c.montant || 0), 0);

  return (
    <Template>
      <Header />
      <div className="container-fluid flex-grow-1">
        <div className="row g-0">
          <Sidebar />
          <main className="col-md-9 ms-sm-auto col-lg-10 px-md-4 main">

            <div className="page-header">
              <div>
                <h1 className="page-title"><BsStarFill /> Casuel</h1>
                <p className="text-muted small mb-0">
                  {MOIS_LABELS[mois]} {annee} — Total : <span className="fw-bold" style={{ color: "#f59e0b" }}>{total.toLocaleString()} Ar</span>
                </p>
              </div>
              <div className="d-flex gap-2 align-items-center flex-wrap">
                <select className="form-select form-select-sm" style={{ width: "auto" }} value={mois} onChange={e => setMois(+e.target.value)}>
                  {MOIS_LABELS.slice(1).map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
                </select>
                <select className="form-select form-select-sm" style={{ width: "auto" }} value={annee} onChange={e => setAnnee(+e.target.value)}>
                  {ANNEES.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                <button className="btn btn-warning btn-sm d-flex align-items-center gap-1 text-white" onClick={openModal}>
                  <BsPlus size={16} /> Ajouter
                </button>
              </div>
            </div>

            {loading ? <SkLocataires /> : (
              <div className="card-pro p-0">
                <div className="p-3 border-bottom d-flex justify-content-between align-items-center">
                  <h6 className="fw-bold mb-0">Revenus occasionnels — {MOIS_LABELS[mois]} {annee}</h6>
                  <span className="fw-bold" style={{ color: "#f59e0b" }}>{total.toLocaleString()} Ar</span>
                </div>
                {casuel.length === 0 ? (
                  <div className="text-center py-5 text-muted">
                    <p className="mb-2">Aucun casuel pour ce mois</p>
                    <button className="btn btn-sm btn-warning text-white" onClick={openModal}><BsPlus /> Ajouter</button>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead style={{ background: "#f8fafc" }}>
                        <tr>
                          <th style={{ fontSize: "0.73rem", color: "#64748b" }}>Source</th>
                          <th style={{ fontSize: "0.73rem", color: "#64748b" }}>Montant</th>
                          <th style={{ fontSize: "0.73rem", color: "#64748b" }}>Date</th>
                          <th style={{ fontSize: "0.73rem", color: "#64748b" }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {casuel.map(c => (
                          <tr key={c.id}>
                            <td className="fw-semibold" style={{ fontSize: "0.875rem" }}>{c.nom}</td>
                            <td className="fw-bold" style={{ fontSize: "0.875rem", color: "#f59e0b" }}>
                              {(+c.montant).toLocaleString()} Ar
                            </td>
                            <td style={{ fontSize: "0.8rem", color: "#64748b" }}>
                              {new Date(c.date_casuel + "T00:00:00").toLocaleDateString("fr-FR")}
                            </td>
                            <td>
                              <button className="btn btn-outline-danger btn-sm" onClick={() => handleDelete(c.id)}>
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
          </main>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content-pro" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header-pro">
              <h6><BsStarFill className="me-2" />Nouveau casuel — {MOIS_LABELS[mois]} {annee}</h6>
              <button className="btn-close" onClick={() => setShowModal(false)} />
            </div>
            <form onSubmit={handleAdd} className="p-4">
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label">Source *</label>
                  <input type="text" className="form-control form-control-sm" value={form.nom}
                    onChange={e => setForm({ ...form, nom: e.target.value })}
                    placeholder="Ex: Bonus, Vente, Cadeau…" autoFocus />
                </div>
                <div className="col-12">
                  <label className="form-label">Montant (Ar) *</label>
                  <input type="number" className="form-control form-control-sm" value={form.montant}
                    onChange={e => setForm({ ...form, montant: e.target.value })} min={1} placeholder="0" />
                </div>
              </div>
              <div className="d-flex justify-content-end gap-2 mt-4">
                <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setShowModal(false)}>Annuler</button>
                <button type="submit" className="btn btn-warning btn-sm text-white" disabled={saving}>
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
