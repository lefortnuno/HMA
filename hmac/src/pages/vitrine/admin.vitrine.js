import { useState, useEffect } from "react";
import axios from "../../contexts/api/axios";
import GetUserData from "../../contexts/api/udata";
import Template from "../../components/template/template";
import Header from "../../components/header/header";
import Sidebar from "../../components/sidebar/sidebar";
import { toast } from "react-toastify";
import { Link, useNavigate } from "react-router-dom";
import {
  BsImages, BsPlus, BsPencilSquare, BsFillTrashFill,
  BsEye, BsToggleOn, BsToggleOff, BsX, BsCloudUpload,
} from "react-icons/bs";

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

const EMPTY_FORM = {
  titre: "", type: "CHAMBRE", description: "", prix: "",
  surface: "", localisation: "", nbChambres: "", nbPieces: "",
  disponible: true, photos: [], caracteristiques: [],
};

export default function AdminVitrine() {
  const u_info  = GetUserData();
  const navigate = useNavigate();
  const [biens, setBiens]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [toDelete, setToDelete]     = useState(null);
  const [isMobile, setIsMobile]     = useState(window.innerWidth < 768);
  const [showModal, setShowModal]   = useState(false);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [uploading, setUploading]   = useState(false);
  const [saving, setSaving]         = useState(false);

  useEffect(() => {
    fetchBiens();
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  function fetchBiens() {
    setLoading(true);
    axios.get("vitrine/biens", u_info.opts)
      .then(r => setBiens(r.data || []))
      .catch(() => setBiens([]))
      .finally(() => setLoading(false));
  }

  function openModal() {
    setForm(EMPTY_FORM);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
  }

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
      .post("vitrine/biens", {
        ...form,
        prix: +form.prix, surface: +form.surface || null,
        nbChambres: +form.nbChambres || null, nbPieces: +form.nbPieces || null,
      }, u_info.opts)
      .then(() => {
        toast.success("Bien publié !");
        closeModal();
        fetchBiens();
      })
      .catch(() => toast.error("Erreur lors de la publication"))
      .finally(() => setSaving(false));
  }

  function toggleDispo(bien) {
    axios
      .put(`vitrine/biens/${bien.id}`, { ...bien, disponible: !bien.disponible }, u_info.opts)
      .then(() => {
        toast.success(`Bien ${!bien.disponible ? "marqué disponible" : "marqué indisponible"}`);
        fetchBiens();
      })
      .catch(() => toast.error("Erreur"));
  }

  function handleDelete(id) {
    axios
      .delete(`vitrine/biens/${id}`, u_info.opts)
      .then(() => { toast.success("Bien supprimé"); fetchBiens(); setToDelete(null); })
      .catch(() => toast.error("Erreur de suppression"));
  }

  const nbDispo = biens.filter(b => b.disponible).length;

  return (
    <Template>
      <Header />
      <div className="container-fluid flex-grow-1">
        <div className="row g-0">
          <Sidebar />
          <main className="col-md-9 ms-sm-auto col-lg-10 px-md-4 main">

            <div className="page-header">
              <div>
                <h1 className="page-title"><BsImages /> Gestion des Biens</h1>
                <p className="text-muted small mb-0">
                  {biens.length} bien(s) — {nbDispo} disponible(s)
                </p>
              </div>
              <div className="d-flex gap-2">
                <a href="/vitrine/" target="_blank" rel="noopener noreferrer"
                  className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1">
                  <BsEye /> Voir la vitrine
                </a>
                {isMobile ? (
                  <Link to="/vitrine/admin/new"
                    className="btn btn-primary btn-sm d-flex align-items-center gap-1">
                    <BsPlus size={16} /> Ajouter
                  </Link>
                ) : (
                  <button onClick={openModal}
                    className="btn btn-primary btn-sm d-flex align-items-center gap-1">
                    <BsPlus size={16} /> Ajouter un bien
                  </button>
                )}
              </div>
            </div>

            <div className="card-pro p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead style={{ background: "#f8fafc" }}>
                    <tr>
                      <th style={{ fontSize: "0.73rem", color: "#64748b" }}>Photo</th>
                      <th style={{ fontSize: "0.73rem", color: "#64748b" }}>Titre</th>
                      <th style={{ fontSize: "0.73rem", color: "#64748b" }}>Type</th>
                      <th style={{ fontSize: "0.73rem", color: "#64748b" }}>Prix</th>
                      <th style={{ fontSize: "0.73rem", color: "#64748b" }}>Localisation</th>
                      <th style={{ fontSize: "0.73rem", color: "#64748b" }}>Disponibilité</th>
                      <th style={{ fontSize: "0.73rem", color: "#64748b" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={7} className="text-center py-4 text-muted">Chargement…</td></tr>
                    ) : biens.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-5 text-muted">
                          Aucun bien publié —{" "}
                          {isMobile
                            ? <Link to="/vitrine/admin/new">Ajouter le premier bien</Link>
                            : <button className="btn btn-link p-0" onClick={openModal}>Ajouter le premier bien</button>
                          }
                        </td>
                      </tr>
                    ) : biens.map(b => (
                      <tr key={b.id}>
                        <td>
                          {b.photos?.[0] ? (
                            <img src={imgSrc(b.photos[0])} alt=""
                              style={{ width: 52, height: 38, objectFit: "cover", borderRadius: 6 }} />
                          ) : (
                            <div style={{ width: 52, height: 38, background: "#f1f5f9", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>
                              {b.type === "VILLA" ? "🏡" : "🏠"}
                            </div>
                          )}
                        </td>
                        <td>
                          <div className="fw-semibold" style={{ fontSize: "0.875rem" }}>{b.titre}</div>
                          {b.surface && <small className="text-muted">{b.surface} m²</small>}
                        </td>
                        <td>
                          <span style={{ fontSize: "0.72rem", fontWeight: 700, padding: "2px 9px", borderRadius: 20, background: b.type === "VILLA" ? "#f5f3ff" : "#eff6ff", color: b.type === "VILLA" ? "#6d28d9" : "#1d4ed8" }}>
                            {b.type}
                          </span>
                        </td>
                        <td className="fw-bold text-primary" style={{ fontSize: "0.875rem" }}>
                          {(b.prix || 0).toLocaleString()} Ar
                        </td>
                        <td style={{ fontSize: "0.875rem", color: "#64748b" }}>{b.localisation || "—"}</td>
                        <td>
                          <button className="btn btn-sm p-0" onClick={() => toggleDispo(b)} title="Basculer" style={{ background: "none", border: "none" }}>
                            {b.disponible ? <BsToggleOn size={24} color="#10b981" /> : <BsToggleOff size={24} color="#94a3b8" />}
                          </button>
                          <span className="ms-1" style={{ fontSize: "0.72rem", color: b.disponible ? "#059669" : "#94a3b8" }}>
                            {b.disponible ? "Dispo" : "Indispo"}
                          </span>
                        </td>
                        <td>
                          <a href={`/vitrine/bien/${b.id}`} target="_blank" rel="noopener noreferrer"
                            className="btn btn-outline-success btn-sm me-1"><BsEye /></a>
                          <button className="btn btn-outline-primary btn-sm me-1"
                            onClick={() => navigate(`/vitrine/admin/edit/${b.id}`, { state: { bien: b } })}>
                            <BsPencilSquare />
                          </button>
                          <button className="btn btn-outline-danger btn-sm" onClick={() => setToDelete(b)}>
                            <BsFillTrashFill />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </main>
        </div>
      </div>

      {/* ── Delete confirm modal ─────────────────────────────── */}
      {toDelete && (
        <div className="modal-overlay" onClick={() => setToDelete(null)}>
          <div className="modal-content-pro" style={{ maxWidth: 360 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header-pro">
              <h6>Supprimer ce bien ?</h6>
              <button className="btn-close" onClick={() => setToDelete(null)} />
            </div>
            <div className="p-4">
              <p className="mb-4">Supprimer <strong>{toDelete.titre}</strong> de la vitrine ?</p>
              <div className="d-flex justify-content-end gap-2">
                <button className="btn btn-outline-secondary btn-sm" onClick={() => setToDelete(null)}>Annuler</button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(toDelete.id)}>Supprimer</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Add bien modal (desktop only) ────────────────────── */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "#fff", borderRadius: 16, width: "100%", maxWidth: 680,
              maxHeight: "90vh", display: "flex", flexDirection: "column",
              boxShadow: "0 20px 60px rgba(0,0,0,0.2)", overflow: "hidden",
            }}
          >
            {/* Header */}
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
              <h6 style={{ margin: 0, fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", gap: 8 }}>
                <BsImages /> Publier un nouveau bien
              </h6>
              <button className="btn-close" onClick={closeModal} />
            </div>

            {/* Scrollable body */}
            <div style={{ overflowY: "auto", padding: "20px", flex: 1 }}>
              <form onSubmit={handleSubmit}>
                <div className="row g-3">

                  <div className="col-12">
                    <label className="form-label">Titre *</label>
                    <input type="text" name="titre" className="form-control form-control-sm" value={form.titre} onChange={handleChange} placeholder="Ex: Villa F5 à Ambohimangakely" />
                  </div>

                  <div className="col-sm-4">
                    <label className="form-label">Type</label>
                    <select name="type" className="form-select form-select-sm" value={form.type} onChange={handleChange}>
                      <option value="CHAMBRE">Chambre</option>
                      <option value="VILLA">Villa</option>
                    </select>
                  </div>
                  <div className="col-sm-4">
                    <label className="form-label">Prix (Ar/mois) *</label>
                    <input type="number" name="prix" className="form-control form-control-sm" value={form.prix} onChange={handleChange} min={0} placeholder="0" />
                  </div>
                  <div className="col-sm-4">
                    <label className="form-label">Surface (m²)</label>
                    <input type="number" name="surface" className="form-control form-control-sm" value={form.surface} onChange={handleChange} min={0} placeholder="0" />
                  </div>

                  <div className="col-sm-6">
                    <label className="form-label">Nb chambres</label>
                    <input type="number" name="nbChambres" className="form-control form-control-sm" value={form.nbChambres} onChange={handleChange} min={0} placeholder="0" />
                  </div>
                  <div className="col-sm-6">
                    <label className="form-label">Nb pièces</label>
                    <input type="number" name="nbPieces" className="form-control form-control-sm" value={form.nbPieces} onChange={handleChange} min={0} placeholder="0" />
                  </div>

                  <div className="col-12">
                    <label className="form-label">Localisation</label>
                    <input type="text" name="localisation" className="form-control form-control-sm" value={form.localisation} onChange={handleChange} placeholder="Ex: Ambohimangakely, Antananarivo" />
                  </div>

                  <div className="col-12">
                    <label className="form-label">Description</label>
                    <textarea name="description" className="form-control form-control-sm" rows={2} value={form.description} onChange={handleChange} placeholder="Décrivez le bien…" />
                  </div>

                  {/* Photo upload */}
                  <div className="col-12">
                    <label className="form-label">Photos</label>
                    <label className="btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-1" style={{ cursor: "pointer" }}>
                      <BsCloudUpload />
                      {uploading ? "Upload en cours…" : "Choisir des photos"}
                      <input type="file" accept="image/*" multiple hidden onChange={handleFileUpload} disabled={uploading} />
                    </label>
                    {form.photos.length > 0 && (
                      <div className="d-flex flex-wrap gap-2 mt-2">
                        {form.photos.map((p, i) => (
                          <div key={i} style={{ position: "relative" }}>
                            <img src={imgSrc(p)} alt="" style={{ width: 70, height: 52, objectFit: "cover", borderRadius: 8, border: "1px solid #e2e8f0" }} />
                            <button type="button" onClick={() => removePhoto(i)} style={{ position: "absolute", top: -6, right: -6, background: "#ef4444", color: "#fff", border: "none", borderRadius: "50%", width: 18, height: 18, fontSize: "0.65rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <BsX />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  <div className="col-12">
                    <label className="form-label">Caractéristiques</label>
                    <div className="d-flex flex-wrap gap-2">
                      {FEATURES.map(f => (
                        <button key={f} type="button" onClick={() => toggleFeature(f)} className="btn btn-sm"
                          style={{ background: form.caracteristiques.includes(f) ? "#2563eb" : "#f1f5f9", color: form.caracteristiques.includes(f) ? "#fff" : "#475569", border: "none", borderRadius: 8, fontSize: "0.78rem", padding: "4px 10px" }}>
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="col-12">
                    <div className="form-check">
                      <input type="checkbox" name="disponible" id="modalDispo" className="form-check-input" checked={form.disponible} onChange={handleChange} />
                      <label className="form-check-label" htmlFor="modalDispo" style={{ fontSize: "0.85rem" }}>Disponible immédiatement</label>
                    </div>
                  </div>

                </div>

                {/* Footer */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20, paddingTop: 16, borderTop: "1px solid #e2e8f0" }}>
                  <button type="button" className="btn btn-outline-secondary btn-sm" onClick={closeModal}>Annuler</button>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={saving || uploading}>
                    {saving ? "Publication…" : "Publier le bien"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </Template>
  );
}
