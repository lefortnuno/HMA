import { BsArrowRightCircle, BsArrowLeftCircle } from "react-icons/bs";
import "./jour.css";

/**
 * Sens du règlement d'un locataire.
 *
 *  ECHU   — il consomme puis il paie : le loyer de juillet se règle en août.
 *  AVANCE — il paie puis il consomme : le loyer de juillet se règle en juillet.
 *
 * Le choix conditionne les mois comptés comme « à recouvrer ».
 */
const OPTIONS = [
  {
    cle: "ECHU",
    titre: "Après consommation",
    detail: "Le loyer du mois se règle le mois suivant",
    Icon: BsArrowRightCircle,
  },
  {
    cle: "AVANCE",
    titre: "D'avance",
    detail: "Le loyer du mois se règle dans le mois même",
    Icon: BsArrowLeftCircle,
  },
];

export default function ModePaiementPicker({ value, onChange, name = "modePaiement" }) {
  const actuel = String(value || "ECHU").toUpperCase() === "AVANCE" ? "AVANCE" : "ECHU";

  return (
    <div className="mode-paiement">
      {OPTIONS.map(({ cle, titre, detail, Icon }) => (
        <button
          key={cle}
          type="button"
          className={`mode-option ${actuel === cle ? "actif" : ""}`}
          onClick={() => onChange({ target: { name, value: cle } })}
          title={detail}
        >
          <Icon size={14} className="mode-icone" />
          <span className="mode-texte">
            <span className="mode-titre">{titre}</span>
            <span className="mode-detail">{detail}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
