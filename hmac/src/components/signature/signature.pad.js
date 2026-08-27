import { useRef, useState, useEffect, useCallback } from "react";
import { BsPencil, BsFonts, BsArrowCounterclockwise } from "react-icons/bs";
import "./signature.pad.css";

/**
 * Saisie d'une signature, au trait ou au clavier.
 *
 * Les deux modes coexistent parce que les deux usages coexistent : le
 * locataire signe au doigt depuis son téléphone, le bailleur souvent depuis
 * un ordinateur sans écran tactile, où tracer à la souris donne un résultat
 * peu flatteur.
 *
 * Le tracé est renvoyé en PNG (fond transparent), le nom tapé en texte brut.
 * `onChange({ type, data })` reçoit `null` tant que rien n'est signé, ce qui
 * permet au parent de garder son bouton désactivé.
 */
export default function SignaturePad({ onChange, nomParDefaut = "" }) {
  const [mode, setMode] = useState("DESSIN");
  const [nom, setNom] = useState(nomParDefaut);
  const [vide, setVide] = useState(true);
  const canvasRef = useRef(null);
  const dessine = useRef(false);
  const dernier = useRef(null);

  // Le canvas est dimensionné en pixels réels pour rester net sur les écrans
  // à forte densité : sans cela le trait sort flou sur mobile.
  const preparer = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ratio = window.devicePixelRatio || 1;
    const largeur = c.clientWidth;
    const hauteur = c.clientHeight;
    if (!largeur || !hauteur) return;
    c.width = largeur * ratio;
    c.height = hauteur * ratio;
    const ctx = c.getContext("2d");
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#111827";
  }, []);

  useEffect(() => {
    if (mode !== "DESSIN") return;
    preparer();
    window.addEventListener("resize", preparer);
    return () => window.removeEventListener("resize", preparer);
  }, [mode, preparer]);

  const position = (e) => {
    const c = canvasRef.current;
    const r = c.getBoundingClientRect();
    const p = e.touches ? e.touches[0] : e;
    return { x: p.clientX - r.left, y: p.clientY - r.top };
  };

  const commencer = (e) => {
    e.preventDefault();
    dessine.current = true;
    dernier.current = position(e);
  };

  const tracer = (e) => {
    if (!dessine.current) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext("2d");
    const p = position(e);
    ctx.beginPath();
    ctx.moveTo(dernier.current.x, dernier.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    dernier.current = p;
    if (vide) setVide(false);
  };

  const arreter = () => {
    if (!dessine.current) return;
    dessine.current = false;
    if (!vide) {
      onChange({ type: "DESSIN", data: canvasRef.current.toDataURL("image/png") });
    }
  };

  const effacer = () => {
    const c = canvasRef.current;
    if (c) c.getContext("2d").clearRect(0, 0, c.width, c.height);
    setVide(true);
    onChange(null);
  };

  const changerNom = (v) => {
    setNom(v);
    onChange(v.trim() ? { type: "TEXTE", data: v.trim() } : null);
  };

  const changerMode = (m) => {
    setMode(m);
    // Changer de mode annule ce qui était en cours : on ne veut pas signer
    // d'un tracé effacé de l'écran, ni d'un nom qu'on ne voit plus.
    if (m === "DESSIN") {
      setVide(true);
      onChange(null);
    } else {
      onChange(nom.trim() ? { type: "TEXTE", data: nom.trim() } : null);
    }
  };

  return (
    <div className="sig-pad">
      <div className="sig-modes">
        <button
          type="button"
          className={mode === "DESSIN" ? "actif" : ""}
          onClick={() => changerMode("DESSIN")}
        >
          <BsPencil /> Dessiner
        </button>
        <button
          type="button"
          className={mode === "TEXTE" ? "actif" : ""}
          onClick={() => changerMode("TEXTE")}
        >
          <BsFonts /> Taper mon nom
        </button>
      </div>

      {mode === "DESSIN" ? (
        <>
          <div className="sig-zone">
            <canvas
              ref={canvasRef}
              onMouseDown={commencer}
              onMouseMove={tracer}
              onMouseUp={arreter}
              onMouseLeave={arreter}
              onTouchStart={commencer}
              onTouchMove={tracer}
              onTouchEnd={arreter}
            />
            {vide && <span className="sig-invite">Signez ici</span>}
          </div>
          <div className="sig-actions">
            <button type="button" onClick={effacer}>
              <BsArrowCounterclockwise /> Effacer
            </button>
          </div>
        </>
      ) : (
        <>
          <input
            type="text"
            className="form-control sig-nom"
            value={nom}
            onChange={(e) => changerNom(e.target.value)}
            placeholder="Votre nom complet"
          />
          <div className="sig-apercu-texte">{nom.trim() || "Votre nom complet"}</div>
        </>
      )}
    </div>
  );
}
