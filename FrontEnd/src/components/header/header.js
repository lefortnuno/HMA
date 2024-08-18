import GetUserData from "../../contexts/api/udata";
import { useNavigate } from "react-router-dom";
import "./header.css";
import hma from "../../assets/images/hma256.png";
import { BsGearFill, BsPower, BsSearch } from "react-icons/bs";
import { useState } from "react";

export default function Header(props) {
  const u_info = GetUserData();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const toggleSearch = () => {
    setSearchVisible(!searchVisible);
  };

  const seDeconnecterDuSession = (event) => {
    event.preventDefault();
    localStorage.clear();
    navigate("/");
  };

  return (
    <>
      {u_info.u_token ? (
        <div className="header d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <img
              src={hma}
              alt="bg-hma"
              className="img-fluid logo rounded-circle me-2"
              style={{ width: "50px" }}
            />
            <div className="drop_item">
              <p className="text-muted">Bonjour!</p> <b>{u_info.u_nom}</b>
            </div>
          </div>

          <div className="d-flex align-items-center">
            <div className="inputRecherche m-3">
              {!searchVisible && (
                <BsSearch className="searchIcon" onClick={toggleSearch} />
              )}
              {searchVisible && (
                <input
                  type="text"
                  placeholder="Recherche"
                  className="form-control text-primary"
                  value={props.children}
                  onBlur={() => setSearchVisible(false)} // Hide input when it loses focus
                />
              )}
            </div>

            <div className="nav-item dropdown">
              <span
                className="dropdown-toggle profile-pic"
                onClick={toggleDropdown}
                aria-expanded={dropdownOpen}
              >
                <span> Menu</span>
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
      ) : null}
    </>
  );
}
