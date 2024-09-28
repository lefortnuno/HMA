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
    <div className="sidebar">
      <div className="sidebar-logo">
        <img
          src={hma}
          alt="bg-hma"
          className="img-fluid logo rounded-circle me-2"
          style={{ width: "50px" }}
        />
        <div className="drop_item">
          <p className="text-muted">Bonjour</p> <b>{u_info.u_nom}</b>
        </div>
      </div>
      <ul>
        <li className={location.pathname === "/home/" ? "active" : ""}>
          <Link to="/home/">
            <span>
              <BsHouse />
            </span>
            <p>Accueil</p>
          </Link>
        </li>
        <li className={location.pathname === "/incoming/" ? "active" : ""}>
          <Link to="/incoming/">
            <span>
              <BsGraphUp />
            </span>
            <p>Gain</p>
          </Link>
        </li>
        <li className={location.pathname === "/outgoing/" ? "active" : ""}>
          <Link to="/outgoing/">
            <span>
              <BsGraphDown />
            </span>
            {/* <BsCashCoin /> */}
            <p>Depense</p>
          </Link>
        </li>
        <li className={location.pathname === "/service/" ? "active" : ""}>
          <Link to="/service/">
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
        {u_info.u_karazana === 1 && (
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
  );
}
