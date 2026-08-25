import { useState, useEffect } from "react";
import axios from "../../contexts/api/axios";
import GetUserData from "../../contexts/api/udata";
import Template from "../../components/template/template";
import Header from "../../components/header/header";
import Sidebar from "../../components/sidebar/sidebar";
import { toast } from "react-toastify";
import {
  BsLightningCharge, BsCheckCircleFill, BsXCircleFill, BsDashCircle,
  BsExclamationTriangleFill, BsCashCoin, BsHourglassSplit, BsSendCheck,
  BsXLg,
} from "react-icons/bs";
import { SkLocataires } from "../../components/skeleton/skeleton";
import { AnneePicker } from "../../components/jour/periode.picker";
import "../loyer/loyer.css";
import { dateDuJour, MOIS_COURT as MOIS, MOIS_LONG as MOIS_FULL } from "../../config/dates";


/**
 * Factures d'eau et d'électricité du locataire.
 *
 * Page distincte du tableau de loyer : les deux ne se règlent ni au même
 * moment ni au même rythme, et les mélanger obligeait à déclarer les deux
 * d'un coup.
 */
export default function MesFactures() {
  const u_info = GetUserData();
  const [annee, setAnnee] = useState(new Date().getFullYear());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState("");
  const [declaration, setDeclaration] = useState(null);
  const [envoi, setEnvoi] = useState(false);

  function charger(silencieux = false) {
    if (!silencieux && !data) setLoading(true);
    return axios
      .get(`loyer/mon-espace?annee=${annee}`, u_info.opts)
      .then((r) => { setData(r.data); setErreur(""); })
      .catch((e) => setErreur(e.response?.data?.message || "Impossible de charger vos factures."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    charger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [annee]);

  const loc = data?.locataire;
  const paiements = data?.paiements || [];
  const jiramaDu = data?.jiramaDu || {};
  const parMois = {};
  paiements.forEach((p) => (parMois[p.mois] = p));

  // Déclarations d'électricité en cours de vérification.
  const declares = {};
  (data?.enAttente || [])
    .filter((d) => d.volet === "JIRAMA")
    .forEach((d) => (declares[d.mois] = d));

  const resteDe = (m) => {
    const p = parMois[m];
    if (p && p.statutJIRAMA === "PAYE") return 0;
    const regle = p && p.statutJIRAMA === "PARTIEL" ? p.montantJIRAMA || 0 : 0;
    return Math.max(0, (jiramaDu[m] || 0) - regle);
  };

  // N'apparaissent que les mois facturés ou déjà réglés.
  const moisConcernes = Array.from({ length: 12 }, (_, i) => i + 1).filter(
    (m) => (jiramaDu[m] || 0) > 0 || (parMois[m]?.montantJIRAMA || 0) > 0
  );

  const totalDu = moisConcernes
    .filter((m) => !declares[m])
    .reduce((s, m) => s + resteDe(m), 0);
  const totalRegle = paiements.reduce(
    (s, p) =>
      p.statutJIRAMA === "PAYE" || p.statutJIRAMA === "PARTIEL"
        ? s + (p.montantJIRAMA || 0)
        : s,
    0
  );

  function ouvrirDeclaration(m) {
    setDeclaration({
      mois: m,
      montantJIRAMA: resteDe(m) || jiramaDu[m] || 0,
      datePaiement: dateDuJour(),
    });
  }

  function envoyer(e) {
    e.preventDefault();
    if (!declaration) return;
    setEnvoi(true);
    axios
      .post(
        "loyer/mon-espace/jirama",
        {
          mois: declaration.mois,
          annee,
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
      .catch((err) => toast.error(err.response?.data?.message || "Erreur lors de l'envoi."))
      .finally(() => setEnvoi(false));
  }

  function Cellule({ m }) {
    const p = parMois[m];
    const attente = declares[m];
    const reste = resteDe(m);
    const regle = p?.montantJIRAMA || 0;

    let bg = "#f8fafc", couleur = "#cbd5e1", Icone = BsDashCircle, libelle = "—";
    if (attente) {
      bg = "#eff6ff"; couleur = "#2563eb"; Icone = BsHourglassSplit;
      libelle = "en attente";
    } else if (p?.statutJIRAMA === "PAYE") {
      bg = "#f0fdf4"; couleur = "#16a34a"; Icone = BsCheckCircleFill;
      libelle = `${(regle / 1000).toFixed(0)}k`;
    } else if (p?.statutJIRAMA === "PARTIEL") {
      bg = "#fffbeb"; couleur = "#d97706"; Icone = BsExclamationTriangleFill;
      libelle = `${(regle / 1000).toFixed(0)}k`;
    } else if (p?.statutJIRAMA === "DOUTE") {
      bg = "#fef9c3"; couleur = "#854d0e"; Icone = BsExclamationTriangleFill;
      libelle = "à confirmer";
    } else if (reste > 0) {
      bg = "#fef2f2"; couleur = "#dc2626"; Icone = BsXCircleFill;
      libelle = `${(reste / 1000).toFixed(0)}k dus`;
    }

    return (
      <div className="col-6 col-sm-4 col-md-3 col-lg-2">
        <div
          className="rounded-3 p-2 text-center h-100 d-flex flex-column"
          style={{ background: bg, border: "1px solid #e2e8f0" }}
          title={`Dû : ${(jiramaDu[m] || 0).toLocaleString()} Ar · réglé : ${regle.toLocaleString()} Ar`}
        >
          <div className="text-muted" style={{ fontSize: "0.7rem", fontWeight: 600 }}>
            {MOIS[m - 1]}
          </div>
          <Icone color={couleur} size={18} className="my-1" />
          <div className="fw-bold" style={{ fontSize: "0.78rem", color: couleur }}>
            {libelle}
          </div>
          {!attente && reste > 0 && (
            <button
              className="btn btn-sm mt-2 w-100 fw-semibold d-inline-flex align-items-center justify-content-center gap-1"
              style={{ background: "#d97706", color: "#fff", fontSize: "0.68rem", padding: "3px 4px" }}
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

  const enAttente = Object.values(declares);

  return (
    <Template>
      <Header />
      <div className="container-fluid flex-grow-1">
        <div className="row g-0">
          <Sidebar />
          <main className="col-md-9 ms-sm-auto col-lg-10 px-md-4 main">
            <div className="page-header">
              <div>
                <h1 className="page-title"><BsLightningCharge /> Facture JIRAMA</h1>
                <p className="text-muted small mb-0">Vos consommations d'eau et d'électricité</p>
              </div>
              <AnneePicker value={annee} onChange={setAnnee} />
            </div>

            {loading ? (
              <SkLocataires />
            ) : erreur ? (
              <div className="card-pro text-center py-5">
                <p className="text-muted mb-0">{erreur}</p>
              </div>
            ) : (
              <>
                {/* Résumé */}
                <div className="row g-3 mb-4">
                  <div className="col-6 col-lg-4">
                    <div className="stat-card">
                      <div className="stat-icon green"><BsCheckCircleFill /></div>
                      <div className="stat-content">
                        <h3>{(totalRegle / 1000).toFixed(0)}k</h3>
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
                      <div className="stat-icon amber"><BsLightningCharge /></div>
                      <div className="stat-content">
                        <h3>
                          {loc?.jiramaNonSoumis
                            ? "—"
                            : loc?.jiramaForfait
                              ? `${(loc.jiramaForfait / 1000).toFixed(0)}k`
                              : "Compteur"}
                        </h3>
                        <p>
                          {loc?.jiramaNonSoumis
                            ? "Non compris dans le bail"
                            : loc?.jiramaForfait
                              ? "Forfait mensuel (Ar)"
                              : "Facturé au relevé"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {loc?.jiramaForfait > 0 && (
                  <div
                    className="rounded-3 p-3 mb-4 d-flex align-items-start gap-2"
                    style={{ background: "#fffbeb", border: "1px solid #fde68a" }}
                  >
                    <BsLightningCharge color="#d97706" size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontSize: "0.84rem", color: "#92400e" }}>
                      Vous réglez au forfait de{" "}
                      <strong>{loc.jiramaForfait.toLocaleString()} Ar</strong> par mois.
                      Si votre compteur individuel dépasse ce montant, le surplus s'ajoute
                      à votre facture.
                    </span>
                  </div>
                )}

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
                      {enAttente.map((d) => MOIS_FULL[d.mois - 1]).join(", ")}.
                    </span>
                  </div>
                )}

                <div className="card-pro">
                  <h6 className="fw-bold mb-3">Mes factures {annee}</h6>
                  {loc?.jiramaNonSoumis ? (
                    <div
                      className="rounded-3 p-3 d-flex align-items-start gap-2"
                      style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}
                    >
                      <BsLightningCharge color="#64748b" size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                      <span style={{ fontSize: "0.85rem", color: "#475569" }}>
                        <strong>Votre bail ne comprend pas l'eau et l'électricité.</strong>
                        <span className="d-block text-muted" style={{ fontSize: "0.78rem" }}>
                          Rien ne vous est réclamé à ce titre : cette page restera vide.
                        </span>
                      </span>
                    </div>
                  ) : moisConcernes.length === 0 ? (
                    <p className="text-muted mb-0" style={{ fontSize: "0.85rem" }}>
                      Aucune facture d'eau ou d'électricité pour {annee}.
                      <br />
                      <small>
                        Les montants apparaîtront dès que le propriétaire aura relevé
                        votre compteur, ou dès le premier mois si vous êtes au forfait.
                      </small>
                    </p>
                  ) : (
                    <>
                      <div className="row g-2">
                        {moisConcernes.map((m) => <Cellule key={m} m={m} />)}
                      </div>
                      <div className="legende mt-3">
                        <span className="legende-item"><BsCheckCircleFill color="#16a34a" /> Réglé</span>
                        <span className="legende-item"><BsExclamationTriangleFill color="#d97706" /> Partiel</span>
                        <span className="legende-item"><BsHourglassSplit color="#2563eb" /> En attente de validation</span>
                        <span className="legende-item"><BsXCircleFill color="#dc2626" /> À payer</span>
                      </div>
                    </>
                  )}
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
              <h6>
                <BsLightningCharge className="me-2" />
                JIRAMA {MOIS_FULL[declaration.mois - 1]} {annee}
              </h6>
              <button className="btn-close" onClick={() => setDeclaration(null)} />
            </div>
            <form onSubmit={envoyer} className="p-4">
              <div
                className="rounded-3 p-2 mb-3 d-flex justify-content-between align-items-center"
                style={{ background: "#fffbeb", border: "1px solid #fde68a" }}
              >
                <small style={{ fontSize: "0.76rem", color: "#92400e" }}>
                  {loc?.jiramaForfait ? "Forfait mensuel" : "Montant facturé"}
                </small>
                <span className="fw-bold" style={{ color: "#b45309" }}>
                  {(jiramaDu[declaration.mois] || 0).toLocaleString()} Ar
                </span>
              </div>

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

              <div className="mb-3">
                <label className="form-label">Montant réglé (Ar)</label>
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
              <div className="mb-3">
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

              <div className="d-flex justify-content-end gap-2 mt-4">
                <button type="button" className="btn btn-outline-danger btn-sm d-inline-flex align-items-center gap-1"
                  onClick={() => setDeclaration(null)}>
                  <BsXLg />
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary btn-sm d-inline-flex align-items-center gap-1"
                  disabled={envoi}>
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
