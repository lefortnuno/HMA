import { useState, useEffect } from "react";
import axios from "../../contexts/api/axios";
import GetUserData from "../../contexts/api/udata";
import Template from "../../components/template/template";
import Header from "../../components/header/header";
import Sidebar from "../../components/sidebar/sidebar";
import { Avatar } from "../../components/avatar/avatar";
import { toast } from "react-toastify";
import {
  BsHouseHeart, BsCheckCircleFill, BsXCircleFill, BsDashCircle, BsExclamationTriangleFill,
  BsCashCoin, BsHourglassSplit, BsSendCheck,
} from "react-icons/bs";
import { SkLocataires } from "../../components/skeleton/skeleton";
import { moisExigibles as calcMoisExigibles, montantDu, libelleEcheance } from "../../config/echeance";
import "../loyer/loyer.css";

const MOIS = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
const MOIS_FULL = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const ANNEES = [2025, 2026, 2027];

/**
 * Espace personnel : le locataire ne voit QUE sa fiche et ses paiements.
 * Aucune donnée des autres locataires n'est chargée ici.
 */
export default function MonEspace() {
  const u_info = GetUserData();
  const [annee, setAnnee] = useState(new Date().getFullYear());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState("");

  // Déclaration d'un règlement, soumise à la validation du propriétaire.
  const [declaration, setDeclaration] = useState(null); // { mois, montantLoyer, montantJIRAMA, datePaiement }
  const [envoi, setEnvoi] = useState(false);

  function charger(silencieux = false) {
    if (!silencieux && !data) setLoading(true);
    return axios
      .get(`loyer/mon-espace?annee=${annee}`, u_info.opts)
      .then((r) => { setData(r.data); setErreur(""); })
      .catch((e) => setErreur(e.response?.data?.message || "Impossible de charger votre espace."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    charger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [annee]);

  const loc = data?.locataire;
  const paiements = data?.paiements || [];
  const enAttente = data?.enAttente || [];
  const parMois = {};
  paiements.forEach((p) => (parMois[p.mois] = p));
  // Mois déjà déclarés et en cours de vérification chez le propriétaire.
  const declares = {};
  enAttente.forEach((d) => (declares[d.mois] = d));

  // Mois exigibles : dépend du sens de règlement du locataire (après
  // consommation ou d'avance) et de sa date de règlement habituelle.
  const moisExigibles = calcMoisExigibles(loc, annee);

  // Reste dû sur un mois : uniquement la part déjà échue (voir config/echeance.js),
  // diminuée de ce qui a déjà été réglé.
  const resteDe = (m) => {
    const p = parMois[m];
    if (p && p.statut === "PAYE") return 0;
    const paye = p && p.statut === "PARTIEL" ? p.montantLoyer || 0 : 0;
    return Math.max(0, montantDu(loc, m, annee) - paye);
  };

  const impayes = moisExigibles.filter((m) => !declares[m] && resteDe(m) > 0);
  const totalDu = impayes.reduce((s, m) => s + resteDe(m), 0);
  const totalPaye = paiements
    .filter((p) => p.statut === "PAYE" || p.statut === "PARTIEL")
    .reduce((s, p) => s + (p.montantLoyer || 0) + (p.montantJIRAMA || 0), 0);

  // Ouvre le formulaire de déclaration, pré-rempli avec ce qui reste dû.
  function ouvrirDeclaration(m) {
    const p = parMois[m];
    setDeclaration({
      mois: m,
      montantLoyer: resteDe(m),
      montantJIRAMA: p?.montantJIRAMA || 0,
      datePaiement: new Date().toISOString().split("T")[0],
    });
  }

  function envoyerDeclaration(e) {
    e.preventDefault();
    if (!declaration) return;
    setEnvoi(true);
    axios
      .post(
        "loyer/mon-espace/paiement",
        {
          mois: declaration.mois,
          annee,
          montantLoyer: Number(declaration.montantLoyer) || 0,
          montantJIRAMA: Number(declaration.montantJIRAMA) || 0,
          datePaiement: declaration.datePaiement || null,
        },
        u_info.opts
      )
      .then((r) => {
        toast.success(r.data?.message || "Déclaration envoyée au propriétaire.");
        setDeclaration(null);
        charger(true);
      })
      .catch((err) =>
        toast.error(err.response?.data?.message || "Erreur lors de l'envoi.")
      )
      .finally(() => setEnvoi(false));
  }

  function Cellule({ m }) {
    const p = parMois[m];
    const exigible = moisExigibles.includes(m);
    const attente = declares[m];
    let bg = "#f8fafc", couleur = "#cbd5e1", Icone = BsDashCircle, libelle = "—";

    if (attente) {
      bg = "#eff6ff"; couleur = "#2563eb"; Icone = BsHourglassSplit;
      libelle = "en attente";
    } else if (p?.statut === "PAYE") {
      bg = "#f0fdf4"; couleur = "#16a34a"; Icone = BsCheckCircleFill;
      libelle = `${(((p.montantLoyer || 0) + (p.montantJIRAMA || 0)) / 1000).toFixed(0)}k`;
    } else if (p?.statut === "PARTIEL") {
      bg = "#fffbeb"; couleur = "#d97706"; Icone = BsExclamationTriangleFill;
      libelle = `${((p.montantLoyer || 0) / 1000).toFixed(0)}k`;
    } else if (p?.statut === "DOUTE") {
      bg = "#fef9c3"; couleur = "#854d0e"; Icone = BsExclamationTriangleFill;
      libelle = "à confirmer";
    } else if (exigible) {
      bg = "#fef2f2"; couleur = "#dc2626"; Icone = BsXCircleFill;
      libelle = "à payer";
    }

    // On ne déclare que ce qui reste dû, et une seule fois par mois.
    const declarable = !attente && resteDe(m) > 0;

    return (
      <div className="col-6 col-sm-4 col-md-3 col-lg-2">
        <div className="rounded-3 p-2 text-center h-100 d-flex flex-column" style={{ background: bg, border: "1px solid #e2e8f0" }}>
          <div className="text-muted" style={{ fontSize: "0.7rem", fontWeight: 600 }}>{MOIS[m - 1]}</div>
          <Icone color={couleur} size={18} className="my-1" />
          <div className="fw-bold" style={{ fontSize: "0.78rem", color: couleur }}>{libelle}</div>
          {declarable && (
            <button
              className="btn btn-sm mt-2 w-100 fw-semibold d-inline-flex align-items-center justify-content-center gap-1"
              style={{ background: "#2563eb", color: "#fff", fontSize: "0.68rem", padding: "3px 4px" }}
              onClick={() => ouvrirDeclaration(m)}
              title={`Signaler le règlement de ${MOIS_FULL[m - 1]}`}
            >
              <BsCashCoin size={10} /> J'ai payé
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <Template>
      <Header />
      <div className="container-fluid flex-grow-1">
        <div className="row g-0">
          <Sidebar />
          <main className="col-md-9 ms-sm-auto col-lg-10 px-md-4 main">
            <div className="page-header">
              <div>
                <h1 className="page-title"><BsHouseHeart /> Mon espace</h1>
                <p className="text-muted small mb-0">Le suivi de vos loyers</p>
              </div>
              <select
                className="form-select form-select-sm"
                style={{ width: "auto" }}
                value={annee}
                onChange={(e) => setAnnee(+e.target.value)}
              >
                {ANNEES.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>

            {loading ? (
              <SkLocataires />
            ) : erreur ? (
              <div className="card-pro text-center py-5">
                <p className="text-muted mb-0">{erreur}</p>
              </div>
            ) : (
              <>
                {/* Ma fiche */}
                <div className="card-pro mb-4 d-flex align-items-center gap-3 flex-wrap">
                  <Avatar photo={loc.photo} nom={`${loc.nom} ${loc.prenom || ""}`} size={58} />
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <div className="fw-bold" style={{ fontSize: "1.05rem" }}>{loc.nom} {loc.prenom}</div>
                    <div className="text-muted" style={{ fontSize: "0.8rem" }}>
                      Chambre <span className={loc.etage === "1ER" ? "badge-1er" : "badge-rdc"}>{loc.chambre}</span>
                      {" · "}{loc.etage === "1ER" ? "1er étage" : "Rez-de-chaussée"}
                    </div>
                    <div style={{ fontSize: "0.74rem", color: "#94a3b8" }}>
                      {libelleEcheance(loc)}
                    </div>
                  </div>
                  <div className="text-end">
                    <div className="fw-bold text-primary" style={{ fontSize: "1.05rem" }}>
                      {(loc.loyer || 0).toLocaleString()} Ar
                    </div>
                    <small className="text-muted" style={{ fontSize: "0.72rem" }}>loyer mensuel</small>
                  </div>
                </div>

                {/* Résumé */}
                <div className="row g-3 mb-4">
                  <div className="col-6 col-lg-4">
                    <div className="stat-card">
                      <div className="stat-icon green"><BsCheckCircleFill /></div>
                      <div className="stat-content">
                        <h3>{(totalPaye / 1000).toFixed(0)}k</h3>
                        <p>Réglé en {annee} (Ar)</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-6 col-lg-4">
                    <div className="stat-card">
                      <div className={`stat-icon ${totalDu > 0 ? "red" : "green"}`}>
                        {totalDu > 0 ? <BsExclamationTriangleFill /> : <BsCheckCircleFill />}
                      </div>
                      <div className="stat-content">
                        <h3 className={totalDu > 0 ? "text-danger" : "text-success"}>
                          {(totalDu / 1000).toFixed(0)}k
                        </h3>
                        <p>Reste à payer (Ar)</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-12 col-lg-4">
                    <div className="stat-card">
                      <div className="stat-icon blue"><BsHouseHeart /></div>
                      <div className="stat-content">
                        <h3>{(loc.caution || 0).toLocaleString()}</h3>
                        <p>Caution versée (Ar)</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rappel des mois dus */}
                {impayes.length > 0 && (
                  <div
                    className="rounded-3 p-3 mb-4 d-flex align-items-center gap-2 flex-wrap"
                    style={{ background: "#fef2f2", border: "1px solid #fecaca" }}
                  >
                    <BsExclamationTriangleFill color="#dc2626" />
                    <span style={{ fontSize: "0.85rem", color: "#991b1b" }}>
                      <strong>
                        {impayes.length} mois en attente :
                      </strong>{" "}
                      {impayes.map((m) => MOIS_FULL[m - 1]).join(", ")} — soit{" "}
                      <strong>{totalDu.toLocaleString()} Ar</strong>.
                    </span>
                  </div>
                )}

                {/* Déclarations en cours de vérification */}
                {enAttente.length > 0 && (
                  <div
                    className="rounded-3 p-3 mb-4 d-flex align-items-center gap-2 flex-wrap"
                    style={{ background: "#eff6ff", border: "1px solid #bfdbfe" }}
                  >
                    <BsHourglassSplit color="#2563eb" />
                    <span style={{ fontSize: "0.85rem", color: "#1e40af" }}>
                      <strong>
                        {enAttente.length} déclaration{enAttente.length > 1 ? "s" : ""} en
                        cours de vérification :
                      </strong>{" "}
                      {enAttente.map((d) => MOIS_FULL[d.mois - 1]).join(", ")}. Le
                      propriétaire les confirmera prochainement.
                    </span>
                  </div>
                )}

                {/* Calendrier des paiements */}
                <div className="card-pro">
                  <h6 className="fw-bold mb-3">Mes paiements — {annee}</h6>
                  <div className="row g-2">
                    {Array.from({ length: 12 }, (_, i) => <Cellule key={i + 1} m={i + 1} />)}
                  </div>
                  <div className="legende mt-3">
                    <span className="legende-item"><BsCheckCircleFill color="#16a34a" /> Payé</span>
                    <span className="legende-item"><BsExclamationTriangleFill color="#d97706" /> Partiel</span>
                    <span className="legende-item"><BsHourglassSplit color="#2563eb" /> En attente de validation</span>
                    <span className="legende-item"><BsXCircleFill color="#dc2626" /> À payer</span>
                    <span className="legende-item"><BsDashCircle color="#cbd5e1" /> Hors période</span>
                  </div>
                </div>
              </>
            )}
          </main>
        </div>
      </div>

      {/* ── Déclaration d'un règlement ── */}
      {declaration && (
        <div className="modal-overlay" onClick={() => setDeclaration(null)}>
          <div className="modal-content-pro" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-pro">
              <h6><BsCashCoin className="me-2" />J'ai payé — {MOIS_FULL[declaration.mois - 1]} {annee}</h6>
              <button className="btn-close" onClick={() => setDeclaration(null)} />
            </div>
            <form onSubmit={envoyerDeclaration} className="p-4">
              <div
                className="rounded-3 p-2 mb-3 d-flex align-items-start gap-2"
                style={{ background: "#eff6ff", border: "1px solid #bfdbfe" }}
              >
                <BsHourglassSplit color="#2563eb" size={15} style={{ flexShrink: 0, marginTop: 2 }} />
                <small style={{ fontSize: "0.75rem", color: "#1e40af" }}>
                  Votre déclaration est envoyée au propriétaire : elle n'apparaîtra
                  comme réglée qu'une fois vérifiée de son côté.
                </small>
              </div>

              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label">Montant du loyer réglé (Ar)</label>
                  <input
                    type="number"
                    min="0"
                    className="form-control form-control-sm"
                    value={declaration.montantLoyer}
                    onChange={(e) =>
                      setDeclaration((d) => ({ ...d, montantLoyer: e.target.value }))
                    }
                  />
                </div>
                <div className="col-12">
                  <label className="form-label">
                    Électricité / eau (JIRAMA){" "}
                    <span className="text-muted" style={{ fontWeight: 400 }}>(si réglée)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="form-control form-control-sm"
                    value={declaration.montantJIRAMA}
                    onChange={(e) =>
                      setDeclaration((d) => ({ ...d, montantJIRAMA: e.target.value }))
                    }
                  />
                </div>
                <div className="col-12">
                  <label className="form-label">Date du règlement</label>
                  <input
                    type="date"
                    className="form-control form-control-sm"
                    value={declaration.datePaiement || ""}
                    onChange={(e) =>
                      setDeclaration((d) => ({ ...d, datePaiement: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="d-flex justify-content-end gap-2 mt-4">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => setDeclaration(null)}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm d-inline-flex align-items-center gap-1"
                  disabled={envoi}
                >
                  <BsSendCheck /> {envoi ? "Envoi..." : "Envoyer au propriétaire"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Template>
  );
}
