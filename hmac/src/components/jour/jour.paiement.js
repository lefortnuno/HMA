import { useState, useRef, useEffect } from "react";
import { BsCalendarCheck, BsChevronDown, BsXLg } from "react-icons/bs";
import "./jour.css";

const PANNEAU_H = 260; // hauteur approchee du panneau, pour choisir le sens d ouverture

/**
 * Choix du jour de règlement habituel (1 à 31).
 *
 * Une liste déroulante native de 31 lignes est longue et peu lisible :
 * on présente les jours en grille, façon calendrier, dans un panneau compact.
 */
export default function JourPaiementPicker({ value, onChange, name = "jourPaiement" }) {
  const [ouvert, setOuvert] = useState(false);
  const [versLeHaut, setVersLeHaut] = useState(false);
  const boite = useRef(null);
  const jour = Number(value) || 0;

  // Les modales ont un `overflow: hidden` : si le panneau ne tient pas
  // en dessous du bouton, on le bascule au-dessus pour ne pas le rogner.
  const basculer = () => {
    if (!ouvert && boite.current) {
      const r = boite.current.getBoundingClientRect();
      setVersLeHaut(r.bottom + PANNEAU_H > window.innerHeight && r.top > PANNEAU_H);
    }
    setOuvert((o) => !o);
  };

  // Fermeture au clic extérieur et à la touche Échap.
  useEffect(() => {
    if (!ouvert) return;
    const dehors = (e) => {
      if (boite.current && !boite.current.contains(e.target)) setOuvert(false);
    };
    const echap = (e) => e.key === "Escape" && setOuvert(false);
    document.addEventListener("mousedown", dehors);
    document.addEventListener("keydown", echap);
    return () => {
      document.removeEventListener("mousedown", dehors);
      document.removeEventListener("keydown", echap);
    };
  }, [ouvert]);

  const choisir = (j) => {
    onChange({ target: { name, value: j === 0 ? "" : String(j) } });
    setOuvert(false);
  };

  return (
    <div className="jour-picker" ref={boite}>
      <button
        type="button"
        className={`jour-declencheur ${jour ? "rempli" : ""}`}
        onClick={basculer}
        title="Jour de règlement habituel"
      >
        <BsCalendarCheck size={13} className="jour-icone" />
        <span className="jour-valeur">{jour ? `le ${jour}` : "Non défini"}</span>
        <BsChevronDown size={10} className={`jour-fleche ${ouvert ? "ouverte" : ""}`} />
      </button>

      {ouvert && (
        <div className={`jour-panneau ${versLeHaut ? "vers-haut" : ""}`}>
          <div className="jour-entete">
            <span>Jour du mois</span>
            {jour > 0 && (
              <button type="button" className="jour-effacer" onClick={() => choisir(0)}>
                <BsXLg size={9} /> Effacer
              </button>
            )}
          </div>
          <div className="jour-grille">
            {Array.from({ length: 31 }, (_, i) => i + 1).map((j) => (
              <button
                key={j}
                type="button"
                className={`jour-case ${j === jour ? "actif" : ""}`}
                onClick={() => choisir(j)}
              >
                {j}
              </button>
            ))}
          </div>
          <div className="jour-pied">
            {jour ? `Règle habituellement le ${jour} de chaque mois` : "Aucun jour défini"}
          </div>
        </div>
      )}
    </div>
  );
}
