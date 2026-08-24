import { useState, useMemo } from "react";
import {
  BsBellFill, BsXLg, BsWhatsapp, BsMessenger, BsCheck2,
  BsInfoCircle, BsArrowCounterclockwise,
} from "react-icons/bs";
import { copierEtOuvrirMessenger, extraireMessengerId } from "../../config/contact";
import { estAvance } from "../../config/echeance";
import { MOIS_LONG } from "../../config/dates";
import "./rappel.css";

/**
 * Rappel amical de fin de mois.
 *
 * Ce n'est pas une relance : personne n'est en retard ici. Le message
 * prévient simplement que l'échéance approche, pour laisser à chacun le
 * temps de s'organiser. Le ton en découle — aucune somme réclamée, aucune
 * date butoir, aucun reproche.
 *
 * Rien n'est envoyé par l'application : chaque bouton ouvre la conversation
 * avec le message déjà écrit, et c'est le bailleur qui appuie sur « envoyer ».
 */

// Le message par défaut. Modifiable avant l'envoi : les jetons entre
// accolades sont remplacés pour chaque locataire.
const MODELE_DEFAUT = `Bonjour {nom},

J'espère que vous allez bien.

Petit rappel tout simple : la fin du mois approche, et le loyer {deMois} ({montant} Ar) arrivera bientôt à échéance{jour}.

Rien à faire dans l'immédiat — c'est juste pour vous laisser le temps de vous organiser tranquillement.

Merci, et bonne journée !
— Trofel`;

/**
 * « de Juillet », mais « d'Août ».
 *
 * Sans cela le message disait « le loyer de Août », qui se remarque
 * immediatement dans un texte qu'on veut soigne.
 */
function deMois(nom) {
  return /^[AEIOUÉÈÀ]/i.test(nom) ? `d'${nom}` : `de ${nom}`;
}

const JETONS = [
  ["{nom}", "le nom du locataire"],
  ["{chambre}", "le numéro de chambre"],
  ["{montant}", "le loyer, en ariary"],
  ["{mois}", "le mois concerné"],
  ["{deMois}", "« d'Août », « de Juillet » — avec l'élision"],
  ["{jour}", "« vers le 15 » si un jour habituel est enregistré"],
];

export default function RappelLoyer({ locataires, getCellData, mois, annee, onClose }) {
  const [modele, setModele] = useState(MODELE_DEFAUT);
  const [masquerPayes, setMasquerPayes] = useState(true);
  const [envoyes, setEnvoyes] = useState({});
  const [apercu, setApercu] = useState(null);

  /**
   * Mois que le locataire s'apprête à régler.
   *
   * Il dépend du sens de règlement : celui qui paie d'avance prépare le mois
   * suivant, celui qui paie à terme échu solde celui qui s'achève. Se
   * tromper là-dessus rendrait le rappel confus.
   */
  function moisConcerne(loc) {
    const m = estAvance(loc) ? mois + 1 : mois;
    return m > 12 ? { mois: 1, annee: annee + 1 } : { mois: m, annee };
  }

  const lignes = useMemo(() => {
    return (locataires || [])
      .filter((l) => l.actif)
      .map((loc) => {
        const cible = moisConcerne(loc);
        const p = getCellData(loc.id, cible.mois);
        const paye = p && p.statut === "PAYE";
        // Uniquement si un jour habituel est reellement enregistre :
        // `jourReglement` retombe sur 1 par defaut, ce qui inventerait
        // une habitude que le locataire n'a pas.
        const jour = Number(loc.jourPaiement) || 0;
        const texte = modele
          .replaceAll("{nom}", `${loc.nom} ${loc.prenom || ""}`.trim())
          .replaceAll("{chambre}", loc.chambre || "")
          .replaceAll("{montant}", Number(loc.loyer || 0).toLocaleString("fr-FR"))
          .replaceAll("{deMois}", deMois(MOIS_LONG[cible.mois - 1]))
          .replaceAll("{mois}", MOIS_LONG[cible.mois - 1])
          .replaceAll("{jour}", jour ? `, vers le ${jour} comme d'habitude` : "");
        return { loc, paye, texte, moisCible: MOIS_LONG[cible.mois - 1] };
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locataires, modele, mois, annee]);

  const visibles = masquerPayes ? lignes.filter((l) => !l.paye) : lignes;
  const nbPayes = lignes.filter((l) => l.paye).length;

  const numeroWhatsApp = (tel) =>
    String(tel || "").replace(/\s+/g, "").replace(/^\+/, "");

  function ouvrirWhatsApp(ligne) {
    const num = numeroWhatsApp(ligne.loc.tel);
    if (!num) return;
    window.open(
      `https://wa.me/${num}?text=${encodeURIComponent(ligne.texte)}`,
      "_blank",
      "noopener",
    );
    setEnvoyes((e) => ({ ...e, [ligne.loc.id]: "WhatsApp" }));
  }

  function ouvrirMessenger(ligne) {
    // Messenger n'accepte pas de message pré-rempli : on copie le texte et
    // on ouvre la conversation, il ne reste qu'à coller.
    copierEtOuvrirMessenger(ligne.texte, ligne.loc.nom, ligne.loc.messengerId);
    setEnvoyes((e) => ({ ...e, [ligne.loc.id]: "Messenger" }));
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content-pro rappel-modale"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titre-rappel"
      >
        <div className="modal-header-pro">
          <h6 id="titre-rappel">
            <BsBellFill className="me-2" /> Rappel de fin de mois
          </h6>
          <button className="btn-close" aria-label="Fermer" onClick={onClose} />
        </div>

        <div className="rappel-corps">
          {/* Le message, modifiable avant tout envoi */}
          <div className="rappel-modele">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
              <label className="fw-semibold mb-0" style={{ fontSize: "0.85rem" }}>
                Message envoyé à chacun
              </label>
              {modele !== MODELE_DEFAUT && (
                <button
                  className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1"
                  onClick={() => setModele(MODELE_DEFAUT)}
                >
                  <BsArrowCounterclockwise size={12} /> Rétablir
                </button>
              )}
            </div>
            <textarea
              className="form-control rappel-zone"
              rows={9}
              value={modele}
              onChange={(e) => setModele(e.target.value)}
            />
            <div className="rappel-jetons">
              {JETONS.map(([jeton, aide]) => (
                <span key={jeton} title={aide}>{jeton}</span>
              ))}
            </div>
          </div>

          {/* Les destinataires */}
          <div className="rappel-liste">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
              <span className="fw-semibold" style={{ fontSize: "0.85rem" }}>
                {visibles.length} destinataire{visibles.length > 1 ? "s" : ""}
              </span>
              {nbPayes > 0 && (
                <label className="rappel-bascule">
                  <input
                    type="checkbox"
                    checked={masquerPayes}
                    onChange={(e) => setMasquerPayes(e.target.checked)}
                  />
                  Masquer ceux qui ont déjà payé ({nbPayes})
                </label>
              )}
            </div>

            {/* Rappeler l'échéance à quelqu'un qui vient de régler serait
                maladroit : on l'écarte par défaut, sans l'interdire. */}
            <div className="rappel-note">
              <BsInfoCircle size={13} />
              <span>
                Rien n'est envoyé automatiquement. Chaque bouton ouvre la
                conversation avec le message prêt — vous appuyez sur envoyer.
              </span>
            </div>

            {visibles.length === 0 ? (
              <p className="text-muted text-center py-4 mb-0" style={{ fontSize: "0.85rem" }}>
                Tout le monde a déjà réglé — personne à relancer.
              </p>
            ) : (
              <ul className="rappel-destinataires">
                {visibles.map((ligne) => {
                  const { loc } = ligne;
                  const aTel = !!numeroWhatsApp(loc.tel);
                  const aMessenger = !!extraireMessengerId(loc.messengerId);
                  const envoye = envoyes[loc.id];
                  return (
                    <li
                      key={loc.id}
                      className={envoye ? "envoye" : ""}
                      onMouseEnter={() => setApercu(ligne)}
                      onFocus={() => setApercu(ligne)}
                    >
                      <div className="rappel-qui">
                        <span className={loc.etage === "RDC" ? "badge-rdc" : "badge-1er"}>
                          {loc.chambre}
                        </span>
                        <div>
                          <div className="fw-semibold" style={{ fontSize: "0.85rem" }}>
                            {loc.nom} {loc.prenom}
                          </div>
                          <small className="text-muted" style={{ fontSize: "0.72rem" }}>
                            {Number(loc.loyer || 0).toLocaleString("fr-FR")} Ar ·{" "}
                            {ligne.moisCible}
                            {ligne.paye && " · déjà payé"}
                          </small>
                        </div>
                      </div>

                      <div className="rappel-actions">
                        {envoye && (
                          // Le canal est deja dit par le bouton d'a cote :
                          // repeter "WhatsApp" ici se lisait deux fois.
                          <span className="rappel-fait" title={`Conversation ouverte sur ${envoye}`}>
                            <BsCheck2 size={13} /> Ouvert
                          </span>
                        )}
                        <button
                          className="btn btn-sm rappel-wa"
                          onClick={() => ouvrirWhatsApp(ligne)}
                          disabled={!aTel}
                          title={
                            aTel
                              ? `Ouvrir WhatsApp avec le message prêt (${loc.tel})`
                              : "Aucun numéro enregistré pour ce locataire"
                          }
                        >
                          <BsWhatsapp /> WhatsApp
                        </button>
                        <button
                          className="btn btn-sm rappel-me"
                          onClick={() => ouvrirMessenger(ligne)}
                          disabled={!aMessenger}
                          title={
                            aMessenger
                              ? "Copier le message et ouvrir la conversation Messenger"
                              : "Aucun lien Messenger enregistré pour ce locataire"
                          }
                        >
                          <BsMessenger /> Messenger
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Aperçu réel du message, tel qu'il partira */}
          <div className="rappel-apercu">
            <div className="fw-semibold mb-2" style={{ fontSize: "0.8rem" }}>
              {apercu
                ? `Aperçu — ${apercu.loc.nom}`
                : "Aperçu — survolez un destinataire"}
            </div>
            <pre className="rappel-texte">
              {apercu ? apercu.texte : visibles[0]?.texte || modele}
            </pre>
          </div>
        </div>

        <div className="rappel-pied">
          <button
            className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-1"
            onClick={onClose}
          >
            <BsXLg /> Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
