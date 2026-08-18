import { useState, useEffect, useRef } from "react";

/**
 * Cellule éditable sur place. MODULE TEMPORAIRE (voir budget.otip.js).
 *
 * Un budget se corrige valeur par valeur, souvent d'un chiffre : ouvrir une
 * fenêtre pour changer « 6954 » en « 6900 » serait disproportionné. On clique
 * dans la cellule, on tape, on sort — comme dans le tableur d'origine.
 *
 * Entrée valide, Échap annule, la perte du focus valide aussi : c'est le
 * réflexe du tableur, et cela évite de perdre une saisie en cliquant ailleurs.
 * Rien n'est envoyé si la valeur n'a pas bougé.
 */
export default function Cellule({
  valeur,
  onSave,
  type = "texte",
  options,
  placeholder = "—",
  suffixe = "",
  aligne = "left",
  fort = false,
}) {
  const [edition, setEdition] = useState(false);
  const [brouillon, setBrouillon] = useState("");
  const champ = useRef(null);

  useEffect(() => {
    if (edition && champ.current) {
      champ.current.focus();
      if (champ.current.select) champ.current.select();
    }
  }, [edition]);

  const ouvrir = () => {
    setBrouillon(valeur === null || valeur === undefined ? "" : String(valeur));
    setEdition(true);
  };

  const valider = () => {
    setEdition(false);
    const avant = valeur === null || valeur === undefined ? "" : String(valeur);
    if (brouillon === avant) return; // rien n'a bougé : pas d'aller-retour serveur
    onSave(type === "nombre" ? Number(brouillon) || 0 : brouillon);
  };

  const auClavier = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      valider();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setEdition(false); // on abandonne la saisie
    }
  };

  if (edition) {
    if (type === "liste") {
      return (
        <select
          ref={champ}
          className="otip-saisie"
          value={brouillon}
          onChange={(e) => setBrouillon(e.target.value)}
          onBlur={valider}
          onKeyDown={auClavier}
        >
          <option value="">—</option>
          {(options || []).map((o) => (
            <option key={o.valeur ?? o} value={o.valeur ?? o}>
              {o.label ?? o}
            </option>
          ))}
        </select>
      );
    }
    return (
      <input
        ref={champ}
        className="otip-saisie"
        type={type === "nombre" ? "number" : type === "date" ? "date" : "text"}
        step={type === "nombre" ? "0.01" : undefined}
        value={brouillon}
        onChange={(e) => setBrouillon(e.target.value)}
        onBlur={valider}
        onKeyDown={auClavier}
        style={{ textAlign: type === "nombre" ? "right" : aligne }}
      />
    );
  }

  const vide = valeur === null || valeur === undefined || valeur === "";
  const affiche =
    type === "nombre"
      ? Number(valeur || 0).toLocaleString("fr-FR")
      : type === "liste"
        ? (options || []).find((o) => (o.valeur ?? o) === valeur)?.label ?? valeur
        : valeur;

  return (
    <button
      type="button"
      className={`otip-cellule ${vide ? "vide" : ""} ${fort ? "fort" : ""}`}
      onClick={ouvrir}
      title="Cliquer pour modifier"
      style={{ textAlign: type === "nombre" ? "right" : aligne }}
    >
      {vide ? placeholder : affiche}
      {!vide && suffixe ? <span className="otip-suffixe"> {suffixe}</span> : null}
    </button>
  );
}
