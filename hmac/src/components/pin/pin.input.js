import { useRef, useEffect } from "react";
import "./pin.css";

/**
 * Saisie d'un code a 4 chiffres, meme principe que l'ecran de connexion :
 * une case par chiffre, passage automatique a la suivante, retour arriere
 * intelligent, et clavier NUMERIQUE sur telephone (inputMode="numeric").
 */
export default function PinInput({
  value = "",
  onChange,
  autoFocus = false,
  disabled = false,
  longueur = 4,
  id = "pin",
}) {
  const refs = useRef([]);

  useEffect(() => {
    if (autoFocus && refs.current[0]) refs.current[0].focus();
  }, [autoFocus]);

  const chiffres = Array.from({ length: longueur }, (_, i) => value[i] || "");

  function ecrire(index, brut) {
    // On ne garde que les chiffres (utile aussi pour un collage "1234").
    const propre = String(brut).replace(/\D/g, "");
    if (!propre) return;

    const suite = chiffres.slice();
    let curseur = index;
    for (const c of propre) {
      if (curseur >= longueur) break;
      suite[curseur] = c;
      curseur++;
    }
    onChange(suite.join("").slice(0, longueur));
    const prochain = Math.min(curseur, longueur - 1);
    refs.current[prochain]?.focus();
  }

  function toucheSpeciale(index, e) {
    if (e.key === "Backspace") {
      e.preventDefault();
      const suite = chiffres.slice();
      if (suite[index]) {
        suite[index] = "";
        onChange(suite.join(""));
      } else if (index > 0) {
        suite[index - 1] = "";
        onChange(suite.join(""));
        refs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      refs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < longueur - 1) {
      refs.current[index + 1]?.focus();
    }
  }

  return (
    <div className="pin-group">
      {chiffres.map((c, i) => (
        <input
          key={i}
          id={`${id}-${i}`}
          ref={(el) => (refs.current[i] = el)}
          className="pin-case"
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
          maxLength={1}
          disabled={disabled}
          value={c}
          onChange={(e) => ecrire(i, e.target.value)}
          onKeyDown={(e) => toucheSpeciale(i, e)}
          onPaste={(e) => {
            e.preventDefault();
            ecrire(i, e.clipboardData.getData("text"));
          }}
          onFocus={(e) => e.target.select()}
        />
      ))}
    </div>
  );
}
