import { useState, useEffect } from "react";
import axios from "../../contexts/api/axios";
import GetUserData from "../../contexts/api/udata";
import Template from "../../components/template/template";
import Header from "../../components/header/header";
import Sidebar from "../../components/sidebar/sidebar";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { BsBuilding, BsDoorOpen, BsDoorClosedFill, BsPlus, BsPencilSquare } from "react-icons/bs";
import { SkLocataires } from "../../components/skeleton/skeleton";
import ApartSelect, {
  useAppartements,
  getSelectedBienId,
  setSelectedBienId,
  KINYA,
} from "../../components/appart/apart.select";
import "./loyer.css";

const LOYER_RDC = 150000;
const LOYER_1ER = 200000;
const MONO_CHAMBRE = "Villa";
const CHAMBRES_RDC = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
const CHAMBRES_1ER = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

function initForm(etage, chambre) {
  return {
    nom: "",
    prenom: "",
    etage,
    chambre,
    tel: "",
    email: "",
    dateEntree: new Date().toISOString().split("T")[0],
    actif: true,
    caution: 0,
  };
}

export default function Chambres() {
  const u_info = GetUserData();
  const navigate = useNavigate();
  const apparts = useAppartements();
  const [bienId, setBienId] = useState(getSelectedBienId());
  const current = apparts.find((a) => a.id === bienId) || KINYA;
  const mono = bienId !== 0;
  const monoLoyer = current.prix || 200000;
  const [locataires, setLocataires] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(initForm("RDC", "1"));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchLocataires();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bienId]);

  function fetchLocataires() {
    setLoading(true);
    axios
      .get(`loyer/locataires?bienId=${bienId}`, u_info.opts)
      .then((r) => setLocataires(r.data || []))
      .catch(() => setLocataires([]))
      .finally(() => setLoading(false));
  }

  function changeAppart(id) {
    setBienId(id);
    setSelectedBienId(id);
  }

  // Map "chambre|etage" -> locataire actif qui l'occupe
  const occupants = {};
  locataires.forEach((l) => {
    if (l.actif) occupants[`${l.chambre}|${l.etage}`] = l;
  });
  const occupantOf = (chambre, etage) => occupants[`${chambre}|${etage}`];

  function handleAttribuer(etage, chambre) {
    setForm(initForm(etage, chambre));
    setShowAdd(true);
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.nom.trim()) return toast.warning("Le nom est requis");
    setSaving(true);
    const loyer = mono ? monoLoyer : form.etage === "RDC" ? LOYER_RDC : LOYER_1ER;
    axios
      .post("loyer/locataires", { ...form, loyer, bienId }, u_info.opts)
      .then(() => {
        toast.success(`Locataire attribué à la chambre ${form.chambre} !`);
        setShowAdd(false);
        fetchLocataires();
      })
      .catch((err) => {
        if (err.response && err.response.status === 409) {
          toast.error(err.response.data.message || "Chambre déjà occupée");
        } else {
          toast.error("Erreur lors de l'attribution");
        }
      })
      .finally(() => setSaving(false));
  }

  // ── Stats occupation ──
  const nbRdcOcc = CHAMBRES_RDC.filter((c) => occupantOf(c, "RDC")).length;
  const nb1erOcc = CHAMBRES_1ER.filter((c) => occupantOf(c, "1ER")).length;
  const totalOcc = nbRdcOcc + nb1erOcc;
  const totalCh = CHAMBRES_RDC.length + CHAMBRES_1ER.length;
  const totalLibre = totalCh - totalOcc;

  function StatCard({ label, value, sub, color }) {
    return (
      <div className="card-pro p-3 text-center flex-fill">
        <div style={{ fontSize: "1.6rem", fontWeight: 800, color }}>{value}</div>
        <div className="fw-semibold" style={{ fontSize: "0.8rem" }}>{label}</div>
        {sub && <div className="text-muted" style={{ fontSize: "0.72rem" }}>{sub}</div>}
      </div>
    );
  }

  function RoomGrid({ etage, chambres, label, loyer }) {
    return (
      <div className="card-pro p-0 mb-4">
        <div className="p-3 border-bottom d-flex justify-content-between align-items-center">
          <h6 className="mb-0 fw-bold">{label}</h6>
          <small className="text-muted">{loyer.toLocaleString()} Ar/mois</small>
        </div>
        <div className="p-3">
          <div className="row g-2">
            {chambres.map((c) => {
              const occ = occupantOf(c, etage);
              const badgeCls = etage === "RDC" ? "badge-rdc" : "badge-1er";
              return (
                <div className="col-6 col-sm-4 col-md-3 col-xl-2" key={c}>
                  <div
                    className="rounded-3 p-2 h-100 d-flex flex-column"
                    style={{
                      border: occ ? "1px solid #e2e8f0" : "1.5px dashed #86efac",
                      background: occ ? "#fff" : "#f0fdf4",
                      cursor: "pointer",
                      minHeight: 92,
                    }}
                    onClick={() =>
                      occ
                        ? navigate(`/loyer/locataires/edit/${occ.id}`, { state: { loc: occ } })
                        : handleAttribuer(etage, c)
                    }
                    title={occ ? `Modifier ${occ.nom}` : `Attribuer la chambre ${c}`}
                  >
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className={badgeCls}>{c}</span>
                      {occ ? (
                        <BsDoorClosedFill color="#94a3b8" size={14} />
                      ) : (
                        <BsDoorOpen color="#22c55e" size={14} />
                      )}
                    </div>
                    {occ ? (
                      <>
                        <div className="fw-semibold text-truncate" style={{ fontSize: "0.82rem" }}>
                          {occ.nom} {occ.prenom}
                        </div>
                        <div className="mt-auto d-flex align-items-center gap-1 text-primary" style={{ fontSize: "0.7rem" }}>
                          <BsPencilSquare size={11} /> Modifier
                        </div>
                      </>
                    ) : (
                      <div className="mt-auto d-flex align-items-center gap-1 fw-semibold" style={{ fontSize: "0.75rem", color: "#16a34a" }}>
                        <BsPlus size={16} /> Attribuer
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── Vue mono-unité (villa entière louée à 1 personne) ──
  function MonoUnit() {
    const occ = occupantOf(MONO_CHAMBRE, "RDC");
    return (
      <>
        <div className="d-flex flex-wrap gap-2 mb-4">
          <StatCard label="Unité" value={1} sub="villa entière" color="#0f172a" />
          <StatCard label="Statut" value={occ ? "Occupée" : "Libre"} sub={`${monoLoyer.toLocaleString()} Ar/mois`} color={occ ? "#2563eb" : "#16a34a"} />
        </div>
        <div className="card-pro p-4" style={{ maxWidth: 460 }}>
          <div
            className="rounded-3 p-3 d-flex flex-column"
            style={{
              border: occ ? "1px solid #e2e8f0" : "1.5px dashed #86efac",
              background: occ ? "#fff" : "#f0fdf4",
              cursor: "pointer",
            }}
            onClick={() =>
              occ
                ? navigate(`/loyer/locataires/edit/${occ.id}`, { state: { loc: occ } })
                : handleAttribuer("RDC", MONO_CHAMBRE)
            }
          >
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="badge-1er">Villa entière</span>
              {occ ? <BsDoorClosedFill color="#94a3b8" /> : <BsDoorOpen color="#22c55e" />}
            </div>
            {occ ? (
              <>
                <div className="fw-bold" style={{ fontSize: "1rem" }}>{occ.nom} {occ.prenom}</div>
                {occ.tel && <div className="text-muted" style={{ fontSize: "0.82rem" }}>{occ.tel}</div>}
                <div className="mt-2 d-flex align-items-center gap-1 text-primary" style={{ fontSize: "0.78rem" }}>
                  <BsPencilSquare size={12} /> Modifier le locataire
                </div>
              </>
            ) : (
              <div className="d-flex align-items-center gap-1 fw-semibold" style={{ color: "#16a34a" }}>
                <BsPlus size={18} /> Attribuer le locataire
              </div>
            )}
          </div>
        </div>
      </>
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
                <h1 className="page-title">
                  <BsBuilding /> {mono ? "Occupation" : "Gestion des Chambres"}
                </h1>
                <p className="text-muted small mb-0">
                  {current.nom} · occupation en temps réel · attribution
                </p>
              </div>
              <ApartSelect list={apparts} value={bienId} onChange={changeAppart} />
            </div>

            {loading ? (
              <SkLocataires />
            ) : mono ? (
              <MonoUnit />
            ) : (
              <>
                {/* ── Récap occupation ── */}
                <div className="d-flex flex-wrap gap-2 mb-4">
                  <StatCard label="Chambres" value={totalCh} sub="au total" color="#0f172a" />
                  <StatCard label="Occupées" value={totalOcc} sub={`RDC ${nbRdcOcc}/10 · 1er ${nb1erOcc}/10`} color="#2563eb" />
                  <StatCard label="Libres" value={totalLibre} sub="disponibles" color="#16a34a" />
                </div>

                <RoomGrid etage="RDC" chambres={CHAMBRES_RDC} label="Rez-de-chaussée" loyer={LOYER_RDC} />
                <RoomGrid etage="1ER" chambres={CHAMBRES_1ER} label="1er Étage" loyer={LOYER_1ER} />
              </>
            )}
          </main>
        </div>
      </div>

      {/* ── Modal attribution ── */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal-content-pro" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-pro">
              <h6>
                <BsDoorOpen className="me-2" />
                {mono ? `Attribuer ${current.nom} (Villa entière)` : `Attribuer la chambre ${form.chambre} (${form.etage})`}
              </h6>
              <button className="btn-close" onClick={() => setShowAdd(false)} />
            </div>
            <form onSubmit={handleSubmit} className="p-4">
              <div className="p-2 rounded-3 mb-3" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                <span className="fw-bold" style={{ color: "#16a34a", fontSize: "0.85rem" }}>
                  {mono
                    ? `Loyer : ${monoLoyer.toLocaleString()} Ar — ${current.nom} (Villa entière)`
                    : `Loyer : ${(form.etage === "RDC" ? LOYER_RDC : LOYER_1ER).toLocaleString()} Ar — Chambre ${form.chambre}`}
                </span>
              </div>
              <div className="row g-3">
                <div className="col-sm-6">
                  <label className="form-label">Nom *</label>
                  <input type="text" name="nom" className="form-control form-control-sm"
                    value={form.nom} onChange={handleChange} placeholder="Nom de famille" autoFocus />
                </div>
                <div className="col-sm-6">
                  <label className="form-label">Prénom</label>
                  <input type="text" name="prenom" className="form-control form-control-sm"
                    value={form.prenom} onChange={handleChange} placeholder="Prénom" />
                </div>
                <div className="col-sm-6">
                  <label className="form-label">Téléphone</label>
                  <input type="tel" name="tel" className="form-control form-control-sm"
                    value={form.tel} onChange={handleChange} placeholder="+261 ..." />
                </div>
                <div className="col-sm-6">
                  <label className="form-label">Email</label>
                  <input type="email" name="email" className="form-control form-control-sm"
                    value={form.email} onChange={handleChange} placeholder="email@exemple.com" />
                </div>
                <div className="col-sm-6">
                  <label className="form-label">Date d'entrée</label>
                  <input type="date" name="dateEntree" className="form-control form-control-sm"
                    value={form.dateEntree} onChange={handleChange} />
                </div>
                <div className="col-sm-6">
                  <label className="form-label">Caution / dépôt de garantie (Ar)</label>
                  <input type="number" name="caution" min="0" className="form-control form-control-sm"
                    value={form.caution} onChange={handleChange} placeholder="0" />
                </div>
              </div>
              <div className="d-flex justify-content-end gap-2 mt-4">
                <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setShowAdd(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                  {saving ? "Attribution..." : "Attribuer la chambre"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Template>
  );
}
