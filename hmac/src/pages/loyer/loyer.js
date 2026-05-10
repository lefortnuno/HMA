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
  BsPlus,
} from "react-icons/bs";
import "./loyer.css";

const MOIS = [
  "Jan","Fév","Mar","Avr","Mai","Jun",
  "Jul","Aoû","Sep","Oct","Nov","Déc",
];

const ANNEES = [2023, 2024, 2025, 2026, 2027];

export default function Loyer() {
  const u_info = GetUserData();
  const [annee, setAnnee] = useState(new Date().getFullYear());
  const [locataires, setLocataires] = useState([]);
  const [paiements, setPaiements] = useState({});
  const [loading, setLoading] = useState(true);
  const [modalCell, setModalCell] = useState(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchLocataires(), fetchPaiements()]).finally(() =>
      setLoading(false)
    );
  }, [annee]);

  function fetchLocataires() {
    return axios
      .get("loyer/locataires", u_info.opts)
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
    let percu = 0, impaye = 0;
    locataires.forEach((loc) => {
      const loyer = loc.loyer || 0;
      for (let m = 1; m <= 12; m++) {
        const p = getCellData(loc.id, m);
        if (p) {
          if (p.statut === "PAYE") percu += (p.montantLoyer || 0) + (p.montantJIRAMA || 0);
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
        onClick={() => setModalCell({ loc, mois: moisIndex + 1, annee, existing: p })}
      >
        {total.toFixed(0)}k
      </span>
    );
  }

  const stats = calcStats();

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
                  Suivi des paiements — {annee}
                </p>
              </div>
              <div className="d-flex gap-2 align-items-center flex-wrap">
                <select
                  className="form-select form-select-sm"
                  style={{ width: "auto" }}
                  value={annee}
                  onChange={(e) => setAnnee(+e.target.value)}
                >
                  {ANNEES.map((a) => (
                    <option key={a} value={a}>{a}</option>
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
                  <div className="stat-icon blue"><BsPeople /></div>
                  <div className="stat-content">
                    <h3>{locataires.length}</h3>
                    <p>Locataires actifs</p>
                  </div>
                </div>
              </div>
              <div className="col-6 col-lg-3">
                <div className="stat-card">
                  <div className="stat-icon green"><BsGraphUp /></div>
                  <div className="stat-content">
                    <h3>{(stats.percu / 1000).toFixed(0)}k</h3>
                    <p>Perçu (Ar)</p>
                  </div>
                </div>
              </div>
              <div className="col-6 col-lg-3">
                <div className="stat-card">
                  <div className="stat-icon red"><BsGraphDown /></div>
                  <div className="stat-content">
                    <h3>{(stats.impaye / 1000).toFixed(0)}k</h3>
                    <p>Impayé (Ar)</p>
                  </div>
                </div>
              </div>
              <div className="col-6 col-lg-3">
                <div className="stat-card">
                  <div className="stat-icon slate"><BsBuilding /></div>
                  <div className="stat-content">
                    <h3>20</h3>
                    <p>Chambres totales</p>
                  </div>
                </div>
              </div>
            </div>

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
                <button className="btn btn-sm btn-outline-success d-flex align-items-center gap-1">
                  <BsFileEarmarkExcel /> Export Excel
                </button>
              </div>

              <div className="tableau-loyer">
                <table className="table table-bordered mb-0">
                  <thead>
                    <tr>
                      <th>N°</th>
                      <th>Locataire</th>
                      {MOIS.map((m, i) => (
                        <th key={i}>{m}</th>
                      ))}
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={15} className="text-center py-4 text-muted">
                          Chargement...
                        </td>
                      </tr>
                    ) : locataires.length === 0 ? (
                      <tr>
                        <td colSpan={15} className="text-center py-5 text-muted">
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
                            <div className="fw-semibold" style={{ fontSize: "0.82rem" }}>
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
                              style={{ fontSize: "0.8rem", whiteSpace: "nowrap" }}
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
        />
      )}
    </Template>
  );
}

function PaymentModal({ cell, onClose, onSave, u_info }) {
  const moisNom = MOIS[cell.mois - 1];
  const [form, setForm] = useState({
    statut: cell.existing?.statut || "PAYE",
    montantLoyer: cell.existing?.montantLoyer ?? cell.loc?.loyer ?? 0,
    montantJIRAMA: cell.existing?.montantJIRAMA ?? 0,
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
              onChange={(e) => setForm({ ...form, statut: e.target.value })}
            >
              <option value="PAYE">Payé</option>
              <option value="PARTIEL">Partiel</option>
              <option value="IMPAYE">Impayé</option>
            </select>
          </div>
          <div className="row g-2 mb-3">
            <div className="col">
              <label className="form-label">Loyer (Ar)</label>
              <input
                type="number"
                className="form-control form-control-sm"
                value={form.montantLoyer}
                onChange={(e) => setForm({ ...form, montantLoyer: +e.target.value })}
                min={0}
              />
            </div>
            <div className="col">
              <label className="form-label">JIRAMA (Ar)</label>
              <input
                type="number"
                className="form-control form-control-sm"
                value={form.montantJIRAMA}
                onChange={(e) => setForm({ ...form, montantJIRAMA: +e.target.value })}
                min={0}
              />
            </div>
          </div>
          <div className="mb-3">
            <label className="form-label">Date de paiement</label>
            <input
              type="date"
              className="form-control form-control-sm"
              value={form.datePaiement}
              onChange={(e) => setForm({ ...form, datePaiement: e.target.value })}
            />
          </div>
          <div className="d-flex justify-content-between align-items-center">
            <span className="fw-bold text-primary">
              Total : {(form.montantLoyer + form.montantJIRAMA).toLocaleString()} Ar
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
      </div>
    </div>
  );
}
