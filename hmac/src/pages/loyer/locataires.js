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
  BsEye,
} from "react-icons/bs";
import "./loyer.css";

const LOYER_RDC = 150000;
const LOYER_1ER = 200000;

export default function Locataires() {
  const u_info = GetUserData();
  const navigate = useNavigate();
  const [locataires, setLocataires] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  useEffect(() => {
    fetchLocataires();
  }, []);

  function fetchLocataires() {
    setLoading(true);
    axios
      .get("loyer/locataires", u_info.opts)
      .then((r) => setLocataires(r.data || []))
      .catch(() => setLocataires([]))
      .finally(() => setLoading(false));
  }

  function handleDelete(id) {
    axios
      .delete(`loyer/locataires/${id}`, u_info.opts)
      .then(() => {
        toast.success("Locataire supprimé");
        fetchLocataires();
        setShowModal(false);
      })
      .catch(() => toast.error("Erreur lors de la suppression"));
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
                <th style={{ fontSize: "0.73rem", color: "#64748b" }}>Nom & Prénom</th>
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
                  <td>
                    <div className="fw-semibold" style={{ fontSize: "0.875rem" }}>
                      {loc.nom} {loc.prenom}
                    </div>
                    <small className="text-muted">{loc.email}</small>
                  </td>
                  <td style={{ fontSize: "0.875rem" }}>{loc.tel || "—"}</td>
                  <td>
                    <span className="fw-bold text-primary" style={{ fontSize: "0.875rem" }}>
                      {(loc.loyer || 0).toLocaleString()} Ar
                    </span>
                  </td>
                  <td style={{ fontSize: "0.875rem" }}>{loc.dateEntree || "—"}</td>
                  <td>
                    <span className={loc.actif ? "badge-paye" : "badge-impaye"}>
                      {loc.actif ? "Actif" : "Inactif"}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn btn-outline-primary btn-sm me-1"
                      onClick={() => navigate(`/loyer/locataires/edit/${loc.id}`, { state: { loc } })}
                    >
                      <BsPencilSquare />
                    </button>
                    <button
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => { setToDelete(loc); setShowModal(true); }}
                    >
                      <BsFillTrashFill />
                    </button>
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
              <Link
                to="/loyer/locataires/new"
                className="btn btn-primary d-flex align-items-center gap-1"
              >
                <BsPlus size={18} /> Ajouter
              </Link>
            </div>

            {loading ? (
              <div className="text-center py-5 text-muted">Chargement...</div>
            ) : locataires.length === 0 ? (
              <div className="card-pro text-center py-5">
                <p className="text-muted mb-3">Aucun locataire enregistré.</p>
                <Link to="/loyer/locataires/new" className="btn btn-primary">
                  <BsPlus /> Ajouter le premier locataire
                </Link>
              </div>
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

      {showModal && toDelete && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content-pro" style={{ maxWidth: 360 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-pro">
              <h6>Confirmer la suppression</h6>
              <button className="btn-close" onClick={() => setShowModal(false)} />
            </div>
            <div className="p-4">
              <p className="mb-4">
                Supprimer <strong>{toDelete.nom} {toDelete.prenom}</strong> (chambre {toDelete.chambre}) ?
                <br />
                <small className="text-danger">Cette action supprimera aussi tous ses paiements.</small>
              </p>
              <div className="d-flex justify-content-end gap-2">
                <button className="btn btn-outline-secondary btn-sm" onClick={() => setShowModal(false)}>
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
