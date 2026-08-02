import axios from "../../contexts/api/axios";
import GetUserData from "../../contexts/api/udata";
import Header from "../../components/header/header";
import Sidebar from "../../components/sidebar/sidebar";
import Template from "../../components/template/template";
import DeleteModal from "../../components/modals/delete";
import { SkTableRows } from "../../components/skeleton/skeleton";
import { copierEtOuvrirMessenger, extraireMessengerId, URL_APP } from "../../config/contact";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  BsFillTrashFill, BsPencilSquare, BsEye,
  BsPeopleFill, BsShieldFill, BsPersonFill, BsSearch, BsPlus,
  BsWhatsapp, BsSend, BsClipboard, BsKey, BsMessenger, BsHouseHeart,
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
  const [filtreRole, setFiltreRole] = useState("TOUS"); // "TOUS" | "0" | "1" | "2"
  const [acces, setAcces] = useState(null);      // { idPS, nom, code, tel }
  const [envoiEnCours, setEnvoiEnCours] = useState(null);

  // Les codes sont hachés en base : impossible de relire l'ancien.
  // On en génère donc un nouveau, à transmettre immédiatement.
  function envoyerAcces(u) {
    setEnvoiEnCours(u.id);
    axios
      .post(`utilisateur/${u.id}/acces`, {}, u_info.opts)
      .then((r) => {
        setAcces({ ...r.data, tel: u.tel || "", messengerId: u.messengerId || "" });
        fetchUsers(true);
      })
      .catch((e) => toast.error(e.response?.data?.message || "Erreur lors de la génération"))
      .finally(() => setEnvoiEnCours(null));
  }

  function messageAcces(a) {
    return (
      `Bonjour ${a.nom},\n\n` +
      `Voici vos accès à l'application de gestion de la Villa Kinya :\n` +
      `• Identifiant : ${a.idPS}\n` +
      `• Code : ${a.code}\n\n` +
      `À votre première connexion, vous devrez choisir votre propre code à 4 chiffres.\n` +
      `Vous y verrez vos loyers réglés et ceux qui restent dus.\n\n` +
      `Lien de l'application : ${URL_APP}\n\n` +
      `— Trofel`
    );
  }

  // Canaux d envoi réellement disponibles pour le compte affiché.
  const aMessenger = !!extraireMessengerId(acces?.messengerId);
  const aWhatsApp = !!String(acces?.tel || "").replace(/\s+/g, "");

  useEffect(() => { fetchUsers(); }, []);

  // silent = true : rafraichit en arriere-plan, sans skeleton plein ecran
  function fetchUsers(silent = false) {
    if (!silent) setLoading(true);
    axios.get(url_req, u_info.opts)
      .then(r => { if (r.status === 200) setUsers(r.data); else toast.warning("Accès refusé"); })
      .catch(() => setUsers([]))
      .finally(() => { if (!silent) setLoading(false); });
  }

  // Les cartes de statistiques servent aussi de filtre : "TOUS" ou un role.
  const filtered = users.filter(u => {
    if (filtreRole !== "TOUS" && String(u.karazana) !== String(filtreRole)) return false;
    return !search || `${u.nom} ${u.prenom}`.toLowerCase().includes(search.toLowerCase());
  });
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const page = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);
  // Les locataires (karazana 2) etaient comptes comme de simples utilisateurs.
  const totalAdmins     = users.filter(u => u.karazana == 1).length;
  const totalLocataires = users.filter(u => u.karazana == 2).length;
  const totalUsers      = users.filter(u => u.karazana != 1 && u.karazana != 2).length;

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
            {/* Chaque carte filtre la liste sur son rôle ; un second clic
                (ou "Total comptes") revient à l'affichage complet. */}
            <div className="row g-3 mb-4">
              {[
                { cle: "TOUS", n: users.length,      libelle: "Total comptes", icone: <BsPeopleFill />, couleur: "blue",   accent: "#2563eb" },
                { cle: "1",    n: totalAdmins,       libelle: `Administrateur${totalAdmins > 1 ? "s" : ""}`,  icone: <BsShieldFill />, couleur: "purple", accent: "#7c3aed" },
                { cle: "0",    n: totalUsers,        libelle: `Utilisateur${totalUsers > 1 ? "s" : ""}`,      icone: <BsPersonFill />, couleur: "slate",  accent: "#475569" },
                { cle: "2",    n: totalLocataires,   libelle: `Locataire${totalLocataires > 1 ? "s" : ""}`,   icone: <BsHouseHeart />, couleur: "green",  accent: "#16a34a" },
              ].map(({ cle, n, libelle, icone, couleur, accent }) => {
                const actif = filtreRole === cle;
                return (
                  <div className="col-6 col-lg-3" key={cle}>
                    <div
                      className="stat-card"
                      role="button"
                      tabIndex={0}
                      title={cle === "TOUS" ? "Afficher tous les comptes" : `N'afficher que : ${libelle}`}
                      onClick={() => { setFiltreRole(actif ? "TOUS" : cle); setCurrentPage(1); }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setFiltreRole(actif ? "TOUS" : cle);
                          setCurrentPage(1);
                        }
                      }}
                      style={{
                        cursor: "pointer",
                        border: `2px solid ${actif ? accent : "transparent"}`,
                        boxShadow: actif ? `0 4px 14px ${accent}33` : undefined,
                        transition: "all 0.15s ease",
                      }}
                    >
                      <div className={`stat-icon ${couleur}`}>{icone}</div>
                      <div className="stat-content">
                        <h3>{n}</h3>
                        <p>{libelle}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {filtreRole !== "TOUS" && (
              <div className="d-flex align-items-center gap-2 mb-3">
                <span className="text-muted" style={{ fontSize: "0.8rem" }}>
                  {filtered.length} compte{filtered.length > 1 ? "s" : ""} affiché{filtered.length > 1 ? "s" : ""}
                </span>
                <button
                  className="btn btn-sm btn-outline-secondary py-0 px-2"
                  style={{ fontSize: "0.75rem" }}
                  onClick={() => { setFiltreRole("TOUS"); setCurrentPage(1); }}
                >
                  ✕ Retirer le filtre
                </button>
              </div>
            )}

            {/* Table */}
            <div className="table-pro">
              {(
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
                    {loading ? (
                      <SkTableRows cols={5} rows={6} />
                    ) : page.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-4 text-muted" style={{ fontSize: "0.85rem" }}>
                          {search
                            ? "Aucun résultat pour cette recherche"
                            : filtreRole !== "TOUS"
                            ? "Aucun compte de ce type"
                            : "Aucun utilisateur"}
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
                          {/* Les badges se replient l'un sous l'autre si la colonne
                              est trop etroite, sans jamais couper un libelle. */}
                          <div className="d-flex flex-wrap align-items-center gap-1">
                            {u.karazana == 2
                              ? <span style={{ background: "#f0fdf4", color: "#16a34a", fontSize: "0.72rem", fontWeight: 600, padding: "3px 10px", borderRadius: 6, whiteSpace: "nowrap" }}>
                                  Locataire
                                </span>
                              : u.karazana == 1
                              ? <span style={{ background: "#eff6ff", color: "#2563eb", fontSize: "0.72rem", fontWeight: 600, padding: "3px 10px", borderRadius: 6, whiteSpace: "nowrap" }}>
                                  Admin
                                </span>
                              : <span style={{ background: "#f8fafc", color: "#475569", fontSize: "0.72rem", fontWeight: 600, padding: "3px 10px", borderRadius: 6, whiteSpace: "nowrap" }}>
                                  Utilisateur
                                </span>
                            }
                            {String(u.mdpTemporaire) === "1" && (
                              <span className="d-inline-flex align-items-center gap-1"
                                title="Code par défaut, pas encore changé"
                                style={{ background: "#fffbeb", color: "#92400e", fontSize: "0.68rem", fontWeight: 700, padding: "3px 8px", borderRadius: 6, whiteSpace: "nowrap" }}>
                                <BsKey size={10} /> code neuf
                              </span>
                            )}
                          </div>
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
                            {String(u.mdpTemporaire) === "1" && (
                              <button className="btn btn-sm d-inline-flex align-items-center gap-1 fw-semibold"
                                style={{ background: "#25D366", color: "#fff", fontSize: "0.72rem" }}
                                title="Générer et envoyer ses accès"
                                disabled={envoiEnCours === u.id}
                                onClick={() => envoyerAcces(u)}>
                                <BsSend size={11} /> {envoiEnCours === u.id ? "..." : "Accès"}
                              </button>
                            )}
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

      {/* ── Accès générés : à transmettre tout de suite ── */}
      {acces && (
        <div className="modal-overlay" onClick={() => setAcces(null)}>
          <div className="modal-content-pro" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-pro">
              <h6><BsKey className="me-2" />Accès de {acces.nom}</h6>
              <button className="btn-close" onClick={() => setAcces(null)} />
            </div>
            <div className="p-4">
              <div className="rounded-3 p-3 mb-3 text-center" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                <div className="text-muted" style={{ fontSize: "0.72rem" }}>Identifiant</div>
                <div className="fw-bold mb-2" style={{ fontSize: "1.05rem" }}>{acces.idPS}</div>
                <div className="text-muted" style={{ fontSize: "0.72rem" }}>Code à 4 chiffres</div>
                <div className="fw-bold" style={{ fontSize: "2rem", letterSpacing: "0.35em", color: "#2563eb" }}>
                  {acces.code}
                </div>
              </div>

              <div className="rounded-3 p-2 mb-3" style={{ background: "#fffbeb", border: "1px solid #fde68a" }}>
                <small style={{ fontSize: "0.75rem", color: "#92400e" }}>
                  Ce code n'est affiché qu'une seule fois. Transmettez-le maintenant.
                </small>
              </div>

              <div className="d-flex gap-2 flex-wrap justify-content-end">
                <button className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-1"
                  onClick={() => {
                    navigator.clipboard.writeText(messageAcces(acces));
                    toast.success("Message copié");
                  }}>
                  <BsClipboard /> Copier le message
                </button>
                {/* Sans identifiant Messenger / sans numero, le bouton n ouvrirait
                    qu une recherche inutile : on le laisse visible mais inactif. */}
                <button className="btn btn-sm d-inline-flex align-items-center gap-1 fw-semibold"
                  style={{
                    background: aMessenger ? "#0866FF" : "#e2e8f0",
                    color: aMessenger ? "#fff" : "#94a3b8",
                    cursor: aMessenger ? "pointer" : "not-allowed",
                  }}
                  disabled={!aMessenger}
                  title={aMessenger
                    ? "Copie le message et ouvre Messenger"
                    : "Aucun lien Messenger enregistré pour ce compte"}
                  onClick={() => {
                    copierEtOuvrirMessenger(messageAcces(acces), acces.nom, acces.messengerId);
                    toast.info("Message copié — collez-le dans la conversation");
                  }}>
                  <BsMessenger /> Messenger
                </button>
                {aWhatsApp ? (
                  <a className="btn btn-sm d-inline-flex align-items-center gap-1 fw-semibold"
                    style={{ background: "#25D366", color: "#fff" }}
                    href={`https://wa.me/${acces.tel.replace(/\s+/g, "").replace(/^\+/, "")}?text=${encodeURIComponent(messageAcces(acces))}`}
                    target="_blank" rel="noopener noreferrer">
                    <BsWhatsapp /> WhatsApp
                  </a>
                ) : (
                  <button className="btn btn-sm d-inline-flex align-items-center gap-1 fw-semibold"
                    style={{ background: "#e2e8f0", color: "#94a3b8", cursor: "not-allowed" }}
                    disabled
                    title="Aucun numéro de téléphone enregistré pour ce compte">
                    <BsWhatsapp /> WhatsApp
                  </button>
                )}
              </div>

              {(!aMessenger || !aWhatsApp) && (
                <small className="text-muted d-block mt-2" style={{ fontSize: "0.72rem" }}>
                  {!aMessenger && !aWhatsApp
                    ? "Ni numéro ni lien Messenger sur cette fiche : copiez le message pour le transmettre."
                    : !aMessenger
                    ? "Aucun lien Messenger sur cette fiche."
                    : "Aucun numéro de téléphone sur cette fiche."}
                </small>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedEntity && (
        <DeleteModal
          show={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={() => {
            setShowDeleteModal(false);
            setUsers((prev) => prev.filter((x) => x.id !== selectedEntity.id));
            fetchUsers(true);
          }}
          entity={selectedEntity}
          entityName="utilisateur"
          auth={u_info.opts}
        />
      )}
    </Template>
  );
}
