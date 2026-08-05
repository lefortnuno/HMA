import trofelL from "../../assets/images/trofel-l.png";
import "./provenance.css";

/**
 * Marque un montant comme reçu en main propre par le bailleur.
 *
 * Le logo lui-même fait office de témoin : allumé, la somme est arrivée entre
 * ses mains ; éteint, elle a été remise sur place et ne compte pas dans
 * l'encaisse. Plus lisible qu'une case à cocher, qui n'aurait rien dit de
 * *qui* a reçu l'argent.
 *
 * Reste un vrai bouton — focusable, actionnable au clavier, avec un état
 * annoncé — plutôt qu'une image cliquable.
 */
export default function LogoCheck({ actif, onToggle, disabled, titre }) {
  const libelle = disabled
    ? "Rien à encaisser"
    : actif
      ? `${titre} : reçu en main propre — cliquer si remis sur place`
      : `${titre} : remis sur place — cliquer si reçu en main propre`;

  return (
    <button
      type="button"
      className={`logo-check ${actif ? "actif" : "inactif"}`}
      onClick={disabled ? undefined : onToggle}
      disabled={disabled}
      role="switch"
      aria-checked={!!actif}
      aria-label={libelle}
      title={libelle}
    >
      <img src={trofelL} alt="" aria-hidden="true" />
    </button>
  );
}
