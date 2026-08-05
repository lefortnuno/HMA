import { useState, useEffect, useRef } from "react";
import axios from "../../contexts/api/axios";
import GetUserData from "../../contexts/api/udata";
import Template from "../../components/template/template";
import Header from "../../components/header/header";
import Sidebar from "../../components/sidebar/sidebar";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import {
  BsLightningCharge,
  BsFileEarmarkExcel,
  BsExclamationTriangleFill,
  BsWhatsapp,
  BsMessenger,
  BsFileEarmarkText,
  BsBuilding,
  BsPeople,
  BsGraphUp,
  BsGraphDown,
  BsCashCoin,
  BsXLg,
} from "react-icons/bs";
import * as XLSX from "xlsx";
import { SkLoyerRows } from "../../components/skeleton/skeleton";
import ApartSelect, {
  useAppartements,
  getSelectedBienId,
  setSelectedBienId,
  KINYA,
} from "../../components/appart/apart.select";
import { copierEtOuvrirMessenger } from "../../config/contact";
import SaisieReleves from "./releves.jirama";
import { estAvantEntree } from "../../config/echeance";
import { AnneePicker } from "../../components/jour/periode.picker";
import "./loyer.css";
import { MOIS_COURT as MOIS, MOIS_LONG as MOIS_FULL } from "../../config/dates";

const PAR_PAGE = 9;

// Jour du mois ou la facture de la compagnie arrive habituellement.
const JOUR_FACTURE = 25;

/**
 * La facture JIRAMA d'un mois est-elle censee etre arrivee ?
 *
 * L'eau et l'electricite se consomment puis se paient : rien ne peut etre
 * reclame pour le mois en cours avant l'arrivee de la facture, vers le 25.
 */
function factureArrivee(mois, annee, aujourdhui = new Date()) {
  const anneeCourante = aujourdhui.getFullYear();
  const moisCourant = aujourdhui.getMonth() + 1;
  if (Number(annee) < anneeCourante) return true;
  if (Number(annee) > anneeCourante) return false;
  if (Number(mois) < moisCourant) return true;
  if (Number(mois) > moisCourant) return false;
  return aujourdhui.getDate() >= JOUR_FACTURE;
}

function lienRelanceWhatsApp(loc, moisNom, annee, montant) {
  if (!loc.tel) return null;
  const num = loc.tel.replace(/\s+/g, "").replace(/^\+/, "");
  return `https://wa.me/${num}?text=${encodeURIComponent(texteRelance(loc, moisNom, annee, montant))}`;
}

function texteRelance(loc, moisNom, annee, montant) {
  return (
    `Bonjour ${loc.nom},\n` +
    `Petit rappel concernant votre facture d'électricité et d'eau (JIRAMA) ` +
    `du mois de ${moisNom} ${annee} (chambre ${loc.chambre}), ` +
    `d'un montant de ${(montant || 0).toLocaleString()} Ar.\n` +
    `Merci de régulariser dès que possible.\n` +
    `— Trofel`
  );
}

/**
 * JIRAMA restant à recouvrer.
 *
 * Ne comptent que les mois effectivement facturés : sans relevé de
 * consommation, il n'y a rien à réclamer.
 */
function AlerteJirama({ locataires, getCell, factureDe, annee }) {
  const [ongletActif, setOngletActif] = useState(0);
  const [page, setPage] = useState(1);

  const parMois = {};
  locataires
    .filter((loc) => loc.actif)
    .forEach((loc) => {
      for (let m = 1; m <= 12; m++) {
        const facture = factureDe(loc.id, m);
        if (facture <= 0) continue; // pas de relevé pour ce mois
        // Facture pas encore arrivee : rien a reclamer, meme au forfait.
        if (!factureArrivee(m, annee)) continue;
        const p = getCell(loc.id, m);
        if (p && p.statutJIRAMA === "PAYE") continue;
        const paye = p && p.statutJIRAMA === "PARTIEL" ? p.montantJIRAMA || 0 : 0;
        const reste = facture - paye;
        if (reste <= 0) continue;
        (parMois[m] = parMois[m] || []).push({
          loc,
          reste,
          partiel: !!(p && p.statutJIRAMA === "PARTIEL"),
          doute: !!(p && p.statutJIRAMA === "DOUTE"),
        });
      }
    });

  const moisConcernes = Object.keys(parMois).map(Number).sort((a, b) => b - a);
  if (moisConcernes.length === 0) return null;

  const totalGlobal = moisConcernes.reduce(
    (s, m) => s + parMois[m].reduce((t, x) => t + x.reste, 0),
    0
  );
  const moisActif = moisConcernes[Math.min(ongletActif, moisConcernes.length - 1)];
  const liste = parMois[moisActif] || [];
  const totalOnglet = liste.reduce((s, x) => s + x.reste, 0);
  const nbPages = Math.max(1, Math.ceil(liste.length / PAR_PAGE));
  const pageSure = Math.min(page, nbPages);
  const visibles = liste.slice((pageSure - 1) * PAR_PAGE, pageSure * PAR_PAGE);

  return (
    <div className="card-pro p-0 mb-4" style={{ overflow: "hidden", borderTop: "3px solid #f59e0b" }}>
      <div
        className="px-3 py-3 d-flex justify-content-between align-items-center flex-wrap gap-2"
        style={{ background: "linear-gradient(90deg,#fffbeb,#fff)" }}
      >
        <div className="d-flex align-items-center gap-2">
          <span
            className="d-inline-flex align-items-center justify-content-center rounded-3"
            style={{ background: "#fef3c7", color: "#d97706", width: 38, height: 38 }}
          >
            <BsExclamationTriangleFill size={18} />
          </span>
          <div>
            <h6 className="mb-0 fw-bold" style={{ color: "#92400e", fontSize: "0.95rem" }}>
              JIRAMA à recouvrer
            </h6>
            <small className="text-muted" style={{ fontSize: "0.75rem" }}>
              Relevés de compteur et forfaits mensuels échus
            </small>
          </div>
        </div>
        <div className="text-end">
          <div className="fw-bold" style={{ color: "#b45309", fontSize: "1.15rem", lineHeight: 1.1 }}>
            {totalGlobal.toLocaleString()} Ar
          </div>
          <small className="text-muted" style={{ fontSize: "0.72rem" }}>total en attente</small>
        </div>
      </div>

      <div className="d-flex gap-1 px-3 flex-wrap" style={{ borderBottom: "1px solid #e2e8f0" }}>
        {moisConcernes.map((m, i) => {
          const actif = m === moisActif;
          return (
            <button
              key={m}
              onClick={() => { setOngletActif(i); setPage(1); }}
              className="btn btn-sm d-flex align-items-center gap-2 fw-semibold"
              style={{
                borderRadius: 0,
                border: "none",
                borderBottom: actif ? "2px solid #d97706" : "2px solid transparent",
                color: actif ? "#b45309" : "#64748b",
                background: "transparent",
                fontSize: "0.82rem",
              }}
            >
              {MOIS_FULL[m - 1]}
              <span
                className="rounded-pill px-2"
                style={{
                  background: actif ? "#fef3c7" : "#f1f5f9",
                  color: actif ? "#b45309" : "#64748b",
                  fontSize: "0.7rem",
                  fontWeight: 700,
                }}
              >
                {parMois[m].length}
              </span>
            </button>
          );
        })}
      </div>

      <div className="px-3 py-2 d-flex justify-content-between align-items-center flex-wrap gap-2"
        style={{ background: "#fffdf7" }}>
        <small className="text-muted" style={{ fontSize: "0.76rem" }}>
          {liste.length} locataire{liste.length > 1 ? "s" : ""} · {MOIS_FULL[moisActif - 1]} {annee}
        </small>
        <small className="fw-bold" style={{ color: "#b45309" }}>
          {totalOnglet.toLocaleString()} Ar
        </small>
      </div>

      <div className="row g-2 p-3">
        {visibles.map(({ loc, reste, partiel, doute }) => {
          const lien = lienRelanceWhatsApp(loc, MOIS_FULL[moisActif - 1], annee, reste);
          return (
            <div className="col-12 col-md-6 col-xl-4" key={loc.id}>
              <div className="rounded-3 p-2 h-100 d-flex align-items-center gap-2"
                style={{ background: "#fff", border: "1px solid #fde68a" }}>
                <span className={loc.etage === "RDC" ? "badge-rdc" : "badge-1er"}>{loc.chambre}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="fw-semibold text-truncate" style={{ fontSize: "0.83rem" }}>
                    {loc.nom} {loc.prenom}
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "#b45309", fontWeight: 700 }}>
                    {reste.toLocaleString()} Ar
                    {partiel && <span className="text-muted fw-normal"> · partiel</span>}
                    {doute && <span className="text-muted fw-normal"> · à confirmer</span>}
                  </div>
                </div>
                {lien && (
                  <a href={lien} target="_blank" rel="noopener noreferrer"
                    className="btn btn-sm d-inline-flex align-items-center gap-1 fw-semibold"
                    style={{ background: "#25D366", color: "#fff", fontSize: "0.7rem" }}>
                    <BsWhatsapp size={11} /> Relancer
                  </a>
                )}
                {!lien && (
                  <button
                    className="btn btn-sm d-inline-flex align-items-center gap-1 fw-semibold"
                    style={{ background: "#0866FF", color: "#fff", fontSize: "0.7rem" }}
                    onClick={() => {
                      copierEtOuvrirMessenger(
                        texteRelance(loc, MOIS_FULL[moisActif - 1], annee, reste),
                        loc.nom,
                        loc.messengerId
                      );
                      toast.info("Message copié — collez-le dans la conversation");
                    }}
                  >
                    <BsMessenger size={11} /> Relancer
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {nbPages > 1 && (
        <div className="d-flex justify-content-end align-items-center gap-1 px-3 pb-3">
          <button className="btn btn-outline-secondary btn-sm" disabled={pageSure === 1}
            onClick={() => setPage(pageSure - 1)}>‹</button>
          <small className="text-muted px-2" style={{ fontSize: "0.75rem" }}>
            {pageSure} / {nbPages}
          </small>
          <button className="btn btn-outline-secondary btn-sm" disabled={pageSure === nbPages}
            onClick={() => setPage(pageSure + 1)}>›</button>
        </div>
      )}
    </div>
  );
}

export default function TableauJirama() {
  const u_info = GetUserData();
  const tableauRef = useRef(null);
  const moisCourant = new Date().getMonth() + 1;
  const [bienId, setBienId] = useState(getSelectedBienId());
  const apparts = useAppartements(bienId, setBienId);
  const current = apparts.find((a) => a.id === bienId) || KINYA;
  const [annee, setAnnee] = useState(new Date().getFullYear());
  const [locataires, setLocataires] = useState([]);
  const [paiements, setPaiements] = useState({});
  const [factures, setFactures] = useState({}); // factures[locId][mois] = montant relevé
  const [totauxFacture, setTotauxFacture] = useState({}); // totauxFacture[mois] = facture JIRAMA globale
  const [loading, setLoading] = useState(true);
  const [modalCell, setModalCell] = useState(null);
  // Deux faces d un meme sujet : ce que la compagnie facture, ce que les
  // locataires reglent. Les separer en deux pages obligeait a faire l aller-retour.
  const [vue, setVue] = useState("REGLEMENTS"); // REGLEMENTS | RELEVES

  useEffect(() => {
    if (locataires.length === 0) setLoading(true);
    Promise.all([fetchLocataires(), fetchPaiements(), fetchFactures()]).finally(() =>
      setLoading(false)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [annee, bienId]);

  // Comme pour les loyers : on cadre la vue sur le mois précédent le mois courant.
  useEffect(() => {
    if (loading || locataires.length === 0) return;
    const box = tableauRef.current;
    if (!box || box.scrollWidth <= box.clientWidth) return;
    const th = box.querySelector(`thead th[data-mois="${Math.max(1, moisCourant - 1)}"]`);
    if (!th) return;
    const ths = box.querySelectorAll("thead th");
    const figees = (ths[0]?.offsetWidth || 0) + (ths[1]?.offsetWidth || 0);
    box.scrollTo({ left: Math.max(0, th.offsetLeft - figees), behavior: "smooth" });
  }, [loading, locataires.length, annee, moisCourant]);

  function changeAppart(id) {
    setBienId(id);
    setSelectedBienId(id);
  }

  function fetchLocataires() {
    return axios
      .get(`loyer/locataires?bienId=${bienId}`, u_info.opts)
      .then((r) => setLocataires(r.data || []))
      .catch(() => setLocataires([]));
  }

  function fetchPaiements() {
    return axios
      .get(`loyer/paiements?annee=${annee}`, u_info.opts)
      .then((r) => {
        const map = {};
        (r.data || []).forEach((p) => {
          if (!map[p.locataireId]) map[p.locataireId] = {};
          map[p.locataireId][p.mois] = p;
        });
        setPaiements(map);
      })
      .catch(() => setPaiements({}));
  }

  // Consommations relevées : ce que chaque locataire doit, mois par mois.
  function fetchFactures() {
    return axios
      .get(`loyer/factures?annee=${annee}&bienId=${bienId}`, u_info.opts)
      .then((r) => {
        const map = {};
        const totaux = {};
        (r.data || []).forEach((f) => {
          totaux[f.mois] = f.montantTotal || 0;
          (f.consommations || []).forEach((c) => {
            if (!map[c.locataireId]) map[c.locataireId] = {};
            map[c.locataireId][f.mois] = {
              montant: c.montantJIRAMA || 0,
              exempt: !!c.exempt,
            };
          });
        });
        setFactures(map);
        setTotauxFacture(totaux);
      })
      .catch(() => {
        setFactures({});
        setTotauxFacture({});
      });
  }

  const getCell = (locId, mois) => paiements[locId]?.[mois] || null;

  /**
   * Montant JIRAMA du par un locataire sur un mois.
   *
   * Certains locataires reglent au forfait (10 000 Ar). Le compteur reste la
   * reference quand il depasse : le surplus releve leur est facture en plus.
   */
  const factureDe = (locId, mois) => {
    const loc0 = locataires.find((l) => l.id === locId);
    // Bail sans eau ni electricite : rien ne lui est jamais reclame.
    if (loc0?.jiramaNonSoumis) return 0;
    const ligne = factures[locId]?.[mois];
    // Absent ce mois-la : rien ne lui est du, pas meme son forfait.
    // Le signal vient du releve (case Absent) ou du statut du reglement.
    if (ligne?.exempt || getCell(locId, mois)?.statutJIRAMA === "ABSENT") return 0;
    const releve = ligne?.montant || 0;
    const forfait = forfaitDe(locId);
    if (!forfait) return releve;
    const loc = locataires.find((l) => l.id === locId);
    if (estAvantEntree(loc, mois, annee)) return releve;
    const maintenant = new Date();
    const aVenir =
      annee > maintenant.getFullYear() ||
      (annee === maintenant.getFullYear() && mois > maintenant.getMonth() + 1);
    if (aVenir) return releve;
    // Le forfait du mois en cours n'est du qu'une fois la facture arrivee.
    if (!releve && !factureArrivee(mois, annee)) return 0;
    return Math.max(forfait, releve);
  };

  const forfaitDe = (locId) =>
    Number(locataires.find((l) => l.id === locId)?.jiramaForfait) || 0;

  // Encaissé sur un mois, tous locataires confondus (rapprochement facture).
  function encaisseDuMois(mois) {
    return locataires.reduce((s, loc) => {
      const p = getCell(loc.id, mois);
      if (!p || p.statutJIRAMA === "IMPAYE" || p.statutJIRAMA === "DOUTE") return s;
      return s + (p.montantJIRAMA || 0);
    }, 0);
  }

  function releveDuMois(mois) {
    return locataires.reduce((s, loc) => s + factureDe(loc.id, mois), 0);
  }

  function totalReleve(locId) {
    let t = 0;
    for (let m = 1; m <= 12; m++) t += factureDe(locId, m);
    return t;
  }

  function totalAnnuel(locId) {
    let t = 0;
    for (let m = 1; m <= 12; m++) {
      const p = getCell(locId, m);
      if (p && (p.statutJIRAMA === "PAYE" || p.statutJIRAMA === "PARTIEL"))
        t += p.montantJIRAMA || 0;
    }
    return t;
  }

  const stats = (() => {
    let releve = 0, encaisse = 0;
    for (let m = 1; m <= 12; m++) {
      releve += releveDuMois(m);
      encaisse += encaisseDuMois(m);
    }
    return { releve, encaisse, reste: Math.max(0, releve - encaisse) };
  })();

  function renderCell(loc, mois) {
    const p = getCell(loc.id, mois);
    const attendu = factureDe(loc.id, mois);
    const paye = p?.montantJIRAMA || 0;
    const statut = p?.statutJIRAMA || "IMPAYE";

    // Bail sans eau ni électricité : aucune saisie possible, et une marque
    // distincte du « — » qui signifie seulement « pas encore renseigné ».
    if (loc.jiramaNonSoumis) {
      return (
        <span
          className="cell-vide"
          style={{ cursor: "default", color: "#cbd5e1" }}
          title={`${loc.nom} ne paie pas le JIRAMA (bail sans eau ni électricité)`}
        >
          ∅
        </span>
      );
    }

    // Absent ce mois-là : son forfait ne s'applique pas non plus, sinon la
    // saisie exigerait un minimum de 10 000 Ar pour quelqu'un qui ne doit rien.
    const exempt =
      !!factures[loc.id]?.[mois]?.exempt || p?.statutJIRAMA === "ABSENT";
    const forfait = exempt ? 0 : forfaitDe(loc.id);

    // Ni relevé ni règlement : rien à afficher pour ce mois.
    if (attendu === 0 && paye === 0) {
      return (
        <span
          className="cell-vide"
          title={
            exempt
              ? `${loc.nom} n'était pas concerné ce mois-ci`
              : "Aucune consommation relevée — cliquer pour saisir un règlement"
          }
          onClick={() => setModalCell({ loc, mois, annee, existing: p, attendu, forfait })}
        >
          {exempt ? "∅" : "—"}
        </span>
      );
    }

    const cls =
      statut === "PAYE"
        ? "cell-paye"
        : statut === "PARTIEL"
          ? "cell-partiel"
          : statut === "DOUTE"
            ? "cell-doute"
            : "cell-impaye";
    const affiche = statut === "IMPAYE" ? attendu : paye;

    return (
      <span
        className={cls}
        title={
          (forfait ? `Forfait mensuel : ${forfait.toLocaleString()} Ar\n` : "") +
          `Dû ce mois : ${attendu.toLocaleString()} Ar\n` +
          `Réglé : ${paye.toLocaleString()} Ar` +
          (statut === "IMPAYE" ? "\nNon réglé" : "")
        }
        onClick={() => setModalCell({ loc, mois, annee, existing: p, attendu, forfait })}
      >
        {statut === "DOUTE" && <span className="pastille-doute">!</span>}
        {forfait > 0 && <span className="pastille-forfait" title="Forfait mensuel">F</span>}
        {(affiche / 1000).toFixed(affiche >= 10000 ? 0 : 1)}k
      </span>
    );
  }

  function exportExcel() {
    if (locataires.length === 0) return toast.warning("Aucune donnée à exporter");
    const header = ["N°", "Locataire", ...MOIS_FULL, "Total réglé (Ar)"];
    const rows = locataires.map((loc) => {
      const row = [loc.chambre, `${loc.nom} ${loc.prenom}`];
      for (let m = 1; m <= 12; m++) {
        const p = getCell(loc.id, m);
        const attendu = factureDe(loc.id, m);
        if (!p && attendu === 0) { row.push(""); continue; }
        const statut = p?.statutJIRAMA || "IMPAYE";
        row.push(
          statut === "PAYE"
            ? p.montantJIRAMA || 0
            : statut === "IMPAYE"
              ? `Impayé (${attendu})`
              : `${statut === "DOUTE" ? "Doute" : "Partiel"} (${p?.montantJIRAMA || 0})`
        );
      }
      row.push(totalAnnuel(loc.id));
      return row;
    });
    const releve = ["", "TOTAL RELEVÉ"];
    const encaisse = ["", "TOTAL ENCAISSÉ"];
    for (let m = 1; m <= 12; m++) {
      releve.push(releveDuMois(m));
      encaisse.push(encaisseDuMois(m));
    }
    releve.push(stats.releve);
    encaisse.push(stats.encaisse);

    const ws = XLSX.utils.aoa_to_sheet([header, ...rows, [], releve, encaisse]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `JIRAMA ${annee}`);
    XLSX.writeFile(wb, `jirama_${current.nom.replace(/\s+/g, "_")}_${annee}.xlsx`);
    toast.success("Export Excel généré");
  }

  return (
    <Template>
      <Header />
      <div className="container-fluid flex-grow-1">
        <div className="row g-0">
          <Sidebar />
          <main className="col-md-9 ms-sm-auto col-lg-10 px-md-4 main">
            {/* Page header — même structure que le Tableau Loyer */}
            <div className="page-header">
              <div>
                <h1 className="page-title">
                  <BsLightningCharge /> Gestion du JIRAMA
                </h1>
                <p className="text-muted small mb-0">
                  {current.nom} · eau &amp; électricité — {annee}
                </p>
              </div>
              <div className="d-flex gap-2 align-items-center flex-wrap">
                <ApartSelect list={apparts} value={bienId} onChange={changeAppart} />
                <AnneePicker value={annee} onChange={setAnnee} />
                <Link
                  to="/loyer/"
                  className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
                >
                  <BsBuilding /> Loyers
                </Link>
              </div>
            </div>


            {/* Sélecteur de vue */}
            <div className="d-flex gap-1 mb-3 flex-wrap">
              {[
                { cle: "REGLEMENTS", label: "Règlements des locataires", Icon: BsCashCoin },
                { cle: "RELEVES", label: "Relevés & facture reçue", Icon: BsFileEarmarkText },
              ].map(({ cle, label, Icon }) => {
                const actif = vue === cle;
                return (
                  <button
                    key={cle}
                    className="btn btn-sm d-flex align-items-center gap-2 fw-semibold"
                    style={{
                      background: actif ? "#2563eb" : "#f1f5f9",
                      color: actif ? "#fff" : "#475569",
                      borderRadius: 8,
                      fontSize: "0.82rem",
                    }}
                    onClick={() => setVue(cle)}
                  >
                    <Icon size={14} /> {label}
                  </button>
                );
              })}
            </div>

            {vue === "RELEVES" ? (
              <SaisieReleves
                bienId={bienId}
                mono={bienId !== 0}
                current={current}
                onSaved={fetchFactures}
              />
            ) : (
              <>
            {/* Stat cards */}
            <div className="row g-3 mb-4">
              <div className="col-6 col-lg-3">
                <div className="stat-card">
                  <div className="stat-icon blue">
                    <BsPeople />
                  </div>
                  <div className="stat-content">
                    <h3>{locataires.length}</h3>
                    <p>Locataires actifs</p>
                  </div>
                </div>
              </div>
              <div className="col-6 col-lg-3">
                <div className="stat-card">
                  <div className="stat-icon amber">
                    <BsLightningCharge />
                  </div>
                  <div className="stat-content">
                    <h3>{(stats.releve / 1000).toFixed(0)}k</h3>
                    <p>Relevé (Ar)</p>
                  </div>
                </div>
              </div>
              <div className="col-6 col-lg-3">
                <div className="stat-card">
                  <div className="stat-icon green">
                    <BsGraphUp />
                  </div>
                  <div className="stat-content">
                    <h3>{(stats.encaisse / 1000).toFixed(0)}k</h3>
                    <p>Encaissé (Ar)</p>
                  </div>
                </div>
              </div>
              <div className="col-6 col-lg-3">
                <div className="stat-card">
                  <div className="stat-icon red">
                    <BsGraphDown />
                  </div>
                  <div className="stat-content">
                    <h3>{(stats.reste / 1000).toFixed(0)}k</h3>
                    <p>Reste dû (Ar)</p>
                  </div>
                </div>
              </div>
            </div>

            {!loading && (
              <AlerteJirama
                locataires={locataires}
                getCell={getCell}
                factureDe={factureDe}
                annee={annee}
              />
            )}

            <div className="card-pro p-0 mb-4">
              <div className="p-3 border-bottom d-flex justify-content-between align-items-center flex-wrap gap-2">
                <div>
                  <h6 className="mb-0 fw-bold">Tableau JIRAMA — {annee}</h6>
                  <div className="legende mt-1">
                    <span className="legende-item">
                      <span className="cell-paye">12k</span> Réglé
                    </span>
                    <span className="legende-item">
                      <span className="cell-impaye">12k</span> Dû, non réglé
                    </span>
                    <span className="legende-item">
                      <span className="cell-partiel">12k</span> Partiel
                    </span>
                    <span className="legende-item">
                      <span className="cell-doute"><span className="pastille-doute">!</span>12k</span> Doute
                    </span>
                    <span
                      className="legende-item"
                      title="Locataire au forfait mensuel : le relevé ne prime que s il dépasse le forfait"
                    >
                      <span className="cell-paye"><span className="pastille-forfait">F</span>10k</span> Forfait
                    </span>
                    <span
                      className="legende-item"
                      title="Bail sans eau ni électricité : rien ne lui est réclamé"
                    >
                      <span style={{ color: "#cbd5e1", fontWeight: 700 }}>∅</span> Hors JIRAMA
                    </span>
                    <span className="legende-item">
                      <span className="badge-rdc">1</span> RDC
                    </span>
                    <span className="legende-item">
                      <span className="badge-1er">I</span> 1er étage
                    </span>
                  </div>
                </div>
                <div className="d-flex gap-2">
                  <button
                    className="btn btn-sm btn-outline-success d-flex align-items-center gap-1"
                    onClick={exportExcel}
                  >
                    <BsFileEarmarkExcel /> Excel
                  </button>
                </div>
              </div>

              <div className="tableau-loyer" ref={tableauRef}>
                <table className="table table-bordered mb-0">
                  <thead>
                    <tr>
                      <th>N°</th>
                      <th style={{ width: "75px", maxWidth: "75px" }}>Locataire</th>
                      {MOIS.map((m, i) => (
                        <th
                          key={m}
                          data-mois={i + 1}
                          className={i + 1 === moisCourant ? "th-mois-courant" : ""}
                        >
                          {m}
                        </th>
                      ))}
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <SkLoyerRows cols={15} />
                    ) : locataires.length === 0 ? (
                      <tr>
                        <td colSpan={15} className="text-center text-muted py-4" style={{ fontSize: "0.85rem" }}>
                          Aucun locataire pour {current.nom}.
                        </td>
                      </tr>
                    ) : (
                      locataires.map((loc) => (
                        // Bail sans eau ni électricité : la ligne entière est
                        // estompée, pour qu'on ne la confonde pas avec un mois
                        // simplement pas encore saisi.
                        <tr key={loc.id} style={loc.jiramaNonSoumis ? { opacity: 0.5 } : undefined}>
                          <td>
                            <span className={loc.etage === "RDC" ? "badge-rdc" : "badge-1er"}>
                              {loc.chambre}
                            </span>
                          </td>
                          <td>
                            <div
                              className="fw-semibold"
                              style={{
                                fontSize: "0.82rem",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                width: "75px",
                                maxWidth: "75px",
                              }}
                              title={`${loc.nom} ${loc.prenom || ""}`.trim()}
                            >
                              {loc.nom} {loc.prenom}
                            </div>
                            <small className="text-muted">
                              {loc.jiramaNonSoumis
                                ? "hors JIRAMA"
                                : loc.jiramaForfait
                                  ? `forfait ${(loc.jiramaForfait / 1000).toFixed(0)}k`
                                  : `${(totalReleve(loc.id) / 1000).toFixed(0)}k relevés`}
                            </small>
                          </td>
                          {MOIS.map((_, mi) => (
                            <td key={mi} className={mi + 1 === moisCourant ? "td-mois-courant" : ""}>
                              {renderCell(loc, mi + 1)}
                            </td>
                          ))}
                          <td>
                            <span className="fw-bold text-primary" style={{ fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                              {(totalAnnuel(loc.id) / 1000).toFixed(0)}k
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {!loading && locataires.length > 0 && (
                    <tfoot>
                      {/* Contrôle demandé : la facture JIRAMA du mois doit
                          correspondre à la somme réglée par les locataires. */}
                      <tr style={{ background: "#f8fafc" }}>
                        <td colSpan={2} className="fw-bold" style={{ fontSize: "0.74rem" }}>
                          Facture JIRAMA
                        </td>
                        {MOIS.map((_, mi) => (
                          <td key={mi} style={{ fontSize: "0.7rem", color: "#64748b", whiteSpace: "nowrap" }}>
                            {totauxFacture[mi + 1] ? `${(totauxFacture[mi + 1] / 1000).toFixed(0)}k` : "—"}
                          </td>
                        ))}
                        <td></td>
                      </tr>
                      <tr style={{ background: "#f8fafc" }}>
                        <td colSpan={2} className="fw-bold" style={{ fontSize: "0.74rem" }}>
                          Encaissé / relevé
                        </td>
                        {MOIS.map((_, mi) => {
                          const m = mi + 1;
                          const r = releveDuMois(m);
                          const e = encaisseDuMois(m);
                          if (r === 0 && e === 0)
                            return <td key={mi} style={{ fontSize: "0.7rem", color: "#cbd5e1" }}>—</td>;
                          const ok = e >= r && r > 0;
                          return (
                            <td
                              key={mi}
                              title={`Relevé ${r.toLocaleString()} Ar · encaissé ${e.toLocaleString()} Ar`}
                              style={{
                                fontSize: "0.7rem",
                                fontWeight: 700,
                                whiteSpace: "nowrap",
                                color: ok ? "#16a34a" : "#dc2626",
                              }}
                            >
                              {(e / 1000).toFixed(0)}/{(r / 1000).toFixed(0)}k
                            </td>
                          );
                        })}
                        <td></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
              </>
            )}
          </main>
        </div>
      </div>

      {modalCell && (
        <ModalJirama
          cell={modalCell}
          u_info={u_info}
          onClose={() => setModalCell(null)}
          onSave={() => {
            fetchPaiements();
            setModalCell(null);
          }}
        />
      )}
    </Template>
  );
}

function ModalJirama({ cell, u_info, onClose, onSave }) {
  const [form, setForm] = useState({
    statutJIRAMA:
      cell.existing?.statutJIRAMA && cell.existing.statutJIRAMA !== "IMPAYE"
        ? cell.existing.statutJIRAMA
        : "PAYE",
    montantJIRAMA:
      cell.existing?.montantJIRAMA && cell.existing.montantJIRAMA > 0
        ? cell.existing.montantJIRAMA
        : cell.attendu || 0,
  });
  const [saving, setSaving] = useState(false);

  // Le forfait est un plancher : on peut régler davantage (surplus au
  // compteur), jamais moins — sauf à assumer un règlement partiel.
  const plancher = cell.forfait || 0;
  const montantSaisi = Number(form.montantJIRAMA) || 0;
  const sousLePlancher =
    plancher > 0 &&
    !["IMPAYE", "PARTIEL", "ABSENT"].includes(form.statutJIRAMA) &&
    montantSaisi < plancher;

  function handleSubmit(e) {
    e.preventDefault();
    if (sousLePlancher)
      return toast.warning(
        `${cell.loc.nom} est au forfait de ${plancher.toLocaleString()} Ar : ` +
          `saisissez au moins ce montant, ou passez le statut en « Partiel ».`
      );
    setSaving(true);
    axios
      .post(
        "loyer/paiements/jirama",
        {
          locataireId: cell.loc.id,
          mois: cell.mois,
          annee: cell.annee,
          montantJIRAMA: ["IMPAYE", "ABSENT"].includes(form.statutJIRAMA)
            ? 0
            : Number(form.montantJIRAMA) || 0,
          statutJIRAMA: form.statutJIRAMA,
        },
        u_info.opts
      )
      .then((res) => {
        if (res.status === 202) {
          toast.info(res.data.message || "Demande envoyée à l'admin pour validation.");
          onClose();
          return;
        }
        toast.success("Règlement JIRAMA enregistré !");
        onSave();
      })
      .catch((err) => toast.error(err.response?.data?.message || "Erreur d'enregistrement"))
      .finally(() => setSaving(false));
  }

  const reste = (cell.attendu || 0) - (Number(form.montantJIRAMA) || 0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-pro" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-pro">
          <h6>
            <BsLightningCharge className="me-2" />
            JIRAMA — {cell.loc.nom} / {MOIS_FULL[cell.mois - 1]} {cell.annee}
          </h6>
          <button className="btn-close" onClick={onClose} />
        </div>
        <form onSubmit={handleSubmit} className="p-3">
          <div
            className="rounded-3 p-2 mb-3 d-flex justify-content-between align-items-center"
            style={{ background: "#fffbeb", border: "1px solid #fde68a" }}
          >
            <small style={{ fontSize: "0.76rem", color: "#92400e" }}>
              {cell.forfait > 0 ? "Forfait mensuel" : "Consommation relevée"}
            </small>
            <span className="fw-bold" style={{ color: "#b45309" }}>
              {(cell.attendu || 0).toLocaleString()} Ar
            </span>
          </div>

          {cell.forfait > 0 && (
            <p className="text-muted" style={{ fontSize: "0.76rem" }}>
              {cell.loc.nom} règle au forfait de {cell.forfait.toLocaleString()} Ar.
              {cell.attendu > cell.forfait
                ? " Son compteur dépasse ce mois-ci : le surplus est ajouté."
                : " Rien à saisir, le montant est déjà rempli."}
            </p>
          )}

          {cell.attendu === 0 && (
            <p className="text-muted" style={{ fontSize: "0.76rem" }}>
              Aucun relevé pour ce mois —{" "}
              <a href="/loyer/factures/" style={{ color: "#2563eb" }}>
                saisir la facture JIRAMA
              </a>
              .
            </p>
          )}

          <div className="mb-3">
            <label className="form-label">Statut</label>
            <select
              className="form-select form-select-sm"
              value={form.statutJIRAMA}
              onChange={(e) => {
                const s = e.target.value;
                setForm({
                  statutJIRAMA: s,
                  montantJIRAMA:
                    s === "IMPAYE" || s === "ABSENT"
                      ? 0
                      : s === "PAYE"
                        ? cell.attendu || form.montantJIRAMA
                        : form.montantJIRAMA,
                });
              }}
            >
              <option value="PAYE">Payé</option>
              <option value="PARTIEL">Partiel</option>
              <option value="DOUTE">Doute — dit avoir payé, à confirmer</option>
              <option value="IMPAYE">Impayé</option>
              <option value="ABSENT">Absent — rien à payer ce mois</option>
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label small mb-1">
              Montant réglé (Ar)
              {plancher > 0 && (
                <span className="text-muted" style={{ fontWeight: 400 }}>
                  {" "}— minimum {plancher.toLocaleString()} Ar
                </span>
              )}
            </label>
            <input
              type="number"
              className={`form-control form-control-sm ${sousLePlancher ? "is-invalid" : ""}`}
              min={form.statutJIRAMA === "PARTIEL" ? 0 : plancher || 0}
              value={form.montantJIRAMA}
              readOnly={["IMPAYE", "ABSENT"].includes(form.statutJIRAMA)}
              style={
                ["IMPAYE", "ABSENT"].includes(form.statutJIRAMA)
                  ? { background: "#f8fafc", cursor: "default", color: "#64748b" }
                  : {}
              }
              onChange={(e) => setForm({ ...form, montantJIRAMA: +e.target.value })}
            />
            {sousLePlancher ? (
              <small className="text-danger" style={{ fontSize: "0.72rem" }}>
                Forfait de {plancher.toLocaleString()} Ar : impossible de saisir moins.
                Pour un règlement incomplet, choisissez le statut « Partiel ».
              </small>
            ) : plancher > 0 && montantSaisi > plancher ? (
              <small className="text-muted" style={{ fontSize: "0.72rem" }}>
                Surplus au compteur : {(montantSaisi - plancher).toLocaleString()} Ar
                au-dessus du forfait.
              </small>
            ) : (
              cell.attendu > 0 && reste > 0 && form.statutJIRAMA !== "IMPAYE" && (
                <small className="text-danger" style={{ fontSize: "0.72rem" }}>
                  Reste {reste.toLocaleString()} Ar sur la consommation relevée.
                </small>
              )
            )}
          </div>

          <div className="d-flex justify-content-end gap-2">
            <button type="button" className="btn btn-outline-danger btn-sm d-inline-flex align-items-center gap-1" onClick={onClose}>
              <BsXLg /> Annuler
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving || sousLePlancher}>
              {saving ? "..." : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
