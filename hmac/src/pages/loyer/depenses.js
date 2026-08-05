import { useState, useEffect } from "react";
import axios from "../../contexts/api/axios";
import GetUserData from "../../contexts/api/udata";
import Template from "../../components/template/template";
import Header from "../../components/header/header";
import Sidebar from "../../components/sidebar/sidebar";
import { toast } from "react-toastify";
import {
  BsCashCoin,
  BsPlus,
  BsFillTrashFill,
  BsXLg,
  BsSave,
  BsInfoCircle,
} from "react-icons/bs";
import ApartSelect, {
  useAppartements,
  getSelectedBienId,
  setSelectedBienId,
  KINYA,
} from "../../components/appart/apart.select";
import { MoisPicker, AnneePicker } from "../../components/jour/periode.picker";
import { TYPES, ORDRE_TYPES } from "../../config/sorties";
import "./loyer.css";
import { dateDuJour, formatDate } from "../../config/dates";

const MOIS_LABELS = ["","Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];

function initForm() {
  return {
    description: "",
    montant: "",
    type: "IMMOBILIER",
    categorie: "Réparation",
    beneficiaire: "",
    impacteBenefice: true,
    date: dateDuJour(),
  };
}

/** Pastille de nature, reprise à l'identique dans la liste et les filtres. */
function BadgeType({ cle, compact }) {
  const t = TYPES[cle] || TYPES.AUTRE;
  const { Icone } = t;
  return (
    <span
      className="d-inline-flex align-items-center gap-1"
      style={{
        fontSize: "0.72rem",
        fontWeight: 600,
        background: t.fond,
        color: t.couleur,
        border: `1px solid ${t.bordure}`,
        borderRadius: 6,
        padding: "2px 8px",
        whiteSpace: "nowrap",
      }}
      title={t.aide}
    >
      <Icone size={12} /> {compact ? t.court : t.label}
    </span>
  );
}

export default function Depenses() {
  const u_info = GetUserData();
  const now = new Date();
  const [bienId, setBienId] = useState(getSelectedBienId());
  const apparts = useAppartements(bienId, setBienId);
  const current = apparts.find((a) => a.id === bienId) || KINYA;
  const [mois, setMois] = useState(now.getMonth() + 1);
  const [annee, setAnnee] = useState(now.getFullYear());
  const [depenses, setDepenses] = useState([]);
  const [filtre, setFiltre] = useState("TOUS");
  const [form, setForm] = useState(initForm());
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchDepenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mois, annee, bienId]);

  function changeAppart(id) {
    setBienId(id);
    setSelectedBienId(id);
  }

  function fetchDepenses() {
    axios
      .get(`loyer/depenses?mois=${mois}&annee=${annee}&bienId=${bienId}`, u_info.opts)
      .then((r) => setDepenses(r.data || []))
      .catch(() => setDepenses([]));
  }

  /**
   * Changer de nature réaligne la catégorie et l'effet sur le bénéfice.
   *
   * Sans cela on gardait « Réparation » sur un envoi familial, et surtout un
   * effet sur le bénéfice hérité de la nature précédente.
   */
  function changerType(cle) {
    const t = TYPES[cle];
    setForm((f) => ({
      ...f,
      type: cle,
      categorie: t.categories.includes(f.categorie) ? f.categorie : t.categories[0],
      impacteBenefice: t.impacte,
      beneficiaire: t.beneficiaireRequis ? f.beneficiaire : "",
    }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.description.trim()) return toast.warning("Description requise");
    if (!form.montant || form.montant <= 0) return toast.warning("Montant invalide");
    setSaving(true);
    axios
      .post("loyer/depenses", { ...form, mois, annee, montant: +form.montant, bienId }, u_info.opts)
      .then(() => {
        toast.success("Sortie enregistrée");
        setForm(initForm());
        setShowModal(false);
        fetchDepenses();
      })
      .catch(() => toast.error("Erreur d'enregistrement"))
      .finally(() => setSaving(false));
  }

  function handleDelete(id) {
    axios
      .delete(`loyer/depenses/${id}`, u_info.opts)
      .then(() => {
        toast.success("Sortie supprimée");
        setDepenses((prev) => prev.filter((x) => x.id !== id));
        fetchDepenses();
      })
      .catch(() => toast.error("Erreur de suppression"));
  }

  // ── Totaux ───────────────────────────────────────────────────────────────
  // Deux sommes bien distinctes : ce qui grève le résultat de la maison, et
  // ce qu'on en a simplement sorti (famille, placements).
  const totalMois = depenses.reduce((s, d) => s + (+d.montant || 0), 0);
  const totalCharges = depenses
    .filter((d) => d.impacteBenefice !== 0)
    .reduce((s, d) => s + (+d.montant || 0), 0);
  const totalAffecte = totalMois - totalCharges;

  const parType = {};
  depenses.forEach((d) => {
    const cle = TYPES[d.type] ? d.type : "IMMOBILIER";
    parType[cle] = (parType[cle] || 0) + (+d.montant || 0);
  });
  const typesPresents = ORDRE_TYPES.filter((t) => parType[t]);

  const visibles = filtre === "TOUS" ? depenses : depenses.filter((d) => (TYPES[d.type] ? d.type : "IMMOBILIER") === filtre);

  const typeForm = TYPES[form.type];

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
                  <BsCashCoin /> Sorties d'argent
                </h1>
                <p className="text-muted small mb-0">
                  {current.nom} · {MOIS_LABELS[mois]} {annee} — Total :{" "}
                  <span className="fw-bold text-danger">{totalMois.toLocaleString()} Ar</span>
                </p>
              </div>
              <div className="d-flex gap-2 align-items-center flex-wrap">
                <ApartSelect list={apparts} value={bienId} onChange={changeAppart} />
                <MoisPicker value={mois} onChange={setMois} />
                <AnneePicker value={annee} onChange={setAnnee} />
                <button
                  className="btn btn-success btn-sm d-flex align-items-center gap-1"
                  onClick={() => { setForm(initForm()); setShowModal(true); }}
                >
                  <BsPlus size={16} /> Ajouter
                </button>
              </div>
            </div>

            {/* Ce qui pèse sur le résultat, face à ce qu'on en a sorti. */}
            {totalMois > 0 && (
              <div className="row g-3 mb-3">
                <div className="col-sm-6">
                  <div className="p-3 rounded-3 h-100" style={{ background: "#fff5f5", border: "1px solid #fecaca" }}>
                    <div className="text-muted" style={{ fontSize: "0.74rem", fontWeight: 600 }}>
                      Charges de la résidence
                    </div>
                    <div className="fw-bold text-danger" style={{ fontSize: "1.2rem" }}>
                      {totalCharges.toLocaleString()} Ar
                    </div>
                    <small className="text-muted" style={{ fontSize: "0.72rem" }}>
                      déduites du bénéfice du mois
                    </small>
                  </div>
                </div>
                <div className="col-sm-6">
                  <div className="p-3 rounded-3 h-100" style={{ background: "#f5f3ff", border: "1px solid #ddd6fe" }}>
                    <div className="text-muted" style={{ fontSize: "0.74rem", fontWeight: 600 }}>
                      Sorties de bénéfice
                    </div>
                    <div className="fw-bold" style={{ fontSize: "1.2rem", color: "#6d28d9" }}>
                      {totalAffecte.toLocaleString()} Ar
                    </div>
                    <small className="text-muted" style={{ fontSize: "0.72rem" }}>
                      envois famille et placements — sans effet sur le résultat
                    </small>
                  </div>
                </div>
              </div>
            )}

            {/* Filtres par nature */}
            {typesPresents.length > 1 && (
              <div className="d-flex gap-2 flex-wrap mb-3">
                <button
                  className={`btn btn-sm ${filtre === "TOUS" ? "btn-primary" : "btn-outline-secondary"}`}
                  onClick={() => setFiltre("TOUS")}
                >
                  Toutes ({depenses.length})
                </button>
                {typesPresents.map((cle) => {
                  const t = TYPES[cle];
                  const { Icone } = t;
                  const actif = filtre === cle;
                  return (
                    <button
                      key={cle}
                      className="btn btn-sm d-inline-flex align-items-center gap-1"
                      onClick={() => setFiltre(actif ? "TOUS" : cle)}
                      title={t.aide}
                      style={{
                        background: actif ? t.couleur : t.fond,
                        color: actif ? "#fff" : t.couleur,
                        border: `1px solid ${actif ? t.couleur : t.bordure}`,
                        fontWeight: 600,
                        fontSize: "0.78rem",
                      }}
                    >
                      <Icone size={13} /> {t.label} · {(parType[cle] / 1000).toFixed(0)}k
                    </button>
                  );
                })}
              </div>
            )}

            {/* Liste */}
            <div className="card-pro p-0">
              <div className="p-3 border-bottom d-flex justify-content-between align-items-center">
                <h6 className="fw-bold mb-0">
                  {filtre === "TOUS" ? "Sorties" : TYPES[filtre].label} — {MOIS_LABELS[mois]} {annee}
                </h6>
                <span className="fw-bold text-danger">
                  {visibles.reduce((s, d) => s + (+d.montant || 0), 0).toLocaleString()} Ar
                </span>
              </div>
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead style={{ background: "#f8fafc" }}>
                    <tr>
                      <th style={{ fontSize: "0.73rem", color: "#64748b" }}>Date</th>
                      <th style={{ fontSize: "0.73rem", color: "#64748b" }}>Description</th>
                      <th style={{ fontSize: "0.73rem", color: "#64748b" }}>Nature</th>
                      <th style={{ fontSize: "0.73rem", color: "#64748b" }}>Catégorie</th>
                      <th style={{ fontSize: "0.73rem", color: "#64748b" }}>Montant</th>
                      <th style={{ fontSize: "0.73rem", color: "#64748b" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibles.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center text-muted py-5">
                          <div className="mb-2">
                            {depenses.length === 0
                              ? "Aucune sortie pour ce mois"
                              : `Aucune sortie de nature « ${TYPES[filtre].label} » ce mois-ci`}
                          </div>
                          <button
                            className="btn btn-sm btn-success d-inline-flex align-items-center gap-1"
                            onClick={() => { setForm(initForm()); setShowModal(true); }}
                          >
                            <BsPlus /> Ajouter
                          </button>
                        </td>
                      </tr>
                    ) : (
                      visibles.map((d) => (
                        <tr key={d.id}>
                          <td style={{ fontSize: "0.875rem", whiteSpace: "nowrap" }}>{formatDate(d.date)}</td>
                          <td style={{ fontSize: "0.875rem" }}>
                            {d.description}
                            {d.beneficiaire && (
                              <small className="d-block text-muted" style={{ fontSize: "0.73rem" }}>
                                pour {d.beneficiaire}
                              </small>
                            )}
                          </td>
                          <td><BadgeType cle={TYPES[d.type] ? d.type : "IMMOBILIER"} compact /></td>
                          <td>
                            <span style={{ fontSize: "0.75rem", background: "#f1f5f9", color: "#475569", borderRadius: 6, padding: "2px 8px" }}>
                              {d.categorie}
                            </span>
                          </td>
                          <td className="fw-bold text-danger" style={{ fontSize: "0.875rem", whiteSpace: "nowrap" }}>
                            {(+d.montant).toLocaleString()} Ar
                            {d.impacteBenefice === 0 && (
                              <small
                                className="d-block text-muted fw-normal"
                                style={{ fontSize: "0.68rem" }}
                                title="Sortie de bénéfice : n'entre pas dans le résultat de la résidence"
                              >
                                hors résultat
                              </small>
                            )}
                          </td>
                          <td>
                            <button
                              className="btn-action btn-action-delete"
                              title="Supprimer cette sortie"
                              aria-label="Supprimer cette sortie"
                              onClick={() => handleDelete(d.id)}
                            >
                              <BsFillTrashFill />
                            </button>
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

      {/* ── Modal ajout ── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="modal-content-pro"
            style={{ maxWidth: 560 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header-pro">
              <h6><BsCashCoin className="me-2" />Nouvelle sortie — {MOIS_LABELS[mois]} {annee}</h6>
              <button className="btn-close" onClick={() => setShowModal(false)} />
            </div>
            <form onSubmit={handleSubmit} className="p-4">

              {/* La nature d'abord : elle commande le reste du formulaire. */}
              <label className="form-label">Nature de la sortie</label>
              <div className="d-flex gap-2 flex-wrap mb-1">
                {ORDRE_TYPES.map((cle) => {
                  const t = TYPES[cle];
                  const { Icone } = t;
                  const actif = form.type === cle;
                  return (
                    <button
                      key={cle}
                      type="button"
                      onClick={() => changerType(cle)}
                      className="btn btn-sm d-inline-flex align-items-center gap-1"
                      style={{
                        background: actif ? t.couleur : t.fond,
                        color: actif ? "#fff" : t.couleur,
                        border: `1.5px solid ${actif ? t.couleur : t.bordure}`,
                        fontWeight: 600,
                        fontSize: "0.78rem",
                      }}
                    >
                      <Icone size={13} /> {t.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-muted mb-3" style={{ fontSize: "0.74rem" }}>
                {typeForm.aide}
              </p>

              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label">Description *</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder={
                      form.type === "FAMILLE"
                        ? "Ex: envoi mensuel"
                        : form.type === "INVESTISSEMENT"
                          ? "Ex: acompte terrain"
                          : "Ex: réparation toiture"
                    }
                    autoFocus
                  />
                </div>

                {typeForm.beneficiaireRequis && (
                  <div className="col-12">
                    <label className="form-label">Bénéficiaire</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={form.beneficiaire}
                      onChange={(e) => setForm({ ...form, beneficiaire: e.target.value })}
                      placeholder="À qui l'argent est parti"
                    />
                  </div>
                )}

                <div className="col-sm-6">
                  <label className="form-label">Montant (Ar) *</label>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    value={form.montant}
                    onChange={(e) => setForm({ ...form, montant: e.target.value })}
                    min={0}
                    placeholder="0"
                  />
                </div>
                <div className="col-sm-6">
                  <label className="form-label">Catégorie</label>
                  <select
                    className="form-select form-select-sm"
                    value={form.categorie}
                    onChange={(e) => setForm({ ...form, categorie: e.target.value })}
                  >
                    {typeForm.categories.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="col-sm-6">
                  <label className="form-label">Date</label>
                  <input
                    type="date"
                    className="form-control form-control-sm"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                  />
                </div>

                {/* Effet sur le résultat : proposé selon la nature, mais le
                    dernier mot reste à la saisie. */}
                <div className="col-12">
                  <div
                    className="p-3 rounded-3 d-flex gap-2 align-items-start"
                    style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}
                  >
                    <div className="form-check mb-0">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id="impacteBenefice"
                        checked={form.impacteBenefice}
                        onChange={(e) => setForm({ ...form, impacteBenefice: e.target.checked })}
                      />
                      <label className="form-check-label fw-semibold" htmlFor="impacteBenefice" style={{ fontSize: "0.82rem" }}>
                        Déduire du bénéfice de la résidence
                      </label>
                      <small className="d-block text-muted" style={{ fontSize: "0.73rem" }}>
                        {form.impacteBenefice
                          ? "Cette sortie sera comptée comme une charge du mois."
                          : "Cette sortie n'entrera pas dans le résultat : c'est une part du bénéfice qu'on en sort, pas un coût de la maison."}
                      </small>
                    </div>
                    <BsInfoCircle size={15} style={{ color: "#94a3b8", flex: "0 0 auto", marginTop: 2 }} />
                  </div>
                </div>
              </div>

              <div className="d-flex justify-content-end gap-2 mt-4">
                <button
                  type="button"
                  className="btn btn-outline-danger btn-sm d-inline-flex align-items-center gap-1"
                  onClick={() => setShowModal(false)}
                >
                  <BsXLg /> Annuler
                </button>
                <button type="submit" className="btn btn-primary btn-sm d-inline-flex align-items-center gap-1" disabled={saving}>
                  <BsSave /> {saving ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Template>
  );
}
