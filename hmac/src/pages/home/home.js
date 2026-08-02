import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Template from "../../components/template/template";
import Header from "../../components/header/header";
import Sidebar from "../../components/sidebar/sidebar";
import GetUserData from "../../contexts/api/udata";
import {
  BsBuilding, BsGraphUp, BsStarFill, BsImages,
  BsPeopleFill, BsClipboardData, BsCurrencyExchange, BsFileEarmarkText,
} from "react-icons/bs";
import Reglement from "../../components/reglement/reglement";
import "./home.css";

import FlashBanner from "./flash";

/* ─── Module shortcuts ─────────────────────────────────────── */
const MODULES = [
  { to: "/loyer/",            Icon: BsBuilding,         label: "Tableau Loyer",     color: "#2563eb", bg: "#eff6ff",  desc: "Suivi des paiements"     },
  { to: "/loyer/locataires/", Icon: BsPeopleFill,        label: "Locataires",        color: "#8b5cf6", bg: "#f5f3ff",  desc: "Gestion des locataires"  },
  { to: "/loyer/jirama/",     Icon: BsFileEarmarkText,   label: "Factures JIRAMA",   color: "#06b6d4", bg: "#ecfeff",  desc: "Eau & électricité"       },
  { to: "/loyer/depenses/",   Icon: BsCurrencyExchange,  label: "Dépenses Immo",     color: "#f59e0b", bg: "#fffbeb",  desc: "Dépenses immobilières"   },
  { to: "/loyer/benefices/",  Icon: BsClipboardData,     label: "Bénéfices",         color: "#10b981", bg: "#f0fdf4",  desc: "Résultats mensuels"      },
  { to: "/finance/revenus/",  Icon: BsGraphUp,           label: "Revenus & Charges", color: "#2563eb", bg: "#eff6ff",  desc: "Finances fixes"          },
  { to: "/finance/casuel/",   Icon: BsStarFill,          label: "Casuel & Dépenses", color: "#f59e0b", bg: "#fffbeb",  desc: "Revenus occasionnels"    },
  { to: "/vitrine/admin/",    Icon: BsImages,            label: "Mes Biens",         color: "#ef4444", bg: "#fff5f5",  desc: "Gestion vitrine"         },
];

const DAYS   = ["Dimanche","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"];
const MONTHS = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];

/* ─── Page ─────────────────────────────────────────────────── */
export default function Home() {
  const u_info = GetUserData();
  const estLocataire = String(localStorage.getItem("karazana")) === "2";
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const h = now.getHours();
  const greeting = h < 12 ? "Bonjour" : h < 18 ? "Bon après-midi" : "Bonsoir";

  const p  = n => String(n).padStart(2, "0");
  const timeStr = `${p(h)}:${p(now.getMinutes())}:${p(now.getSeconds())}`;
  const dateStr = `${DAYS[now.getDay()]} ${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`;

  return (
    <Template>
      <Header />
      <div className="container-fluid flex-grow-1">
        <div className="row g-0">
          <Sidebar />
          <main className="col-md-9 ms-sm-auto col-lg-10 px-md-4 main">

            {/* Pixel animation banner */}
            <div className="pixel-banner-wrap">
              <FlashBanner />
            </div>

            {/* Règlement de la résidence — visible de tous, locataires compris */}
            <Reglement />

            {/* Welcome */}
            <div className="home-welcome-row">
              <div>
                <h2 className="home-greeting">
                  {greeting}, <span>{u_info.u_nom}</span> !
                </h2>
                <p className="home-date">{dateStr}</p>
              </div>
              <div className="home-clock">{timeStr}</div>
            </div>

            {/* Raccourcis vers les modules — sans objet pour un locataire,
                qui n a acces qu a son espace personnel. */}
            {!estLocataire && (
            <div className="home-modules-grid">
              {MODULES.map(({ to, Icon, label, color, bg, desc }) => (
                <Link
                  key={to}
                  to={to}
                  className="home-module-card"
                  style={{ "--card-color": color, "--card-bg": bg }}
                >
                  <div className="hmc-icon"><Icon /></div>
                  <div>
                    <div className="hmc-label">{label}</div>
                    <div className="hmc-desc">{desc}</div>
                  </div>
                </Link>
              ))}
            </div>
            )}

          </main>
        </div>
      </div>
    </Template>
  );
}
