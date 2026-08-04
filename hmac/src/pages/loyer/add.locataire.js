import { useState, useEffect } from "react";
import axios from "../../contexts/api/axios";
import GetUserData from "../../contexts/api/udata";
import Template from "../../components/template/template";
import Header from "../../components/header/header";
import Sidebar from "../../components/sidebar/sidebar";
import { toast } from "react-toastify";
import { useNavigate, Link } from "react-router-dom";
import { BsPeople, BsArrowLeft, BsXLg, BsSave, BsPersonBadge, BsDoorOpen, BsTelephone, BsCalendarCheck, BsLightningCharge } from "react-icons/bs";
import AvatarPicker from "../../components/avatar/avatar";
import JourPaiementPicker from "../../components/jour/jour.paiement";
import ModePaiementPicker from "../../components/jour/mode.paiement";
import { getSelectedBienId } from "../../components/appart/apart.select";
import "./loyer.css";

const CHAMBRES_RDC = ["1","2","3","4","5","6","7","8","9","10"];
const CHAMBRES_1ER = ["I","II","III","IV","V","VI","VII","VIII","IX","X"];
const MONO_CHAMBRE = "Villa";

export default function AddLocataire() {
  const u_info = GetUserData();
  const navigate = useNavigate();
  const bienId = getSelectedBienId();
  const mono = bienId !== 0;
  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    etage: "RDC",
    chambre: "1",
    tel: "",
    email: "",
    dateEntree: new Date().toISOString().split("T")[0],
    actif: true,
    caution: 0,
    photo: "",
    jourPaiement: "",
    // Les nouveaux locataires reglent d avance (ils paient puis consomment).
    modePaiement: "AVANCE",
    jiramaForfait: "",
    jiramaNonSoumis: false,
    messengerId: "",
  });
  const [saving, setSaving] = useState(false);
  const [locataires, setLocataires] = useState([]);

  useEffect(() => {
    axios
      .get(`loyer/locataires?bienId=${bienId}`, u_info.opts)
      .then((r) => {
        const list = r.data || [];
        setLocataires(list);
        if (mono) {
          const libre = !list.some((l) => l.actif);
          setForm((f) => ({ ...f, etage: "RDC", chambre: libre ? MONO_CHAMBRE : "" }));
          return;
        }
        // Pré-règle sur un étage/chambre réellement libre.
        const freeOf = (etage) => {
          const occ = new Set(list.filter((l) => l.actif).map((l) => `${l.chambre}|${l.etage}`));
          return (etage === "RDC" ? CHAMBRES_RDC : CHAMBRES_1ER).filter((c) => !occ.has(`${c}|${etage}`));
        };
        const etage = freeOf("RDC").length ? "RDC" : "1ER";
        setForm((f) => ({ ...f, etage, chambre: freeOf(etage)[0] || "" }));
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loyer = mono ? 200000 : form.etage === "RDC" ? 150000 : 200000;

  function freeChambresFor(etage) {
    if (mono) return locataires.some((l) => l.actif) ? [] : [MONO_CHAMBRE];
    const occ = new Set(locataires.filter((l) => l.actif).map((l) => `${l.chambre}|${l.etage}`));
    return (etage === "RDC" ? CHAMBRES_RDC : CHAMBRES_1ER).filter((c) => !occ.has(`${c}|${etage}`));
  }
  const chambres = freeChambresFor(form.etage);

  function handleChange(e) {
    const { name, value } = e.target;
    if (name === "etage") {
      setForm((f) => ({ ...f, etage: value, chambre: freeChambresFor(value)[0] || "" }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.nom.trim()) return toast.warning("Le nom est requis");
    setSaving(true);
    axios
      .post("loyer/locataires", { ...form, loyer, bienId }, u_info.opts)
      .then((res) => {
        if (res.status === 202) {
          toast.info(res.data.message || "Demande envoyée à l'admin pour validation.");
          navigate("/loyer/locataires/");
          return;
        }
        toast.success("Locataire ajouté !");
        navigate("/loyer/locataires/");
      })
      .catch((err) =>
        toast.error(
          err.response?.status === 409
            ? err.response.data.message || "Chambre déjà occupée"
            : "Erreur lors de l'ajout"
        )
      )
      .finally(() => setSaving(false));
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
                  <BsPeople /> Ajouter un locataire
                </h1>
              </div>
              <Link to="/loyer/locataires/" className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1">
                <BsArrowLeft /> Retour
              </Link>
            </div>

            <div className="card-pro" style={{ maxWidth: 620 }}>
              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  <div className="col-12 form-section">
                    <BsPersonBadge /> Identité
                  </div>
                  <div className="col-12 pb-3 mb-1 border-bottom">
                    <label className="form-label">Photo du locataire</label>
                    <AvatarPicker value={form.photo} onChange={(p) => setForm((fm) => ({ ...fm, photo: p }))} nom={`${form.nom} ${form.prenom}`} size={72} />
                  </div>
                  <div className="col-sm-6">
                    <label className="form-label">Nom *</label>
                    <input
                      type="text"
                      name="nom"
                      className="form-control"
                      value={form.nom}
                      onChange={handleChange}
                      placeholder="Nom de famille"
                    />
                  </div>
                  <div className="col-sm-6">
                    <label className="form-label">Prénom</label>
                    <input
                      type="text"
                      name="prenom"
                      className="form-control"
                      value={form.prenom}
                      onChange={handleChange}
                      placeholder="Prénom"
                    />
                  </div>

                  <div className="col-12 form-section">
                    <BsDoorOpen /> Logement
                  </div>
                  <div className="col-sm-6">
                    <label className="form-label">Étage</label>
                    <select
                      name="etage"
                      className="form-select"
                      value={form.etage}
                      onChange={handleChange}
                    >
                      <option value="RDC">Rez-de-chaussée (150 000 Ar)</option>
                      <option value="1ER">1er Étage (200 000 Ar)</option>
                    </select>
                  </div>
                  <div className="col-sm-6">
                    <label className="form-label">Chambre</label>
                    <select
                      name="chambre"
                      className="form-select"
                      value={form.chambre}
                      onChange={handleChange}
                      disabled={chambres.length === 0}
                    >
                      {chambres.length === 0 ? (
                        <option value="">Aucune chambre libre</option>
                      ) : (
                        chambres.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))
                      )}
                    </select>
                  </div>

                  <div className="col-12">
                    <div
                      className="p-3 rounded-3 d-flex align-items-center gap-3"
                      style={{ background: "#eff6ff", border: "1px solid #bfdbfe" }}
                    >
                      <BsPeople size={20} color="#2563eb" />
                      <div>
                        <div className="fw-bold text-primary" style={{ fontSize: "0.875rem" }}>
                          Loyer mensuel : {loyer.toLocaleString()} Ar
                        </div>
                        <small className="text-muted">
                          Chambre {form.chambre} — {form.etage}
                        </small>
                      </div>
                    </div>
                  </div>

                  <div className="col-12 form-section">
                    <BsTelephone /> Contact
                  </div>
                  <div className="col-sm-6">
                    <label className="form-label">Téléphone</label>
                    <input
                      type="tel"
                      name="tel"
                      className="form-control"
                      value={form.tel}
                      onChange={handleChange}
                      placeholder="+261 ..."
                    />
                  </div>
                  <div className="col-sm-6">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      name="email"
                      className="form-control"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="email@exemple.com"
                    />
                  </div>

                  <div className="col-12 form-section">
                    <BsCalendarCheck /> Bail &amp; règlement
                  </div>
                  <div className="col-sm-6">
                    <label className="form-label">Date d'entrée</label>
                    <input
                      type="date"
                      name="dateEntree"
                      className="form-control"
                      value={form.dateEntree}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-sm-6">
                    <label className="form-label">Caution / dépôt de garantie (Ar)</label>
                    <input type="number" name="caution" min="0" className="form-control"
                      value={form.caution} onChange={handleChange} placeholder="0" />
                  </div>
                  <div className="col-sm-6">
                    <label className="form-label">Jour de paiement habituel</label>
                    <div>
                      <JourPaiementPicker value={form.jourPaiement} onChange={handleChange} />
                    </div>
                  </div>
                    <div className="col-12">
                      <label className="form-label">Sens du règlement</label>
                      <ModePaiementPicker value={form.modePaiement} onChange={handleChange} />
                    </div>
                    <div className="col-12 form-section">
                      <BsLightningCharge /> Eau &amp; électricité
                    </div>
                    <div className="col-12">
                      <label className="d-flex align-items-start gap-2" style={{ cursor: "pointer" }}>
                        <input type="checkbox" name="jiramaNonSoumis" className="form-check-input mt-1"
                          checked={!!form.jiramaNonSoumis}
                          onChange={(e) => handleChange({ target: { name: "jiramaNonSoumis", value: e.target.checked } })} />
                        <span>
                          <span className="fw-semibold" style={{ fontSize: "0.85rem" }}>
                            Ne paie pas le JIRAMA
                          </span>
                          <span className="d-block text-muted" style={{ fontSize: "0.72rem" }}>
                            Son bail ne comprend ni eau ni électricité : rien ne lui sera
                            jamais réclamé à ce titre.
                          </span>
                        </span>
                      </label>
                    </div>
                    <div className="col-12">
                      <label className="form-label">
                        Forfait JIRAMA <span className="text-muted" style={{ fontWeight: 400 }}>(Ar/mois, vide = au compteur)</span>
                      </label>
                      <input type="number" name="jiramaForfait" min="0" step="500"
                        className="form-control form-control-sm"
                        placeholder="Ex. : 10000"
                        value={form.jiramaForfait ?? ""} onChange={handleChange} />
                      <small className="text-muted" style={{ fontSize: "0.72rem" }}>
                        Montant dû chaque mois sans relevé. Si le compteur dépasse ce forfait,
                        c est le relevé qui fait foi.
                      </small>
                    </div>
                  <div className="col-12">
                    <label className="form-label">Lien Messenger <span className="text-muted" style={{ fontWeight: 400 }}>(optionnel)</span></label>
                    <input type="text" name="messengerId" className="form-control"
                      autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
                      value={form.messengerId || ""} onChange={handleChange}
                      placeholder="Collez l&apos;URL de la conversation Messenger" />
                  </div>


                  <div className="col-12 d-flex justify-content-end gap-2 pt-2">
                    <Link to="/loyer/locataires/" className="btn btn-outline-danger d-inline-flex align-items-center gap-1">
            <BsXLg /> Annuler
          </Link>
                    <button
                      type="submit"
                      className="btn btn-success d-inline-flex align-items-center gap-2"
                      disabled={saving || !form.chambre}
                    >
                      <BsSave />
                      {saving ? "Enregistrement..." : "Ajouter le locataire"}
                    </button>
                  </div>
                </div>
              </form>
            </div>

          </main>
        </div>
      </div>
    </Template>
  );
}
