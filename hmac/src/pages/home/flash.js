import { useEffect, useRef } from "react";

/**
 * Bannière d'accueil : une voiture de course façon Flash McQueen, dessinée au
 * canvas (aucune image externe, donc rien à charger ni à héberger).
 *
 * Ses yeux — les pupilles du pare-brise, comme dans Cars — balaient lentement
 * de gauche à droite. Le décor défile derrière elle pour donner le mouvement.
 */
export default function FlashBanner() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let w, h, animId;
    let t = 0;              // temps, en frames
    let decor = 0;          // défilement du sol et des collines
    const prefereCalme = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

    function setup() {
      w = canvas.width = canvas.offsetWidth || 800;
      h = canvas.height = canvas.offsetHeight || 220;
    }
    setup();
    const onResize = () => setup();
    window.addEventListener("resize", onResize);

    // ── Décor ──────────────────────────────────────────────
    function ciel() {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "#0f172a");
      g.addColorStop(0.55, "#1e293b");
      g.addColorStop(1, "#334155");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      // Soleil bas, façon fin d'après-midi.
      ctx.save();
      ctx.globalAlpha = 0.16;
      ctx.fillStyle = "#f59e0b";
      ctx.beginPath();
      ctx.arc(w * 0.78, h * 0.34, Math.min(w, h) * 0.22, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    function collines(offset, hauteur, couleur, alpha) {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = couleur;
      ctx.beginPath();
      const base = h * 0.72;
      ctx.moveTo(0, base);
      for (let x = 0; x <= w; x += 8) {
        const y =
          base -
          hauteur * (0.6 + 0.4 * Math.sin((x + offset) * 0.006)) *
            (0.7 + 0.3 * Math.sin((x + offset) * 0.017));
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    function route() {
      const solY = h * 0.74;
      ctx.fillStyle = "#1f2937";
      ctx.fillRect(0, solY, w, h - solY);

      // Bande centrale en pointillés, qui défile.
      ctx.strokeStyle = "rgba(226,232,240,0.55)";
      ctx.lineWidth = 3;
      ctx.setLineDash([26, 22]);
      ctx.lineDashOffset = -decor * 2.4;
      ctx.beginPath();
      ctx.moveTo(0, h * 0.9);
      ctx.lineTo(w, h * 0.9);
      ctx.stroke();
      ctx.setLineDash([]);

      // Liseré clair en haut de la chaussée.
      ctx.strokeStyle = "rgba(148,163,184,0.35)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, solY);
      ctx.lineTo(w, solY);
      ctx.stroke();
    }

    // ── La voiture ─────────────────────────────────────────
    // Dessinée dans un repère de 200 x 90, mise à l'échelle ensuite.
    function voiture(regard) {
      const ech = Math.min(w / 420, h / 190);
      const cx = w / 2;
      const cy = h * 0.72;
      const rebond = Math.sin(t * 0.09) * 1.4; // trépidation du moteur

      ctx.save();
      ctx.translate(cx, cy + rebond);
      ctx.scale(ech, ech);

      // Ombre portée
      ctx.save();
      ctx.globalAlpha = 0.32;
      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.ellipse(0, 26, 108, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Carrosserie — rouge de course
      const corps = ctx.createLinearGradient(0, -46, 0, 24);
      corps.addColorStop(0, "#ef4444");
      corps.addColorStop(0.5, "#dc2626");
      corps.addColorStop(1, "#991b1b");
      ctx.fillStyle = corps;
      ctx.beginPath();
      ctx.moveTo(-104, 18);
      ctx.quadraticCurveTo(-112, 2, -96, -6);      // capot avant
      ctx.lineTo(-54, -12);
      ctx.quadraticCurveTo(-34, -46, 6, -46);      // pare-brise / toit
      ctx.quadraticCurveTo(52, -46, 66, -12);
      ctx.lineTo(96, -6);
      ctx.quadraticCurveTo(112, 0, 104, 18);       // arrière
      ctx.closePath();
      ctx.fill();

      // Reflet le long de la caisse
      ctx.save();
      ctx.globalAlpha = 0.22;
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.moveTo(-92, -2);
      ctx.quadraticCurveTo(0, -18, 92, -2);
      ctx.quadraticCurveTo(0, -9, -92, -2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Bas de caisse
      ctx.fillStyle = "#7f1d1d";
      ctx.beginPath();
      ctx.moveTo(-104, 18);
      ctx.lineTo(104, 18);
      ctx.lineTo(98, 24);
      ctx.lineTo(-98, 24);
      ctx.closePath();
      ctx.fill();

      // Aileron arrière
      ctx.fillStyle = "#b91c1c";
      ctx.fillRect(74, -26, 26, 5);
      ctx.fillRect(84, -21, 5, 12);

      // Numéro 95 sur la portière
      ctx.save();
      ctx.fillStyle = "#fbbf24";
      ctx.beginPath();
      ctx.arc(14, -4, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#7f1d1d";
      ctx.font = "700 15px Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("95", 14, -3);
      ctx.restore();

      // Pare-brise — c'est là que vivent les yeux
      const vitre = ctx.createLinearGradient(0, -44, 0, -14);
      vitre.addColorStop(0, "#e0f2fe");
      vitre.addColorStop(1, "#bae6fd");
      ctx.fillStyle = vitre;
      ctx.beginPath();
      ctx.moveTo(-48, -14);
      ctx.quadraticCurveTo(-30, -41, 5, -41);
      ctx.quadraticCurveTo(44, -41, 58, -14);
      ctx.closePath();
      ctx.fill();

      // Yeux : deux blancs, pupilles qui suivent `regard` (-1 → gauche, 1 → droite)
      const oeil = (ox) => {
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.ellipse(ox, -26, 12, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(15,23,42,0.25)";
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = "#0f172a";
        ctx.beginPath();
        ctx.arc(ox + regard * 5.5, -25, 5, 0, Math.PI * 2);
        ctx.fill();

        // Petite étincelle, pour le regard vivant
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.beginPath();
        ctx.arc(ox + regard * 5.5 - 1.8, -27, 1.6, 0, Math.PI * 2);
        ctx.fill();
      };
      oeil(-14);
      oeil(20);

      // Bouche discrète (calandre)
      ctx.strokeStyle = "rgba(127,29,29,0.85)";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(-72, 4, 12, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();

      // Phare avant
      ctx.fillStyle = "rgba(254,240,138,0.9)";
      ctx.beginPath();
      ctx.ellipse(-88, -4, 7, 5, -0.3, 0, Math.PI * 2);
      ctx.fill();

      // Roues, qui tournent
      const roue = (rx) => {
        ctx.save();
        ctx.translate(rx, 18);
        ctx.fillStyle = "#111827";
        ctx.beginPath();
        ctx.arc(0, 0, 19, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#4b5563";
        ctx.beginPath();
        ctx.arc(0, 0, 9, 0, Math.PI * 2);
        ctx.fill();
        // Rayons
        ctx.rotate(t * 0.22);
        ctx.strokeStyle = "#9ca3af";
        ctx.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(0, -8);
          ctx.stroke();
          ctx.rotate(Math.PI / 2);
        }
        ctx.restore();
      };
      roue(-62);
      roue(64);

      ctx.restore();
    }

    // ── Titre ──────────────────────────────────────────────
    function titre() {
      const fs = Math.min(w / 16, 30);
      ctx.save();
      ctx.textAlign = "left";
      ctx.font = `900 ${fs}px "Courier New", monospace`;
      ctx.shadowColor = "#2563eb";
      ctx.shadowBlur = 22;
      ctx.fillStyle = "rgba(255,255,255,0.94)";
      ctx.fillText("HMA", 22, 44);

      ctx.font = `600 ${Math.max(9, fs * 0.34)}px "Courier New", monospace`;
      ctx.shadowBlur = 8;
      ctx.fillStyle = "rgba(147,197,253,0.8)";
      ctx.fillText("HABITAT MANAGEMENT APP", 22, 44 + fs * 0.7);
      ctx.restore();
    }

    function draw() {
      t += 1;
      decor += 1.6;

      ciel();
      collines(decor * 0.25, h * 0.16, "#0b1220", 0.9);
      collines(decor * 0.55, h * 0.1, "#111a2e", 0.9);
      route();

      // Balayage du regard, lent et régulier : de gauche à droite puis retour.
      const regard = Math.sin(t * 0.018);
      voiture(regard);
      titre();

      animId = requestAnimationFrame(draw);
    }

    if (prefereCalme) {
      // Une image fixe suffit quand l'utilisateur limite les animations.
      ciel();
      collines(0, h * 0.16, "#0b1220", 0.9);
      collines(0, h * 0.1, "#111a2e", 0.9);
      route();
      voiture(0);
      titre();
    } else {
      draw();
    }

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="pixel-canvas" />;
}
