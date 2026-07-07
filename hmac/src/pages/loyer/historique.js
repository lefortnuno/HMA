import { useState, useEffect } from "react";
import axios from "../../contexts/api/axios";
import GetUserData from "../../contexts/api/udata";
import Template from "../../components/template/template";
import Header from "../../components/header/header";
import Sidebar from "../../components/sidebar/sidebar";
import { BsClockHistory, BsBoxArrowInRight, BsBoxArrowLeft, BsArrowLeftRight } from "react-icons/bs";
import { SkLocataires } from "../../components/skeleton/skeleton";
import ApartSelect, {
  useAppartements,
  getSelectedBienId,
  setSelectedBienId,
} from "../../components/appart/apart.select";
import "./loyer.css";

const MOIS_FR = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];

function formatDateTime(str) {
  if (!str) return "—";
  const d = new Date(str);
  if (isNaN(d)) return "—";
  return `${d.getDate()} ${MOIS_FR[d.getMonth()]} ${d.getFullYear()} à ${String(d.getHours()).padStart(2, "0")}h${String(d.getMinutes()).padStart(2, "0")}`;
}

const ACTIONS = {
  ENTREE: { label: "Entrée", color: "#16a34a", bg: "#f0fdf4", Icon: BsBoxArrowInRight },
  SORTIE: { label: "Sortie", color: "#dc2626", bg: "#fef2f2", Icon: BsBoxArrowLeft },
  MODIFICATION: { label: "Changement", color: "#d97706", bg: "#fffbeb", Icon: BsArrowLeftRight },
};

export default function Historique() {
  const u_info = GetUserData();
  const apparts = useAppartements();
  const [bienId, setBienId] = useState(getSelectedBienId());
  const [histo, setHisto] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axios
      .get(`loyer/historique?bienId=${bienId}`, u_info.opts)
      .then((r) => setHisto(r.data || []))
      .catch(() => setHisto([]))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bienId]);

  function changeAppart(id) {
    setBienId(id);
    setSelectedBienId(id);
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
                  <BsClockHistory /> Historique d'occupation
                </h1>
                <p className="text-muted small mb-0">
                  Qui a occupé quelle chambre, et quand
                </p>
              </div>
              <ApartSelect list={apparts} value={bienId} onChange={changeAppart} />
            </div>

            {loading ? (
              <SkLocataires />
            ) : histo.length === 0 ? (
              <div className="card-pro text-center py-5">
                <p className="text-muted mb-0">
                  Aucun mouvement enregistré pour l'instant.<br />
                  <small>Les entrées, sorties et changements de chambre apparaîtront ici automatiquement.</small>
                </p>
              </div>
            ) : (
              <div className="card-pro p-0 mb-4">
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead style={{ background: "#f8fafc" }}>
                      <tr>
                        <th style={{ fontSize: "0.73rem", color: "#64748b" }}>Date</th>
                        <th style={{ fontSize: "0.73rem", color: "#64748b" }}>Action</th>
                        <th style={{ fontSize: "0.73rem", color: "#64748b" }}>Locataire</th>
                        <th style={{ fontSize: "0.73rem", color: "#64748b" }}>Chambre</th>
                        <th style={{ fontSize: "0.73rem", color: "#64748b" }}>Détails</th>
                      </tr>
                    </thead>
                    <tbody>
                      {histo.map((h) => {
                        const a = ACTIONS[h.action] || ACTIONS.MODIFICATION;
                        return (
                          <tr key={h.id}>
                            <td style={{ fontSize: "0.83rem", whiteSpace: "nowrap" }}>
                              {formatDateTime(h.dateAction)}
                            </td>
                            <td>
                              <span
                                className="d-inline-flex align-items-center gap-1 rounded-3 px-2 py-1 fw-semibold"
                                style={{ background: a.bg, color: a.color, fontSize: "0.75rem" }}
                              >
                                <a.Icon size={12} /> {a.label}
                              </span>
                            </td>
                            <td className="fw-semibold" style={{ fontSize: "0.85rem" }}>
                              {h.nom} {h.prenom}
                            </td>
                            <td>
                              <span className={h.etage === "1ER" ? "badge-1er" : "badge-rdc"}>
                                {h.chambre}
                              </span>
                            </td>
                            <td className="text-muted" style={{ fontSize: "0.82rem" }}>
                              {h.details}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </Template>
  );
}
