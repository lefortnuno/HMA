import GetUserData from "../../contexts/api/udata";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { BsGear, BsPower, BsChevronDown } from "react-icons/bs";
import "./header.css";
import hma from "../../assets/images/hma256.png";

export default function Header({ children }) {
  const u_info = GetUserData();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const scrollToTop = () => {
    document.getElementById("sidebarMenu")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const confirmLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  if (!u_info.u_token) return null;

  return (
    <>
      <header className="header">
        <div className="header-left">
          <button
            className="btn-hamburger"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#sidebarMenu"
            aria-controls="sidebarMenu"
            aria-expanded="false"
            onClick={scrollToTop}
          >
            ☰
          </button>
          <Link to="/home/" className="header-brand d-none d-md-flex">
            <img src={hma} alt="HMA" />
            <span>HMA</span>
          </Link>
          <div className="inputRecherche">{children}</div>
        </div>

        <div className="header-right">
          <button className="user-btn" onClick={() => setOpen(!open)}>
            <img src={hma} alt="avatar" className="user-avatar" />
            <div className="d-none d-sm-flex flex-column text-start">
              <span className="user-name-text">{u_info.u_nom}</span>
              <span className="user-role-text">
                {u_info.u_karazana == 1 ? "Admin" : "Utilisateur"}
              </span>
            </div>
            <BsChevronDown size={11} />
          </button>

          {open && (
            <ul className="dropdown-user">
              <li className="dropdown-user-header">
                <h6>
                  {u_info.u_nom} {u_info.u_prenom}
                </h6>
                <small>
                  {u_info.u_karazana == 1 ? "Administrateur" : "Utilisateur"}
                </small>
              </li>
              <li className="drop-item">
                <BsGear /> Paramètres
              </li>
              <li
                className="drop-item danger"
                onClick={() => { setOpen(false); setShowConfirm(true); }}
              >
                <BsPower /> Se déconnecter
              </li>
            </ul>
          )}
        </div>
      </header>

      {showConfirm && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 2000, padding: 16,
          }}
          onClick={() => setShowConfirm(false)}
        >
          <div
            style={{
              background: "#fff", borderRadius: 14, width: "100%", maxWidth: 340,
              boxShadow: "0 20px 60px rgba(0,0,0,0.2)", overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0", background: "#fff5f5", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h6 style={{ margin: 0, fontWeight: 700, color: "#dc2626", display: "flex", alignItems: "center", gap: 8 }}>
                <BsPower /> Déconnexion
              </h6>
              <button className="btn-close" onClick={() => setShowConfirm(false)} />
            </div>
            <div style={{ padding: "20px 24px" }}>
              <p style={{ margin: "0 0 20px", fontSize: "0.9rem", color: "#475569" }}>
                Êtes-vous sûr de vouloir vous déconnecter ?
              </p>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <button
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => setShowConfirm(false)}
                >
                  Annuler
                </button>
                <button
                  className="btn btn-danger btn-sm d-flex align-items-center gap-1"
                  onClick={confirmLogout}
                >
                  <BsPower size={13} /> Se déconnecter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
