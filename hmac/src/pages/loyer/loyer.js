import { useState, useEffect } from "react";
import axios from "../../contexts/api/axios";
import GetUserData from "../../contexts/api/udata";
import Template from "../../components/template/template";
import Header from "../../components/header/header";
import Sidebar from "../../components/sidebar/sidebar";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import {
  BsBuilding,
  BsPeople,
  BsGraphUp,
  BsGraphDown,
  BsFileEarmarkExcel,
  BsFileEarmarkPdf,
  BsShare,
  BsWhatsapp,
} from "react-icons/bs";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import trofelLImg from "../../assets/images/trofel-l.png";
import { SkLoyerRows } from "../../components/skeleton/skeleton";
import ApartSelect, {
  useAppartements,
  getSelectedBienId,
  setSelectedBienId,
  KINYA,
} from "../../components/appart/apart.select";
import "./loyer.css";

const MOIS = [
  "Jan",
  "Fév",
  "Mar",
  "Avr",
  "Mai",
  "Jun",
  "Jul",
  "Aoû",
  "Sep",
  "Oct",
  "Nov",
  "Déc",
];

const ANNEES = [2023, 2024, 2025, 2026, 2027];

const MOIS_FULL = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

async function imgToBase64(url) {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

// Lien WhatsApp de relance avec message pré-rempli.
export function lienRelanceWhatsApp(loc, moisNom, annee, montant) {
  if (!loc.tel) return null;
  const num = loc.tel.replace(/\s+/g, "").replace(/^\+/, "");
  const msg =
    `Bonjour ${loc.nom},\n` +
    `Petit rappel concernant votre loyer de ${moisNom} ${annee} ` +
    `(chambre ${loc.chambre}) d'un montant de ${(montant || 0).toLocaleString()} Ar ` +
    `qui reste en attente de paiement.\n` +
    `Merci de régulariser dès que possible.\n` +
    `— LEFORT N. Nuno (Trofel)`;
  return `https://wa.me/${num}?text=${encodeURIComponent(msg)}`;
}

export default function Loyer() {
  const u_info = GetUserData();
  const apparts = useAppartements();
  const [bienId, setBienId] = useState(getSelectedBienId());
  const current = apparts.find((a) => a.id === bienId) || KINYA;
  const [annee, setAnnee] = useState(new Date().getFullYear());
  const [locataires, setLocataires] = useState([]);
  const [paiements, setPaiements] = useState({});
  const [jiramaMap, setJiramaMap] = useState({}); // jiramaMap[locId][mois] = montantCalculé
  const [loading, setLoading] = useState(true);
  const [modalCell, setModalCell] = useState(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchLocataires(),
      fetchPaiements(),
      fetchJiramaMap(),
    ]).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [annee, bienId]);

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

  // Récupère toutes les factures JIRAMA de l'année et construit
  // une map [locataireId][mois] = montantJIRAMA calculé.
  // Utilisée pour pré-remplir le champ JIRAMA dans la modal de paiement.
  function fetchJiramaMap() {
    return axios
      .get(`loyer/factures?annee=${annee}&bienId=${bienId}`, u_info.opts)
      .then((r) => {
        const map = {};
        (r.data || []).forEach((f) => {
          (f.consommations || []).forEach((c) => {
            if (!map[c.locataireId]) map[c.locataireId] = {};
            map[c.locataireId][f.mois] = c.montantJIRAMA || 0;
          });
        });
        setJiramaMap(map);
      })
      .catch(() => setJiramaMap({}));
  }

  function getCellData(locataireId, mois) {
    return paiements[locataireId]?.[mois] || null;
  }

  function calcTotalAnnuel(locId) {
    let total = 0;
    for (let m = 1; m <= 12; m++) {
      const p = getCellData(locId, m);
      if (p && p.statut === "PAYE") {
        total += (p.montantLoyer || 0) + (p.montantJIRAMA || 0);
      }
    }
    return total;
  }

  function calcStats() {
    let percu = 0,
      impaye = 0;
    locataires.forEach((loc) => {
      const loyer = loc.loyer || 0;
      for (let m = 1; m <= 12; m++) {
        const p = getCellData(loc.id, m);
        if (p) {
          if (p.statut === "PAYE")
            percu += (p.montantLoyer || 0) + (p.montantJIRAMA || 0);
          else impaye += loyer;
        }
      }
    });
    return { percu, impaye };
  }

  function renderCell(loc, moisIndex) {
    const p = getCellData(loc.id, moisIndex + 1);
    if (!p) {
      return (
        <span
          className="cell-vide"
          title="Cliquer pour enregistrer"
          onClick={() => setModalCell({ loc, mois: moisIndex + 1, annee })}
        >
          —
        </span>
      );
    }
    const total = ((p.montantLoyer || 0) + (p.montantJIRAMA || 0)) / 1000;
    const cls =
      p.statut === "PAYE"
        ? "cell-paye"
        : p.statut === "PARTIEL"
          ? "cell-partiel"
          : "cell-impaye";
    return (
      <span
        className={cls}
        title={`Loyer: ${p.montantLoyer?.toLocaleString()} | JIRAMA: ${p.montantJIRAMA?.toLocaleString()}`}
        onClick={() =>
          setModalCell({ loc, mois: moisIndex + 1, annee, existing: p })
        }
      >
        {total.toFixed(0)}k
      </span>
    );
  }

  const stats = calcStats();

  function exportExcel() {
    if (locataires.length === 0)
      return toast.warning("Aucune donnée à exporter");
    const header = [
      "N°",
      "Locataire",
      "Loyer/mois",
      ...MOIS_FULL,
      "Total annuel (Ar)",
    ];
    const rows = locataires.map((loc) => {
      const row = [loc.chambre, `${loc.nom} ${loc.prenom}`, loc.loyer || 0];
      for (let m = 1; m <= 12; m++) {
        const p = getCellData(loc.id, m);
        if (!p) {
          row.push("");
          continue;
        }
        const total = (p.montantLoyer || 0) + (p.montantJIRAMA || 0);
        row.push(
          p.statut === "PAYE"
            ? total
            : p.statut === "PARTIEL"
              ? `PARTIEL - ${total}`
              : "IMPAYÉ",
        );
      }
      row.push(calcTotalAnnuel(loc.id));
      return row;
    });
    const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
    ws["!cols"] = [
      { wch: 8 },
      { wch: 24 },
      { wch: 14 },
      ...Array(12).fill({ wch: 13 }),
      { wch: 18 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Loyers ${annee}`);
    XLSX.writeFile(wb, `loyers_${annee}.xlsx`);
    toast.success("Export Excel généré !");
  }

  function exportPDF() {
    if (locataires.length === 0)
      return toast.warning("Aucune donnée à exporter");
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text(`Tableau des paiements — ${annee}`, 14, 13);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`Généré le ${new Date().toLocaleDateString("fr-FR")}`, 14, 19);

    const head = [["N°", "Locataire", "Loyer/mois", ...MOIS, "Total"]];
    const body = locataires.map((loc) => {
      const row = [
        loc.chambre,
        `${loc.nom} ${loc.prenom}`,
        `${(loc.loyer || 0).toLocaleString()} Ar`,
      ];
      for (let m = 1; m <= 12; m++) {
        const p = getCellData(loc.id, m);
        if (!p) {
          row.push("—");
          continue;
        }
        const total = (p.montantLoyer || 0) + (p.montantJIRAMA || 0);
        const k = (total / 1000).toFixed(0);
        row.push(
          p.statut === "PAYE"
            ? `${k}k`
            : p.statut === "PARTIEL"
              ? `~${k}k`
              : "✗",
        );
      }
      row.push(`${(calcTotalAnnuel(loc.id) / 1000).toFixed(0)}k`);
      return row;
    });

    autoTable(doc, {
      head,
      body,
      startY: 23,
      styles: { fontSize: 7, cellPadding: 2, halign: "center" },
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: 255,
        fontStyle: "bold",
      },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 32, halign: "left" },
        2: { cellWidth: 22 },
      },
      didParseCell: (data) => {
        if (data.section !== "body") return;
        const col = data.column.index;
        if (col < 3 || col > 14) return;
        const val = String(data.cell.raw);
        if (val !== "—" && val !== "✗" && !val.startsWith("~")) {
          data.cell.styles.fillColor = [220, 252, 231];
          data.cell.styles.textColor = [22, 163, 74];
        } else if (val.startsWith("~")) {
          data.cell.styles.fillColor = [254, 249, 195];
          data.cell.styles.textColor = [202, 138, 4];
        } else if (val === "✗") {
          data.cell.styles.fillColor = [254, 226, 226];
          data.cell.styles.textColor = [220, 38, 38];
        }
      },
    });
    doc.save(`loyers_${annee}.pdf`);
    toast.success("Export PDF généré !");
  }

  return (
    <Template>
      <Header />
      <div className="container-fluid flex-grow-1">
        <div className="row g-0">
          <Sidebar />
          <main className="col-md-9 ms-sm-auto col-lg-10 px-md-4 main">
            {/* Page header */}
            <div className="page-header">
              <div>
                <h1 className="page-title">
                  <BsBuilding /> Gestion des Loyers
                </h1>
                <p className="text-muted small mb-0">
                  {current.nom} · suivi des paiements — {annee}
                </p>
              </div>
              <div className="d-flex gap-2 align-items-center flex-wrap">
                <ApartSelect list={apparts} value={bienId} onChange={changeAppart} />
                <select
                  className="form-select form-select-sm"
                  style={{ width: "auto" }}
                  value={annee}
                  onChange={(e) => setAnnee(+e.target.value)}
                >
                  {ANNEES.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
                <Link
                  to="/loyer/locataires/"
                  className="btn btn-sm btn-primary d-flex align-items-center gap-1"
                >
                  <BsPeople /> Locataires
                </Link>
                <Link
                  to="/loyer/factures/"
                  className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
                >
                  <BsFileEarmarkExcel /> JIRAMA
                </Link>
              </div>
            </div>

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
                  <div className="stat-icon slate">
                    <BsBuilding />
                  </div>
                  <div className="stat-content">
                    <h3>20</h3>
                    <p>Totales chambres</p>
                  </div>
                </div>
              </div>
              <div className="col-6 col-lg-3">
                <div className="stat-card">
                  <div className="stat-icon green">
                    <BsGraphUp />
                  </div>
                  <div className="stat-content">
                    <h3>{(stats.percu / 1000).toFixed(0)}k</h3>
                    <p>Perçu (Ar)</p>
                  </div>
                </div>
              </div>
              <div className="col-6 col-lg-3">
                <div className="stat-card">
                  <div className="stat-icon red">
                    <BsGraphDown />
                  </div>
                  <div className="stat-content">
                    <h3>{(stats.impaye / 1000).toFixed(0)}k</h3>
                    <p>Impayé (Ar)</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Récap impayés du mois en cours + relance WhatsApp */}
            {(() => {
              const moisCourant = new Date().getMonth() + 1;
              const anneeCourante = new Date().getFullYear();
              if (annee !== anneeCourante) return null;
              const impayes = locataires.filter((loc) => {
                if (!loc.actif) return false;
                const p = getCellData(loc.id, moisCourant);
                return !p || p.statut === "IMPAYE" || p.statut === "PARTIEL";
              });
              if (impayes.length === 0) return null;
              const totalDu = impayes.reduce((s, loc) => {
                const p = getCellData(loc.id, moisCourant);
                return s + (loc.loyer || 0) - (p && p.statut === "PARTIEL" ? p.montantLoyer || 0 : 0);
              }, 0);
              return (
                <div className="card-pro p-0 mb-4" style={{ borderLeft: "4px solid #ef4444", overflow: "hidden" }}>
                  <div
                    className="px-3 py-2 d-flex justify-content-between align-items-center flex-wrap gap-1"
                    style={{ background: "#fef2f2", borderBottom: "1px solid #fecaca" }}
                  >
                    <h6 className="mb-0 fw-bold" style={{ color: "#b91c1c", fontSize: "0.9rem" }}>
                      Impayés — {MOIS_FULL[moisCourant - 1]} {anneeCourante}
                      <span
                        className="ms-2 rounded-pill px-2"
                        style={{ background: "#dc2626", color: "#fff", fontSize: "0.72rem", padding: "2px 0" }}
                      >
                        {impayes.length}
                      </span>
                    </h6>
                    <span className="fw-bold" style={{ color: "#b91c1c", fontSize: "0.85rem" }}>
                      Total dû : {totalDu.toLocaleString()} Ar
                    </span>
                  </div>
                  <div className="p-2">
                    <div className="row g-2">
                      {impayes.map((loc) => {
                        const p = getCellData(loc.id, moisCourant);
                        const du =
                          (loc.loyer || 0) -
                          (p && p.statut === "PARTIEL" ? p.montantLoyer || 0 : 0);
                        const lien = lienRelanceWhatsApp(loc, MOIS_FULL[moisCourant - 1], anneeCourante, du);
                        return (
                          <div className="col-6 col-md-4 col-xl-3" key={loc.id}>
                            <div
                              className="h-100 rounded-3 p-2 d-flex flex-column"
                              style={{ border: "1px solid #e2e8f0", background: "#fff" }}
                            >
                              <div className="d-flex align-items-center gap-2 mb-1">
                                <span className={loc.etage === "1ER" ? "badge-1er" : "badge-rdc"}>
                                  {loc.chambre}
                                </span>
                                <span
                                  className="fw-semibold text-truncate"
                                  style={{ fontSize: "0.83rem" }}
                                  title={loc.nom}
                                >
                                  {loc.nom}
                                </span>
                              </div>
                              <div className="d-flex align-items-center justify-content-between mt-auto gap-1">
                                <span className="fw-bold" style={{ color: "#b91c1c", fontSize: "0.8rem" }}>
                                  {du.toLocaleString()} Ar
                                </span>
                                {lien ? (
                                  <a
                                    href={lien}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-sm py-0 px-2 fw-semibold d-flex align-items-center gap-1"
                                    style={{ background: "#25D366", color: "#fff", fontSize: "0.72rem" }}
                                  >
                                    <BsWhatsapp size={11} /> Relancer
                                  </a>
                                ) : (
                                  <span
                                    className="rounded-pill px-2"
                                    style={{ background: "#f1f5f9", color: "#94a3b8", fontSize: "0.68rem" }}
                                  >
                                    pas de n°
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Tableau principal */}
            <div className="card-pro p-0 mb-4">
              <div className="p-3 border-bottom d-flex justify-content-between align-items-center flex-wrap gap-2">
                <div>
                  <h6 className="mb-0 fw-bold">
                    Tableau des paiements — {annee}
                  </h6>
                  <div className="legende mt-1">
                    <span className="legende-item">
                      <span className="cell-paye">150k</span> Payé
                    </span>
                    <span className="legende-item">
                      <span className="cell-impaye">150k</span> Impayé
                    </span>
                    <span className="legende-item">
                      <span className="cell-partiel">150k</span> Partiel
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
                  <button
                    className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1"
                    onClick={exportPDF}
                  >
                    <BsFileEarmarkPdf /> PDF
                  </button>
                </div>
              </div>

              <div className="tableau-loyer">
                <table className="table table-bordered mb-0">
                  <thead>
                    <tr>
                      <th>N°</th>
                      <th
                        style={{
                          width: "75px",
                          maxWidth: "75px",
                        }}
                      >
                        Locataire
                      </th>
                      {MOIS.map((m, i) => (
                        <th key={i}>{m}</th>
                      ))}
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <SkLoyerRows cols={15} />
                    ) : locataires.length === 0 ? (
                      <tr>
                        <td
                          colSpan={15}
                          className="text-center py-5 text-muted"
                        >
                          Aucun locataire enregistré —{" "}
                          <Link to="/loyer/locataires/">
                            Ajouter un locataire
                          </Link>
                        </td>
                      </tr>
                    ) : (
                      locataires.map((loc) => (
                        <tr key={loc.id}>
                          <td>
                            <span
                              className={
                                loc.etage === "RDC" ? "badge-rdc" : "badge-1er"
                              }
                            >
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
                                cursor: "pointer",
                                width: "75px",
                                maxWidth: "75px",
                              }}
                              title={`${loc.nom} ${loc.prenom}`}
                            >
                              {loc.nom} {loc.prenom}
                            </div>
                            <small className="text-muted">
                              {loc.loyer?.toLocaleString()} Ar
                            </small>
                          </td>
                          {MOIS.map((_, mi) => (
                            <td key={mi}>{renderCell(loc, mi)}</td>
                          ))}
                          <td>
                            <span
                              className="fw-bold text-primary"
                              style={{
                                fontSize: "0.8rem",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {(calcTotalAnnuel(loc.id) / 1000).toFixed(0)}k
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        </div>
      </div>

      {modalCell && (
        <PaymentModal
          cell={modalCell}
          onClose={() => setModalCell(null)}
          onSave={() => {
            fetchPaiements();
            setModalCell(null);
          }}
          u_info={u_info}
          paiements={paiements}
          jiramaCalcule={jiramaMap[modalCell.loc.id]?.[modalCell.mois] || 0}
        />
      )}
    </Template>
  );
}

function PaymentModal({ cell, onClose, onSave, u_info, paiements, jiramaCalcule = 0 }) {
  const moisNom = MOIS[cell.mois - 1];
  const moisNomFull = MOIS_FULL[cell.mois - 1];
  const [form, setForm] = useState({
    statut: cell.existing?.statut || "PAYE",
    montantLoyer: cell.existing?.montantLoyer ?? cell.loc?.loyer ?? 0,
    // Pré-remplit avec le montant calculé dans Factures JIRAMA si pas de paiement existant
    montantJIRAMA: cell.existing?.montantJIRAMA ?? jiramaCalcule ?? 0,
    datePaiement: cell.existing?.datePaiement
      ? cell.existing.datePaiement.split("T")[0]
      : new Date().toISOString().split("T")[0],
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaving(true);
    const data = {
      ...form,
      locataireId: cell.loc.id,
      mois: cell.mois,
      annee: cell.annee,
    };
    const req = cell.existing?.id
      ? axios.put(`loyer/paiements/${cell.existing.id}`, data, u_info.opts)
      : axios.post("loyer/paiements", data, u_info.opts);
    req
      .then(() => {
        toast.success("Paiement enregistré !");
        onSave();
      })
      .catch(() => toast.error("Erreur d'enregistrement"))
      .finally(() => setSaving(false));
  };

  async function genRecuPDF() {
    const trofelB64 = await imgToBase64(trofelLImg);
    const doc = new jsPDF({
      unit: "mm",
      format: "a4",
      orientation: "portrait",
    });
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();
    const mg = 15;
    const R = W - mg;

    const loyerDu = cell.loc.loyer || 0; // loyer fixe du locataire (prix du loyer)
    const loyerPaye = +(form.montantLoyer || 0); // ce qu'il a effectivement payé ce mois
    const jirama = +(form.montantJIRAMA || 0);
    const recuId = cell.existing?.id ?? "";

    // Arriérés : cumul des mois précédents non soldés (année en cours)
    const locPaiements = (paiements || {})[cell.loc.id] || {};
    let arrieres = 0;
    for (let m = 1; m < cell.mois; m++) {
      const p = locPaiements[m];
      if (!p || p.statut === "PAYE") continue;
      if (p.statut === "IMPAYE") arrieres += cell.loc.loyer || 0;
      else if (p.statut === "PARTIEL")
        arrieres += (cell.loc.loyer || 0) - (p.montantLoyer || 0);
    }

    // Date facture JIRAMA du mois
    let dateFactureJIRAMA = ".";
    try {
      const facRes = await axios.get(
        `loyer/factures?mois=${cell.mois}&annee=${cell.annee}`,
        u_info.opts,
      );
      const facs = facRes.data || [];
      if (facs.length > 0 && facs[0].dateFacture) {
        const df = new Date(facs[0].dateFacture + "T00:00:00");
        dateFactureJIRAMA = `${String(df.getDate()).padStart(2, "0")} / ${String(df.getMonth() + 1).padStart(2, "0")} / ${df.getFullYear()}`;
      }
    } catch {}

    const montantTotalDu = loyerDu + jirama + arrieres;
    const paiementLocataire = form.statut !== "IMPAYE" ? loyerPaye + jirama : 0;
    const solde = montantTotalDu - paiementLocataire;
    const statutLabel =
      form.statut === "PAYE"
        ? "PAYÉ"
        : form.statut === "PARTIEL"
          ? "PARTIEL"
          : "IMPAYÉ";
    const nomComplet = `${cell.loc.nom} ${cell.loc.prenom || ""}`.trim();
    const etageLabel =
      cell.loc.etage === "RDC" ? "Rez-de-chaussée" : "1er Étage";
    const lastDay = new Date(cell.annee, cell.mois, 0).getDate();

    let datePaiementStr = ".";
    if (form.datePaiement) {
      const d = new Date(form.datePaiement + "T00:00:00");
      datePaiementStr = `${String(d.getDate()).padStart(2, "0")} / ${String(d.getMonth() + 1).padStart(2, "0")} / ${d.getFullYear()}`;
    }

    const refStr = `${cell.loc.nom}_${moisNomFull}_${cell.annee}_${recuId}`;

    const B = () => doc.setFont("helvetica", "bold");
    const N = () => doc.setFont("helvetica", "normal");
    const K = () => doc.setTextColor(0, 0, 0);
    const doubleLine = (y) => {
      doc.setDrawColor(0);
      doc.setLineWidth(0.25);
      doc.line(mg, y, R, y);
      doc.line(mg, y + 0.8, R, y + 0.8);
    };

    // ══════════════ PAGE 1 ══════════════
    let y = 15;

    // ── Logo placeholder (top-left) ──
    // doc.setDrawColor(160);
    // doc.setFillColor(245, 245, 245);
    // doc.roundedRect(mg, y, 42, 26, 2, 2, "FD");
    // N();
    // doc.setFontSize(7);
    // doc.setTextColor(140);
    // doc.text("VOTRE LOGO", mg + 21, y + 14, { align: "center" });

    // ── Titre bloc (top-right) ──
    B();
    K();
    doc.setFontSize(11);
    doc.text("QUITTANCE DE LOYER PAR VILLA KINYA", R, y + 7, {
      align: "right",
    });
    doc.setFontSize(10);
    doc.text(`Loyer - ${moisNomFull} ${cell.annee} -`, R, y + 14, {
      align: "right",
    });
    doc.text(`Quittance de Loyer n°: .${recuId}.`, R, y + 21, {
      align: "right",
    });

    y += 34;

    // ── Bailleur ──
    B();
    K();
    doc.setFontSize(10);
    doc.text("      --- BAILLEUR ---", mg, y);
    y += 7;
    doc.text("- LEFORT Nomenjanahry Nuno", mg, y);
    y += 7;
    doc.text("- Tél : 034 86 588 68 / Facebook : Trofel", mg, y);
    y += 9;

    // ── Locataire (centré) ──
    doc.text(
      `--- LOCATAIRE --- : ${nomComplet} ( Tél : ${cell.loc.tel || "—"} )`,
      W / 2,
      y,
      { align: "center" },
    );
    y += 7;
    doc.text(refStr, W / 2, y, { align: "center" });
    y += 10;

    // ── Double séparateur ──
    doubleLine(y);
    y += 8;

    // ── Corps du reçu ──
    B();
    K();
    doc.setFontSize(10);

    doc.text(`|| Reçu de Mr/Mme/Mlle: ${nomComplet}`, mg, y);
    y += 7;

    doc.text(`|| La somme de: ${loyerPaye.toFixed(2)} Ar de Loyer.`, mg, y);
    doc.text(`Fait à Fianarantsoa le ${datePaiementStr}`, R, y, {
      align: "right",
    });
    y += 7;

    doc.text(
      `|| Et une Facture JIRAMA du: ${dateFactureJIRAMA}. D'une montant de: ${jirama.toFixed(2)} Ar.`,
      mg,
      y,
    );
    doc.text("LEFORT N. Nuno", R, y, { align: "right" });
    y += 7;

    doc.text(
      "|| Pour louer et accessoirés les appartements de V.KINYA :",
      mg,
      y,
    );
    y += 7;
    doc.text(
      `|| Soanierana LOT 0307/802-G VILLA KINYA, Local ${cell.loc.chambre} ; Etage : ${etageLabel}`,
      mg,
      y,
    );
    y += 7;
    doc.text(
      `|| En paiement du terme du:- 01 / ${moisNomFull} / ${cell.annee} -au:- ${lastDay} / ${moisNomFull} / ${cell.annee} -.`,
      mg,
      y,
    );
    y += 10;

    // ── Double séparateur ──
    doubleLine(y);
    y += 8;

    // ── DETAILS ──
    B();
    K();
    doc.setFontSize(8);
    const d36 = "-".repeat(86);
    const d86 = "-".repeat(151);
    doc.text(`|| ${d36} DETAILS : ${d36}-`, mg, y);
    y += 8;

    doc.setFontSize(10);
    doc.text(`|| - Loyer nu : ${loyerDu.toFixed(2)} Ar`, mg, y);
    doc.text(
      `- Montant Total dû : ${montantTotalDu.toFixed(2)} Ar`,
      W / 2 + 5,
      y,
    );
    y += 7;

    doc.text(`|| - JIRAMA du locataire : ${jirama.toFixed(2)} Ar`, mg, y);
    doc.text(
      `- Paiement du locataire : ${paiementLocataire.toFixed(2)} Ar`,
      W / 2 + 5,
      y,
    );
    y += 7;

    doc.text(`|| - Charges/Provisions de Charges : 0.00 Ar`, mg, y);
    doc.text(`- Date Facture JIRAMA : ${dateFactureJIRAMA}`, W / 2 + 5, y);
    y += 7;

    if (arrieres > 0) {
      doc.text(
        `|| - Arriéré (mois précédents) : ${arrieres.toFixed(2)} Ar`,
        mg,
        y,
      );
      doc.text(`- Statut : ${statutLabel}`, W / 2 + 5, y);
      y += 7;
    } else {
      doc.text(`|| - Statut du paiement : ${statutLabel}`, mg, y);
      y += 7;
    }

    B();
    K();
    doc.setFontSize(10);

    doc.text("||", mg, y);
    doc.text(`- Solde à payer : ${solde.toFixed(2)} Ar`, W / 2 + 5, y);
    y += 7;

    doc.text(`|| ${d86}`, mg, y);
    y += 7;

    // Tirets centre + double ligne
    doc.setFontSize(7);
    // doc.text(`${"-".repeat(62)}:${"-".repeat(62)}`, W / 2, y, { align: "center" }); y += 5;
    doubleLine(y);
    y += 8;

    doc.setFontSize(10);
    B();
    K();
    doc.text(
      "|| Merci pour Votre Confiance ! Que Dieu vos Garde ! A la prochaine.",
      mg,
      y,
    );
    y += 7;

    [
      "||..........    Le paiement de la présente n'emporte pas présomption de paiement des termes antérieurs.",
      "||..........    Cette quittance ou ce reçu annule tous les reçus qui auraient pu être donnés",
      "||..........    pour acompte versé sur le présent terme. En cas de congé précédemment donné,",
      "||..........    cette quittance ou ce reçu représenterait l'indemnité d'occupation",
      "||..........    et ne saurait être considéré comme un titre d'occupation. Sous réserve d'encaissement.",
    ].forEach((line) => {
      doc.text(line, mg, y);
      y += 6.5;
    });

    doubleLine(y);
    y += 8;
    doc.text(`Suite de fois de reçu : . . ${recuId} . .`, mg, y);

    // ── Logo Trofel L (bas droite) ──
    doc.addImage(trofelB64, "PNG", R - 24, H - 34, 24, 18);

    return doc;
  }

  const pdfFileName = `${cell.loc.nom}_${moisNomFull}_${cell.annee}_${cell.existing?.id ?? ""}.pdf`;

  async function handleDownload() {
    try {
      const doc = await genRecuPDF();
      doc.save(pdfFileName);
    } catch {
      toast.error("Erreur génération PDF");
    }
  }

  const hasExisting = !!cell.existing;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-pro" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-pro">
          <h6>
            Paiement — {cell.loc.nom} / {moisNom} {cell.annee}
          </h6>
          <button className="btn-close" onClick={onClose} />
        </div>
        <form onSubmit={handleSubmit} className="p-3">
          <div className="mb-3">
            <label className="form-label">Statut</label>
            <select
              className="form-select form-select-sm"
              value={form.statut}
              onChange={(e) => {
                const s = e.target.value;
                setForm({
                  ...form,
                  statut: s,
                  montantLoyer: s === "PAYE" ? cell.loc.loyer || 0 : 0,
                  montantJIRAMA: s === "IMPAYE" ? 0 : form.montantJIRAMA,
                });
              }}
            >
              <option value="PAYE">Payé</option>
              <option value="PARTIEL">Partiel</option>
              <option value="IMPAYE">Impayé</option>
            </select>
          </div>
          <div className="row g-2 mb-3">
            <div className="col">
              <label className="form-label small mb-1">
                {form.statut === "PARTIEL"
                  ? "Montant payé — Loyer (Ar)"
                  : `Loyer fixe — ${(cell.loc.loyer || 0).toLocaleString()} Ar`}
              </label>
              <input
                type="number"
                className="form-control form-control-sm"
                value={form.montantLoyer}
                min={0}
                readOnly={form.statut !== "PARTIEL"}
                style={
                  form.statut !== "PARTIEL"
                    ? {
                        background: "#f8fafc",
                        cursor: "default",
                        color: "#64748b",
                      }
                    : {}
                }
                onChange={(e) =>
                  setForm({ ...form, montantLoyer: +e.target.value })
                }
              />
            </div>
            <div className="col">
              <label className="form-label small mb-1 d-flex align-items-center justify-content-between gap-1">
                <span>JIRAMA (Ar)</span>
                {jiramaCalcule > 0 && (
                  <button
                    type="button"
                    title="Utiliser le montant calculé dans Factures JIRAMA"
                    onClick={() =>
                      setForm({ ...form, montantJIRAMA: jiramaCalcule })
                    }
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      fontSize: "0.7rem",
                      color: "#2563eb",
                      fontWeight: 600,
                      cursor: "pointer",
                      textDecoration: "underline",
                    }}
                  >
                    ↻ {jiramaCalcule.toLocaleString()} Ar
                  </button>
                )}
              </label>
              <input
                type="number"
                className="form-control form-control-sm"
                value={form.montantJIRAMA}
                min={0}
                readOnly={form.statut === "IMPAYE"}
                style={
                  form.statut === "IMPAYE"
                    ? {
                        background: "#f8fafc",
                        cursor: "default",
                        color: "#64748b",
                      }
                    : {}
                }
                onChange={(e) =>
                  setForm({ ...form, montantJIRAMA: +e.target.value })
                }
              />
              {jiramaCalcule === 0 && form.statut !== "IMPAYE" && (
                <small className="text-muted" style={{ fontSize: "0.7rem" }}>
                  Aucune facture JIRAMA saisie pour {moisNom} —{" "}
                  <a href="/loyer/factures/" style={{ color: "#2563eb" }}>
                    saisir
                  </a>
                </small>
              )}
            </div>
          </div>
          <div className="mb-3">
            <label className="form-label">Date de paiement</label>
            <input
              type="date"
              className="form-control form-control-sm"
              value={form.datePaiement}
              onChange={(e) =>
                setForm({ ...form, datePaiement: e.target.value })
              }
            />
          </div>
          <div className="d-flex justify-content-between align-items-center">
            <span className="fw-bold text-primary">
              Total :{" "}
              {(form.montantLoyer + form.montantJIRAMA).toLocaleString()} Ar
            </span>
            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={onClose}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={saving}
              >
                {saving ? "..." : "Enregistrer"}
              </button>
            </div>
          </div>
        </form>

        {form.statut !== "PAYE" && cell.loc.tel && (
          <div className="px-3 pb-2 pt-0">
            <a
              href={lienRelanceWhatsApp(
                cell.loc,
                moisNomFull,
                cell.annee,
                (cell.loc.loyer || 0) - (form.statut === "PARTIEL" ? form.montantLoyer || 0 : 0)
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-sm w-100 fw-semibold d-flex align-items-center justify-content-center gap-2"
              style={{ background: "#25D366", color: "#fff" }}
            >
              Relancer {cell.loc.nom} sur WhatsApp
            </a>
          </div>
        )}

        {hasExisting && (
          <div className="px-3 pb-3 pt-0">
            <div className="border-top pt-3">
              <p className="text-muted small mb-2 fw-semibold">
                Envoyer le reçu :
              </p>
              <div className="d-flex gap-2 flex-wrap justify-content-end">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                  onClick={handleDownload}
                >
                  <BsShare /> Partager
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1"
                  onClick={handleDownload}
                >
                  <BsFileEarmarkPdf /> Télécharger PDF
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
