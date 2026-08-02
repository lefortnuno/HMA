import { useState, useRef, useEffect } from "react";
import { BsCalendar3, BsCalendarRange, BsChevronDown, BsChevronLeft, BsChevronRight } from "react-icons/bs";
import "./jour.css";

/**
 * Sélecteurs de mois et d'année, sur le même principe que le choix du jour de
 * règlement : un bouton compact, puis une grille dans un panneau.
 *
 * Une liste déroulante native oblige à figer les années possibles dans le
 * code — d'où les listes s'arrêtant à 2027 un peu partout. Ici l'année se
 * parcourt par pages de douze, sans borne.
 */

const MOIS_COURT = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
const MOIS_LONG = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];

// Ferme au clic extérieur et à la touche Échap.
function useFermeture(ouvert, fermer) {
  const boite = useRef(null);
  useEffect(() => {
    if (!ouvert) return;
    const dehors = (e) => {
      if (boite.current && !boite.current.contains(e.target)) fermer();
    };
    const echap = (e) => e.key === "Escape" && fermer();
    document.addEventListener("mousedown", dehors);
    document.addEventListener("keydown", echap);
    return () => {
      document.removeEventListener("mousedown", dehors);
      document.removeEventListener("keydown", echap);
    };
  }, [ouvert, fermer]);
  return boite;
}

const PANNEAU_H = 240;

// Bascule le panneau au-dessus du bouton quand la place manque en dessous.
function sensOuverture(boite) {
  if (!boite.current) return false;
  const r = boite.current.getBoundingClientRect();
  return r.bottom + PANNEAU_H > window.innerHeight && r.top > PANNEAU_H;
}

export function MoisPicker({ value, onChange, largeur = 118 }) {
  const [ouvert, setOuvert] = useState(false);
  const [versLeHaut, setVersLeHaut] = useState(false);
  const boite = useFermeture(ouvert, () => setOuvert(false));
  const mois = Number(value) || 0;

  const basculer = () => {
    if (!ouvert) setVersLeHaut(sensOuverture(boite));
    setOuvert((o) => !o);
  };

  const choisir = (m) => {
    onChange(m);
    setOuvert(false);
  };

  return (
    <div className="jour-picker" style={{ width: largeur }} ref={boite}>
      <button
        type="button"
        className={`jour-declencheur ${mois ? "rempli" : ""}`}
        onClick={basculer}
        title="Choisir le mois"
      >
        <BsCalendar3 size={13} className="jour-icone" />
        <span className="jour-valeur">{mois ? MOIS_LONG[mois - 1] : "Mois"}</span>
        <BsChevronDown size={10} className={`jour-fleche ${ouvert ? "ouverte" : ""}`} />
      </button>

      {ouvert && (
        <div className={`jour-panneau periode-panneau ${versLeHaut ? "vers-haut" : ""}`}>
          <div className="jour-entete">
            <span>Mois</span>
          </div>
          <div className="periode-grille">
            {MOIS_COURT.map((m, i) => (
              <button
                key={m}
                type="button"
                className={`periode-case ${i + 1 === mois ? "actif" : ""}`}
                onClick={() => choisir(i + 1)}
                title={MOIS_LONG[i]}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function AnneePicker({ value, onChange, largeur = 104 }) {
  const annee = Number(value) || new Date().getFullYear();
  const [ouvert, setOuvert] = useState(false);
  const [versLeHaut, setVersLeHaut] = useState(false);
  // Page de douze années, centrée au départ sur l'année choisie.
  const [debut, setDebut] = useState(annee - 5);
  const boite = useFermeture(ouvert, () => setOuvert(false));

  const basculer = () => {
    if (!ouvert) {
      setVersLeHaut(sensOuverture(boite));
      setDebut(annee - 5); // on revient toujours autour de l'année en cours
    }
    setOuvert((o) => !o);
  };

  const choisir = (a) => {
    onChange(a);
    setOuvert(false);
  };

  const annees = Array.from({ length: 12 }, (_, i) => debut + i);

  return (
    <div className="jour-picker" style={{ width: largeur }} ref={boite}>
      <button
        type="button"
        className="jour-declencheur rempli"
        onClick={basculer}
        title="Choisir l'année"
      >
        <BsCalendarRange size={13} className="jour-icone" />
        <span className="jour-valeur">{annee}</span>
        <BsChevronDown size={10} className={`jour-fleche ${ouvert ? "ouverte" : ""}`} />
      </button>

      {ouvert && (
        <div className={`jour-panneau periode-panneau ${versLeHaut ? "vers-haut" : ""}`}>
          <div className="jour-entete periode-nav">
            <button type="button" className="periode-fleche" onClick={() => setDebut((d) => d - 12)} title="Années précédentes">
              <BsChevronLeft size={10} />
            </button>
            <span>{annees[0]} – {annees[11]}</span>
            <button type="button" className="periode-fleche" onClick={() => setDebut((d) => d + 12)} title="Années suivantes">
              <BsChevronRight size={10} />
            </button>
          </div>
          <div className="periode-grille">
            {annees.map((a) => (
              <button
                key={a}
                type="button"
                className={`periode-case ${a === annee ? "actif" : ""}`}
                onClick={() => choisir(a)}
              >
                {a}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
