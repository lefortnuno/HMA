import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Template from "../../components/template/template";
import Header from "../../components/header/header";
import Sidebar from "../../components/sidebar/sidebar";
import GetUserData from "../../contexts/api/udata";
import {
  BsBuilding, BsGraphUp, BsStarFill, BsImages,
  BsPeopleFill, BsClipboardData, BsCurrencyExchange, BsFileEarmarkText,
} from "react-icons/bs";
import "./home.css";

/* ─── Pixel rain canvas ────────────────────────────────────── */
function PixelRain() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const CELL = 11;
    let cols, drops, animId, w, h;

    function setup() {
      w = canvas.width  = canvas.offsetWidth  || 800;
      h = canvas.height = canvas.offsetHeight || 220;
      cols = Math.floor(w / CELL);

      drops = Array.from({ length: cols }, () => ({
        y:      Math.random() * -(h / CELL) * 3,
        speed:  0.12 + Math.random() * 0.22,
        trail:  7  + Math.floor(Math.random() * 12),
        glow:   Math.random() > 0.88,
      }));

      // Dark fill on resize so no flash
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, w, h);
    }

    setup();

    const onResize = () => { setup(); };
    window.addEventListener("resize", onResize);

    function draw() {
      // Fade-trail overlay
      ctx.fillStyle = "rgba(15, 23, 42, 0.18)";
      ctx.fillRect(0, 0, w, h);

      for (let i = 0; i < cols; i++) {
        const d = drops[i];
        const px = i * CELL;

        for (let t = 0; t < d.trail; t++) {
          const cy = Math.floor(d.y) - t;
          const py = cy * CELL;
          if (py < 0 || py >= h) continue;

          let r, g, b, a;
          if (t === 0) {
            // Leading pixel — near white
            r = 210; g = 230; b = 255; a = 1;
          } else if (t === 1) {
            r = 147; g = 197; b = 253; a = 0.9;
          } else if (t === 2) {
            r = 96;  g = 165; b = 250; a = 0.75;
          } else {
            // Trail fades to primary blue
            r = 37; g = 99; b = 235;
            a = Math.max(0, (1 - t / d.trail) * 0.65);
          }

          ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
          ctx.fillRect(px + 1, py + 1, CELL - 2, CELL - 2);

          // Occasional bright "spark" pixel
          if (t === 0 && d.glow) {
            ctx.fillStyle = `rgba(255,255,255,0.6)`;
            const s = 3;
            ctx.fillRect(
              px + CELL / 2 - s / 2,
              py + CELL / 2 - s / 2,
              s, s
            );
          }
        }

        d.y += d.speed;

        if ((d.y - d.trail) * CELL > h) {
          d.y     = Math.random() * -25;
          d.speed = 0.12 + Math.random() * 0.22;
          d.trail = 7 + Math.floor(Math.random() * 12);
          d.glow  = Math.random() > 0.88;
        }
      }

      /* ── HMA overlay text ─────────────────────────── */
      const cx  = w / 2;
      const cy  = h / 2 + 18;
      const fs  = Math.min(w / 4.5, 88);

      ctx.save();
      ctx.textAlign = "center";
      ctx.font = `900 ${fs}px "Courier New", monospace`;

      // Deep glow
      ctx.shadowColor = "#2563eb";
      ctx.shadowBlur  = 48;
      ctx.fillStyle   = "rgba(37,99,235,0.25)";
      ctx.fillText("HMA", cx, cy);

      // Mid glow
      ctx.shadowBlur  = 24;
      ctx.fillStyle   = "rgba(96,165,250,0.5)";
      ctx.fillText("HMA", cx, cy);

      // Crisp white core
      ctx.shadowBlur  = 10;
      ctx.fillStyle   = "rgba(255,255,255,0.93)";
      ctx.fillText("HMA", cx, cy);

      // Subtitle
      const sfs = Math.max(10, Math.min(w / 50, 13));
      ctx.font      = `600 ${sfs}px "Courier New", monospace`;
      ctx.shadowBlur = 8;
      ctx.fillStyle  = "rgba(147,197,253,0.75)";
      ctx.letterSpacing = "3px";
      ctx.fillText("HABITAT  MANAGEMENT  APP", cx, cy + fs * 0.55);

      ctx.restore();

      animId = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="pixel-canvas" />;
}

/* ─── Module shortcuts ─────────────────────────────────────── */
const MODULES = [
  { to: "/loyer/",            Icon: BsBuilding,         label: "Tableau Loyer",     color: "#2563eb", bg: "#eff6ff",  desc: "Suivi des paiements"     },
  { to: "/loyer/locataires/", Icon: BsPeopleFill,        label: "Locataires",        color: "#8b5cf6", bg: "#f5f3ff",  desc: "Gestion des locataires"  },
  { to: "/loyer/factures/",   Icon: BsFileEarmarkText,   label: "Factures JIRAMA",   color: "#06b6d4", bg: "#ecfeff",  desc: "Eau & électricité"       },
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
              <PixelRain />
            </div>

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

            {/* Module shortcuts */}
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

          </main>
        </div>
      </div>
    </Template>
  );
}
