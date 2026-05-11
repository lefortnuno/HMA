import { useState } from "react";
import axios from "../../contexts/api/axios";
import GetUserData from "../../contexts/api/udata";
import Template from "../../components/template/template";
import Header from "../../components/header/header";
import Sidebar from "../../components/sidebar/sidebar";
import { toast } from "react-toastify";
import { useNavigate, Link, useParams, useLocation } from "react-router-dom";
import { BsImages, BsArrowLeft, BsX, BsCloudUpload } from "react-icons/bs";

const FEATURES = ["Eau","Électricité","Parking","Jardin","Sécurité","Meublé","Wifi","Climatisation","Cuisine équipée"];

const API_ORIGIN =
  process.env.REACT_APP_OFFLINE_API_HEAD +
  process.env.REACT_APP_OFFLINE_API_IP_ADRESS +
  process.env.REACT_APP_OFFLINE_API_PORT;

function imgSrc(p) {
  if (!p) return "";
  if (p.startsWith("http")) return p;
  return API_ORIGIN + p;
}

export default function EditBien() {
  const u_info = GetUserData();
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const existing = location.state?.bien || {};

  const [form, setForm] = useState({
    titre:           existing.titre || "",
    type:            existing.type || "CHAMBRE",
    description:     existing.description || "",
    prix:            existing.prix || "",
    surface:         existing.surface || "",
    localisation:    existing.localisation || "",
    nbChambres:      existing.nbChambres || "",
    nbPieces:        existing.nbPieces || "",
    disponible:      existing.disponible !== undefined ? existing.disponible : true,
    photos:          existing.photos || [],
    caracteristiques:existing.caracteristiques || [],
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  }

  function toggleFeature(feat) {
    setForm(f => ({
      ...f,
      caracteristiques: f.caracteristiques.includes(feat)
        ? f.caracteristiques.filter(c => c !== feat)
        : [...f.caracteristiques, feat],
    }));
  }

  async function handleFileUpload(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    const authHeader = u_info.opts?.headers?.Authorization;
    const cfg = authHeader ? { headers: { Authorization: authHeader } } : {};
    for (const file of files) {
      const fd = new FormData();
      fd.append("photo", file);
      try {
        const r = await axios.post("vitrine/upload", fd, cfg);
        setForm(f => ({ ...f, photos: [...f.photos, r.data.url] }));
      } catch {
        toast.error("Erreur upload : " + file.name);
      }
    }
    setUploading(false);
    e.target.value = "";
  }

  function removePhoto(i) {
    setForm(f => ({ ...f, photos: f.photos.filter((_, idx) => idx !== i) }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.titre.trim()) return toast.warning("Le titre est requis");
    if (!form.prix) return toast.warning("Le prix est requis");
    setSaving(true);
    axios
      .put(`vitrine/biens/${id}`, {
        ...form,
        prix: +form.prix, surface: +form.surface || null,
        nbChambres: +form.nbChambres || null, nbPieces: +form.nbPieces || null,
      }, u_info.opts)
      .then(() => { toast.success("Bien mis à jour !"); navigate("/vitrine/admin/"); })
      .catch(() => toast.error("Erreur lors de la mise à jour"))
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
              <h1 className="page-title"><BsImages /> Modifier le bien</h1>
              <Link to="/vitrine/admin/" className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1">
                <BsArrowLeft /> Retour
              </Link>
            </div>

            <div className="card-pro" style={{ maxWidth: 720 }}>
              <form onSubmit={handleSubmit}>
                <div className="row g-3">

                  <div className="col-12">
                    <label className="form-label">Titre *</label>
                    <input type="text" name="titre" className="form-control" value={form.titre} onChange={handleChange} />
                  </div>
                  <div className="col-sm-4">
                    <label className="form-label">Type</label>
                    <select name="type" className="form-select" value={form.type} onChange={handleChange}>
                      <option value="CHAMBRE">Chambre</option>
                      <option value="VILLA">Villa</option>
                    </select>
                  </div>
                  <div className="col-sm-4">
                    <label className="form-label">Prix (Ar/mois) *</label>
                    <input type="number" name="prix" className="form-control" value={form.prix} onChange={handleChange} min={0} />
                  </div>
                  <div className="col-sm-4">
                    <label className="form-label">Surface (m²)</label>
                    <input type="number" name="surface" className="form-control" value={form.surface} onChange={handleChange} min={0} />
                  </div>
                  <div className="col-sm-6">
                    <label className="form-label">Nb chambres</label>
                    <input type="number" name="nbChambres" className="form-control" value={form.nbChambres} onChange={handleChange} min={0} />
                  </div>
                  <div className="col-sm-6">
                    <label className="form-label">Nb pièces</label>
                    <input type="number" name="nbPieces" className="form-control" value={form.nbPieces} onChange={handleChange} min={0} />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Localisation</label>
                    <input type="text" name="localisation" className="form-control" value={form.localisation} onChange={handleChange} />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Description</label>
                    <textarea name="description" className="form-control" rows={3} value={form.description} onChange={handleChange} />
                  </div>

                  {/* File upload */}
                  <div className="col-12">
                    <label className="form-label">Photos</label>
                    <label className="btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-1" style={{ cursor: "pointer" }}>
                      <BsCloudUpload />
                      {uploading ? "Upload en cours…" : "Ajouter des photos"}
                      <input type="file" accept="image/*" multiple hidden onChange={handleFileUpload} disabled={uploading} />
                    </label>
                    {form.photos.length > 0 && (
                      <div className="d-flex flex-wrap gap-2 mt-2">
                        {form.photos.map((p, i) => (
                          <div key={i} style={{ position: "relative" }}>
                            <img src={imgSrc(p)} alt="" style={{ width: 80, height: 60, objectFit: "cover", borderRadius: 8, border: "1px solid #e2e8f0" }} />
                            <button type="button" onClick={() => removePhoto(i)} style={{ position: "absolute", top: -6, right: -6, background: "#ef4444", color: "#fff", border: "none", borderRadius: "50%", width: 18, height: 18, fontSize: "0.65rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <BsX />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="col-12">
                    <label className="form-label">Caractéristiques</label>
                    <div className="d-flex flex-wrap gap-2">
                      {FEATURES.map(f => (
                        <button key={f} type="button" onClick={() => toggleFeature(f)} className="btn btn-sm"
                          style={{ background: form.caracteristiques.includes(f) ? "#2563eb" : "#f1f5f9", color: form.caracteristiques.includes(f) ? "#fff" : "#475569", border: "none", borderRadius: 8, fontSize: "0.8rem" }}>
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="col-12">
                    <div className="form-check">
                      <input type="checkbox" name="disponible" id="disponibleCheck" className="form-check-input" checked={form.disponible} onChange={handleChange} />
                      <label className="form-check-label" htmlFor="disponibleCheck">Disponible immédiatement</label>
                    </div>
                  </div>

                  <div className="col-12 d-flex justify-content-end gap-2 pt-2">
                    <Link to="/vitrine/admin/" className="btn btn-outline-secondary">Annuler</Link>
                    <button type="submit" className="btn btn-primary" disabled={saving || uploading}>
                      {saving ? "Enregistrement…" : "Enregistrer"}
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
