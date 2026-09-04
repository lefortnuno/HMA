import { useState, useEffect, useCallback } from "react";
import axios from "../../contexts/api/axios";
import GetUserData from "../../contexts/api/udata";
import Template from "../../components/template/template";
import Header from "../../components/header/header";
import Sidebar from "../../components/sidebar/sidebar";
import { toast } from "react-toastify";
import {
  BsPiggyBank, BsPlus, BsFillTrashFill, BsXLg, BsFileEarmarkExcel,
  BsExclamationTriangle, BsWallet2, BsPeople, BsBank, BsCashCoin,
  BsReceipt, BsCalendarEvent, BsArrowRepeat, BsJournalText, BsCheckCircleFill,
  BsCurrencyExchange,
} from "react-icons/bs";
import * as XLSX from "xlsx";
import Cellule from "./cellule";
import Convertisseur from "./convertisseur";
import { dateDuJour, formatDate, aujourdhuiLocal, MOIS_LONG } from "../../config/dates";
import { SkBenefices } from "../../components/skeleton/skeleton";
import "../loyer/loyer.css";
import "./otip.css";

/**
 * Budget OTIP — remboursement des prêts qui ont financé le départ d'Iruno.
 *
 * MODULE TEMPORAIRE, à retirer quand le dossier sera clos :
 * voir hmas/scripts/remove_otip.js, qui supprime les tables et liste les
 * fichiers et les trois lignes à effacer.
 *
 * Volontairement en dirhams : ce budget ne concerne pas la résidence et ne
 * doit pas se mélanger aux ariary du reste de l'application.
 *
 * Le prévisionnel n'est pas recalculé ici — il vient du serveur, qui rejoue
 * la chaîne du classeur d'origine (hmas/utils/otip.js, sous test).
 */

const DH = (v) => `${Number(v || 0).toLocaleString("fr-FR")} DH`;
const nbSafe = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const STATUTS = [
  { valeur: "A_NEGOCIER", label: "À négocier" },
  { valeur: "DEMANDE", label: "Demandé" },
  { valeur: "ACCORDE", label: "Accordé" },
  { valeur: "SIGNE", label: "Signé" },
  { valeur: "LEGALISE", label: "Légalisé" },
  { valeur: "RECU", label: "Reçu" },
  { valeur: "REMBOURSEMENT", label: "En remboursement" },
  { valeur: "SOLDE", label: "Soldé" },
];
const couleurStatut = (s) =>
  ({
    A_NEGOCIER: "gris", DEMANDE: "gris", ACCORDE: "bleu", SIGNE: "bleu",
    LEGALISE: "bleu", RECU: "vert", REMBOURSEMENT: "ambre", SOLDE: "vert",
  }[s] || "gris");

export default function BudgetOtip() {
  const u_info = GetUserData();
  const [data, setData] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [onglet, setOnglet] = useState("budget");
  const [aSupprimer, setASupprimer] = useState(null);
  const [convertisseur, setConvertisseur] = useState(false);
  const [suppression, setSuppression] = useState(false);

  const charger = useCallback((silencieux = false) => {
    if (!silencieux) setChargement(true);
    axios
      .get("otip", u_info.opts)
      .then((r) => setData(r.data))
      .catch(() => toast.error("Chargement impossible"))
      .finally(() => setChargement(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  // Échap referme la confirmation, sauf pendant la suppression.
  useEffect(() => {
    if (!aSupprimer) return;
    const k = (e) => {
      if (e.key === "Escape" && !suppression) setASupprimer(null);
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [aSupprimer, suppression]);

  const params = data?.params || {};
  const calcul = data?.calcul || null;
  const P1 = params.periode1 || "Août";
  const P2 = params.periode2 || "Septembre";
  const MOIS = [P1, P2];

  const lignesDe = (section) =>
    (data?.lignes || []).filter((l) => l.section === section);

  // Année de départ du remboursement : fixe, comme le reste de ce module
  // temporaire (les échéances RSG et les dates de départ sont elles aussi
  // écrites en dur pour 2026). La déduire de la date du jour casserait le
  // calcul dès l'année suivante : "aujourd'hui" en 2027 recalerait le début
  // du remboursement en 2027, alors qu'il a eu lieu en 2026.
  const ANNEE_DEBUT_REMBOURSEMENT = 2026;

  /**
   * Mensualités déjà prélevées depuis le début du remboursement.
   *
   * `moisRemb` ne porte qu'un nom de mois ("Septembre"), sans année ni jour :
   * le premier prélèvement automatique tombe donc le 1er du mois SUIVANT
   * (le remboursement démarre fin du mois indiqué, pas pendant).
   */
  function mensualitesEcoulees(moisDebut) {
    const idx = MOIS_LONG.indexOf(moisDebut);
    if (idx < 0) return 0;
    const aujourdhui = aujourdhuiLocal();
    const debut = new Date(ANNEE_DEBUT_REMBOURSEMENT, idx + 1, 1);
    const diff =
      (aujourdhui.getFullYear() - debut.getFullYear()) * 12 +
      (aujourdhui.getMonth() - debut.getMonth());
    return Math.max(diff + 1, 0);
  }

  // ── Reste à payer, en tenant compte des mensualités déjà prélevées ───────
  // Ni l'objectif ni la barre de progression ne le font : ils datent de la
  // collecte de la garantie, où « emprunts reçus » comptait comme argent
  // acquis, pas comme dette à rembourser (voir l'explication ci-dessous).
  const resteAPayer = lignesDe("EMPRUNT").reduce(
    (s, x) =>
      s + Math.max(nbSafe(x.montant) - nbSafe(x.montant2) * mensualitesEcoulees(x.moisRemb), 0),
    0,
  );

  // ── Reste par mois : revenus récurrents moins charges récurrentes ────────
  // Les dépenses PONCTUELLES en sont exclues à dessein : par définition elles
  // ne se reproduisent pas chaque mois, les compter fausserait un solde
  // mensuel censé se répéter à l'identique.
  const revenusMensuels = lignesDe("REVENU").reduce((s, x) => s + nbSafe(x.montant), 0);
  const resteParMois =
    revenusMensuels - (calcul?.totalFixes || 0) - (calcul?.totalRemboursementMensuel || 0);

  // ── Écritures ────────────────────────────────────────────────────────────
  // Chaque saisie part au serveur, qui renvoie le prévisionnel recalculé :
  // les cartes du haut suivent la valeur qu'on vient de taper.
  function majLigne(id, champ, valeur) {
    setData((d) => ({
      ...d,
      lignes: d.lignes.map((l) => (l.id === id ? { ...l, [champ]: valeur } : l)),
    }));
    axios
      .put(`otip/lignes/${id}`, { [champ]: valeur }, u_info.opts)
      .then(() => charger(true))
      .catch(() => {
        toast.error("Enregistrement refusé");
        charger(true);
      });
  }

  function ajouterLigne(section, gabarit = {}) {
    axios
      .post(
        "otip/lignes",
        { section, libelle: "Nouvelle ligne", montant: 0, ...gabarit },
        u_info.opts
      )
      .then(() => charger(true))
      .catch(() => toast.error("Ajout impossible"));
  }

  function majParam(cle, valeur) {
    axios
      .post("otip/params", { cle, valeur: String(valeur) }, u_info.opts)
      .then(() => charger(true))
      .catch(() => toast.error("Enregistrement refusé"));
  }

  function majDepense(id, champ, valeur) {
    setData((d) => ({
      ...d,
      depenses: d.depenses.map((x) => (x.id === id ? { ...x, [champ]: valeur } : x)),
    }));
    axios
      .put(`otip/depenses/${id}`, { [champ]: valeur }, u_info.opts)
      .then(() => charger(true))
      .catch(() => {
        toast.error("Enregistrement refusé");
        charger(true);
      });
  }

  function ajouterDepense() {
    axios
      .post(
        "otip/depenses",
        { date: dateDuJour(), categorie: "", description: "", montant: 0 },
        u_info.opts
      )
      .then(() => charger(true))
      .catch(() => toast.error("Ajout impossible"));
  }

  function confirmerSuppression() {
    if (!aSupprimer) return;
    const { type, id } = aSupprimer;
    setSuppression(true);
    axios
      .delete(`otip/${type === "depense" ? "depenses" : "lignes"}/${id}`, u_info.opts)
      .then(() => {
        toast.success("Ligne supprimée");
        setASupprimer(null);
        charger(true);
      })
      .catch(() => toast.error("Suppression impossible"))
      .finally(() => setSuppression(false));
  }

  // ── Export ───────────────────────────────────────────────────────────────
  // Reprend la structure du classeur d'origine, en valeurs : le calcul fait
  // foi côté serveur, on n'exporte pas des formules qui pourraient diverger.
  function exporterExcel() {
    if (!data || !calcul) return;
    const [sA, sB] = calcul.scenarios;
    const l = [];
    l.push(["BUDGET OTIP, GARANT D'IRUNO"]);
    l.push([params.echeance || ""]);
    l.push([]);
    l.push(["Objectif", Number(params.objectif || 0)]);
    l.push([`Disponible si départ le ${sA.libelle}`, sA.disponible]);
    l.push([`Disponible si départ le ${sB.libelle}`, sB.disponible]);
    l.push([`Reste à trouver (sur un départ le ${sA.libelle})`, calcul.resteATrouver]);
    l.push([]);

    const bloc = (titre, entetes, lignes, apres = []) => {
      l.push([titre]);
      l.push(entetes);
      lignes.forEach((x) => l.push(x));
      apres.forEach((x) => l.push(x));
      l.push([]);
    };

    bloc(
      "1 · Liquidités actuelles",
      ["Poste", "Montant"],
      lignesDe("LIQUIDITE").map((x) => [x.libelle, x.montant]),
      [
        ["(–) Dépenses déjà engagées", -calcul.depensesEngagees],
        ["SOUS-TOTAL LIQUIDITÉS NETTES", calcul.liquidites],
      ]
    );
    bloc(
      "2 · Créances à recevoir",
      ["Nom", "Montant", "Échéance"],
      lignesDe("CREANCE").map((x) => [x.libelle, x.montant, x.mois]),
      [["TOTAL CRÉANCES", calcul.totalCreances]]
    );
    bloc(
      "3 · Emprunts prévus",
      ["Prêteur", "Contact", "Montant", "Mois de réception", "Remb./mois", "Début remb.", "Statut"],
      lignesDe("EMPRUNT").map((x) => [
        x.libelle, x.contact, x.montant, x.mois, x.montant2, x.moisRemb,
        STATUTS.find((s) => s.valeur === x.statut)?.label || "",
      ]),
      [["TOTAL EMPRUNTS", "", calcul.totalEmprunts, "", calcul.totalRemboursementMensuel]]
    );
    bloc(
      "4 · Revenus mensuels",
      ["Poste", P1, P2, "Versement"],
      lignesDe("REVENU").map((x) => [
        x.libelle, x.montant, x.montant2,
        x.finDeMois ? "fin de mois" : "en cours de mois",
      ]),
      [["TOTAL DU MOIS", calcul.revenusCourants + calcul.revenusFinDeMois, calcul.horsFenetre.revenus]]
    );
    bloc(
      "5 · Dépenses fixes",
      ["Poste", "Montant / mois"],
      lignesDe("FIXE").map((x) => [x.libelle, x.montant]),
      [["TOTAL DÉPENSES FIXES / MOIS", calcul.totalFixes]]
    );
    bloc(
      "6 · Dépenses ponctuelles",
      ["Poste", "Montant", "Mois prévu"],
      lignesDe("PONCTUELLE").map((x) => [x.libelle, x.montant, x.mois]),
      [["TOTAL DÉPENSES PONCTUELLES", calcul.totalPonctuelles]]
    );

    l.push(["7 · Disponible au départ"]);
    l.push(["Poste", `Départ le ${sA.libelle}`, `Départ le ${sB.libelle}`]);
    l.push(["Liquidités nettes", sA.liquidites, sB.liquidites]);
    l.push(["(+) Revenus acquis", sA.revenus, sB.revenus]);
    l.push(["(+) Créances reçues", sA.creances, sB.creances]);
    l.push(["(+) Emprunts reçus", sA.emprunts, sB.emprunts]);
    l.push(["(–) Dépenses fixes", -sA.fixes, -sB.fixes]);
    l.push(["(–) Remboursements prêts", -sA.remboursements, -sB.remboursements]);
    l.push(["(–) Dépenses ponctuelles", -sA.ponctuelles, -sB.ponctuelles]);
    l.push(["DISPONIBLE AU DÉPART", sA.disponible, sB.disponible]);
    l.push(["Manque pour l'objectif", sA.manque, sB.manque]);
    l.push([]);
    l.push([`Après le départ (${P2}), conservé, hors garantie`]);
    l.push(["Créances à recevoir", calcul.horsFenetre.creances]);
    l.push(["Dépenses ponctuelles", -calcul.horsFenetre.ponctuelles]);
    l.push(["Remboursements de prêts", -calcul.horsFenetre.remboursements]);

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(l);
    ws["!cols"] = [
      { wch: 40 }, { wch: 18 }, { wch: 18 }, { wch: 18 },
      { wch: 16 }, { wch: 16 }, { wch: 22 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, "Budget OTIP");

    const dep = [["Date", "Catégorie", "Description", "Montant (DH)"]];
    (data.depenses || []).forEach((d) =>
      dep.push([
        d.date ? String(d.date).split("T")[0] : "",
        d.categorie, d.description, d.montant,
      ])
    );
    dep.push(["", "", "TOTAL DÉPENSES ENGAGÉES", calcul.depensesEngagees]);
    const ws2 = XLSX.utils.aoa_to_sheet(dep);
    ws2["!cols"] = [{ wch: 14 }, { wch: 18 }, { wch: 40 }, { wch: 16 }];
    XLSX.utils.book_append_sheet(wb, ws2, "Dépenses journalières");

    XLSX.writeFile(wb, `Budget_OTIP_${dateDuJour()}.xlsx`);
    toast.success("Export généré");
  }

  // ── Rendu ────────────────────────────────────────────────────────────────
  const Section = ({ titre, num, Icone, children, onAjouter, aide }) => (
    <div className="card-pro p-0 otip-section">
      <div className="otip-section-tete">
        <div className="d-flex align-items-center gap-2">
          <span className="otip-num">{num}</span>
          <div>
            <h6 className="mb-0 fw-bold d-flex align-items-center gap-2">
              <Icone /> {titre}
            </h6>
            {aide && <small className="text-muted otip-aide">{aide}</small>}
          </div>
        </div>
        {onAjouter && (
          <button
            className="btn btn-success btn-sm d-inline-flex align-items-center gap-1"
            onClick={onAjouter}
          >
            <BsPlus size={16} /> Ajouter
          </button>
        )}
      </div>
      <div className="table-responsive">{children}</div>
    </div>
  );

  const btnSuppr = (cible, quoi) => (
    <button
      className="btn-action btn-action-delete"
      title={`Supprimer « ${quoi} »`}
      aria-label={`Supprimer « ${quoi} »`}
      onClick={() => setASupprimer(cible)}
    >
      <BsFillTrashFill />
    </button>
  );

  return (
    <Template>
      <Header />
      <div className="container-fluid flex-grow-1">
        <div className="row g-0">
          <Sidebar />
          <main className="col-md-9 ms-sm-auto col-lg-10 px-md-4 main">

            <div className="page-header">
              <div>
                <h1 className="page-title">
                  <BsPiggyBank /> Budget OTIP
                </h1>
                <p className="text-muted small mb-0">
                  {params.echeance || "Remboursement des prêts pour le départ d'Iruno"}
                </p>
              </div>
              <div className="d-flex gap-2 align-items-center flex-wrap">
                <button
                  className="btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-1"
                  onClick={() => setConvertisseur(true)}
                  title="Convertir entre ariary, franc malgache, euro et dirham"
                >
                  <BsCurrencyExchange /> Convertir
                </button>
                <button
                  className="btn btn-outline-success btn-sm d-inline-flex align-items-center gap-1"
                  onClick={exporterExcel}
                  disabled={!data}
                >
                  <BsFileEarmarkExcel /> Excel
                </button>
              </div>
            </div>

            {chargement || !calcul ? (
              <SkBenefices />
            ) : (
              <>
                {/* Objectif : le total à réunir pour rembourser CPM et AC2I. */}
                <div className="row g-3 mb-3">
                  <div className="col-sm-6 col-lg-3">
                    <div className="stat-card">
                      <div className="stat-icon blue"><BsBank /></div>
                      <div className="stat-content">
                        <h3 className="otip-kpi-editable">
                          <Cellule
                            valeur={Number(params.objectif || 0)}
                            type="nombre"
                            onSave={(v) => majParam("objectif", v)}
                            fort
                          />
                        </h3>
                        <p>Objectif (DH)</p>
                      </div>
                    </div>
                  </div>

                  {/* Décroît tout seul, mois après mois, une fois les
                      prélèvements automatiques démarrés (voir CPM/AC2I). */}
                  <div className="col-sm-6 col-lg-3">
                    <div className="stat-card">
                      <div className={`stat-icon ${resteAPayer > 0 ? "red" : "green"}`}>
                        {resteAPayer > 0 ? <BsCalendarEvent /> : <BsCheckCircleFill />}
                      </div>
                      <div className="stat-content">
                        <h3>{Math.round(resteAPayer).toLocaleString("fr-FR")}</h3>
                        <p>
                          Reste à payer (DH)
                          <small className="d-block otip-kpi-note">
                            {DH(Math.round(calcul.totalRemboursementMensuel))}/mois, prélevés automatiquement
                          </small>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Revenus récurrents moins charges récurrentes ; les
                      dépenses ponctuelles n'y entrent pas, par définition
                      elles ne se répètent pas chaque mois. */}
                  <div className="col-sm-6 col-lg-3">
                    <div className="stat-card">
                      <div className={`stat-icon ${resteParMois >= 0 ? "green" : "red"}`}>
                        {resteParMois >= 0 ? <BsCheckCircleFill /> : <BsExclamationTriangle />}
                      </div>
                      <div className="stat-content">
                        <h3 className={resteParMois < 0 ? "text-danger" : ""}>
                          {resteParMois < 0 ? "− " : ""}
                          {Math.abs(Math.round(resteParMois)).toLocaleString("fr-FR")}
                        </h3>
                        <p>
                          Reste par mois (DH)
                          <small className="d-block otip-kpi-note">
                            revenus − fixes − remboursements
                          </small>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card-pro otip-progression mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                    <span className="fw-semibold" style={{ fontSize: "0.85rem" }}>
                      Progression vers l'objectif
                    </span>
                    <span className="text-muted" style={{ fontSize: "0.8rem" }}>
                      {DH(Math.round(calcul.soldeReference))} sur {DH(calcul.objectif)} ·{" "}
                      <strong>{calcul.progression.toFixed(1)} %</strong>
                    </span>
                  </div>
                  <div className="otip-barre">
                    <div
                      className={`otip-barre-remplie ${calcul.resteATrouver > 0 ? "" : "atteint"}`}
                      style={{ width: `${Math.max(calcul.progression, 1)}%` }}
                    />
                  </div>
                </div>

                {/* Onglets */}
                <div className="otip-onglets mb-3">
                  <button
                    className={onglet === "budget" ? "actif" : ""}
                    onClick={() => setOnglet("budget")}
                  >
                    <BsJournalText /> Budget prévisionnel
                  </button>
                  <button
                    className={onglet === "depenses" ? "actif" : ""}
                    onClick={() => setOnglet("depenses")}
                  >
                    <BsReceipt /> Dépenses journalières
                    {data.depenses.length > 0 && (
                      <span className="otip-pastille">{data.depenses.length}</span>
                    )}
                  </button>
                </div>

                {onglet === "budget" ? (
                  <div className="row g-3">
                    {/* 1 · Liquidités */}
                    <div className="col-12 col-xl-6">
                      <Section
                        num="1" titre="Liquidités actuelles" Icone={BsWallet2}
                        aide="Ce dont vous disposez aujourd'hui"
                        onAjouter={() => ajouterLigne("LIQUIDITE")}
                      >
                        <table className="table otip-table mb-0">
                          <thead>
                            <tr><th>Poste</th><th className="text-end">Montant</th><th /></tr>
                          </thead>
                          <tbody>
                            {lignesDe("LIQUIDITE").map((x) => (
                              <tr key={x.id}>
                                <td><Cellule valeur={x.libelle} onSave={(v) => majLigne(x.id, "libelle", v)} /></td>
                                <td><Cellule valeur={x.montant} type="nombre" onSave={(v) => majLigne(x.id, "montant", v)} /></td>
                                <td className="otip-actions">
                                  {btnSuppr({ type: "ligne", id: x.id, libelle: x.libelle, montant: x.montant }, x.libelle)}
                                </td>
                              </tr>
                            ))}
                            <tr className="otip-ligne-calc">
                              <td>(–) Dépenses déjà engagées</td>
                              <td className="text-end">− {DH(calcul.depensesEngagees)}</td>
                              <td />
                            </tr>
                            <tr className="otip-total">
                              <td>Liquidités nettes</td>
                              <td className="text-end">{DH(calcul.liquidites)}</td>
                              <td />
                            </tr>
                          </tbody>
                        </table>
                      </Section>
                    </div>

                    {/* 2 · Créances */}
                    <div className="col-12 col-xl-6">
                      <Section
                        num="2" titre="Créances à recevoir" Icone={BsPeople}
                        aide="Ce qu'on vous doit"
                        onAjouter={() => ajouterLigne("CREANCE", { mois: P1 })}
                      >
                        <table className="table otip-table mb-0">
                          <thead>
                            <tr><th>Nom</th><th className="text-end">Montant</th><th>Échéance</th><th /></tr>
                          </thead>
                          <tbody>
                            {lignesDe("CREANCE").map((x) => (
                              <tr key={x.id}>
                                <td><Cellule valeur={x.libelle} onSave={(v) => majLigne(x.id, "libelle", v)} /></td>
                                <td><Cellule valeur={x.montant} type="nombre" onSave={(v) => majLigne(x.id, "montant", v)} /></td>
                                <td><Cellule valeur={x.mois} type="liste" options={MOIS} onSave={(v) => majLigne(x.id, "mois", v)} /></td>
                                <td className="otip-actions">
                                  {btnSuppr({ type: "ligne", id: x.id, libelle: x.libelle, montant: x.montant }, x.libelle)}
                                </td>
                              </tr>
                            ))}
                            <tr className="otip-total">
                              <td>Total créances</td>
                              <td className="text-end">{DH(calcul.totalCreances)}</td>
                              <td colSpan={2} />
                            </tr>
                          </tbody>
                        </table>
                      </Section>
                    </div>

                    {/* 3 · Emprunts */}
                    <div className="col-12">
                      <Section
                        num="3" titre="Emprunts prévus" Icone={BsBank}
                        aide="Qui vous prête, combien, et ce que vous lui rendez chaque mois"
                        onAjouter={() =>
                          ajouterLigne("EMPRUNT", {
                            mois: P1, statut: "A_NEGOCIER", libelle: "Nouveau prêteur",
                          })
                        }
                      >
                        <table className="table otip-table mb-0">
                          <thead>
                            <tr>
                              <th>Prêteur</th><th>Contact</th><th className="text-end">Montant</th>
                              <th>Reçu en</th><th className="text-end">Remb./mois</th>
                              <th>Début remb.</th><th>Statut</th><th />
                            </tr>
                          </thead>
                          <tbody>
                            {lignesDe("EMPRUNT").map((x) => (
                              <tr key={x.id}>
                                <td><Cellule valeur={x.libelle} onSave={(v) => majLigne(x.id, "libelle", v)} /></td>
                                <td><Cellule valeur={x.contact} placeholder="à renseigner" onSave={(v) => majLigne(x.id, "contact", v)} /></td>
                                <td><Cellule valeur={x.montant} type="nombre" onSave={(v) => majLigne(x.id, "montant", v)} /></td>
                                <td><Cellule valeur={x.mois} type="liste" options={MOIS} onSave={(v) => majLigne(x.id, "mois", v)} /></td>
                                <td><Cellule valeur={x.montant2} type="nombre" onSave={(v) => majLigne(x.id, "montant2", v)} /></td>
                                <td><Cellule valeur={x.moisRemb} type="liste" options={MOIS} onSave={(v) => majLigne(x.id, "moisRemb", v)} /></td>
                                <td>
                                  <span className={`otip-statut ${couleurStatut(x.statut)}`}>
                                    <Cellule
                                      valeur={x.statut} type="liste" options={STATUTS}
                                      onSave={(v) => majLigne(x.id, "statut", v)}
                                    />
                                  </span>
                                </td>
                                <td className="otip-actions">
                                  {btnSuppr({ type: "ligne", id: x.id, libelle: x.libelle, montant: x.montant }, x.libelle)}
                                </td>
                              </tr>
                            ))}
                            <tr className="otip-total">
                              <td colSpan={2}>Total emprunts</td>
                              <td className="text-end">{DH(calcul.totalEmprunts)}</td>
                              <td />
                              <td className="text-end">{DH(calcul.totalRemboursementMensuel)}</td>
                              <td colSpan={3} />
                            </tr>
                          </tbody>
                        </table>
                      </Section>
                    </div>

                    {/* 4 · Revenus */}
                    <div className="col-12 col-xl-6">
                      <Section
                        num="4" titre="Revenus mensuels" Icone={BsArrowRepeat}
                        aide="Un revenu « fin de mois » n'est acquis que si le départ est après la paie"
                        onAjouter={() => ajouterLigne("REVENU")}
                      >
                        <table className="table otip-table mb-0">
                          <thead>
                            <tr>
                              <th>Poste</th>
                              <th className="text-end">{P1}</th>
                              <th className="text-end">{P2}</th>
                              <th className="text-center">Versé</th>
                              <th />
                            </tr>
                          </thead>
                          <tbody>
                            {lignesDe("REVENU").map((x) => (
                              <tr key={x.id}>
                                <td><Cellule valeur={x.libelle} onSave={(v) => majLigne(x.id, "libelle", v)} /></td>
                                <td><Cellule valeur={x.montant} type="nombre" onSave={(v) => majLigne(x.id, "montant", v)} /></td>
                                <td><Cellule valeur={x.montant2} type="nombre" onSave={(v) => majLigne(x.id, "montant2", v)} /></td>
                                <td className="text-center">
                                  {/* Décide si ce revenu tombe avant ou après le 29 août. */}
                                  <button
                                    type="button"
                                    className={`otip-bascule ${x.finDeMois ? "fin" : "courant"}`}
                                    onClick={() => majLigne(x.id, "finDeMois", x.finDeMois ? 0 : 1)}
                                    aria-pressed={!!x.finDeMois}
                                    title={
                                      x.finDeMois
                                        ? "Versé en fin de mois, perdu si le départ est le 29 août"
                                        : "Versé en cours de mois, acquis dans les deux cas"
                                    }
                                  >
                                    {x.finDeMois ? "fin de mois" : "en cours"}
                                  </button>
                                </td>
                                <td className="otip-actions">
                                  {btnSuppr({ type: "ligne", id: x.id, libelle: x.libelle, montant: x.montant }, x.libelle)}
                                </td>
                              </tr>
                            ))}
                            <tr className="otip-total">
                              <td>Total du mois</td>
                              <td className="text-end">
                                {DH(calcul.revenusCourants + calcul.revenusFinDeMois)}
                              </td>
                              <td className="text-end">{DH(calcul.horsFenetre.revenus)}</td>
                              <td colSpan={2} />
                            </tr>
                            {/* Ce qui compte vraiment : la part acquise selon la
                                date de départ, colonne « Août » seulement. */}
                            <tr className="otip-ligne-calc">
                              <td>dont acquis au départ</td>
                              <td className="text-end">
                                {DH(calcul.scenarios[0].revenus)} <span className="otip-mini">le {calcul.scenarios[0].libelle}</span>
                              </td>
                              <td className="text-end">
                                {DH(calcul.scenarios[1].revenus)} <span className="otip-mini">le {calcul.scenarios[1].libelle}</span>
                              </td>
                              <td colSpan={2} />
                            </tr>
                          </tbody>
                        </table>
                      </Section>
                    </div>

                    {/* 5 · Dépenses fixes */}
                    <div className="col-12 col-xl-6">
                      <Section
                        num="5" titre="Dépenses fixes" Icone={BsCashCoin}
                        aide="Prélevées chaque mois, sans prorata"
                        onAjouter={() => ajouterLigne("FIXE")}
                      >
                        <table className="table otip-table mb-0">
                          <thead>
                            <tr><th>Poste</th><th className="text-end">Montant / mois</th><th /></tr>
                          </thead>
                          <tbody>
                            {lignesDe("FIXE").map((x) => (
                              <tr key={x.id}>
                                <td><Cellule valeur={x.libelle} onSave={(v) => majLigne(x.id, "libelle", v)} /></td>
                                <td><Cellule valeur={x.montant} type="nombre" onSave={(v) => majLigne(x.id, "montant", v)} /></td>
                                <td className="otip-actions">
                                  {btnSuppr({ type: "ligne", id: x.id, libelle: x.libelle, montant: x.montant }, x.libelle)}
                                </td>
                              </tr>
                            ))}
                            <tr className="otip-total">
                              <td>Total / mois</td>
                              <td className="text-end">{DH(calcul.totalFixes)}</td>
                              <td />
                            </tr>
                          </tbody>
                        </table>
                      </Section>
                    </div>

                    {/* 6 · Dépenses ponctuelles */}
                    <div className="col-12 col-xl-6">
                      <Section
                        num="6" titre="Dépenses ponctuelles" Icone={BsCalendarEvent}
                        aide="Prévues une seule fois"
                        onAjouter={() => ajouterLigne("PONCTUELLE", { mois: P1 })}
                      >
                        <table className="table otip-table mb-0">
                          <thead>
                            <tr><th>Poste</th><th className="text-end">Montant</th><th>Mois prévu</th><th /></tr>
                          </thead>
                          <tbody>
                            {lignesDe("PONCTUELLE").map((x) => (
                              <tr key={x.id}>
                                <td><Cellule valeur={x.libelle} onSave={(v) => majLigne(x.id, "libelle", v)} /></td>
                                <td><Cellule valeur={x.montant} type="nombre" onSave={(v) => majLigne(x.id, "montant", v)} /></td>
                                <td><Cellule valeur={x.mois} type="liste" options={MOIS} onSave={(v) => majLigne(x.id, "mois", v)} /></td>
                                <td className="otip-actions">
                                  {btnSuppr({ type: "ligne", id: x.id, libelle: x.libelle, montant: x.montant }, x.libelle)}
                                </td>
                              </tr>
                            ))}
                            <tr className="otip-total">
                              <td>Total ponctuelles</td>
                              <td className="text-end">{DH(calcul.totalPonctuelles)}</td>
                              <td colSpan={2} />
                            </tr>
                          </tbody>
                        </table>
                      </Section>
                    </div>

                  </div>
                ) : (
                  /* Dépenses journalières */
                  <div className="card-pro p-0 otip-section">
                    <div className="otip-section-tete">
                      <div>
                        <h6 className="mb-0 fw-bold d-flex align-items-center gap-2">
                          <BsReceipt /> Dépenses journalières
                        </h6>
                        <small className="text-muted otip-aide">
                          Chaque montant saisi ici se déduit de vos liquidités, section 1
                        </small>
                      </div>
                      <div className="d-flex align-items-center gap-3">
                        <span className="fw-bold text-danger">{DH(calcul.depensesEngagees)}</span>
                        <button
                          className="btn btn-success btn-sm d-inline-flex align-items-center gap-1"
                          onClick={ajouterDepense}
                        >
                          <BsPlus size={16} /> Ajouter
                        </button>
                      </div>
                    </div>
                    <div className="table-responsive">
                      <table className="table otip-table mb-0">
                        <thead>
                          <tr>
                            <th>Date</th><th>Catégorie</th><th>Description</th>
                            <th className="text-end">Montant</th><th />
                          </tr>
                        </thead>
                        <tbody>
                          {data.depenses.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="text-center text-muted py-5">
                                <div className="mb-2">Aucune dépense enregistrée</div>
                                <button
                                  className="btn btn-sm btn-success d-inline-flex align-items-center gap-1"
                                  onClick={ajouterDepense}
                                >
                                  <BsPlus /> Ajouter
                                </button>
                              </td>
                            </tr>
                          ) : (
                            data.depenses.map((d) => (
                              <tr key={d.id}>
                                <td style={{ whiteSpace: "nowrap" }}>
                                  <Cellule
                                    valeur={d.date ? String(d.date).split("T")[0] : ""}
                                    type="date"
                                    onSave={(v) => majDepense(d.id, "date", v)}
                                  />
                                  <small className="d-block text-muted otip-date-lisible">
                                    {formatDate(d.date)}
                                  </small>
                                </td>
                                <td><Cellule valeur={d.categorie} onSave={(v) => majDepense(d.id, "categorie", v)} /></td>
                                <td><Cellule valeur={d.description} onSave={(v) => majDepense(d.id, "description", v)} /></td>
                                <td><Cellule valeur={d.montant} type="nombre" onSave={(v) => majDepense(d.id, "montant", v)} /></td>
                                <td className="otip-actions">
                                  {btnSuppr(
                                    { type: "depense", id: d.id, libelle: d.description || "cette dépense", montant: d.montant },
                                    d.description || "cette dépense"
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                          {data.depenses.length > 0 && (
                            <tr className="otip-total">
                              <td colSpan={3}>Total engagé</td>
                              <td className="text-end">{DH(calcul.depensesEngagees)}</td>
                              <td />
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* Doublon flottant du bouton Convertir : sur une page longue, le
          bouton du bandeau sort de l'écran dès qu'on descend, alors qu'on a
          souvent besoin du convertisseur en pleine saisie. */}
      <button
        type="button"
        className="otip-convertir-flottant"
        onClick={() => setConvertisseur(true)}
        title="Convertir entre ariary, franc malgache, euro et dirham"
      >
        <BsCurrencyExchange size={20} />
      </button>

      {convertisseur && <Convertisseur onClose={() => setConvertisseur(false)} />}

      {/* Confirmation de suppression */}
      {aSupprimer && (
        <div className="modal-overlay" onClick={() => !suppression && setASupprimer(null)}>
          <div
            className="modal-content-pro"
            style={{ maxWidth: 430 }}
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
          >
            <div className="modal-header-pro">
              <h6 className="text-danger">
                <BsExclamationTriangle className="me-2" /> Supprimer cette ligne ?
              </h6>
              <button
                className="btn-close" aria-label="Fermer"
                onClick={() => setASupprimer(null)} disabled={suppression}
              />
            </div>
            <div className="p-4">
              <p className="text-muted mb-3" style={{ fontSize: "0.85rem" }}>
                Cette ligne sera retirée du budget et le prévisionnel sera recalculé.
                L'opération est irréversible.
              </p>
              <div
                className="p-3 rounded-3 mb-3 d-flex justify-content-between align-items-center gap-3"
                style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}
              >
                <span className="fw-bold" style={{ fontSize: "0.9rem" }}>
                  {aSupprimer.libelle}
                </span>
                <span className="fw-bold text-danger" style={{ whiteSpace: "nowrap" }}>
                  {DH(aSupprimer.montant)}
                </span>
              </div>
              <div className="d-flex justify-content-end gap-2">
                <button
                  className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-1"
                  onClick={() => setASupprimer(null)}
                  disabled={suppression}
                  autoFocus
                >
                  <BsXLg /> Annuler
                </button>
                <button
                  className="btn btn-danger btn-sm d-inline-flex align-items-center gap-1"
                  onClick={confirmerSuppression}
                  disabled={suppression}
                >
                  <BsFillTrashFill /> {suppression ? "Suppression..." : "Supprimer"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Template>
  );
}
