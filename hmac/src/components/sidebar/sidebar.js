import { useEffect, useState } from "react";
import axios from "../../contexts/api/axios";
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
  BsBell,
} from "react-icons/bs";

function NavItem({ to, Icon, label, location, exact, badge }) {
  const isActive = exact
    ? location.pathname === to
    : location.pathname.startsWith(to);
  return (
    <li className={isActive ? "active" : ""}>
      <Link to={to}>
        <Icon />
        <p>
          {label}
          {badge > 0 && (
            <span
              style={{
                marginLeft: 8,
                background: "#dc2626",
                color: "#fff",
                borderRadius: 999,
                fontSize: "0.68rem",
                fontWeight: 700,
                padding: "1px 7px",
                verticalAlign: "middle",
              }}
            >
              {badge > 99 ? "99+" : badge}
            </span>
          )}
        </p>
      </Link>
    </li>
  );
}

export default function Sidebar() {
  const u_info = GetUserData();
  const location = useLocation();
  const isAdmin = String(u_info.u_karazana) === "1";
  const [nbPending, setNbPending] = useState(0);

  // Close mobile sidebar on route change
  useEffect(() => {
    const sidebar = document.getElementById("sidebarMenu");
    if (sidebar && window.innerWidth < 768) {
      sidebar.classList.remove("show");
    }
  }, [location.pathname]);

  // Badge notifications : nombre de demandes en attente de validation.
  useEffect(() => {
    if (!u_info.u_token) return;
    axios
      .get("loyer/validations/count", u_info.opts)
      .then((r) => setNbPending(r.data?.nb || 0))
      .catch(() => setNbPending(0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const nav = (to, Icon, label, exact = true, badge = 0) => (
    <NavItem
      key={to}
      to={to}
      Icon={Icon}
      label={label}
      location={location}
      exact={exact}
      badge={badge}
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
        {nav("/notifications/", BsBell, "Notifications", true, isAdmin ? nbPending : 0)}

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
