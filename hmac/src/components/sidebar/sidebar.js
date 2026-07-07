import { useEffect } from "react";
import GetUserData from "../../contexts/api/udata";
import { Link, useLocation } from "react-router-dom";
import "./sidebar.css";

import {
  BsHouse,
  BsCashCoin,
  BsPeople,
  BsGraphUp,
  BsClipboardData,
  BsCurrencyExchange,
  BsBuilding,
  BsDoorOpen,
  BsClockHistory,
  BsInfoCircle,
  BsFileEarmarkText,
  BsImages,
  BsStarFill,
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
  const isAdmin = String(u_info.u_karazana) === "1";

  // Close mobile sidebar on route change
  useEffect(() => {
    const sidebar = document.getElementById("sidebarMenu");
    if (sidebar && window.innerWidth < 768) {
      sidebar.classList.remove("show");
    }
  }, [location.pathname]);

  const nav = (to, Icon, label, exact = true) => (
    <NavItem
      key={to}
      to={to}
      Icon={Icon}
      label={label}
      location={location}
      exact={exact}
    />
  );

  return (
    <nav
      id="sidebarMenu"
      className="col-md-3 col-lg-2 d-md-block sidebar collapse"
    >
      <ul>
        <div className="sidebar-section-label">Principal</div>
        {nav("/home/", BsHouse, "Accueil", true)}
        {nav("/ofatrano/", BsCashCoin, "Ofatrano", true)}

        <div className="separator" />

        <div className="sidebar-section-label">Immobilier</div>
        {nav("/loyer/", BsBuilding, "Tableau Loyer", true)}
        {nav("/loyer/chambres/", BsDoorOpen, "Chambres", true)}
        {nav("/loyer/locataires/", BsPeople, "Locataires", true)}
        {nav("/loyer/factures/", BsFileEarmarkText, "Factures JIRAMA", true)}
        {isAdmin && nav("/loyer/depenses/", BsCurrencyExchange, "Dépenses Immo", true)}
        {isAdmin && nav("/loyer/benefices/", BsClipboardData, "Bénéfices", true)}
        {isAdmin && nav("/loyer/historique/", BsClockHistory, "Historique", true)}

        {isAdmin && (
          <>
            <div className="separator" />

            <div className="sidebar-section-label">Finance Personnelle</div>
            {nav("/finance/revenus/", BsGraphUp, "Revenus & Charges", true)}
            {nav("/finance/casuel/", BsStarFill, "Casuel & Dépenses", true)}
            {nav("/finance/bilan/", BsClipboardData, "Bilan Mensuel", true)}

            <div className="separator" />

            <div className="sidebar-section-label">Vitrine</div>
            {nav("/vitrine/admin/", BsImages, "Mes Biens", true)}

            <div className="separator" />

            {nav("/users/", BsPeople, "Utilisateurs", true)}
          </>
        )}
        {nav("/about/", BsInfoCircle, "À propos", true)}
      </ul>
    </nav>
  );
}
