import { BsSpeedometer2, BsTagFill, BsSlashCircle } from "react-icons/bs";
import "./jour.css";

/**
 * Régime JIRAMA du locataire.
 *
 * Trois situations s'excluent, et une case à cocher doublée d'un champ de
 * montant ne savait pas les dire : on pouvait cocher « ne paie pas » tout en
 * laissant un forfait rempli, deux réglages qui se contredisent.
 *
 *   COMPTEUR — facturé sur le relevé de son compteur individuel
 *   FORFAIT  — montant fixe chaque mois, le relevé ne prime que s'il dépasse
 *   HORS     — bail sans eau ni électricité, rien ne lui est jamais réclamé
 *
 * Le composant expose les deux champs du modèle (`jiramaForfait` et
 * `jiramaNonSoumis`) via le même `onChange` que les autres champs du
 * formulaire, et garantit qu'ils restent cohérents entre eux.
 */
const OPTIONS = [
  {
    cle: "COMPTEUR",
    titre: "Au compteur",
    detail: "Facturé sur son relevé",
    Icon: BsSpeedometer2,
  },
  {
    cle: "FORFAIT",
    titre: "Forfait mensuel",
    detail: "Montant fixe, surplus au relevé",
    Icon: BsTagFill,
  },
  {
    cle: "HORS",
    titre: "Hors bail",
    detail: "Ne paie pas le JIRAMA",
    Icon: BsSlashCircle,
  },
];

export default function JiramaPicker({ forfait, nonSoumis, onChange }) {
  const regime = nonSoumis ? "HORS" : Number(forfait) > 0 ? "FORFAIT" : "COMPTEUR";

  // Un seul régime à la fois : choisir l'un neutralise les autres réglages.
  function choisir(cle) {
    if (cle === "HORS") {
      onChange({ target: { name: "jiramaNonSoumis", value: true } });
      onChange({ target: { name: "jiramaForfait", value: "" } });
      return;
    }
    onChange({ target: { name: "jiramaNonSoumis", value: false } });
    onChange({
      target: { name: "jiramaForfait", value: cle === "FORFAIT" ? forfait || 10000 : "" },
    });
  }

  return (
    <div>
      <div className="mode-paiement jirama-regime">
        {OPTIONS.map(({ cle, titre, detail, Icon }) => (
          <button
            key={cle}
            type="button"
            className={`mode-option ${regime === cle ? "actif" : ""}`}
            onClick={() => choisir(cle)}
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

      {regime === "FORFAIT" && (
        <div className="jirama-forfait">
          <label className="form-label mb-1">Montant du forfait (Ar / mois)</label>
          <input
            type="number"
            name="jiramaForfait"
            min="0"
            step="500"
            className="form-control form-control-sm"
            style={{ maxWidth: 180 }}
            placeholder="10000"
            value={forfait ?? ""}
            onChange={onChange}
          />
          <small className="text-muted">
            Dû chaque mois sans relevé. Si son compteur dépasse ce montant,
            c'est le relevé qui fait foi.
          </small>
        </div>
      )}

      {regime === "HORS" && (
        <div className="jirama-note">
          Son bail ne comprend ni eau ni électricité : rien ne lui sera jamais
          réclamé à ce titre, et il n'apparaîtra pas dans les relances.
        </div>
      )}
    </div>
  );
}
