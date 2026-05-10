import GetUserData from "../../contexts/api/udata";
import { Link, useLocation } from "react-router-dom";
import "./sidebar.css";
import hma from "../../assets/images/hma256.png";

import {
  BsHouse,
  BsPeople,
  BsGraphUp,
  BsGraphDown,
  BsGear,
  BsGlobe2,
  BsInfoCircle,
  BsBuilding,
  BsClipboardData,
  BsCurrencyExchange,
  BsImages,
  BsFileEarmarkText,
} from "react-icons/bs";

function NavItem({ to, Icon, label, location, exact }) {
  const isActive = exact
    ? location.pathname === to
    : location.pathname.startsWith(to);
  return (
    <li className={isActive ? "active" : ""}>
      <Link to={to}>
        <Icon />
        <p>{label}</p>
      </Link>
    </li>
  );
}

export default function Sidebar() {
  const u_info = GetUserData();
  const location = useLocation();
  const nav = (to, Icon, label, exact = true) => (
    <NavItem key={to} to={to} Icon={Icon} label={label} location={location} exact={exact} />
  );

  return (
    <nav
      id="sidebarMenu"
      className="col-md-3 col-lg-2 d-md-block sidebar collapse"
    >
      {/* <a
        className="carte-visite"
        href="https://trofel.vercel.app/"
        target="_blank"
        rel="noopener noreferrer"
      >
        <img src={hma} alt="HMA" className="logo" />
        <div className="carte-visite-name">
          <p>Bonjour</p>
          <b>{u_info.u_nom}</b>
        </div>
      </a> */}

      <ul>
        <div className="sidebar-section-label">Principal</div>
        {nav("/home/", BsHouse, "Accueil", true)}
        {nav("/inComing/", BsGraphUp, "Gains", true)}
        {nav("/outGoing/", BsGraphDown, "Dépenses", true)}
        {nav("/services/", BsGear, "Services", true)}
        {nav("/boutiques/", BsGlobe2, "Boutiques", true)}

        <div className="separator" />

        <div className="sidebar-section-label">Immobilier</div>
        {nav("/loyer/", BsBuilding, "Tableau Loyer", true)}
        {nav("/loyer/locataires/", BsPeople, "Locataires", true)}
        {nav("/loyer/factures/", BsFileEarmarkText, "Factures JIRAMA", true)}
        {nav("/loyer/depenses/", BsCurrencyExchange, "Dépenses Immo", true)}
        {nav("/loyer/benefices/", BsClipboardData, "Bénéfices", true)}

        <div className="separator" />

        <div className="sidebar-section-label">Vitrine</div>
        {nav("/vitrine/admin/", BsImages, "Mes Biens", true)}

        <div className="separator" />

        {u_info.u_karazana == 1 &&
          nav("/users/", BsPeople, "Utilisateurs", true)}
        {nav("/about/", BsInfoCircle, "À propos", true)}
      </ul>
    </nav>
  );
}
