import GetUserData from "../../contexts/api/udata";

import { Link, useLocation } from "react-router-dom";

import "./sidebar.css";
import hma from "../../assets/images/hma256.png";

import {
  BsFolder2Open,
  BsGlobe2,
  BsGeoAlt,
  BsHouse,
  BsInfoLg,
  BsGoogle,
  BsPeople,
  BsStickies,
  BsReception4,
  BsGraphUp,
  BsGraphDown,
  BsCashStack,
  BsCashCoin,
  BsInfoCircle,
  BsGear,
  BsQuestionCircle,
} from "react-icons/bs";

export default function Sidebar() {
  const u_info = GetUserData();
  const location = useLocation(); 

  return (
    <nav
      id="sidebarMenu"
      className="col-md-3 col-lg-2 d-md-block bg-light sidebar collapse"
    >
      <div className="position-sticky">
        <div className="carte-visite">
          <img
            src={hma}
            alt="bg-hma"
            className="logo img-fluid rounded-circle me-2"
            style={{ width: "50px" }}
          />
          <div className="carte-visite-name">
            <p className="text-muted">Bonjour</p> <b>{u_info.u_nom}</b>
          </div>
        </div>

        <ul className="nav flex-column">
          <li className={location.pathname === "/home/" ? "active" : ""}>
            <Link to="/home/">
              <span>
                <BsHouse />
              </span>
              <p>Accueil</p>
            </Link>
          </li>
          <li className={location.pathname === "/inComing/" ? "active" : ""}>
            <Link to="/inComing/">
              <span>
                <BsGraphUp />
              </span>
              <p>Gain</p>
            </Link>
          </li>
          <li className={location.pathname === "/outGoing/" ? "active" : ""}>
            <Link to="/outGoing/">
              <span>
                <BsGraphDown />
              </span>
              {/* <BsCashCoin /> */}
              <p>Dépense</p>
            </Link>
          </li>
          <li className={location.pathname === "/service/" ? "active" : ""}>
            <Link to="/services/">
              <span>
                <BsGear />
              </span>
              <p>Services</p>
            </Link>
          </li>
          <li className={location.pathname === "/boutique/" ? "active" : ""}>
            <Link to="/boutique/">
              <span>
                <BsGlobe2 />
              </span>
              <p>Boutiques</p>
            </Link>
          </li>

          <li></li>
          {u_info.u_karazana == 1 && (
            <li className={location.pathname === "/users/" ? "active" : ""}>
              <Link to="/users/">
                <span>
                  <BsPeople />
                </span>
                <p>Utilisateurs</p>
              </Link>
            </li>
          )}
          <li className={location.pathname === "/about/" ? "active" : ""}>
            <Link to="/about/">
              <span>
                <BsInfoCircle />
              </span>
              <p>Apropos</p>
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}
