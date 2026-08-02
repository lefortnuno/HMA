import { useState, useEffect } from "react";
import axios from "../../contexts/api/axios";
import GetUserData from "../../contexts/api/udata";
import Template from "../../components/template/template";
import Header from "../../components/header/header";
import Sidebar from "../../components/sidebar/sidebar";
import { Avatar } from "../../components/avatar/avatar";
import {
  BsHouseHeart, BsCheckCircleFill, BsXCircleFill, BsDashCircle, BsExclamationTriangleFill,
} from "react-icons/bs";
import { SkLocataires } from "../../components/skeleton/skeleton";
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

  useEffect(() => {
    if (!data) setLoading(true);
    axios
      .get(`loyer/mon-espace?annee=${annee}`, u_info.opts)
      .then((r) => { setData(r.data); setErreur(""); })
      .catch((e) => setErreur(e.response?.data?.message || "Impossible de charger votre espace."))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [annee]);

  const loc = data?.locataire;
  const paiements = data?.paiements || [];
  const parMois = {};
  paiements.forEach((p) => (parMois[p.mois] = p));

  // Mois exigibles : de la date d'entrée jusqu'au mois précédent.
  const now = new Date();
  const moisExigibles = [];
  if (loc) {
    let debut = 1;
    const d = loc.dateEntree ? new Date(loc.dateEntree) : null;
    if (d && !isNaN(d) && d.getFullYear() === annee) debut = d.getMonth() + 1;
    const fin = annee === now.getFullYear() ? now.getMonth() : 12;
    for (let m = debut; m <= fin; m++) moisExigibles.push(m);
  }

  const impayes = moisExigibles.filter((m) => {
    const p = parMois[m];
    return !p || p.statut !== "PAYE";
  });
  const totalDu = impayes.reduce((s, m) => {
    const p = parMois[m];
    const paye = p && p.statut === "PARTIEL" ? p.montantLoyer || 0 : 0;
    return s + (loc?.loyer || 0) - paye;
  }, 0);
  const totalPaye = paiements
    .filter((p) => p.statut === "PAYE" || p.statut === "PARTIEL")
    .reduce((s, p) => s + (p.montantLoyer || 0) + (p.montantJIRAMA || 0), 0);

  function Cellule({ m }) {
    const p = parMois[m];
    const exigible = moisExigibles.includes(m);
    let bg = "#f8fafc", couleur = "#cbd5e1", Icone = BsDashCircle, libelle = "—";

    if (p?.statut === "PAYE") {
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

    return (
      <div className="col-6 col-sm-4 col-md-3 col-lg-2">
        <div className="rounded-3 p-2 text-center h-100" style={{ background: bg, border: "1px solid #e2e8f0" }}>
          <div className="text-muted" style={{ fontSize: "0.7rem", fontWeight: 600 }}>{MOIS[m - 1]}</div>
          <Icone color={couleur} size={18} className="my-1" />
          <div className="fw-bold" style={{ fontSize: "0.78rem", color: couleur }}>{libelle}</div>
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

                {/* Calendrier des paiements */}
                <div className="card-pro">
                  <h6 className="fw-bold mb-3">Mes paiements — {annee}</h6>
                  <div className="row g-2">
                    {Array.from({ length: 12 }, (_, i) => <Cellule key={i + 1} m={i + 1} />)}
                  </div>
                  <div className="legende mt-3">
                    <span className="legende-item"><BsCheckCircleFill color="#16a34a" /> Payé</span>
                    <span className="legende-item"><BsExclamationTriangleFill color="#d97706" /> Partiel</span>
                    <span className="legende-item"><BsXCircleFill color="#dc2626" /> À payer</span>
                    <span className="legende-item"><BsDashCircle color="#cbd5e1" /> Hors période</span>
                  </div>
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </Template>
  );
}
