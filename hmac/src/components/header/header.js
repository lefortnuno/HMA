import GetUserData from "../../contexts/api/udata";

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { BsGearFill, BsGear, BsPower } from "react-icons/bs";

import "./header.css";
import hma from "../../assets/images/hma256.png";

// Le composant Header avec un bouton hamburger pour le menu
export default function Header({ children }) {
  const u_info = GetUserData();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Fonction pour ouvrir/fermer le dropdown du profil utilisateur
  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  // Fonction pour se déconnecter et rediriger vers la page de connexion
  const seDeconnecterDuSession = (event) => {
    event.preventDefault();
    localStorage.clear();
    navigate("/");
  };

  // Fonction pour faire défiler vers le haut lorsque le menu est ouvert
  const scrollToTop = () => {
    const sidebar = document.getElementById("sidebarMenu");
    if (sidebar) {
      sidebar.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Vérifie si l'utilisateur est connecté (u_token) avant d'afficher l'entête
  return (
    <>
      {u_info.u_token ? (
        <header className="py-3">
          <div className="header container-fluid d-flex justify-content-between align-items-center bg-white">
            {/* Bouton hamburger pour le menu sur les petits écrans */}
            <div className="d-flex align-items-center">
              <button
                className="btn btn-outline-light me-3 d-md-none text-dark"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#sidebarMenu" // ID du sidebar pour l'afficher/masquer
                aria-controls="sidebarMenu"
                aria-expanded="false"
                aria-label="Toggle navigation"
                onClick={scrollToTop}
              >
                &#9776; Menu
              </button>
            </div>

            {/* Barre de recherche et menu utilisateur */}
            <div className="d-flex align-items-center">
              <div className="inputRecherche m-3">{children}</div>

              {/* Dropdown pour le profil utilisateur */}
              <div className="nav-item dropdown">
                <span
                  className="dropdown-toggle profile-pic"
                  onClick={toggleDropdown}
                  aria-expanded={dropdownOpen}
                >
                  <span>Solde</span>
                </span>
                {/* Menu du profil */}
                <ul
                  className={`dropdown-menu dropdown-user ${
                    dropdownOpen ? "show" : ""
                  }`}
                >
                  <li>
                    <div className="user-box">
                      <div className="u-img">
                        <img src={hma} alt="pdp" />
                      </div>
                      <div className="u-text">
                        <h4>Solde</h4>
                        <div>
                          <b className="text-danger">{u_info.u_karazana}</b>
                          <p className="text-muted"> .&euro;</p>
                        </div>
                      </div>
                    </div>
                  </li>
                  <div className="dropdown-divider"></div>
                  <div className="dropdown-item">
                    <span>
                      <BsGear />
                    </span>
                    <p>Paramètres de compte</p>
                  </div>
                  <div className="dropdown-divider"></div>
                  <div
                    className="dropdown-item"
                    onClick={(e) => seDeconnecterDuSession(e)}
                  >
                    <span>
                      <BsPower />
                    </span>
                    <p>Se déconnecter</p>
                  </div>
                </ul>
              </div>
            </div>
          </div>
        </header>
      ) : null}
    </>
  );
}
