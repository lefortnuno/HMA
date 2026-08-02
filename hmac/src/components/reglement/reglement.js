import { useState, useEffect } from "react";
import axios from "../../contexts/api/axios";
import GetUserData from "../../contexts/api/udata";
import { toast } from "react-toastify";
import {
  BsJournalBookmarkFill, BsPlusLg, BsPencilFill, BsTrashFill,
  BsCashCoin, BsShieldLock, BsLightningCharge, BsCalendarCheck,
  BsReceipt, BsMoonStars, BsBrush, BsPeople, BsTools, BsPatchCheckFill,
  BsChevronDown, BsChevronUp,
} from "react-icons/bs";
import "./reglement.css";

/**
 * Règlement intérieur de la résidence.
 *
 * Affiché en tête de l'accueil, pour tout le monde — locataires compris.
 * L'admin gère les règles sur place ; les autres en proposent, et
 * l'admin valide (ou reformule) depuis ses notifications.
 */

// Chaque règle porte une clé d'icône ; on retombe sur un sceau par défaut.
const ICONES = {
  loyer: BsCashCoin,
  caution: BsShieldLock,
  jirama: BsLightningCharge,
  preavis: BsCalendarCheck,
  recu: BsReceipt,
  calme: BsMoonStars,
  proprete: BsBrush,
  visiteurs: BsPeople,
  degradation: BsTools,
};

const CHOIX_ICONES = [
  ["loyer", "Loyer"],
  ["caution", "Caution"],
  ["jirama", "Eau & électricité"],
  ["preavis", "Préavis"],
  ["recu", "Reçu"],
  ["calme", "Calme"],
  ["proprete", "Propreté"],
  ["visiteurs", "Visiteurs"],
  ["degradation", "Entretien"],
];

const formVide = { titre: "", texte: "", icone: "loyer", actif: true };

export default function Reglement() {
  const u_info = GetUserData();
  const estAdmin = String(localStorage.getItem("karazana")) === "1";

  const [regles, setRegles] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [deplie, setDeplie] = useState(false);
  const [edition, setEdition] = useState(null); // { id?, titre, texte, icone, actif }
  const [aSupprimer, setASupprimer] = useState(null);
  const [envoi, setEnvoi] = useState(false);

  useEffect(() => {
    charger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function charger() {
    axios
      .get("loyer/reglements", u_info.opts)
      .then((r) => setRegles(r.data || []))
      .catch(() => setRegles([]))
      .finally(() => setChargement(false));
  }

  function enregistrer(e) {
    e.preventDefault();
    if (!edition) return;
    setEnvoi(true);
    const corps = {
      titre: edition.titre,
      texte: edition.texte,
      icone: edition.icone,
      actif: edition.actif,
    };
    const req = edition.id
      ? axios.put(`loyer/reglements/${edition.id}`, corps, u_info.opts)
      : axios.post("loyer/reglements", corps, u_info.opts);
    req
      .then((res) => {
        if (res.status === 202) {
          toast.info(res.data.message || "Proposition envoyée pour validation.");
        } else {
          toast.success(edition.id ? "Règle mise à jour" : "Règle ajoutée");
          charger();
        }
        setEdition(null);
      })
      .catch((err) => toast.error(err.response?.data?.message || "Erreur d'enregistrement"))
      .finally(() => setEnvoi(false));
  }

  function supprimer() {
    if (!aSupprimer) return;
    axios
      .delete(`loyer/reglements/${aSupprimer.id}`, u_info.opts)
      .then((res) => {
        if (res.status === 202) {
          toast.info(res.data.message || "Demande envoyée pour validation.");
        } else {
          toast.success("Règle retirée");
          setRegles((prev) => prev.filter((r) => r.id !== aSupprimer.id));
        }
        setASupprimer(null);
      })
      .catch((err) => toast.error(err.response?.data?.message || "Erreur de suppression"));
  }

  if (chargement || regles.length === 0) {
    // Rien à afficher tant qu'aucune règle n'est publiée.
    if (!chargement && !estAdmin) return null;
    if (chargement) return null;
  }

  const trop = regles.length > 3;

  return (
    <>
      <section className="reglement-bloc">
        <div className="reglement-entete">
          <div className="reglement-titre">
            <span className="reglement-sceau"><BsJournalBookmarkFill /></span>
            <div style={{ minWidth: 0 }}>
              <h2>Règlement de la résidence</h2>
              <p>
                {regles.length} règle{regles.length > 1 ? "s" : ""} en vigueur ·
                {estAdmin
                  ? " modifiable à tout moment"
                  : " une proposition ? elle sera étudiée"}
              </p>
            </div>
          </div>
          <div className="reglement-actions">
            {trop && (
              <button
                type="button"
                className="reglement-btn"
                onClick={() => setDeplie((d) => !d)}
              >
                {deplie ? <BsChevronUp /> : <BsChevronDown />}
                {deplie ? "Replier" : `Voir les ${regles.length}`}
              </button>
            )}
            <button
              type="button"
              className="reglement-btn principal"
              onClick={() => setEdition({ ...formVide })}
            >
              <BsPlusLg />
              {estAdmin ? "Ajouter une règle" : "Proposer une règle"}
            </button>
          </div>
        </div>

        {regles.length === 0 ? (
          <p className="reglement-vide">
            Aucune règle publiée pour l'instant. Ajoutez-en une pour que chacun
            sache à quoi s'en tenir.
          </p>
        ) : (
          <div className={`reglement-grille ${!deplie && trop ? "repliee" : ""}`}>
            {regles.map((r, i) => {
              const Icone = ICONES[r.icone] || BsPatchCheckFill;
              return (
                <article
                  key={r.id}
                  className={`regle-carte ${r.actif ? "" : "inactive"}`}
                >
                  <span className="regle-icone"><Icone /></span>
                  <div className="regle-corps">
                    <div className="regle-titre">
                      <span className="regle-num">{String(i + 1).padStart(2, "0")}</span>
                      {r.titre}
                    </div>
                    <p className="regle-texte">{r.texte}</p>
                    {!r.actif && <span className="regle-badge-inactif">Désactivée</span>}
                  </div>
                  {estAdmin && (
                    <div className="regle-outils">
                      <button
                        type="button"
                        className="regle-outil"
                        title="Modifier la formulation"
                        onClick={() =>
                          setEdition({
                            id: r.id,
                            titre: r.titre,
                            texte: r.texte,
                            icone: r.icone || "loyer",
                            actif: !!r.actif,
                          })
                        }
                      >
                        <BsPencilFill />
                      </button>
                      <button
                        type="button"
                        className="regle-outil danger"
                        title="Retirer la règle"
                        onClick={() => setASupprimer(r)}
                      >
                        <BsTrashFill />
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}

        {!estAdmin && regles.length > 0 && (
          <div className="reglement-pied">
            Une règle vous semble injuste ou incomplète ? Proposez-en une : le
            propriétaire la lira et pourra l'adopter.
          </div>
        )}
      </section>

      {/* ── Ajout / modification ── */}
      {edition && (
        <div className="modal-overlay" onClick={() => setEdition(null)}>
          <div className="modal-content-pro" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-pro">
              <h6>
                <BsJournalBookmarkFill className="me-2" />
                {edition.id
                  ? "Modifier la règle"
                  : estAdmin
                    ? "Nouvelle règle"
                    : "Proposer une règle"}
              </h6>
              <button className="btn-close" onClick={() => setEdition(null)} />
            </div>
            <form onSubmit={enregistrer} className="p-4">
              {!estAdmin && (
                <div
                  className="rounded-3 p-2 mb-3"
                  style={{ background: "#eff6ff", border: "1px solid #bfdbfe" }}
                >
                  <small style={{ fontSize: "0.76rem", color: "#1e40af" }}>
                    Votre proposition part chez le propriétaire. Il peut l'adopter
                    telle quelle ou en reformuler le texte avant publication.
                  </small>
                </div>
              )}

              <div className="mb-3">
                <label className="form-label">Titre de la règle *</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  maxLength={160}
                  placeholder="Ex. : Calme de 22 h à 6 h"
                  value={edition.titre}
                  onChange={(e) => setEdition({ ...edition, titre: e.target.value })}
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Explication *</label>
                <textarea
                  className="form-control form-control-sm"
                  rows={4}
                  maxLength={2000}
                  placeholder="Dites pourquoi cette règle existe : elle sera mieux respectée."
                  value={edition.texte}
                  onChange={(e) => setEdition({ ...edition, texte: e.target.value })}
                />
                <small className="text-muted" style={{ fontSize: "0.72rem" }}>
                  {edition.texte.length}/2000
                </small>
              </div>

              <div className="mb-3">
                <label className="form-label">Illustration</label>
                <select
                  className="form-select form-select-sm"
                  value={edition.icone}
                  onChange={(e) => setEdition({ ...edition, icone: e.target.value })}
                >
                  {CHOIX_ICONES.map(([cle, label]) => (
                    <option key={cle} value={cle}>{label}</option>
                  ))}
                </select>
              </div>

              {estAdmin && (
                <label className="d-flex align-items-center gap-2 mb-3" style={{ cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={edition.actif}
                    onChange={(e) => setEdition({ ...edition, actif: e.target.checked })}
                  />
                  <span style={{ fontSize: "0.82rem" }}>
                    Publiée — visible des locataires
                  </span>
                </label>
              )}

              <div className="d-flex justify-content-end gap-2">
                <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setEdition(null)}>
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={envoi || !edition.titre.trim() || !edition.texte.trim()}
                >
                  {envoi ? "..." : edition.id ? "Enregistrer" : estAdmin ? "Publier" : "Proposer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Retrait d'une règle ── */}
      {aSupprimer && (
        <div className="modal-overlay" onClick={() => setASupprimer(null)}>
          <div className="modal-content-pro" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-pro">
              <h6><BsTrashFill className="me-2" />Retirer cette règle ?</h6>
              <button className="btn-close" onClick={() => setASupprimer(null)} />
            </div>
            <div className="p-4">
              <p style={{ fontSize: "0.86rem" }}>
                <strong>{aSupprimer.titre}</strong>
              </p>
              <p className="text-muted" style={{ fontSize: "0.8rem" }}>
                Elle disparaîtra de l'accueil de tous les locataires.
              </p>
              <div className="d-flex justify-content-end gap-2">
                <button className="btn btn-outline-secondary btn-sm" onClick={() => setASupprimer(null)}>
                  Annuler
                </button>
                <button className="btn btn-danger btn-sm" onClick={supprimer}>
                  Retirer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
