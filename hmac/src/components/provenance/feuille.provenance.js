import { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import axios from "../../contexts/api/axios";
import GetUserData from "../../contexts/api/udata";
import { BsWallet2, BsCheckCircleFill, BsExclamationTriangleFill, BsInfoCircle } from "react-icons/bs";
import LogoCheck from "./logo.check";
import "./provenance.css";

const MOIS_FULL = ["","Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const REGLE = ["PAYE", "PARTIEL"];

/**
 * Feuille de provenance du mois.
 *
 * Le tableau des paiements dit qui a payé. Celui-ci répond à une autre
 * question, que rien ne traçait jusqu'ici : combien le bailleur a-t-il
 * réellement eu entre les mains ? Un loyer réglé sur place est bien encaissé
 * par la maison, mais pas par lui — et c'est cet écart qui, en fin de mois,
 * explique un solde qui ne tombe pas juste.
 *
 * D'où le témoin par ligne, les frais éventuels, et surtout la confrontation
 * finale entre le total attendu et la somme réellement reçue.
 */
export default function FeuilleProvenance({ mois, annee, bienId, paiements, provenance, onChange }) {
  const u_info = GetUserData();
  const [lignes, setLignes] = useState(paiements || []);
  const [frais, setFrais] = useState({ libelle: "", montant: "" });
  const [sommeRecue, setSommeRecue] = useState("");
  const [enregistre, setEnregistre] = useState(false);
  // Dernier état connu du serveur. Comparer à cette empreinte plutôt que de
  // guetter le premier rendu : les champs sont remplis par un effet, donc le
  // rendu suivant ressemble à une saisie et déclenchait un enregistrement à
  // vide dès l'ouverture de la page — et à chaque changement de mois.
  const dernierEnvoi = useRef("");

  // Les paiements arrivent du parent : on les recopie pour pouvoir basculer un
  // témoin sans attendre l'aller-retour serveur.
  useEffect(() => setLignes(paiements || []), [paiements]);

  useEffect(() => {
    const libelle = provenance?.fraisLibelle || "";
    const montant = provenance?.fraisMontant ? String(provenance.fraisMontant) : "";
    const recue =
      provenance?.sommeRecue === null || provenance?.sommeRecue === undefined
        ? ""
        : String(provenance.sommeRecue);
    setFrais({ libelle, montant });
    setSommeRecue(recue);
    dernierEnvoi.current = JSON.stringify([libelle, montant, recue]);
  }, [provenance, mois, annee, bienId]);

  // Enregistrement différé : on ne part pas au serveur à chaque frappe, et
  // jamais si rien n'a bougé depuis ce que le serveur nous a donné.
  useEffect(() => {
    const empreinte = JSON.stringify([frais.libelle, frais.montant, sommeRecue]);
    if (empreinte === dernierEnvoi.current) return;
    const t = setTimeout(() => {
      axios
        .post(
          "loyer/provenance",
          {
            mois, annee, bienId,
            fraisLibelle: frais.libelle,
            fraisMontant: Number(frais.montant) || 0,
            sommeRecue: sommeRecue === "" ? null : Number(sommeRecue),
          },
          u_info.opts
        )
        .then(() => {
          dernierEnvoi.current = empreinte;
          setEnregistre(true);
          setTimeout(() => setEnregistre(false), 1800);
        })
        .catch(() => toast.error("Enregistrement impossible"));
    }, 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frais.libelle, frais.montant, sommeRecue]);

  function basculer(ligne, champ) {
    const nouvelle = ligne[champ] ? 0 : 1;
    // Optimiste : le témoin répond au clic, on corrige si le serveur refuse.
    setLignes((ls) => ls.map((l) => (l.id === ligne.id ? { ...l, [champ]: nouvelle } : l)));
    axios
      .put(`loyer/paiements/${ligne.id}/provenance`, { [champ]: nouvelle }, u_info.opts)
      .then(() => onChange && onChange())
      .catch(() => {
        setLignes((ls) => ls.map((l) => (l.id === ligne.id ? { ...l, [champ]: ligne[champ] } : l)));
        toast.error("Modification refusée");
      });
  }

  // ── Totaux ───────────────────────────────────────────────────────────────
  const montantLoyer = (p) => (REGLE.includes(p.statut) ? p.montantLoyer || 0 : 0);
  const montantJirama = (p) => (REGLE.includes(p.statutJIRAMA) ? p.montantJIRAMA || 0 : 0);

  const encLoyer = lignes.reduce((s, p) => s + (p.loyerRecuParMoi ? montantLoyer(p) : 0), 0);
  const encJirama = lignes.reduce((s, p) => s + (p.jiramaRecuParMoi ? montantJirama(p) : 0), 0);
  const relLoyer = lignes.reduce((s, p) => s + montantLoyer(p), 0);
  const relJirama = lignes.reduce((s, p) => s + montantJirama(p), 0);
  const horsMain = relLoyer + relJirama - encLoyer - encJirama;

  const fraisNum = Number(frais.montant) || 0;
  const attendu = encLoyer + encJirama + fraisNum;
  const recu = sommeRecue === "" ? null : Number(sommeRecue);
  const ecart = recu === null ? null : recu - attendu;

  // ── Remarque ─────────────────────────────────────────────────────────────
  let etat = "attente";
  let Icone = BsInfoCircle;
  let remarque = (
    <>
      Saisissez la somme que vous avez réellement reçue pour la confronter au
      total attendu de <strong>{attendu.toLocaleString()} Ar</strong>.
    </>
  );
  if (ecart !== null) {
    if (ecart === 0) {
      etat = "accord";
      Icone = BsCheckCircleFill;
      remarque = (
        <>
          Le compte est bon : vous avez reçu exactement les{" "}
          <strong>{attendu.toLocaleString()} Ar</strong> attendus pour{" "}
          {MOIS_FULL[mois]} {annee}. Rien à réclamer.
        </>
      );
    } else if (ecart < 0) {
      etat = "ecart";
      Icone = BsExclamationTriangleFill;
      remarque = (
        <>
          Il manque <strong>{Math.abs(ecart).toLocaleString()} Ar</strong> : vous
          attendiez {attendu.toLocaleString()} Ar et n'avez reçu que{" "}
          {recu.toLocaleString()} Ar.{" "}
          {horsMain > 0
            ? `À vérifier auprès de qui a encaissé sur place — ${horsMain.toLocaleString()} Ar ne sont pas passés par vous ce mois-ci.`
            : "Tout était pourtant censé vous revenir directement : à confirmer avec les locataires concernés."}
        </>
      );
    } else {
      etat = "ecart";
      Icone = BsExclamationTriangleFill;
      remarque = (
        <>
          Vous avez reçu <strong>{ecart.toLocaleString()} Ar de plus</strong> que
          les {attendu.toLocaleString()} Ar attendus. Sans doute un reliquat d'un
          mois précédent, ou des frais non encore saisis ci-dessus.
        </>
      );
    }
  }

  return (
    <div className="card-pro">
      <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-1">
        <div>
          <h6 className="fw-bold mb-1 d-flex align-items-center gap-2">
            <BsWallet2 /> Provenance — {MOIS_FULL[mois]} {annee}
          </h6>
          <p className="text-muted mb-0" style={{ fontSize: "0.78rem" }}>
            Le logo allumé signale une somme reçue en main propre. Éteint, elle a
            été réglée sur place et ne compte pas dans votre encaisse.
          </p>
        </div>
        {enregistre && (
          <span className="badge-paye" style={{ fontSize: "0.68rem" }}>
            Enregistré
          </span>
        )}
      </div>

      {lignes.length === 0 ? (
        <p className="text-muted text-center py-4 mb-0">
          Aucun paiement enregistré pour ce mois.
        </p>
      ) : (
        <>
          <div className="table-responsive">
            <table className="prov-table">
              <thead>
                <tr>
                  <th>Locataire</th>
                  <th className="text-end">Loyer</th>
                  <th className="text-end">JIRAMA</th>
                  <th className="text-center">Statut</th>
                </tr>
              </thead>
              <tbody>
                {lignes.map((p) => {
                  const ml = montantLoyer(p);
                  const mj = montantJirama(p);
                  return (
                    <tr key={p.id}>
                      <td>
                        <span
                          className={p.etage === "RDC" ? "badge-rdc" : "badge-1er"}
                          style={{ marginRight: 6 }}
                        >
                          {p.chambre}
                        </span>
                        <span className="fw-semibold">{p.nom}</span>
                      </td>
                      <td>
                        <div className={`prov-montant ${ml && !p.loyerRecuParMoi ? "hors" : ""}`}>
                          <span className={`somme ${ml ? "" : "nulle"}`}>
                            {ml ? ml.toLocaleString() : "—"}
                          </span>
                          <LogoCheck
                            actif={!!p.loyerRecuParMoi}
                            disabled={!ml}
                            titre={`Loyer de ${p.nom}`}
                            onToggle={() => basculer(p, "loyerRecuParMoi")}
                          />
                        </div>
                      </td>
                      <td>
                        <div className={`prov-montant ${mj && !p.jiramaRecuParMoi ? "hors" : ""}`}>
                          <span className={`somme ${mj ? "" : "nulle"}`}>
                            {mj ? mj.toLocaleString() : "—"}
                          </span>
                          <LogoCheck
                            actif={!!p.jiramaRecuParMoi}
                            disabled={!mj}
                            titre={`JIRAMA de ${p.nom}`}
                            onToggle={() => basculer(p, "jiramaRecuParMoi")}
                          />
                        </div>
                      </td>
                      <td className="text-center">
                        <span
                          className={
                            p.statut === "PAYE"
                              ? "badge-paye"
                              : p.statut === "PARTIEL"
                                ? "badge-partiel"
                                : "badge-impaye"
                          }
                        >
                          {p.statut}
                        </span>
                      </td>
                    </tr>
                  );
                })}

                <tr className="prov-total-row">
                  <td>Reçu en main propre</td>
                  <td className="text-end">{encLoyer.toLocaleString()}</td>
                  <td className="text-end">{encJirama.toLocaleString()}</td>
                  <td className="text-center text-muted" style={{ fontSize: "0.72rem" }}>
                    Ar
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {horsMain > 0 && (
            <p className="text-muted mt-2 mb-0" style={{ fontSize: "0.76rem" }}>
              <strong>{horsMain.toLocaleString()} Ar</strong> ont été réglés mais
              encaissés sur place — comptés dans les recettes du mois, pas dans
              votre encaisse.
            </p>
          )}

          {/* Frais et confrontation au solde réel */}
          <hr className="my-3" />

          <div className="row g-3 align-items-end">
            <div className="col-12 col-md-5">
              <label className="form-label" style={{ fontSize: "0.74rem", color: "#64748b", fontWeight: 600 }}>
                Frais ou ligne supplémentaire
              </label>
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="ex. frais de retrait Mvola"
                value={frais.libelle}
                onChange={(e) => setFrais((f) => ({ ...f, libelle: e.target.value }))}
              />
            </div>
            <div className="col-6 col-md-3">
              <label className="form-label" style={{ fontSize: "0.74rem", color: "#64748b", fontWeight: 600 }}>
                Montant (Ar)
              </label>
              <input
                type="number"
                className="form-control form-control-sm text-end"
                placeholder="0"
                value={frais.montant}
                onChange={(e) => setFrais((f) => ({ ...f, montant: e.target.value }))}
              />
            </div>
            <div className="col-6 col-md-4">
              <label className="form-label" style={{ fontSize: "0.74rem", color: "#64748b", fontWeight: 600 }}>
                Somme réellement reçue
              </label>
              <input
                type="number"
                className="form-control form-control-sm text-end"
                placeholder="laisser vide si non vérifié"
                value={sommeRecue}
                onChange={(e) => setSommeRecue(e.target.value)}
              />
            </div>
          </div>
          <p className="text-muted mt-1 mb-0" style={{ fontSize: "0.72rem" }}>
            Un montant négatif est accepté pour une retenue.
          </p>

          {/* Total attendu */}
          <div className="d-flex justify-content-between align-items-center p-3 rounded-3 mt-3"
               style={{ background: "#eff6ff", border: "2px solid #bfdbfe" }}>
            <div>
              <div className="fw-bold" style={{ fontSize: "0.9rem", color: "#1e3a8a" }}>
                Entre vos mains
              </div>
              <small className="text-muted" style={{ fontSize: "0.72rem" }}>
                {encLoyer.toLocaleString()} loyers + {encJirama.toLocaleString()} JIRAMA
                {fraisNum ? ` ${fraisNum < 0 ? "−" : "+"} ${Math.abs(fraisNum).toLocaleString()} ${frais.libelle || "frais"}` : ""}
              </small>
            </div>
            <span className="fw-bold" style={{ fontSize: "1.25rem", color: "#1d4ed8", whiteSpace: "nowrap" }}>
              {attendu.toLocaleString()} Ar
            </span>
          </div>

          {/* Remarque sur le solde */}
          <div className={`prov-solde ${etat} mt-3`}>
            <div className="d-flex gap-2 align-items-start">
              <Icone
                size={17}
                style={{
                  flex: "0 0 auto",
                  marginTop: 2,
                  color: etat === "accord" ? "#16a34a" : etat === "ecart" ? "#d97706" : "#94a3b8",
                }}
              />
              <p className="remarque">{remarque}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
