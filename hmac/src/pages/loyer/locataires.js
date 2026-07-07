import { useState, useEffect } from "react";
import axios from "../../contexts/api/axios";
import GetUserData from "../../contexts/api/udata";
import Template from "../../components/template/template";
import Header from "../../components/header/header";
import Sidebar from "../../components/sidebar/sidebar";
import { toast } from "react-toastify";
import { Link, useNavigate } from "react-router-dom";
import {
  BsPeople,
  BsPencilSquare,
  BsFillTrashFill,
  BsPlus,
  BsTelephone,
  BsChatDots,
  BsWhatsapp,
} from "react-icons/bs";
import { SkLocataires } from "../../components/skeleton/skeleton";
import ApartSelect, {
  useAppartements,
  getSelectedBienId,
  setSelectedBienId,
  KINYA,
} from "../../components/appart/apart.select";
import "./loyer.css";

const MONO_CHAMBRE = "Villa"; // slot unique d'un appart mono-locataire

const LOYER_RDC = 150000;
const LOYER_1ER = 200000;
const CHAMBRES_RDC = ["1","2","3","4","5","6","7","8","9","10"];
const CHAMBRES_1ER = ["I","II","III","IV","V","VI","VII","VIII","IX","X"];

const MOIS_FR = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
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

function initForm() {
  return {
    nom: "",
    prenom: "",
    etage: "RDC",
    chambre: "1",
    tel: "",
    email: "",
    dateEntree: new Date().toISOString().split("T")[0],
    actif: true,
    caution: 0,
  };
}

export default function Locataires() {
  const u_info = GetUserData();
  const navigate = useNavigate();
  const apparts = useAppartements();
  const [bienId, setBienId] = useState(getSelectedBienId());
  const current = apparts.find((a) => a.id === bienId) || KINYA;
  const mono = bienId !== 0; // appart mono-locataire (villa entiere)
  const monoLoyer = current.prix || 200000;
  const [locataires, setLocataires] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState(initForm());
  const [saving, setSaving] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState(initForm());
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => {
    fetchLocataires();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bienId]);

  // Liste des "slots" LIBRES. En mono : une seule unité "Villa".
  function freeChambresFor(etage) {
    const actifs = locataires.filter((l) => l.actif);
    if (mono) return actifs.length ? [] : [MONO_CHAMBRE];
    const occ = new Set(actifs.map((l) => `${l.chambre}|${l.etage}`));
    return (etage === "RDC" ? CHAMBRES_RDC : CHAMBRES_1ER).filter(
      (c) => !occ.has(`${c}|${etage}`)
    );
  }

  // silent = true : rafraichit sans afficher le skeleton
  // (utilise apres ajout/modif/suppression pour rester fluide).
  function fetchLocataires(silent = false) {
    if (!silent) setLoading(true);
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
      .then(() => {
        toast.success("Locataire supprimé");
        // Retrait immediat de la ligne, sans skeleton ni "rechargement".
        setLocataires((prev) => prev.filter((l) => l.id !== id));
        setShowDeleteModal(false);
        fetchLocataires(true);
      })
      .catch(() => toast.error("Erreur lors de la suppression"));
  }

  function handleAddChange(e) {
    const { name, value } = e.target;
    if (name === "etage") {
      const free = freeChambresFor(value);
      setAddForm((f) => ({ ...f, etage: value, chambre: free[0] || "" }));
    } else {
      setAddForm((f) => ({ ...f, [name]: value }));
    }
  }

  function handleAddSubmit(e) {
    e.preventDefault();
    if (!addForm.nom.trim()) return toast.warning("Le nom est requis");
    setSaving(true);
    const loyer = mono ? monoLoyer : addForm.etage === "RDC" ? LOYER_RDC : LOYER_1ER;
    axios
      .post("loyer/locataires", { ...addForm, loyer, bienId }, u_info.opts)
      .then(() => {
        toast.success("Locataire ajouté !");
        setAddForm(initForm());
        setShowAddModal(false);
        fetchLocataires(true);
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

  function handleAjouter() {
    // Ouvre le formulaire pré-réglé sur un slot libre (mono = unité "Villa").
    const etage = mono ? "RDC" : freeChambresFor("RDC").length ? "RDC" : "1ER";
    const free = freeChambresFor(etage);
    if (window.innerWidth >= 768) {
      setAddForm({ ...initForm(), etage, chambre: free[0] || "" });
      setShowAddModal(true);
    } else {
      navigate("/loyer/locataires/new");
    }
  }

  function handleEditClick(loc) {
    if (window.innerWidth >= 768) {
      setEditTarget(loc);
      setEditForm({
        nom: loc.nom || "",
        prenom: loc.prenom || "",
        etage: loc.etage || "RDC",
        chambre: loc.chambre || "1",
        tel: loc.tel || "",
        email: loc.email || "",
        dateEntree: loc.dateEntree ? loc.dateEntree.split("T")[0] : new Date().toISOString().split("T")[0],
        actif: loc.actif !== undefined ? loc.actif : true,
        caution: loc.caution || 0,
      });
      setShowEditModal(true);
    } else {
      navigate(`/loyer/locataires/edit/${loc.id}`, { state: { loc } });
    }
  }

  function handleEditChange(e) {
    const { name, value, type, checked } = e.target;
    if (name === "etage") {
      const free = freeChambresFor(value);
      setEditForm((f) => ({ ...f, etage: value, chambre: free[0] || "" }));
    } else {
      setEditForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
    }
  }

  // Chambres proposables en édition : les libres + celle actuellement occupée par ce locataire.
  function editChambreOptions() {
    const free = freeChambresFor(editForm.etage);
    const current = editTarget && editTarget.etage === editForm.etage ? editTarget.chambre : null;
    const all = current && !free.includes(current) ? [current, ...free] : free;
    return (editForm.etage === "RDC" ? CHAMBRES_RDC : CHAMBRES_1ER).filter((c) => all.includes(c));
  }

  function handleEditSubmit(e) {
    e.preventDefault();
    if (!editForm.nom.trim()) return toast.warning("Le nom est requis");
    const loyer = mono ? monoLoyer : editForm.etage === "RDC" ? LOYER_RDC : LOYER_1ER;
    setEditSaving(true);
    axios
      .put(`loyer/locataires/${editTarget.id}`, { ...editForm, loyer, bienId }, u_info.opts)
      .then(() => {
        toast.success("Locataire modifié !");
        setShowEditModal(false);
        fetchLocataires(true);
      })
      .catch((err) =>
        toast.error(
          err.response?.status === 409
            ? err.response.data.message || "Chambre déjà occupée"
            : "Erreur lors de la modification"
        )
      )
      .finally(() => setEditSaving(false));
  }

  const rdcList = locataires.filter((l) => l.etage === "RDC");
  const etageList = locataires.filter((l) => l.etage === "1ER");
  const chambres = freeChambresFor(addForm.etage); // uniquement les chambres libres
  const loyer = addForm.etage === "RDC" ? LOYER_RDC : LOYER_1ER;

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
                  className="btn btn-primary d-flex align-items-center gap-1"
                  onClick={handleAjouter}
                >
                  <BsPlus size={18} /> Ajouter
                </button>
              </div>
            </div>

            {loading ? (
              <SkLocataires />
            ) : locataires.length === 0 ? (
              <div className="card-pro text-center py-5">
                <p className="text-muted mb-3">Aucun locataire enregistré pour {current.nom}.</p>
                <button className="btn btn-primary" onClick={handleAjouter}>
                  <BsPlus /> Ajouter le premier locataire
                </button>
              </div>
            ) : mono ? (
              <LocataireTable list={locataires} label={`${current.nom} — Villa entière (${monoLoyer.toLocaleString()} Ar/mois)`} />
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
              <h6>Confirmer la suppression</h6>
              <button className="btn-close" onClick={() => setShowDeleteModal(false)} />
            </div>
            <div className="p-4">
              <p className="mb-4">
                Supprimer <strong>{toDelete.nom} {toDelete.prenom}</strong> (chambre {toDelete.chambre}) ?
                <br />
                <small className="text-danger">Cette action supprimera aussi tous ses paiements.</small>
              </p>
              <div className="d-flex justify-content-end gap-2">
                <button className="btn btn-outline-secondary btn-sm" onClick={() => setShowDeleteModal(false)}>
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

      {/* ── Modal édition (PC uniquement) ── */}
      {showEditModal && editTarget && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div
            className="modal-content-pro"
            style={{ maxWidth: 560 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header-pro">
              <h6><BsPencilSquare className="me-2" />Modifier — {editTarget.nom} {editTarget.prenom}</h6>
              <button className="btn-close" onClick={() => setShowEditModal(false)} />
            </div>
            <form onSubmit={handleEditSubmit} className="p-4">
              <div className="row g-3">
                <div className="col-sm-6">
                  <label className="form-label">Nom *</label>
                  <input type="text" name="nom" className="form-control form-control-sm"
                    value={editForm.nom} onChange={handleEditChange} placeholder="Nom de famille" />
                </div>
                <div className="col-sm-6">
                  <label className="form-label">Prénom</label>
                  <input type="text" name="prenom" className="form-control form-control-sm"
                    value={editForm.prenom} onChange={handleEditChange} placeholder="Prénom" />
                </div>
                {!mono && (
                  <>
                    <div className="col-sm-6">
                      <label className="form-label">Étage</label>
                      <select name="etage" className="form-select form-select-sm"
                        value={editForm.etage} onChange={handleEditChange}>
                        <option value="RDC">Rez-de-chaussée (150 000 Ar)</option>
                        <option value="1ER">1er Étage (200 000 Ar)</option>
                      </select>
                    </div>
                    <div className="col-sm-6">
                      <label className="form-label">Chambre</label>
                      <select name="chambre" className="form-select form-select-sm"
                        value={editForm.chambre} onChange={handleEditChange}>
                        {editChambreOptions().map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
                <div className="col-12">
                  <div className="p-2 rounded-3 d-flex align-items-center gap-2"
                    style={{ background: "#eff6ff", border: "1px solid #bfdbfe" }}>
                    <span className="fw-bold text-primary" style={{ fontSize: "0.85rem" }}>
                      {mono
                        ? `Loyer : ${monoLoyer.toLocaleString()} Ar — ${current.nom} (Villa entière)`
                        : `Loyer : ${(editForm.etage === "RDC" ? LOYER_RDC : LOYER_1ER).toLocaleString()} Ar — Chambre ${editForm.chambre} (${editForm.etage})`}
                    </span>
                  </div>
                </div>
                <div className="col-sm-6">
                  <label className="form-label">Téléphone</label>
                  <input type="tel" name="tel" className="form-control form-control-sm"
                    value={editForm.tel} onChange={handleEditChange} placeholder="+261 ..." />
                </div>
                <div className="col-sm-6">
                  <label className="form-label">Email</label>
                  <input type="email" name="email" className="form-control form-control-sm"
                    value={editForm.email} onChange={handleEditChange} placeholder="email@exemple.com" />
                </div>
                <div className="col-sm-6">
                  <label className="form-label">Date d'entrée</label>
                  <input type="date" name="dateEntree" className="form-control form-control-sm"
                    value={editForm.dateEntree} onChange={handleEditChange} />
                </div>
                <div className="col-sm-6">
                  <label className="form-label">Caution / dépôt de garantie (Ar)</label>
                  <input type="number" name="caution" min="0" className="form-control form-control-sm"
                    value={editForm.caution} onChange={handleEditChange} placeholder="0" />
                </div>
                <div className="col-sm-6 d-flex align-items-end pb-1">
                  <div className="form-check">
                    <input type="checkbox" name="actif" className="form-check-input" id="editActifCheck"
                      checked={editForm.actif} onChange={handleEditChange} />
                    <label className="form-check-label" htmlFor="editActifCheck">Locataire actif</label>
                  </div>
                </div>
              </div>
              <div className="d-flex justify-content-end gap-2 mt-4">
                <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setShowEditModal(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={editSaving}>
                  {editSaving ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal ajout (PC uniquement) ── */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div
            className="modal-content-pro"
            style={{ maxWidth: 560 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header-pro">
              <h6><BsPeople className="me-2" />Ajouter un locataire</h6>
              <button className="btn-close" onClick={() => setShowAddModal(false)} />
            </div>
            <form onSubmit={handleAddSubmit} className="p-4">
              <div className="row g-3">
                <div className="col-sm-6">
                  <label className="form-label">Nom *</label>
                  <input type="text" name="nom" className="form-control form-control-sm"
                    value={addForm.nom} onChange={handleAddChange} placeholder="Nom de famille" />
                </div>
                <div className="col-sm-6">
                  <label className="form-label">Prénom</label>
                  <input type="text" name="prenom" className="form-control form-control-sm"
                    value={addForm.prenom} onChange={handleAddChange} placeholder="Prénom" />
                </div>
                {!mono && (
                  <>
                    <div className="col-sm-6">
                      <label className="form-label">Étage</label>
                      <select name="etage" className="form-select form-select-sm"
                        value={addForm.etage} onChange={handleAddChange}>
                        <option value="RDC">Rez-de-chaussée (150 000 Ar)</option>
                        <option value="1ER">1er Étage (200 000 Ar)</option>
                      </select>
                    </div>
                    <div className="col-sm-6">
                      <label className="form-label">Chambre</label>
                      <select name="chambre" className="form-select form-select-sm"
                        value={addForm.chambre} onChange={handleAddChange}
                        disabled={chambres.length === 0}>
                        {chambres.length === 0 ? (
                          <option value="">Aucune chambre libre</option>
                        ) : (
                          chambres.map((c) => <option key={c} value={c}>{c}</option>)
                        )}
                      </select>
                    </div>
                  </>
                )}
                <div className="col-12">
                  <div className="p-2 rounded-3 d-flex align-items-center gap-2"
                    style={{ background: "#eff6ff", border: "1px solid #bfdbfe" }}>
                    <span className="fw-bold text-primary" style={{ fontSize: "0.85rem" }}>
                      {mono
                        ? `Loyer : ${monoLoyer.toLocaleString()} Ar — ${current.nom} (Villa entière)`
                        : `Loyer : ${loyer.toLocaleString()} Ar — Chambre ${addForm.chambre} (${addForm.etage})`}
                    </span>
                  </div>
                </div>
                <div className="col-sm-6">
                  <label className="form-label">Téléphone</label>
                  <input type="tel" name="tel" className="form-control form-control-sm"
                    value={addForm.tel} onChange={handleAddChange} placeholder="+261 ..." />
                </div>
                <div className="col-sm-6">
                  <label className="form-label">Email</label>
                  <input type="email" name="email" className="form-control form-control-sm"
                    value={addForm.email} onChange={handleAddChange} placeholder="email@exemple.com" />
                </div>
                <div className="col-sm-6">
                  <label className="form-label">Date d'entrée</label>
                  <input type="date" name="dateEntree" className="form-control form-control-sm"
                    value={addForm.dateEntree} onChange={handleAddChange} />
                </div>
                <div className="col-sm-6">
                  <label className="form-label">Caution / dépôt de garantie (Ar)</label>
                  <input type="number" name="caution" min="0" className="form-control form-control-sm"
                    value={addForm.caution} onChange={handleAddChange} placeholder="0" />
                </div>
              </div>
              <div className="d-flex justify-content-end gap-2 mt-4">
                <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setShowAddModal(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={saving || !addForm.chambre}>
                  {saving ? "Enregistrement..." : "Ajouter le locataire"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Template>
  );
}
