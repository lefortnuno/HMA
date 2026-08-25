import { useState, useEffect } from "react";
import axios from "../../contexts/api/axios";
import GetUserData from "../../contexts/api/udata";
import Template from "../../components/template/template";
import Header from "../../components/header/header";
import Sidebar from "../../components/sidebar/sidebar";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import {
  BsPeople,
  BsPencilSquare,
  BsFillTrashFill,
  BsPersonPlusFill,
  BsTelephone,
  BsChatDots,
  BsWhatsapp,
  BsXLg,
} from "react-icons/bs";
import { SkLocataires } from "../../components/skeleton/skeleton";
import { Avatar } from "../../components/avatar/avatar";
import { libelleEcheance, estAvance } from "../../config/echeance";
import ApartSelect, {
  useAppartements,
  getSelectedBienId,
  setSelectedBienId,
  KINYA,
} from "../../components/appart/apart.select";
import "./loyer.css";
import { MOIS_COURT as MOIS_FR } from "../../config/dates";


const LOYER_RDC = 150000;
const LOYER_1ER = 200000;

function formatDate(str) {
  if (!str) return "—";
  const d = new Date(str);
  if (isNaN(d)) return "—";
  return `${d.getDate()} ${MOIS_FR[d.getMonth()]} ${d.getFullYear()}`;
}

function PhoneActions({ tel }) {
  const [open, setOpen] = useState(false);
  if (!tel) return <span className="text-muted">—</span>;

  const clean = tel.replace(/\s+/g, "");
  const waNum = clean.startsWith("+") ? clean.slice(1) : clean;

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        className="btn btn-link p-0 fw-semibold text-decoration-none"
        style={{ fontSize: "0.85rem", color: "#2563eb" }}
        onClick={() => setOpen((o) => !o)}
      >
        {tel}
      </button>
      {open && (
        <>
          <div
            style={{ position: "fixed", inset: 0, zIndex: 999 }}
            onClick={() => setOpen(false)}
          />
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 4px)",
              left: 0,
              zIndex: 1000,
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: 10,
              boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
              minWidth: 155,
              padding: "4px 0",
            }}
          >
            <a
              href={`tel:${clean}`}
              className="d-flex align-items-center gap-2 px-3 py-2 text-decoration-none text-dark"
              style={{ fontSize: "0.83rem" }}
              onClick={() => setOpen(false)}
            >
              <BsTelephone color="#2563eb" /> Appeler
            </a>
            <a
              href={`sms:${clean}`}
              className="d-flex align-items-center gap-2 px-3 py-2 text-decoration-none text-dark"
              style={{ fontSize: "0.83rem" }}
              onClick={() => setOpen(false)}
            >
              <BsChatDots color="#475569" /> SMS
            </a>
            <a
              href={`https://wa.me/${waNum}`}
              target="_blank"
              rel="noopener noreferrer"
              className="d-flex align-items-center gap-2 px-3 py-2 text-decoration-none"
              style={{ fontSize: "0.83rem", color: "#25D366" }}
              onClick={() => setOpen(false)}
            >
              <BsWhatsapp /> WhatsApp
            </a>
          </div>
        </>
      )}
    </div>
  );
}

export default function Locataires() {
  const u_info = GetUserData();
  const navigate = useNavigate();
  const [bienId, setBienId] = useState(getSelectedBienId());
  const apparts = useAppartements(bienId, setBienId);
  const current = apparts.find((a) => a.id === bienId) || KINYA;
  const mono = bienId !== 0; // appart mono-locataire (villa entiere)
  const monoLoyer = current.prix || 200000;
  const [locataires, setLocataires] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  useEffect(() => {
    fetchLocataires();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bienId]);

  // silent = true : rafraichit sans afficher le skeleton
  // (utilise apres ajout/modif/suppression pour rester fluide).
  function fetchLocataires(silent = false) {
    if (!silent && locataires.length === 0) setLoading(true);
    axios
      .get(`loyer/locataires?bienId=${bienId}`, u_info.opts)
      .then((r) => setLocataires(r.data || []))
      .catch(() => setLocataires([]))
      .finally(() => {
        if (!silent) setLoading(false);
      });
  }

  function changeAppart(id) {
    setBienId(id);
    setSelectedBienId(id);
  }

  function handleDelete(id) {
    axios
      .delete(`loyer/locataires/${id}`, u_info.opts)
      .then((res) => {
        if (res.status === 202) {
          toast.info(res.data.message || "Demande envoyée à l'admin pour validation.");
          setShowDeleteModal(false);
          return;
        }
        toast.success("Locataire supprimé");
        // Retrait immediat de la ligne, sans skeleton ni "rechargement".
        setLocataires((prev) => prev.filter((l) => l.id !== id));
        setShowDeleteModal(false);
        fetchLocataires(true);
      })
      .catch(() => toast.error("Erreur lors de la suppression"));
  }

  // Depart d'un locataire sans perdre son historique : on le rend inactif.
  // La chambre redevient libre et son compte de connexion est retire cote serveur.
  function handleArchiver(loc) {
    axios
      .put(`loyer/locataires/${loc.id}`, { ...loc, actif: false }, u_info.opts)
      .then((res) => {
        if (res.status === 202) {
          toast.info(res.data.message || "Demande envoyée à l'admin pour validation.");
        } else {
          toast.success(`${loc.nom} archivé, chambre ${loc.chambre} libérée`);
          // La fiche reste dans la liste, marquee "Inactif".
          setLocataires((prev) =>
            prev.map((l) => (l.id === loc.id ? { ...l, actif: 0 } : l))
          );
          fetchLocataires(true);
        }
        setShowDeleteModal(false);
      })
      .catch((err) =>
        toast.error(err.response?.data?.message || "Erreur lors de l'archivage")
      );
  }


  /**
   * Le formulaire vit dans une page dédiée, plus dans une fenêtre.
   *
   * Une quinzaine de champs à l'étroit dans une modale, c'était illisible ;
   * et le même formulaire existait en quatre exemplaires — deux modales et
   * deux pages — qui divergeaient à chaque nouveau champ. Une seule page pour
   * l'ajout, une seule pour la modification.
   */
  function handleAjouter() {
    navigate("/loyer/locataires/new");
  }

  function handleEditClick(loc) {
    navigate(`/loyer/locataires/edit/${loc.id}`, { state: { loc } });
  }

  const rdcList = locataires.filter((l) => l.etage === "RDC");
  const etageList = locataires.filter((l) => l.etage === "1ER");

  function LocataireTable({ list, label }) {
    if (list.length === 0) return null;
    return (
      <div className="card-pro p-0 mb-4">
        <div className="p-3 border-bottom">
          <h6 className="mb-0 fw-bold">{label}</h6>
        </div>
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead style={{ background: "#f8fafc" }}>
              <tr>
                <th style={{ fontSize: "0.73rem", color: "#64748b" }}>Chambre</th>
                <th style={{ fontSize: "0.73rem", color: "#64748b", width: "150px", maxWidth: "150px" }}>
                  Nom & Prénom
                </th>
                <th style={{ fontSize: "0.73rem", color: "#64748b" }}>Téléphone</th>
                <th style={{ fontSize: "0.73rem", color: "#64748b" }}>Loyer</th>
                <th style={{ fontSize: "0.73rem", color: "#64748b" }}>Date entrée</th>
                <th style={{ fontSize: "0.73rem", color: "#64748b" }}>Paiement habituel</th>
                <th style={{ fontSize: "0.73rem", color: "#64748b" }}>Règlement</th>
                <th style={{ fontSize: "0.73rem", color: "#64748b" }}>JIRAMA</th>
                <th style={{ fontSize: "0.73rem", color: "#64748b" }}>Statut</th>
                <th style={{ fontSize: "0.73rem", color: "#64748b" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((loc) => (
                <tr key={loc.id}>
                  <td>
                    <span className={loc.etage === "RDC" ? "badge-rdc" : "badge-1er"}>
                      {loc.chambre}
                    </span>
                  </td>
                  <td style={{ width: "150px", maxWidth: "150px" }}>
                    <div className="d-flex align-items-center gap-2">
                    <Avatar photo={loc.photo} nom={`${loc.nom} ${loc.prenom || ""}`} size={32} />
                    <div style={{ minWidth: 0 }}>
                    <div
                      className="fw-semibold"
                      style={{ fontSize: "0.875rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                      title={`${loc.nom} ${loc.prenom}`}
                    >
                      {loc.nom} {loc.prenom}
                    </div>
                    <small
                      className="text-muted"
                      style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}
                      title={loc.email}
                    >
                      {loc.email}
                    </small>
                    </div>
                    </div>
                  </td>
                  <td>
                    <PhoneActions tel={loc.tel} />
                  </td>
                  <td>
                    <span className="fw-bold text-primary" style={{ fontSize: "0.875rem" }}>
                      {(loc.loyer || 0).toLocaleString()} Ar
                    </span>
                  </td>
                  <td style={{ fontSize: "0.875rem" }}>{formatDate(loc.dateEntree)}</td>
                  <td title={libelleEcheance(loc)}>
                    {loc.jourPaiement ? (
                      <span
                        className="rounded-pill px-2 fw-semibold"
                        style={{ background: "#eff6ff", color: "#2563eb", fontSize: "0.72rem", whiteSpace: "nowrap" }}
                      >
                        le {loc.jourPaiement} du mois
                      </span>
                    ) : (
                      <span className="text-muted" style={{ fontSize: "0.78rem" }}>
                        non défini
                      </span>
                    )}
                  </td>
                  {/* Le sens du règlement change le mois réellement dû. */}
                  <td title={libelleEcheance(loc)}>
                    <span
                      className="rounded-pill px-2 fw-semibold"
                      style={
                        estAvance(loc)
                          ? { background: "#f0fdf4", color: "#16a34a", fontSize: "0.72rem", whiteSpace: "nowrap" }
                          : { background: "#fff7ed", color: "#c2410c", fontSize: "0.72rem", whiteSpace: "nowrap" }
                      }
                    >
                      {estAvance(loc) ? "Avant conso." : "Après conso."}
                    </span>
                  </td>
                  {/* Eau & électricité : hors bail, au forfait, ou au compteur. */}
                  <td>
                    {loc.jiramaNonSoumis ? (
                      <span
                        className="rounded-pill px-2 fw-semibold"
                        title="Son bail ne comprend ni eau ni électricité"
                        style={{ background: "#f1f5f9", color: "#64748b", fontSize: "0.72rem", whiteSpace: "nowrap" }}
                      >
                        Non soumis
                      </span>
                    ) : loc.jiramaForfait > 0 ? (
                      <span
                        className="rounded-pill px-2 fw-semibold"
                        title={`Forfait mensuel de ${Number(loc.jiramaForfait).toLocaleString()} Ar ; le relevé ne prime que s'il dépasse ce montant`}
                        style={{ background: "#fffbeb", color: "#b45309", fontSize: "0.72rem", whiteSpace: "nowrap" }}
                      >
                        Forfait {(loc.jiramaForfait / 1000).toFixed(0)}k
                      </span>
                    ) : (
                      <span
                        className="text-muted"
                        title="Facturé selon le relevé de son compteur"
                        style={{ fontSize: "0.78rem" }}
                      >
                        Au compteur
                      </span>
                    )}
                  </td>
                  <td>
                    <span className={loc.actif ? "badge-paye" : "badge-impaye"}>
                      {loc.actif ? "Actif" : "Inactif"}
                    </span>
                  </td>
                  <td>
                    <div className="d-flex gap-1">
                      <button
                        className="btn-action btn-action-edit"
                        title={`Modifier ${loc.nom}`}
                        aria-label={`Modifier ${loc.nom}`}
                        onClick={() => handleEditClick(loc)}
                      >
                        <BsPencilSquare />
                      </button>
                      <button
                        className="btn-action btn-action-delete"
                        title={`Supprimer ${loc.nom}`}
                        aria-label={`Supprimer ${loc.nom}`}
                        onClick={() => { setToDelete(loc); setShowDeleteModal(true); }}
                      >
                        <BsFillTrashFill />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
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
                  <BsPeople /> Locataires
                </h1>
                <p className="text-muted small mb-0">
                  {locataires.length} locataire(s) enregistré(s)
                </p>
              </div>
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <ApartSelect list={apparts} value={bienId} onChange={changeAppart} />
                <button
                  className="btn btn-success d-flex align-items-center gap-1"
                  onClick={handleAjouter}
                >
                  <BsPersonPlusFill size={16} /> Ajouter un locataire
                </button>
              </div>
            </div>

            {loading ? (
              <SkLocataires />
            ) : locataires.length === 0 ? (
              <div className="card-pro text-center py-5">
                <p className="text-muted mb-3">Aucun locataire enregistré pour {current.nom}.</p>
                <button className="btn btn-success" onClick={handleAjouter}>
                  <BsPersonPlusFill /> Ajouter le premier locataire
                </button>
              </div>
            ) : mono ? (
              <LocataireTable list={locataires} label={`${current.nom} (Villa entière, ${monoLoyer.toLocaleString()} Ar/mois)`} />
            ) : (
              <>
                <LocataireTable
                  list={rdcList}
                  label={`Rez-de-chaussée (${LOYER_RDC.toLocaleString()} Ar/mois)`}
                />
                <LocataireTable
                  list={etageList}
                  label={`1er Étage (${LOYER_1ER.toLocaleString()} Ar/mois)`}
                />
              </>
            )}
          </main>
        </div>
      </div>

      {/* ── Modal suppression ── */}
      {showDeleteModal && toDelete && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div
            className="modal-content-pro"
            style={{ maxWidth: 360 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header-pro">
              <h6>Départ de {toDelete.nom} {toDelete.prenom}</h6>
              <button className="btn-close" onClick={() => setShowDeleteModal(false)} />
            </div>
            <div className="p-4">
              <p className="mb-3" style={{ fontSize: "0.9rem" }}>
                Chambre <strong>{toDelete.chambre}</strong>, que souhaitez-vous faire ?
              </p>

              {/* Option recommandee : on garde la trace du passage du locataire. */}
              <div
                className="rounded-3 p-3 mb-3"
                style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}
              >
                <div className="fw-bold mb-1" style={{ color: "#15803d", fontSize: "0.87rem" }}>
                  Archiver le locataire <span className="ms-1" style={{ fontWeight: 500 }}>(recommandé)</span>
                </div>
                <small className="d-block mb-3" style={{ color: "#166534", fontSize: "0.78rem" }}>
                  La chambre est libérée et son accès à l'application est retiré, mais sa
                  fiche et l'historique de ses paiements sont conservés.
                </small>
                <button
                  className="btn btn-sm w-100 fw-semibold"
                  style={{ background: "#16a34a", color: "#fff" }}
                  onClick={() => handleArchiver(toDelete)}
                >
                  Archiver, libérer la chambre {toDelete.chambre}
                </button>
              </div>

              <div className="rounded-3 p-3" style={{ background: "#fef2f2", border: "1px solid #fecaca" }}>
                <div className="fw-bold mb-1" style={{ color: "#b91c1c", fontSize: "0.87rem" }}>
                  Supprimer définitivement
                </div>
                <small className="d-block mb-3" style={{ color: "#991b1b", fontSize: "0.78rem" }}>
                  Efface la fiche, <strong>tout l'historique de ses paiements</strong> et son
                  compte de connexion. Irréversible.
                </small>
                <button
                  className="btn btn-outline-danger btn-sm w-100"
                  onClick={() => handleDelete(toDelete.id)}
                >
                  Supprimer définitivement
                </button>
              </div>

              <div className="d-flex justify-content-end mt-3">
                <button className="btn btn-outline-danger btn-sm d-inline-flex align-items-center gap-1" onClick={() => setShowDeleteModal(false)}>
                  <BsXLg /> Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </Template>
  );
}
