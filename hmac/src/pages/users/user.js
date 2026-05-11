import axios from "../../contexts/api/axios";
import GetUserData from "../../contexts/api/udata";
import Header from "../../components/header/header";
import Sidebar from "../../components/sidebar/sidebar";
import Template from "../../components/template/template";
import DeleteModal from "../../components/modals/delete";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  BsFillTrashFill, BsPencilSquare, BsEye,
  BsPeopleFill, BsShieldFill, BsPersonFill, BsSearch, BsPlus,
} from "react-icons/bs";

const url_req = "utilisateur/";
const PER_PAGE = 8;
const COLORS = ["#2563eb", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4"];
const MOIS = ["","Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];

function fmtDate(dt) {
  if (!dt) return "—";
  const s = String(dt).replace(" ", "T");
  const d = new Date(s.includes("T") ? s : s + "T12:00:00");
  if (isNaN(d.getTime())) return "—";
  return `${String(d.getDate()).padStart(2, "0")} ${MOIS[d.getMonth() + 1]} ${d.getFullYear()}`;
}

function UserAvatar({ nom, prenom }) {
  const initials = `${(nom || "?")[0]}${(prenom || "?")[0]}`.toUpperCase();
  const bg = COLORS[(nom?.charCodeAt(0) || 0) % COLORS.length];
  return (
    <div style={{
      width: 34, height: 34, borderRadius: "50%", background: bg, color: "#fff",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: "0.75rem", fontWeight: 700, flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

export default function User() {
  const u_info = GetUserData();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState(null);

  useEffect(() => { fetchUsers(); }, []);

  function fetchUsers() {
    setLoading(true);
    axios.get(url_req, u_info.opts)
      .then(r => { if (r.status === 200) setUsers(r.data); else toast.warning("Accès refusé"); })
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }

  const filtered = users.filter(u =>
    !search || `${u.nom} ${u.prenom}`.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const page = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);
  const totalAdmins = users.filter(u => u.karazana == 1).length;
  const totalUsers  = users.filter(u => u.karazana != 1).length;

  return (
    <Template>
      <Header />
      <div className="container-fluid flex-grow-1">
        <div className="row g-0">
          <Sidebar />
          <main className="col-md-9 ms-sm-auto col-lg-10 px-md-4 main">

            <div className="page-header">
              <div>
                <h1 className="page-title"><BsPeopleFill /> Utilisateurs</h1>
                <p className="text-muted small mb-0">
                  {users.length} compte{users.length > 1 ? "s" : ""} enregistré{users.length > 1 ? "s" : ""}
                </p>
              </div>
              <div className="d-flex gap-2 align-items-center flex-wrap">
                <div className="input-group input-group-sm" style={{ width: 230 }}>
                  <span className="input-group-text bg-white border-end-0">
                    <BsSearch size={13} style={{ color: "#94a3b8" }} />
                  </span>
                  <input type="text" className="form-control border-start-0 ps-0"
                    placeholder="Rechercher un utilisateur…"
                    value={search}
                    onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                    style={{ fontSize: "0.82rem" }} />
                </div>
                <Link to="/newUser/" className="btn btn-primary btn-sm d-flex align-items-center gap-1">
                  <BsPlus size={16} /> Ajouter
                </Link>
              </div>
            </div>

            {/* Stat cards */}
            <div className="row g-3 mb-4">
              <div className="col-sm-4">
                <div className="stat-card">
                  <div className="stat-icon blue"><BsPeopleFill /></div>
                  <div className="stat-content">
                    <h3>{users.length}</h3>
                    <p>Total comptes</p>
                  </div>
                </div>
              </div>
              <div className="col-sm-4">
                <div className="stat-card">
                  <div className="stat-icon purple"><BsShieldFill /></div>
                  <div className="stat-content">
                    <h3>{totalAdmins}</h3>
                    <p>Administrateurs</p>
                  </div>
                </div>
              </div>
              <div className="col-sm-4">
                <div className="stat-card">
                  <div className="stat-icon slate"><BsPersonFill /></div>
                  <div className="stat-content">
                    <h3>{totalUsers}</h3>
                    <p>Utilisateurs</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="table-pro">
              {loading ? (
                <div className="text-center py-5 text-muted" style={{ fontSize: "0.85rem" }}>
                  Chargement…
                </div>
              ) : (
                <div className="tbl-scroll-wrap">
                <table className="table table-hover mb-0">
                  <thead>
                    <tr>
                      <th>Utilisateur</th>
                      <th>ID</th>
                      <th>Rôle</th>
                      <th>Créé le</th>
                      <th style={{ width: 130 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {page.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-4 text-muted" style={{ fontSize: "0.85rem" }}>
                          {search ? "Aucun résultat pour cette recherche" : "Aucun utilisateur"}
                        </td>
                      </tr>
                    ) : page.map(u => (
                      <tr key={u.idPS}>
                        <td title={`${u.nom} ${u.prenom}`}>
                          <div className="d-flex align-items-center gap-2">
                            <UserAvatar nom={u.nom || ""} prenom={u.prenom || ""} />
                            <span className="fw-semibold text-truncate" style={{ fontSize: "0.875rem" }}>
                              {u.nom} {u.prenom}
                            </span>
                          </div>
                        </td>
                        <td style={{ fontSize: "0.78rem", color: "#94a3b8" }}>#{u.idPS}</td>
                        <td>
                          {u.karazana == 1
                            ? <span style={{ background: "#eff6ff", color: "#2563eb", fontSize: "0.72rem", fontWeight: 600, padding: "3px 10px", borderRadius: 6 }}>
                                Admin
                              </span>
                            : <span style={{ background: "#f8fafc", color: "#475569", fontSize: "0.72rem", fontWeight: 600, padding: "3px 10px", borderRadius: 6 }}>
                                Utilisateur
                              </span>
                          }
                        </td>
                        <td style={{ fontSize: "0.78rem", color: "#64748b", whiteSpace: "nowrap" }}>
                          {fmtDate(u.created_at || u.createdAt || u.date_creation)}
                        </td>
                        <td>
                          <div className="d-flex gap-1 justify-content-end">
                            <button className="btn btn-outline-primary btn-sm" title="Voir"
                              onClick={() => navigate(`/aboutUser/${u.id}`, { state: { entity: u } })}>
                              <BsEye />
                            </button>
                            <button className="btn btn-outline-secondary btn-sm" title="Modifier"
                              onClick={() => navigate(`/editUser/${u.id}`, { state: { entity: u } })}>
                              <BsPencilSquare />
                            </button>
                            <button className="btn btn-outline-danger btn-sm" title="Supprimer"
                              onClick={() => { setSelectedEntity(u); setShowDeleteModal(true); }}>
                              <BsFillTrashFill />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="d-flex justify-content-end align-items-center gap-1 mt-3">
                <button className="btn btn-outline-secondary btn-sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}>‹</button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button key={i}
                    className={`btn btn-sm ${currentPage === i + 1 ? "btn-primary" : "btn-outline-secondary"}`}
                    onClick={() => setCurrentPage(i + 1)}>
                    {i + 1}
                  </button>
                ))}
                <button className="btn btn-outline-secondary btn-sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}>›</button>
              </div>
            )}

          </main>
        </div>
      </div>

      {selectedEntity && (
        <DeleteModal
          show={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={() => { setShowDeleteModal(false); fetchUsers(); }}
          entity={selectedEntity}
          entityName="utilisateur"
          auth={u_info.opts}
        />
      )}
    </Template>
  );
}
