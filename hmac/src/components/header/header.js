import GetUserData from "../../contexts/api/udata";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BsGear, BsPower, BsChevronDown } from "react-icons/bs";
import "./header.css";
import hma from "../../assets/images/hma256.png";

export default function Header({ children }) {
  const u_info = GetUserData();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const scrollToTop = () => {
    document.getElementById("sidebarMenu")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const logout = (e) => {
    e.preventDefault();
    localStorage.clear();
    navigate("/");
  };

  if (!u_info.u_token) return null;

  return (
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
        <a href="/home/" className="header-brand d-none d-md-flex">
          <img src={hma} alt="HMA" />
          <span>HMA</span>
        </a>
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
            <li className="drop-item danger" onClick={logout}>
              <BsPower /> Se déconnecter
            </li>
          </ul>
        )}
      </div>
    </header>
  );
}
