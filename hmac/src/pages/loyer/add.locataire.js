import { useState, useEffect } from "react";
import axios from "../../contexts/api/axios";
import GetUserData from "../../contexts/api/udata";
import Template from "../../components/template/template";
import Header from "../../components/header/header";
import Sidebar from "../../components/sidebar/sidebar";
import { toast } from "react-toastify";
import { useNavigate, Link } from "react-router-dom";
import { BsPeople, BsArrowLeft } from "react-icons/bs";
import "./loyer.css";

const CHAMBRES_RDC = ["1","2","3","4","5","6","7","8","9","10"];
const CHAMBRES_1ER = ["I","II","III","IV","V","VI","VII","VIII","IX","X"];

export default function AddLocataire() {
  const u_info = GetUserData();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    etage: "RDC",
    chambre: "1",
    tel: "",
    email: "",
    dateEntree: new Date().toISOString().split("T")[0],
    actif: true,
  });
  const [saving, setSaving] = useState(false);
  const [locataires, setLocataires] = useState([]);

  useEffect(() => {
    axios
      .get("loyer/locataires", u_info.opts)
      .then((r) => {
        const list = r.data || [];
        setLocataires(list);
        // Pré-règle sur un étage/chambre réellement libre.
        const freeOf = (etage) => {
          const occ = new Set(list.filter((l) => l.actif).map((l) => `${l.chambre}|${l.etage}`));
          return (etage === "RDC" ? CHAMBRES_RDC : CHAMBRES_1ER).filter((c) => !occ.has(`${c}|${etage}`));
        };
        const etage = freeOf("RDC").length ? "RDC" : "1ER";
        setForm((f) => ({ ...f, etage, chambre: freeOf(etage)[0] || "" }));
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loyer = form.etage === "RDC" ? 150000 : 200000;

  function freeChambresFor(etage) {
    const occ = new Set(locataires.filter((l) => l.actif).map((l) => `${l.chambre}|${l.etage}`));
    return (etage === "RDC" ? CHAMBRES_RDC : CHAMBRES_1ER).filter((c) => !occ.has(`${c}|${etage}`));
  }
  const chambres = freeChambresFor(form.etage);

  function handleChange(e) {
    const { name, value } = e.target;
    if (name === "etage") {
      setForm((f) => ({ ...f, etage: value, chambre: freeChambresFor(value)[0] || "" }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.nom.trim()) return toast.warning("Le nom est requis");
    setSaving(true);
    axios
      .post("loyer/locataires", { ...form, loyer }, u_info.opts)
      .then(() => {
        toast.success("Locataire ajouté !");
        navigate("/loyer/locataires/");
      })
      .catch((err) =>
        toast.error(
          err.response?.status === 409
            ? err.response.data.message || "Chambre déjà occupée"
            : "Erreur lors de l'ajout"
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
              <div>
                <h1 className="page-title">
                  <BsPeople /> Ajouter un locataire
                </h1>
              </div>
              <Link to="/loyer/locataires/" className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1">
                <BsArrowLeft /> Retour
              </Link>
            </div>

            <div className="card-pro" style={{ maxWidth: 620 }}>
              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  <div className="col-sm-6">
                    <label className="form-label">Nom *</label>
                    <input
                      type="text"
                      name="nom"
                      className="form-control"
                      value={form.nom}
                      onChange={handleChange}
                      placeholder="Nom de famille"
                    />
                  </div>
                  <div className="col-sm-6">
                    <label className="form-label">Prénom</label>
                    <input
                      type="text"
                      name="prenom"
                      className="form-control"
                      value={form.prenom}
                      onChange={handleChange}
                      placeholder="Prénom"
                    />
                  </div>

                  <div className="col-sm-6">
                    <label className="form-label">Étage</label>
                    <select
                      name="etage"
                      className="form-select"
                      value={form.etage}
                      onChange={handleChange}
                    >
                      <option value="RDC">Rez-de-chaussée (150 000 Ar)</option>
                      <option value="1ER">1er Étage (200 000 Ar)</option>
                    </select>
                  </div>
                  <div className="col-sm-6">
                    <label className="form-label">Chambre</label>
                    <select
                      name="chambre"
                      className="form-select"
                      value={form.chambre}
                      onChange={handleChange}
                      disabled={chambres.length === 0}
                    >
                      {chambres.length === 0 ? (
                        <option value="">Aucune chambre libre</option>
                      ) : (
                        chambres.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))
                      )}
                    </select>
                  </div>

                  <div className="col-12">
                    <div
                      className="p-3 rounded-3 d-flex align-items-center gap-3"
                      style={{ background: "#eff6ff", border: "1px solid #bfdbfe" }}
                    >
                      <BsPeople size={20} color="#2563eb" />
                      <div>
                        <div className="fw-bold text-primary" style={{ fontSize: "0.875rem" }}>
                          Loyer mensuel : {loyer.toLocaleString()} Ar
                        </div>
                        <small className="text-muted">
                          Chambre {form.chambre} — {form.etage}
                        </small>
                      </div>
                    </div>
                  </div>

                  <div className="col-sm-6">
                    <label className="form-label">Téléphone</label>
                    <input
                      type="tel"
                      name="tel"
                      className="form-control"
                      value={form.tel}
                      onChange={handleChange}
                      placeholder="+261 ..."
                    />
                  </div>
                  <div className="col-sm-6">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      name="email"
                      className="form-control"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="email@exemple.com"
                    />
                  </div>

                  <div className="col-sm-6">
                    <label className="form-label">Date d'entrée</label>
                    <input
                      type="date"
                      name="dateEntree"
                      className="form-control"
                      value={form.dateEntree}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-12 d-flex justify-content-end gap-2 pt-2">
                    <Link to="/loyer/locataires/" className="btn btn-outline-secondary">
                      Annuler
                    </Link>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={saving || !form.chambre}
                    >
                      {saving ? "Enregistrement..." : "Ajouter le locataire"}
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
