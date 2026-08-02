import { useState, useEffect } from "react";
import axios from "../../contexts/api/axios";
import GetUserData from "../../contexts/api/udata";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import { BsCheckCircle, BsExclamationTriangle, BsLightningCharge } from "react-icons/bs";

const MOIS_LABELS = ["","Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
const ANNEES = [2023, 2024, 2025, 2026, 2027];

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
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (mono) return; // appart "loyer seul" : pas de JIRAMA
    fetchLocataires();
    fetchFacture();
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
          f.consommations.forEach((c) => {
            map[c.locataireId] = { indexPrev: c.indexPrev || 0, indexCurr: c.indexCurr || 0 };
          });
          setConsommations((prev) => ({ ...prev, ...map }));
        }
      })
      .catch(() => setFactureId(null));
  }

  const getConso = (locId) => {
    const c = consommations[locId] || { indexPrev: 0, indexCurr: 0 };
    return Math.max(0, (c.indexCurr || 0) - (c.indexPrev || 0));
  };
  const getMontant = (locId) => getConso(locId) * prixUnitaire;

  const totalCalcule = locataires.reduce((s, l) => s + getMontant(l.id), 0);
  const ecart = totalCalcule - montantFacture;

  function handleConsoChange(locId, champ, valeur) {
    setConsommations((prev) => ({
      ...prev,
      [locId]: { ...(prev[locId] || {}), [champ]: +valeur },
    }));
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
      })),
    };
    const req = factureId
      ? axios.put(`loyer/factures/${factureId}`, data, u_info.opts)
      : axios.post("loyer/factures", data, u_info.opts);
    req
      .then(() => {
        toast.success("Facture JIRAMA enregistrée !");
        fetchFacture();
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
            <select className="form-select" value={mois} onChange={(e) => setMois(+e.target.value)}>
              {MOIS_LABELS.slice(1).map((m, i) => (
                <option key={i + 1} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
          <div className="col-sm-3">
            <label className="form-label">Année</label>
            <select className="form-select" value={annee} onChange={(e) => setAnnee(+e.target.value)}>
              {ANNEES.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
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
                  <th style={{ fontSize: "0.73rem", color: "#64748b" }}>Montant JIRAMA</th>
                </tr>
              </thead>
              <tbody>
                {locataires.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center text-muted py-4">
                      Aucun locataire —{" "}
                      <Link to="/loyer/locataires/">Ajouter des locataires</Link>
                    </td>
                  </tr>
                ) : (
                  locataires.map((loc) => (
                    <tr key={loc.id}>
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
                      <td>
                        <span className="fw-bold text-primary" style={{ fontSize: "0.875rem" }}>
                          {getMontant(loc.id).toLocaleString()} Ar
                        </span>
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
