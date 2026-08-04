import { useState, useEffect } from "react";
import axios from "../../contexts/api/axios";
import GetUserData from "../../contexts/api/udata";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import { BsCheckCircle, BsExclamationTriangle, BsLightningCharge } from "react-icons/bs";
import { MoisPicker, AnneePicker } from "../../components/jour/periode.picker";

const MOIS_LABELS = ["","Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];

/**
 * Saisie de la facture JIRAMA d'un mois : prix unitaire, montant reçu de la
 * compagnie, puis les index de compteur de chaque locataire.
 *
 * Vit à l'intérieur de la page Facture JIRAMA — les relevés et les règlements
 * portent sur les mêmes données, les séparer en deux pages obligeait à faire
 * l'aller-retour pour vérifier une somme.
 */
export default function SaisieReleves({ bienId, mono, current, onSaved }) {
  const u_info = GetUserData();

  // La facture porte sur le mois écoulé : on ouvre donc sur M-1.
  const now = new Date();
  const moisPrecedent = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const [mois, setMois] = useState(moisPrecedent.getMonth() + 1);
  const [annee, setAnnee] = useState(moisPrecedent.getFullYear());

  const [prixUnitaire, setPrixUnitaire] = useState(0);
  const [montantFacture, setMontantFacture] = useState(0);
  const [locataires, setLocataires] = useState([]);
  const [consommations, setConsommations] = useState({});
  const [factureId, setFactureId] = useState(null);
  // Montant saisi directement, quand on n a pas les index de compteur.
  const [montantsManuels, setMontantsManuels] = useState({});
  // Locataires absents ce mois : ils ne doivent rien, forfait compris.
  const [exemptions, setExemptions] = useState({});
  // Ce qui a deja ete encaisse, pour que les deux onglets se repondent.
  const [regles, setRegles] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (mono) return; // appart "loyer seul" : pas de JIRAMA
    fetchLocataires();
    fetchFacture();
    fetchReglements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mois, annee, bienId]);

  function fetchLocataires() {
    axios
      .get(`loyer/locataires?bienId=${bienId}`, u_info.opts)
      .then((r) => {
        const list = (r.data || []).filter((l) => l.actif);
        setLocataires(list);
        setConsommations((prev) => {
          const next = { ...prev };
          list.forEach((l) => {
            if (!next[l.id]) next[l.id] = { indexPrev: 0, indexCurr: 0 };
          });
          return next;
        });
      })
      .catch(() => setLocataires([]));
  }

  // Reglements deja enregistres dans l onglet  Reglements  : sans cela, les
  // deux vues du meme mois affichaient des chiffres differents.
  function fetchReglements() {
    axios
      .get(`loyer/paiements?annee=${annee}`, u_info.opts)
      .then((r) => {
        const map = {};
        (r.data || [])
          .filter((p) => Number(p.mois) === Number(mois))
          .forEach((p) => {
            map[p.locataireId] = {
              montant: p.montantJIRAMA || 0,
              statut: p.statutJIRAMA || "IMPAYE",
            };
          });
        setRegles(map);
      })
      .catch(() => setRegles({}));
  }

  function fetchFacture() {
    axios
      .get(`loyer/factures?mois=${mois}&annee=${annee}&bienId=${bienId}`, u_info.opts)
      .then((r) => {
        const f = r.data?.[0];
        if (!f) {
          setFactureId(null);
          return;
        }
        setFactureId(f.id);
        setPrixUnitaire(f.prixUnitaire || 0);
        setMontantFacture(f.montantTotal || 0);
        if (f.consommations) {
          const map = {};
          const manuels = {};
          const exempts = {};
          f.consommations.forEach((c) => {
            map[c.locataireId] = { indexPrev: c.indexPrev || 0, indexCurr: c.indexCurr || 0 };
            // Montant sans relève de compteur : il a forcément été saisi à la main.
            if (!c.consommation && c.montantJIRAMA) manuels[c.locataireId] = c.montantJIRAMA;
            if (c.exempt) exempts[c.locataireId] = true;
          });
          setConsommations((prev) => ({ ...prev, ...map }));
          setMontantsManuels(manuels);
          setExemptions(exempts);
        }
      })
      .catch(() => setFactureId(null));
  }

  const getConso = (locId) => {
    const c = consommations[locId] || { indexPrev: 0, indexCurr: 0 };
    return Math.max(0, (c.indexCurr || 0) - (c.indexPrev || 0));
  };
  const forfaitDe = (locId) =>
    Number(locataires.find((l) => l.id === locId)?.jiramaForfait) || 0;

  // Montant releve au compteur, avant application du forfait.
  const getMontantReleve = (locId) => getConso(locId) * prixUnitaire;

  /**
   * Ce que le locataire doit reellement pour le mois.
   *
   * Trois cas, dans cet ordre : absent (rien du, forfait compris), montant
   * saisi a la main faute de releve, sinon le plus eleve entre son forfait
   * et sa consommation relevee.
   */
  const getMontant = (locId) => {
    if (exemptions[locId]) return 0;
    const manuel = montantsManuels[locId];
    if (manuel !== undefined && manuel !== "") return Number(manuel) || 0;
    return Math.max(forfaitDe(locId), getMontantReleve(locId));
  };

  // Bascule  absent ce mois  : on efface au passage un eventuel montant.
  function basculeExemption(locId) {
    setExemptions((prev) => {
      const suivant = { ...prev };
      if (suivant[locId]) delete suivant[locId];
      else suivant[locId] = true;
      return suivant;
    });
  }

  function handleMontantChange(locId, valeur) {
    setMontantsManuels((prev) => ({ ...prev, [locId]: valeur }));
  }

  const totalCalcule = locataires.reduce((s, l) => s + getMontant(l.id), 0);
  const ecart = totalCalcule - montantFacture;

  function handleConsoChange(locId, champ, valeur) {
    setConsommations((prev) => ({
      ...prev,
      [locId]: { ...(prev[locId] || {}), [champ]: +valeur },
    }));
    // Renseigner un index reprend la main sur un montant saisi manuellement.
    setMontantsManuels((prev) => {
      if (prev[locId] === undefined) return prev;
      const suivant = { ...prev };
      delete suivant[locId];
      return suivant;
    });
  }

  function handleSave(e) {
    e.preventDefault();
    if (!prixUnitaire) return toast.warning("Entrez le prix unitaire JIRAMA");
    setSaving(true);
    const data = {
      mois,
      annee,
      bienId,
      prixUnitaire,
      montantTotal: montantFacture,
      consommations: locataires.map((l) => ({
        locataireId: l.id,
        indexPrev: consommations[l.id]?.indexPrev || 0,
        indexCurr: consommations[l.id]?.indexCurr || 0,
        consommation: getConso(l.id),
        montantJIRAMA: getMontant(l.id),
        exempt: exemptions[l.id] ? 1 : 0,
      })),
    };
    const req = factureId
      ? axios.put(`loyer/factures/${factureId}`, data, u_info.opts)
      : axios.post("loyer/factures", data, u_info.opts);
    req
      .then(() => {
        toast.success("Facture JIRAMA enregistrée !");
        fetchFacture();
        fetchReglements();
        if (onSaved) onSaved();
      })
      .catch(() => toast.error("Erreur d'enregistrement"))
      .finally(() => setSaving(false));
  }

  if (mono) {
    return (
      <div className="card-pro text-center py-5">
        <BsLightningCharge size={38} color="#f59e0b" className="mb-2" />
        <h6 className="fw-bold">{current?.nom} — loyer seul</h6>
        <p className="text-muted mb-0">
          Cet appartement ne gère pas la JIRAMA : le locataire paie l'eau &amp;
          l'électricité lui-même (compteur personnel).
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Paramètres de la facture reçue */}
      <div className="card-pro mb-4">
        <h6 className="fw-bold mb-3">Paramètres de la facture</h6>
        <div className="row g-3">
          <div className="col-sm-3">
            <label className="form-label">Mois</label>
            <div><MoisPicker value={mois} onChange={setMois} /></div>
          </div>
          <div className="col-sm-3">
            <label className="form-label">Année</label>
            <div><AnneePicker value={annee} onChange={setAnnee} /></div>
          </div>
          <div className="col-sm-3">
            <label className="form-label">Prix unitaire (Ar/kWh)</label>
            <input
              type="number"
              className="form-control"
              value={prixUnitaire}
              onChange={(e) => setPrixUnitaire(+e.target.value)}
              min={0}
              placeholder="ex : 500"
            />
          </div>
          <div className="col-sm-3">
            <label className="form-label">Montant facture reçue (Ar)</label>
            <input
              type="number"
              className="form-control"
              value={montantFacture}
              onChange={(e) => setMontantFacture(+e.target.value)}
              min={0}
              placeholder="Montant total"
            />
          </div>
        </div>
      </div>

      {/* Rapprochement avec la facture de la compagnie */}
      {montantFacture > 0 && (
        <div
          className="p-3 rounded-3 mb-4 d-flex align-items-center gap-3"
          style={{
            background: Math.abs(ecart) < 100 ? "#f0fdf4" : "#fff5f5",
            border: `1px solid ${Math.abs(ecart) < 100 ? "#bbf7d0" : "#fecaca"}`,
          }}
        >
          {Math.abs(ecart) < 100 ? (
            <BsCheckCircle color="#16a34a" size={20} />
          ) : (
            <BsExclamationTriangle color="#dc2626" size={20} />
          )}
          <div>
            <div className="fw-semibold" style={{ fontSize: "0.875rem" }}>
              Total calculé : {totalCalcule.toLocaleString()} Ar — Facture JIRAMA :{" "}
              {montantFacture.toLocaleString()} Ar
            </div>
            <small className={Math.abs(ecart) < 100 ? "text-success" : "text-danger"}>
              {Math.abs(ecart) < 100
                ? "Totaux concordants ✓"
                : `Écart de ${Math.abs(ecart).toLocaleString()} Ar — vérifier les index`}
            </small>
          </div>
        </div>
      )}

      {/* Index de compteur, locataire par locataire */}
      <form onSubmit={handleSave}>
        <div className="card-pro p-0 mb-4">
          <div className="p-3 border-bottom">
            <h6 className="fw-bold mb-0">
              Consommations — {MOIS_LABELS[mois]} {annee}
              {factureId && <span className="badge-paye ms-2">Facture enregistrée</span>}
            </h6>
          </div>
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead style={{ background: "#f8fafc" }}>
                <tr>
                  <th style={{ fontSize: "0.73rem", color: "#64748b" }}>Chambre</th>
                  <th style={{ fontSize: "0.73rem", color: "#64748b" }}>Locataire</th>
                  <th style={{ fontSize: "0.73rem", color: "#64748b" }}>Index précédent (kWh)</th>
                  <th style={{ fontSize: "0.73rem", color: "#64748b" }}>Index actuel (kWh)</th>
                  <th style={{ fontSize: "0.73rem", color: "#64748b" }}>Consommation</th>
                  <th style={{ fontSize: "0.73rem", color: "#64748b" }}>Montant dû (Ar)</th>
                  <th style={{ fontSize: "0.73rem", color: "#64748b" }}>Réglé</th>
                  <th style={{ fontSize: "0.73rem", color: "#64748b" }} title="Locataire absent ce mois : il ne doit rien, forfait compris">
                    Absent
                  </th>
                </tr>
              </thead>
              <tbody>
                {locataires.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center text-muted py-4">
                      Aucun locataire —{" "}
                      <Link to="/loyer/locataires/">Ajouter des locataires</Link>
                    </td>
                  </tr>
                ) : (
                  locataires.map((loc) => (
                    <tr
                      key={loc.id}
                      style={exemptions[loc.id] ? { opacity: 0.55 } : undefined}
                    >
                      <td>
                        <span className={loc.etage === "RDC" ? "badge-rdc" : "badge-1er"}>
                          {loc.chambre}
                        </span>
                      </td>
                      <td style={{ fontSize: "0.875rem" }}>
                        {loc.nom} {loc.prenom}
                        {loc.jiramaForfait > 0 && (
                          <span
                            className="text-muted ms-1"
                            style={{ fontSize: "0.72rem" }}
                            title="Règle au forfait : le relevé ne prime que s'il dépasse le forfait"
                          >
                            · forfait {(loc.jiramaForfait / 1000).toFixed(0)}k
                          </span>
                        )}
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          style={{ width: 100 }}
                          value={consommations[loc.id]?.indexPrev || 0}
                          onChange={(e) => handleConsoChange(loc.id, "indexPrev", e.target.value)}
                          min={0}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-control form-control-sm"
                          style={{ width: 100 }}
                          value={consommations[loc.id]?.indexCurr || 0}
                          onChange={(e) => handleConsoChange(loc.id, "indexCurr", e.target.value)}
                          min={0}
                        />
                      </td>
                      <td>
                        <span className="fw-semibold" style={{ fontSize: "0.875rem" }}>
                          {getConso(loc.id)} kWh
                        </span>
                      </td>
                      {/* Montant saisissable directement : on n'a pas toujours
                          les index de compteur, mais on connaît la somme due. */}
                      <td>
                        <input
                          type="number"
                          className="form-control form-control-sm fw-bold"
                          style={{ width: 110, color: "#2563eb" }}
                          min={0}
                          step={500}
                          value={exemptions[loc.id] ? 0 : getMontant(loc.id)}
                          disabled={exemptions[loc.id]}
                          onChange={(e) => handleMontantChange(loc.id, e.target.value)}
                        />
                        {!exemptions[loc.id] && forfaitDe(loc.id) > 0 && (
                          <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>
                            {getMontant(loc.id) > forfaitDe(loc.id)
                              ? "au-dessus du forfait"
                              : "forfait"}
                          </div>
                        )}
                      </td>
                      {/* Ce que l'onglet Règlements a déjà encaissé, pour que
                          les deux vues du même mois ne se contredisent pas. */}
                      <td>
                        {regles[loc.id] && regles[loc.id].statut !== "IMPAYE" ? (
                          <span
                            className="rounded-pill px-2 py-1 fw-semibold"
                            style={{
                              background: regles[loc.id].statut === "PAYE" ? "#f0fdf4" : "#fffbeb",
                              color: regles[loc.id].statut === "PAYE" ? "#16a34a" : "#d97706",
                              fontSize: "0.72rem",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {(regles[loc.id].montant || 0).toLocaleString()} Ar
                          </span>
                        ) : (
                          <span className="text-muted" style={{ fontSize: "0.78rem" }}>
                            —
                          </span>
                        )}
                      </td>
                      <td>
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={!!exemptions[loc.id]}
                          onChange={() => basculeExemption(loc.id)}
                          title={`${loc.nom} n'était pas là ce mois-ci : rien ne lui est dû`}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {locataires.length > 0 && (
                <tfoot style={{ background: "#f8fafc" }}>
                  <tr>
                    <td colSpan={5} className="text-end fw-bold" style={{ fontSize: "0.875rem" }}>
                      Total JIRAMA :
                    </td>
                    <td className="fw-bold text-primary" style={{ fontSize: "0.875rem" }}>
                      {totalCalcule.toLocaleString()} Ar
                    </td>
                    <td colSpan={2} className="text-muted" style={{ fontSize: "0.75rem" }}>
                      {Object.keys(exemptions).length > 0 &&
                        `${Object.keys(exemptions).length} absent(s)`}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        <div className="d-flex justify-content-end">
          <button type="submit" className="btn btn-primary" disabled={saving || locataires.length === 0}>
            {saving ? "Enregistrement..." : factureId ? "Mettre à jour" : "Enregistrer la facture"}
          </button>
        </div>
      </form>
    </>
  );
}
