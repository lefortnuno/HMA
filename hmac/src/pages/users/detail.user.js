import axios from "../../contexts/api/axios";
import GetUserData from "../../contexts/api/udata";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import Header from "../../components/header/header";
import Sidebar from "../../components/sidebar/sidebar";
import Template from "../../components/template/template";

import hma from "../../assets/images/hma256.png";
import Loading from "../../components/loading/loading";

import {
  BsArrowLeft,
  BsPeopleFill,
  BsShieldFill,
  BsPersonFill,
  BsPencilSquare,
} from "react-icons/bs";

const COLORS = [
  "#2563eb",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ef4444",
  "#06b6d4",
];

export default function UserDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const u_info = GetUserData();
  const [user, setUser] = useState(null);
  const [details, setDetails] = useState(null);

  useEffect(() => {
    axios
      .get(`utilisateur/${id}`, u_info.opts)
      .then((r) => {
        if (r.status === 200) setUser(r.data[0]);
      })
      .catch(() => toast.warning("Détails non disponibles."));
  }, []);

  const nom = user?.nom || "";
  const prenom = user?.prenom || "";
  const initials = `${(nom || "?")[0]}${(prenom || "?")[0]}`.toUpperCase();
  const color = COLORS[(nom.charCodeAt(0) || 0) % COLORS.length];
  const isAdmin = user?.karazana == 1;
  const uid = user?.id || user?.idPS;

  const fields = [
    { label: "Nom", value: nom },
    { label: "Prénom", value: prenom },
    { label: "Rôle", value: isAdmin ? "Administrateur" : "Utilisateur" },
    { label: "Identifiant", value: uid ? `#${uid}` : "—" },
  ];

  const onClose = () => {
    navigate("/users/");
  };

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
                  <BsPeopleFill /> Détail utilisateur
                </h1>
                <p className="text-muted small mb-0">Informations du compte</p>
              </div>
              <div className="d-flex gap-2">
                {user && (
                  <button
                    className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1"
                    onClick={() => navigate(`/editUser/${uid}`)}
                  >
                    <BsPencilSquare /> Modifier
                  </button>
                )}
                <button
                  className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
                  onClick={() => navigate("/users/")}
                >
                  <BsArrowLeft /> Retour
                </button>
              </div>
            </div>

            {!user ? (
              <div
                className="card-pro text-center py-5 text-muted"
                style={{ fontSize: "0.85rem" }}
              >
                <main className="">
                  <div className="mt-2">
                    <div className="row">
                      <div className="col-md-4">
                        <div className="u-img">
                          <img src={hma} alt="pdp" />
                        </div>
                      </div>
                      <div className="col-md-8">
                        {!details ? (
                          <Loading />
                        ) : (
                          <div>
                            <p>
                              <b>- </b>
                              Le produit numéroté <b>N°{details.id}</b>, nommé{" "}
                              <b>{details.snom}</b>, est proposé à un prix
                              unitaire de <b>{details.prix}</b>dhs (en{" "}
                              <b>{details.fandrefesana}</b>). Vous pouvez le
                              trouver au lieu suivant: "
                              <b>{details.fandrefesana}</b>"!
                            </p>
                            <p>
                              <b>- </b>
                              <b>{details.hk == 1 ? "Gain" : "Dépense"}</b>{" "}
                              d'argent pour{" "}
                              <b>
                                {details.mnom} {details.prenom}
                              </b>{" "}
                              réalisé le <b>{details.date}</b> pour une quantité
                              de <b>{details.qte}</b>, soit un montant total de{" "}
                              <b>{details.montant}</b>dhs, lié à un service de
                              type{" "}
                              <b>
                                {details.sk == 1 ? "Intellectuel" : "Matériel"}
                              </b>
                              .
                            </p>
                            <p>
                              <b>- Commentaire : </b>
                              {details.coms !== ""
                                ? details.coms
                                : "Aucun commentaire"}
                              .
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={onClose}
                      className="retourBtn btn btn-primary"
                    >
                      Retour
                    </button>
                  </div>
                  {/* -------------------------- FIN -------------------------- */}
                </main>
              </div>
            ) : (
              <div className="row g-3">
                {/* Avatar card */}
                <div className="col-md-4">
                  <div
                    className="card-pro text-center"
                    style={{ padding: "32px 24px" }}
                  >
                    <div
                      style={{
                        width: 88,
                        height: 88,
                        borderRadius: "50%",
                        background: color,
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "2rem",
                        fontWeight: 700,
                        margin: "0 auto 20px",
                        boxShadow: `0 0 0 4px ${color}22`,
                      }}
                    >
                      {initials}
                    </div>
                    <h5 className="fw-bold mb-2" style={{ color: "#0f172a" }}>
                      {nom} {prenom}
                    </h5>
                    <div className="mb-3">
                      {isAdmin ? (
                        <span
                          style={{
                            background: "#eff6ff",
                            color: "#2563eb",
                            fontSize: "0.78rem",
                            fontWeight: 600,
                            padding: "5px 14px",
                            borderRadius: 20,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <BsShieldFill size={11} /> Administrateur
                        </span>
                      ) : (
                        <span
                          style={{
                            background: "#f8fafc",
                            color: "#475569",
                            fontSize: "0.78rem",
                            fontWeight: 600,
                            padding: "5px 14px",
                            borderRadius: 20,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <BsPersonFill size={11} /> Utilisateur
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                      Identifiant #{uid}
                    </div>
                  </div>
                </div>

                {/* Info grid */}
                <div className="col-md-8">
                  <div className="card-pro h-100">
                    <h6
                      className="fw-bold mb-4"
                      style={{
                        color: "#0f172a",
                        fontSize: "0.95rem",
                        paddingBottom: 10,
                        borderBottom: "2px solid #2563eb",
                        display: "inline-block",
                      }}
                    >
                      Informations du compte
                    </h6>
                    <div className="row g-3">
                      {fields.map(({ label, value }) => (
                        <div className="col-sm-6" key={label}>
                          <div
                            style={{
                              background: "#f8fafc",
                              borderRadius: 10,
                              padding: "14px 16px",
                              border: "1px solid #e2e8f0",
                            }}
                          >
                            <div
                              style={{
                                fontSize: "0.68rem",
                                color: "#94a3b8",
                                fontWeight: 600,
                                marginBottom: 6,
                                textTransform: "uppercase",
                                letterSpacing: "0.06em",
                              }}
                            >
                              {label}
                            </div>
                            <div
                              style={{
                                fontSize: "0.9rem",
                                fontWeight: 600,
                                color: "#0f172a",
                              }}
                            >
                              {value || "—"}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Action strip */}
                    <div
                      style={{
                        marginTop: 24,
                        paddingTop: 20,
                        borderTop: "1px solid #f1f5f9",
                        display: "flex",
                        gap: 8,
                      }}
                    >
                      <button
                        className="btn btn-primary btn-sm d-flex align-items-center gap-1"
                        onClick={() => navigate(`/editUser/${uid}`)}
                      >
                        <BsPencilSquare /> Modifier
                      </button>
                      <button
                        className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
                        onClick={() => navigate("/users/")}
                      >
                        <BsArrowLeft /> Retour à la liste
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </Template>
  );
}
