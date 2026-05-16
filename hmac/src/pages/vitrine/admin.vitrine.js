import { useState, useEffect, useMemo } from "react";
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
  BsHouseDoor, BsBuilding, BsCheckCircle, BsXCircle,
  BsSearch, BsGeoAlt,
} from "react-icons/bs";
import "./vitrine.css";

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
  const [filtre, setFiltre]         = useState({ type: "", dispo: "", search: "" });

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

  // ─── Stats ──────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total   = biens.length;
    const dispo   = biens.filter(b => b.disponible).length;
    const indispo = total - dispo;
    const villas  = biens.filter(b => b.type === "VILLA").length;
    const chambres = biens.filter(b => b.type === "CHAMBRE").length;
    return { total, dispo, indispo, villas, chambres };
  }, [biens]);

  // ─── Biens filtrés ──────────────────────────────────────────
  const biensFiltres = useMemo(() => {
    return biens.filter(b => {
      if (filtre.type && b.type !== filtre.type) return false;
      if (filtre.dispo === "dispo" && !b.disponible) return false;
      if (filtre.dispo === "indispo" && b.disponible) return false;
      if (filtre.search) {
        const s = filtre.search.toLowerCase();
        const inTitle = b.titre?.toLowerCase().includes(s);
        const inLoc   = b.localisation?.toLowerCase().includes(s);
        if (!inTitle && !inLoc) return false;
      }
      return true;
    });
  }, [biens, filtre]);

  return (
    <Template>
      <Header />
      <div className="container-fluid flex-grow-1">
        <div className="row g-0">
          <Sidebar />
          <main className="col-md-9 ms-sm-auto col-lg-10 px-md-4 main">

            {/* ─── Page header ─────────────────────────────────── */}
            <div className="page-header">
              <div>
                <h1 className="page-title"><BsImages /> Mes Biens</h1>
                <p className="text-muted small mb-0">
                  Gérer la vitrine de vos chambres et villas
                </p>
              </div>
              <div className="d-flex gap-2 flex-wrap">
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

            {/* ─── Stat cards ──────────────────────────────────── */}
            <div className="row g-3 mb-4">
              <div className="col-6 col-lg-3">
                <div className="stat-card">
                  <div className="stat-icon blue"><BsImages /></div>
                  <div className="stat-content">
                    <h3>{stats.total}</h3>
                    <p>Total biens</p>
                  </div>
                </div>
              </div>
              <div className="col-6 col-lg-3">
                <div className="stat-card">
                  <div className="stat-icon green"><BsCheckCircle /></div>
                  <div className="stat-content">
                    <h3>{stats.dispo}</h3>
                    <p>Disponibles</p>
                  </div>
                </div>
              </div>
              <div className="col-6 col-lg-3">
                <div className="stat-card">
                  <div className="stat-icon purple"><BsBuilding /></div>
                  <div className="stat-content">
                    <h3>{stats.villas}</h3>
                    <p>Villas</p>
                  </div>
                </div>
              </div>
              <div className="col-6 col-lg-3">
                <div className="stat-card">
                  <div className="stat-icon amber"><BsHouseDoor /></div>
                  <div className="stat-content">
                    <h3>{stats.chambres}</h3>
                    <p>Chambres</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ─── Filtres ─────────────────────────────────────── */}
            <div className="card-pro mb-3" style={{ padding: "12px 16px" }}>
              <div className="d-flex gap-2 align-items-center flex-wrap">
                <div style={{ position: "relative", flex: "1 1 220px", minWidth: 180 }}>
                  <BsSearch style={{
                    position: "absolute", left: 10, top: "50%",
                    transform: "translateY(-50%)", color: "#94a3b8",
                  }} />
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Rechercher un bien…"
                    value={filtre.search}
                    onChange={(e) => setFiltre({ ...filtre, search: e.target.value })}
                    style={{ paddingLeft: 32 }}
                  />
                </div>
                <select
                  className="form-select form-select-sm"
                  style={{ width: "auto", minWidth: 130 }}
                  value={filtre.type}
                  onChange={(e) => setFiltre({ ...filtre, type: e.target.value })}
                >
                  <option value="">Tous les types</option>
                  <option value="CHAMBRE">Chambre</option>
                  <option value="VILLA">Villa</option>
                </select>
                <select
                  className="form-select form-select-sm"
                  style={{ width: "auto", minWidth: 150 }}
                  value={filtre.dispo}
                  onChange={(e) => setFiltre({ ...filtre, dispo: e.target.value })}
                >
                  <option value="">Toutes dispos</option>
                  <option value="dispo">Disponible</option>
                  <option value="indispo">Indisponible</option>
                </select>
                <span className="text-muted small ms-auto">
                  {biensFiltres.length} / {stats.total} bien(s)
                </span>
              </div>
            </div>

            {/* ─── Table des biens ─────────────────────────────── */}
            <div className="table-pro">
              <div className="table-responsive">
                <table className="table mb-0">
                  <thead>
                    <tr>
                      <th>Photo</th>
                      <th>Titre</th>
                      <th>Type</th>
                      <th>Prix</th>
                      <th>Localisation</th>
                      <th>Disponibilité</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={7} className="text-center py-4 text-muted">Chargement…</td></tr>
                    ) : biensFiltres.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-5 text-muted">
                          {biens.length === 0 ? (
                            <>
                              Aucun bien publié —{" "}
                              {isMobile
                                ? <Link to="/vitrine/admin/new">Ajouter le premier bien</Link>
                                : <button className="btn btn-link p-0" onClick={openModal}>Ajouter le premier bien</button>
                              }
                            </>
                          ) : (
                            <>Aucun bien ne correspond aux filtres.</>
                          )}
                        </td>
                      </tr>
                    ) : biensFiltres.map(b => (
                      <tr key={b.id}>
                        <td>
                          {b.photos?.[0] ? (
                            <img src={imgSrc(b.photos[0])} alt=""
                              style={{ width: 56, height: 42, objectFit: "cover", borderRadius: 8 }} />
                          ) : (
                            <div style={{
                              width: 56, height: 42, background: "#f1f5f9",
                              borderRadius: 8, display: "flex", alignItems: "center",
                              justifyContent: "center", fontSize: "1.3rem"
                            }}>
                              {b.type === "VILLA" ? "🏡" : "🏠"}
                            </div>
                          )}
                        </td>
                        <td>
                          <div className="fw-semibold" style={{ fontSize: "0.875rem" }}>{b.titre}</div>
                          {b.surface ? <small className="text-muted">{b.surface} m²</small> : null}
                        </td>
                        <td>
                          <span className={`badge-type ${b.type?.toLowerCase()}`}>
                            {b.type === "VILLA" ? "Villa" : "Chambre"}
                          </span>
                        </td>
                        <td>
                          <span className="fw-bold text-primary" style={{ fontSize: "0.875rem", whiteSpace: "nowrap" }}>
                            {(b.prix || 0).toLocaleString()} Ar
                          </span>
                        </td>
                        <td style={{ fontSize: "0.85rem", color: "#475569" }}>
                          {b.localisation ? (
                            <span className="d-inline-flex align-items-center gap-1">
                              <BsGeoAlt size={12} color="#94a3b8" /> {b.localisation}
                            </span>
                          ) : "—"}
                        </td>
                        <td>
                          <button
                            className="btn btn-sm p-0 d-inline-flex align-items-center gap-1"
                            onClick={() => toggleDispo(b)}
                            title="Basculer la disponibilité"
                            style={{ background: "none", border: "none" }}
                          >
                            {b.disponible
                              ? <BsToggleOn size={26} color="#10b981" />
                              : <BsToggleOff size={26} color="#94a3b8" />}
                            <span className={b.disponible ? "badge-paye" : "badge-impaye"} style={{ marginLeft: 4 }}>
                              {b.disponible ? "Dispo" : "Indispo"}
                            </span>
                          </button>
                        </td>
                        <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                          <a href={`/vitrine/bien/${b.id}`} target="_blank" rel="noopener noreferrer"
                            className="btn btn-outline-success btn-sm me-1" title="Voir sur la vitrine">
                            <BsEye />
                          </a>
                          <button className="btn btn-outline-primary btn-sm me-1" title="Modifier"
                            onClick={() => navigate(`/vitrine/admin/edit/${b.id}`, { state: { bien: b } })}>
                            <BsPencilSquare />
                          </button>
                          <button className="btn btn-outline-danger btn-sm" title="Supprimer"
                            onClick={() => setToDelete(b)}>
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
          <div className="modal-content-pro" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header-pro">
              <h6><BsFillTrashFill className="me-2 text-danger" />Supprimer ce bien ?</h6>
              <button className="btn-close" onClick={() => setToDelete(null)} />
            </div>
            <div className="p-4">
              <p className="mb-4">
                Supprimer <strong>{toDelete.titre}</strong> de la vitrine ?
                <br />
                <small className="text-danger">Cette action est définitive.</small>
              </p>
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
            className="modal-content-pro"
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: 680, maxHeight: "90vh", display: "flex", flexDirection: "column" }}
          >
            <div className="modal-header-pro">
              <h6><BsImages className="me-2" />Publier un nouveau bien</h6>
              <button className="btn-close" onClick={closeModal} />
            </div>

            {/* Scrollable body */}
            <div style={{ overflowY: "auto", padding: "20px", flex: 1 }}>
              <form onSubmit={handleSubmit}>
                <div className="row g-3">

                  <div className="col-12">
                    <label className="form-label">Titre *</label>
                    <input type="text" name="titre" className="form-control form-control-sm"
                      value={form.titre} onChange={handleChange}
                      placeholder="Ex: Villa F5 à Ambohimangakely" />
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
                    <input type="number" name="prix" className="form-control form-control-sm"
                      value={form.prix} onChange={handleChange} min={0} placeholder="0" />
                  </div>
                  <div className="col-sm-4">
                    <label className="form-label">Surface (m²)</label>
                    <input type="number" name="surface" className="form-control form-control-sm"
                      value={form.surface} onChange={handleChange} min={0} placeholder="0" />
                  </div>

                  <div className="col-sm-6">
                    <label className="form-label">Nb chambres</label>
                    <input type="number" name="nbChambres" className="form-control form-control-sm"
                      value={form.nbChambres} onChange={handleChange} min={0} placeholder="0" />
                  </div>
                  <div className="col-sm-6">
                    <label className="form-label">Nb pièces</label>
                    <input type="number" name="nbPieces" className="form-control form-control-sm"
                      value={form.nbPieces} onChange={handleChange} min={0} placeholder="0" />
                  </div>

                  <div className="col-12">
                    <label className="form-label">Localisation</label>
                    <input type="text" name="localisation" className="form-control form-control-sm"
                      value={form.localisation} onChange={handleChange}
                      placeholder="Ex: Ambohimangakely, Antananarivo" />
                  </div>

                  <div className="col-12">
                    <label className="form-label">Description</label>
                    <textarea name="description" className="form-control form-control-sm" rows={2}
                      value={form.description} onChange={handleChange} placeholder="Décrivez le bien…" />
                  </div>

                  {/* Photo upload */}
                  <div className="col-12">
                    <label className="form-label">Photos</label>
                    <div>
                      <label className="btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-1" style={{ cursor: "pointer" }}>
                        <BsCloudUpload />
                        {uploading ? "Upload en cours…" : "Choisir des photos"}
                        <input type="file" accept="image/*" multiple hidden onChange={handleFileUpload} disabled={uploading} />
                      </label>
                    </div>
                    {form.photos.length > 0 && (
                      <div className="d-flex flex-wrap gap-2 mt-2">
                        {form.photos.map((p, i) => (
                          <div key={i} style={{ position: "relative" }}>
                            <img src={imgSrc(p)} alt=""
                              style={{ width: 72, height: 54, objectFit: "cover", borderRadius: 8, border: "1px solid #e2e8f0" }} />
                            <button type="button" onClick={() => removePhoto(i)}
                              style={{
                                position: "absolute", top: -6, right: -6,
                                background: "#ef4444", color: "#fff", border: "none",
                                borderRadius: "50%", width: 20, height: 20, fontSize: "0.7rem",
                                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
                              }}>
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
                          style={{
                            background: form.caracteristiques.includes(f) ? "#2563eb" : "#f1f5f9",
                            color: form.caracteristiques.includes(f) ? "#fff" : "#475569",
                            border: "none", borderRadius: 8, fontSize: "0.78rem", padding: "5px 12px",
                            transition: "background 0.15s",
                          }}>
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="col-12">
                    <div className="form-check">
                      <input type="checkbox" name="disponible" id="modalDispo" className="form-check-input"
                        checked={form.disponible} onChange={handleChange} />
                      <label className="form-check-label" htmlFor="modalDispo" style={{ fontSize: "0.85rem" }}>
                        Disponible immédiatement
                      </label>
                    </div>
                  </div>

                </div>

                <div style={{
                  display: "flex", justifyContent: "flex-end", gap: 8,
                  marginTop: 20, paddingTop: 16, borderTop: "1px solid #e2e8f0"
                }}>
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
