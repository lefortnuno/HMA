import { useState, useEffect } from "react";
import axios from "../../contexts/api/axios";
import GetUserData from "../../contexts/api/udata";
import Template from "../../components/template/template";
import Header from "../../components/header/header";
import Sidebar from "../../components/sidebar/sidebar";
import { toast } from "react-toastify";
import { Link, useNavigate } from "react-router-dom";
import {
  BsImages,
  BsPlus,
  BsPencilSquare,
  BsFillTrashFill,
  BsEye,
  BsToggleOn,
  BsToggleOff,
} from "react-icons/bs";

export default function AdminVitrine() {
  const u_info = GetUserData();
  const navigate = useNavigate();
  const [biens, setBiens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toDelete, setToDelete] = useState(null);

  useEffect(() => {
    fetchBiens();
  }, []);

  function fetchBiens() {
    setLoading(true);
    axios
      .get("vitrine/biens", u_info.opts)
      .then((r) => setBiens(r.data || []))
      .catch(() => setBiens([]))
      .finally(() => setLoading(false));
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
      .then(() => {
        toast.success("Bien supprimé");
        fetchBiens();
        setToDelete(null);
      })
      .catch(() => toast.error("Erreur de suppression"));
  }

  const nbDispo = biens.filter((b) => b.disponible).length;

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
                  <BsImages /> Gestion des Biens
                </h1>
                <p className="text-muted small mb-0">
                  {biens.length} bien(s) — {nbDispo} disponible(s)
                </p>
              </div>
              <div className="d-flex gap-2">
                <a
                  href="/vitrine/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
                >
                  <BsEye /> Voir la vitrine
                </a>
                <Link
                  to="/vitrine/admin/new"
                  className="btn btn-primary btn-sm d-flex align-items-center gap-1"
                >
                  <BsPlus size={16} /> Ajouter un bien
                </Link>
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
                      <tr>
                        <td colSpan={7} className="text-center py-4 text-muted">Chargement...</td>
                      </tr>
                    ) : biens.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-5 text-muted">
                          Aucun bien publié —{" "}
                          <Link to="/vitrine/admin/new">Ajouter le premier bien</Link>
                        </td>
                      </tr>
                    ) : (
                      biens.map((b) => (
                        <tr key={b.id}>
                          <td>
                            {b.photos?.[0] ? (
                              <img
                                src={b.photos[0]}
                                alt=""
                                style={{ width: 52, height: 38, objectFit: "cover", borderRadius: 6 }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: 52, height: 38, background: "#f1f5f9",
                                  borderRadius: 6, display: "flex", alignItems: "center",
                                  justifyContent: "center", fontSize: "1.2rem",
                                }}
                              >
                                {b.type === "VILLA" ? "🏡" : "🏠"}
                              </div>
                            )}
                          </td>
                          <td>
                            <div className="fw-semibold" style={{ fontSize: "0.875rem" }}>{b.titre}</div>
                            {b.surface && <small className="text-muted">{b.surface} m²</small>}
                          </td>
                          <td>
                            <span
                              style={{
                                fontSize: "0.72rem", fontWeight: 700, padding: "2px 9px",
                                borderRadius: 20,
                                background: b.type === "VILLA" ? "#f5f3ff" : "#eff6ff",
                                color: b.type === "VILLA" ? "#6d28d9" : "#1d4ed8",
                              }}
                            >
                              {b.type}
                            </span>
                          </td>
                          <td className="fw-bold text-primary" style={{ fontSize: "0.875rem" }}>
                            {(b.prix || 0).toLocaleString()} Ar
                          </td>
                          <td style={{ fontSize: "0.875rem", color: "#64748b" }}>
                            {b.localisation || "—"}
                          </td>
                          <td>
                            <button
                              className="btn btn-sm p-0"
                              onClick={() => toggleDispo(b)}
                              title="Basculer disponibilité"
                              style={{ background: "none", border: "none" }}
                            >
                              {b.disponible ? (
                                <BsToggleOn size={24} color="#10b981" />
                              ) : (
                                <BsToggleOff size={24} color="#94a3b8" />
                              )}
                            </button>
                            <span
                              className="ms-1"
                              style={{
                                fontSize: "0.72rem",
                                color: b.disponible ? "#059669" : "#94a3b8",
                              }}
                            >
                              {b.disponible ? "Dispo" : "Indispo"}
                            </span>
                          </td>
                          <td>
                            <a
                              href={`/vitrine/bien/${b.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-outline-success btn-sm me-1"
                            >
                              <BsEye />
                            </a>
                            <button
                              className="btn btn-outline-primary btn-sm me-1"
                              onClick={() =>
                                navigate(`/vitrine/admin/edit/${b.id}`, { state: { bien: b } })
                              }
                            >
                              <BsPencilSquare />
                            </button>
                            <button
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => setToDelete(b)}
                            >
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

      {toDelete && (
        <div className="modal-overlay" onClick={() => setToDelete(null)}>
          <div className="modal-content-pro" style={{ maxWidth: 360 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-pro">
              <h6>Supprimer ce bien ?</h6>
              <button className="btn-close" onClick={() => setToDelete(null)} />
            </div>
            <div className="p-4">
              <p className="mb-4">
                Supprimer <strong>{toDelete.titre}</strong> de la vitrine ?
              </p>
              <div className="d-flex justify-content-end gap-2">
                <button className="btn btn-outline-secondary btn-sm" onClick={() => setToDelete(null)}>
                  Annuler
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(toDelete.id)}>
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Template>
  );
}
