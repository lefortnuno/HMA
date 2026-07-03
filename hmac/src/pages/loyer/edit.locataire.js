import { useState, useEffect } from "react";
import axios from "../../contexts/api/axios";
import GetUserData from "../../contexts/api/udata";
import Template from "../../components/template/template";
import Header from "../../components/header/header";
import Sidebar from "../../components/sidebar/sidebar";
import { toast } from "react-toastify";
import { useNavigate, useLocation, Link, useParams } from "react-router-dom";
import { BsPeople, BsArrowLeft } from "react-icons/bs";
import "./loyer.css";

const CHAMBRES_RDC = ["1","2","3","4","5","6","7","8","9","10"];
const CHAMBRES_1ER = ["I","II","III","IV","V","VI","VII","VIII","IX","X"];

export default function EditLocataire() {
  const u_info = GetUserData();
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const existing = location.state?.loc || {};

  const [form, setForm] = useState({
    nom: existing.nom || "",
    prenom: existing.prenom || "",
    etage: existing.etage || "RDC",
    chambre: existing.chambre || "1",
    tel: existing.tel || "",
    email: existing.email || "",
    dateEntree: existing.dateEntree
      ? existing.dateEntree.split("T")[0]
      : new Date().toISOString().split("T")[0],
    actif: existing.actif !== undefined ? existing.actif : true,
  });
  const [saving, setSaving] = useState(false);
  const [locataires, setLocataires] = useState([]);

  useEffect(() => {
    axios
      .get("loyer/locataires", u_info.opts)
      .then((r) => setLocataires(r.data || []))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loyer = form.etage === "RDC" ? 150000 : 200000;

  // Chambres libres de l'étage + celle actuellement occupée par ce locataire.
  function chambreOptions(etage) {
    const occ = new Set(
      locataires
        .filter((l) => l.actif && String(l.id) !== String(id))
        .map((l) => `${l.chambre}|${l.etage}`)
    );
    return (etage === "RDC" ? CHAMBRES_RDC : CHAMBRES_1ER).filter(
      (c) => !occ.has(`${c}|${etage}`)
    );
  }
  const chambres = chambreOptions(form.etage);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    if (name === "etage") {
      setForm((f) => ({ ...f, etage: value, chambre: chambreOptions(value)[0] || "" }));
    } else {
      setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.nom.trim()) return toast.warning("Le nom est requis");
    setSaving(true);
    axios
      .put(`loyer/locataires/${id}`, { ...form, loyer }, u_info.opts)
      .then(() => {
        toast.success("Locataire modifié !");
        navigate("/loyer/locataires/");
      })
      .catch((err) =>
        toast.error(
          err.response?.status === 409
            ? err.response.data.message || "Chambre déjà occupée"
            : "Erreur lors de la modification"
        )
      )
      .finally(() => setSaving(false));
  }

  return (
    <Template>
      <Header />
      <div className="container-fluid flex-grow-1">
        <div className="row g-0">
          <Sidebar />
          <main className="col-md-9 ms-sm-auto col-lg-10 px-md-4 main">

            <div className="page-header">
              <h1 className="page-title">
                <BsPeople /> Modifier le locataire
              </h1>
              <Link to="/loyer/locataires/" className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1">
                <BsArrowLeft /> Retour
              </Link>
            </div>

            <div className="card-pro" style={{ maxWidth: 620 }}>
              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  <div className="col-sm-6">
                    <label className="form-label">Nom *</label>
                    <input type="text" name="nom" className="form-control" value={form.nom} onChange={handleChange} />
                  </div>
                  <div className="col-sm-6">
                    <label className="form-label">Prénom</label>
                    <input type="text" name="prenom" className="form-control" value={form.prenom} onChange={handleChange} />
                  </div>

                  <div className="col-sm-6">
                    <label className="form-label">Étage</label>
                    <select name="etage" className="form-select" value={form.etage} onChange={handleChange}>
                      <option value="RDC">Rez-de-chaussée (150 000 Ar)</option>
                      <option value="1ER">1er Étage (200 000 Ar)</option>
                    </select>
                  </div>
                  <div className="col-sm-6">
                    <label className="form-label">Chambre</label>
                    <select name="chambre" className="form-select" value={form.chambre} onChange={handleChange}>
                      {chambres.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div className="col-12">
                    <div className="p-3 rounded-3 d-flex align-items-center gap-3" style={{ background: "#eff6ff", border: "1px solid #bfdbfe" }}>
                      <div>
                        <div className="fw-bold text-primary" style={{ fontSize: "0.875rem" }}>
                          Loyer mensuel : {loyer.toLocaleString()} Ar
                        </div>
                        <small className="text-muted">Chambre {form.chambre} — {form.etage}</small>
                      </div>
                    </div>
                  </div>

                  <div className="col-sm-6">
                    <label className="form-label">Téléphone</label>
                    <input type="tel" name="tel" className="form-control" value={form.tel} onChange={handleChange} />
                  </div>
                  <div className="col-sm-6">
                    <label className="form-label">Email</label>
                    <input type="email" name="email" className="form-control" value={form.email} onChange={handleChange} />
                  </div>
                  <div className="col-sm-6">
                    <label className="form-label">Date d'entrée</label>
                    <input type="date" name="dateEntree" className="form-control" value={form.dateEntree} onChange={handleChange} />
                  </div>
                  <div className="col-sm-6 d-flex align-items-end">
                    <div className="form-check mb-2">
                      <input
                        type="checkbox"
                        name="actif"
                        className="form-check-input"
                        id="actifCheck"
                        checked={form.actif}
                        onChange={handleChange}
                      />
                      <label className="form-check-label" htmlFor="actifCheck">
                        Locataire actif
                      </label>
                    </div>
                  </div>

                  <div className="col-12 d-flex justify-content-end gap-2 pt-2">
                    <Link to="/loyer/locataires/" className="btn btn-outline-secondary">Annuler</Link>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                      {saving ? "Enregistrement..." : "Enregistrer"}
                    </button>
                  </div>
                </div>
              </form>
            </div>

          </main>
        </div>
      </div>
    </Template>
  );
}
