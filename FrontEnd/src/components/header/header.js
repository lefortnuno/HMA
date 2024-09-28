import GetUserData from "../../contexts/api/udata";

import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { BsGearFill, BsPower, BsSearch } from "react-icons/bs";

import "./header.css";
import hma from "../../assets/images/hma256.png";

export default function Header({ children }) {
  const u_info = GetUserData();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const seDeconnecterDuSession = (event) => {
    event.preventDefault();
    localStorage.clear();
    navigate("/");
  };

  return (
    <>
      {u_info.u_token ? (
        <header className="py-3">
          <div className="header container-fluid d-flex justify-content-between align-items-center bg-white">
            <div className="d-flex align-items-center">
              <button
                className="btn btn-outline-light me-3 d-md-none"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#sidebarMenu"
                aria-controls="sidebarMenu"
                aria-expanded="false"
                aria-label="Toggle navigation"
              >
                &#9776; Menu
              </button>
            </div>

            <div className="d-flex align-items-center">
              <div className="inputRecherche m-3">{children}</div>

              <div className="nav-item dropdown">
                <span
                  className="dropdown-toggle profile-pic"
                  onClick={toggleDropdown}
                  aria-expanded={dropdownOpen}
                >
                  <span>Solde</span>
                </span>
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
                        <h4> Solde </h4>
                        <div>
                          <b className="text-danger">{u_info.u_karazana}</b>
                          <p className="text-muted"> .&euro;</p>
                        </div>
                      </div>
                    </div>
                  </li>
                  <div className="dropdown-divider"></div>
                  <div className="dropdown-item">
                    <BsGearFill />
                    <span>Paramètre de compte</span>
                  </div>
                  <div className="dropdown-divider"></div>
                  <div
                    className="dropdown-item logOut"
                    onClick={(e) => seDeconnecterDuSession(e)}
                  >
                    <BsPower />
                    <span>Se déconnecter</span>
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
