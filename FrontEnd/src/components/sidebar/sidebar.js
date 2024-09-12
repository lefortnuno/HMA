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
            {/* <BsCashStack /> */}
            <BsGraphUp />
            <p>Gain</p>
          </Link>
        </li>
        <li className={location.pathname === "/outgoing/" ? "active" : ""}>
          <Link to="/outgoing/">
            {/* <BsCashCoin /> */}
            <BsGraphDown />
            <p>Depense</p>
          </Link>
        </li>
        <li className={location.pathname === "/service/" ? "active" : ""}>
          <Link to="/service/">
            <BsGear />
            <p>Services</p>
          </Link>
        </li>
        {u_info.u_karazana === 1 && (
          <li className={location.pathname === "/users/" ? "active" : ""}>
            <Link to="/users/">
              <BsPeople />
              <p>Utilisateurs</p>
            </Link>
          </li>
        )}
        <li className={location.pathname === "/about/" ? "active" : ""}>
          <Link to="/about/">
            <BsInfoCircle />
            <p>Apropos</p>
          </Link>
        </li>
      </ul>
    </div>
  );
}
