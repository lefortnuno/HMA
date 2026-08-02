import { useEffect, useRef } from "react";

/**
 * Bannière d'accueil : un paysage naturel qui défile sans fin.
 *
 * Tout est dessiné au canvas — aucune image à héberger. Les plans se
 * répètent à l'infini par simple modulo, et la palette reste en demi-teintes
 * (ni nuit, ni plein soleil) pour rester lisible derrière le texte.
 */
export default function PaysageBanner() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let w, h, animId;
    let t = 0;
    const prefereCalme = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

    // Palette douce : bleu-vert atténué, verts mats, sable clair.
    const C = {
      cielHaut: "#7ba7c4",
      cielBas: "#c5d9dd",
      soleil: "rgba(255, 244, 214, 0.55)",
      montLoin: "#8fa5b4",
      montProche: "#6f8a9b",
      collineLoin: "#7fa07e",
      collineProche: "#63855f",
      prairie: "#5b7c52",
      herbe: "#4d6b46",
      eau: "#8fb6c0",
      arbre: "#3f5f3d",
      nuage: "rgba(255, 255, 255, 0.55)",
      oiseau: "rgba(60, 76, 88, 0.55)",
    };

    function setup() {
      w = canvas.width = canvas.offsetWidth || 800;
      h = canvas.height = canvas.offsetHeight || 220;
    }
    setup();
    const onResize = () => setup();
    window.addEventListener("resize", onResize);

    // ── Ciel et soleil voilé ───────────────────────────────
    function ciel() {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, C.cielHaut);
      g.addColorStop(1, C.cielBas);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      ctx.save();
      ctx.fillStyle = C.soleil;
      ctx.beginPath();
      ctx.arc(w * 0.72, h * 0.28, Math.min(w, h) * 0.13, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      ctx.arc(w * 0.72, h * 0.28, Math.min(w, h) * 0.24, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    /**
     * Relief répété à l'infini.
     * `periode` fixe la largeur d'un motif ; on en dessine deux de plus que
     * nécessaire pour qu'aucune couture n'apparaisse aux bords.
     */
    function relief({ vitesse, base, amplitude, periode, couleur, dents }) {
      const decalage = (t * vitesse) % periode;
      ctx.fillStyle = couleur;
      ctx.beginPath();
      ctx.moveTo(-periode, h);
      for (let x = -periode; x <= w + periode; x += 4) {
        const u = (x + decalage) / periode;
        // Somme de deux sinus : un profil irrégulier sans hasard.
        let y =
          base -
          amplitude *
            (0.55 + 0.45 * Math.sin(u * Math.PI * 2)) *
            (0.7 + 0.3 * Math.sin(u * Math.PI * 6 + 1.3));
        if (dents) {
          // Crêtes anguleuses pour les montagnes lointaines.
          y -= amplitude * 0.25 * Math.abs(Math.sin(u * Math.PI * 4));
        }
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w + periode, h);
      ctx.closePath();
      ctx.fill();
    }

    // ── Rivière, en bas du cadre ───────────────────────────
    function riviere() {
      const y0 = h * 0.78;
      ctx.fillStyle = C.eau;
      ctx.fillRect(0, y0, w, h - y0);

      // Reflets : de fines bandes claires qui glissent.
      ctx.save();
      ctx.globalAlpha = 0.3;
      ctx.strokeStyle = "#eaf4f6";
      ctx.lineWidth = 1.4;
      for (let i = 0; i < 7; i++) {
        const y = y0 + 6 + i * ((h - y0 - 8) / 7);
        const largeur = 40 + i * 14;
        const x = ((t * (0.35 + i * 0.06) + i * 130) % (w + largeur * 2)) - largeur;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + largeur, y);
        ctx.stroke();
      }
      ctx.restore();
    }

    // ── Arbres du premier plan ─────────────────────────────
    function arbre(x, y, taille) {
      ctx.fillStyle = "#4a3b2e";
      ctx.fillRect(x - taille * 0.06, y - taille * 0.42, taille * 0.12, taille * 0.45);
      ctx.fillStyle = C.arbre;
      // Trois houppiers superposés : une silhouette de conifère.
      for (let i = 0; i < 3; i++) {
        const t2 = taille * (1 - i * 0.2);
        const yy = y - taille * 0.35 - i * taille * 0.22;
        ctx.beginPath();
        ctx.moveTo(x, yy - t2 * 0.5);
        ctx.lineTo(x - t2 * 0.32, yy);
        ctx.lineTo(x + t2 * 0.32, yy);
        ctx.closePath();
        ctx.fill();
      }
    }

    function rangeeArbres(vitesse, periode, yBase, taille, alpha) {
      ctx.save();
      ctx.globalAlpha = alpha;
      const decalage = (t * vitesse) % periode;
      for (let x = -periode; x <= w + periode; x += periode) {
        // Deux arbres par motif, décalés, pour éviter la régularité.
        arbre(x - decalage + periode * 0.25, yBase, taille);
        arbre(x - decalage + periode * 0.7, yBase + taille * 0.06, taille * 0.78);
      }
      ctx.restore();
    }

    // ── Nuages et oiseaux ──────────────────────────────────
    function nuage(x, y, taille) {
      ctx.fillStyle = C.nuage;
      ctx.beginPath();
      ctx.ellipse(x, y, taille, taille * 0.42, 0, 0, Math.PI * 2);
      ctx.ellipse(x + taille * 0.6, y + taille * 0.1, taille * 0.7, taille * 0.34, 0, 0, Math.PI * 2);
      ctx.ellipse(x - taille * 0.62, y + taille * 0.12, taille * 0.6, taille * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    function nuages() {
      const periode = w + 260;
      [
        { v: 0.16, y: h * 0.18, s: 30, d: 0 },
        { v: 0.11, y: h * 0.3, s: 22, d: periode * 0.45 },
        { v: 0.2, y: h * 0.12, s: 17, d: periode * 0.75 },
      ].forEach(({ v, y, s, d }) => {
        const x = periode - ((t * v + d) % periode) - 120;
        nuage(x, y, s);
      });
    }

    function oiseaux() {
      ctx.save();
      ctx.strokeStyle = C.oiseau;
      ctx.lineWidth = 1.6;
      const periode = w + 200;
      for (let i = 0; i < 3; i++) {
        const x = ((t * 0.6 + i * 90) % periode) - 60;
        const y = h * 0.2 + Math.sin(t * 0.02 + i) * 8 + i * 11;
        const bat = Math.sin(t * 0.16 + i * 1.7) * 3.2; // battement d'ailes
        ctx.beginPath();
        ctx.moveTo(x - 6, y + bat);
        ctx.quadraticCurveTo(x - 3, y - 2, x, y);
        ctx.quadraticCurveTo(x + 3, y - 2, x + 6, y + bat);
        ctx.stroke();
      }
      ctx.restore();
    }

    // ── Titre ──────────────────────────────────────────────
    function titre() {
      const fs = Math.min(w / 16, 30);
      ctx.save();
      ctx.textAlign = "left";
      ctx.font = `900 ${fs}px "Courier New", monospace`;
      ctx.shadowColor = "rgba(15,23,42,0.45)";
      ctx.shadowBlur = 14;
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.fillText("HMA", 22, 44);

      ctx.font = `600 ${Math.max(9, fs * 0.34)}px "Courier New", monospace`;
      ctx.shadowBlur = 8;
      ctx.fillStyle = "rgba(255,255,255,0.82)";
      ctx.fillText("HABITAT MANAGEMENT APP", 22, 44 + fs * 0.7);
      ctx.restore();
    }

    function scene() {
      ciel();
      nuages();
      oiseaux();

      // Du plus lointain au plus proche : la vitesse fait la profondeur.
      relief({ vitesse: 0.06, base: h * 0.68, amplitude: h * 0.3, periode: 620, couleur: C.montLoin, dents: true });
      relief({ vitesse: 0.11, base: h * 0.72, amplitude: h * 0.24, periode: 470, couleur: C.montProche, dents: true });
      relief({ vitesse: 0.2, base: h * 0.78, amplitude: h * 0.14, periode: 360, couleur: C.collineLoin });
      relief({ vitesse: 0.32, base: h * 0.84, amplitude: h * 0.1, periode: 280, couleur: C.collineProche });

      riviere();

      relief({ vitesse: 0.55, base: h * 1.02, amplitude: h * 0.16, periode: 210, couleur: C.prairie });
      rangeeArbres(0.55, 210, h * 0.9, h * 0.2, 0.9);
      relief({ vitesse: 0.85, base: h * 1.12, amplitude: h * 0.14, periode: 150, couleur: C.herbe });

      titre();
    }

    function draw() {
      t += 1;
      scene();
      animId = requestAnimationFrame(draw);
    }

    if (prefereCalme) scene();
    else draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="pixel-canvas" />;
}
