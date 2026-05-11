import axios from "../../contexts/api/axios";
import GetUserData from "../../contexts/api/udata";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Header from "../../components/header/header";
import Sidebar from "../../components/sidebar/sidebar";
import Template from "../../components/template/template";
import {
  BsArrowLeft, BsPeopleFill, BsShieldFill, BsPersonFill, BsEyeFill, BsEyeSlashFill,
} from "react-icons/bs";

const url_req = "utilisateur/";
const COLORS = ["#2563eb", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4"];

export default function EditUser() {
  const { id } = useParams();
  const navigate = useNavigate();
  const u_info = GetUserData();

  const [form, setForm] = useState({ nom: "", prenom: "", idPS: "", karazana: "0", pwd: "" });
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  useEffect(() => {
    axios.get(`${url_req}${id}`, u_info.opts)
      .then(r => {
        if (r.status === 200 && r.data[0]) {
          const u = r.data[0];
          setForm({ nom: u.nom || "", prenom: u.prenom || "", idPS: u.idPS || "", karazana: String(u.karazana ?? "0"), pwd: "" });
          setLoaded(true);
        } else {
          toast.warning("Utilisateur introuvable.");
        }
      })
      .catch(() => toast.error("Erreur lors du chargement."));
  }, []);

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.nom.trim())    return toast.warning("Nom requis");
    if (!form.prenom.trim()) return toast.warning("Prénom requis");
    if (!form.idPS.trim())   return toast.warning("Identifiant requis");
    setSaving(true);
    const payload = { nom: form.nom, prenom: form.prenom, idPS: form.idPS, karazana: form.karazana };
    if (form.pwd) payload.pwd = form.pwd;
    axios.put(`${url_req}${id}`, payload, u_info.opts)
      .then(r => {
        if (r.data?.success) {
          toast.success(r.data.message || "Utilisateur modifié");
          navigate("/users/");
        } else {
          toast.error(r.data?.message || "Échec de la modification");
        }
      })
      .catch(() => toast.error("Erreur lors de la modification."))
      .finally(() => setSaving(false));
  }

  const initials = `${(form.nom || "?")[0]}${(form.prenom || "?")[0]}`.toUpperCase();
  const color = COLORS[(form.nom.charCodeAt(0) || 0) % COLORS.length];
  const isAdmin = form.karazana == 1;

  return (
    <Template>
      <Header />
      <div className="container-fluid flex-grow-1">
        <div className="row g-0">
          <Sidebar />
          <main className="col-md-9 ms-sm-auto col-lg-10 px-md-4 main">

            <div className="page-header">
              <div>
                <h1 className="page-title"><BsPeopleFill /> Modifier l'utilisateur</h1>
                <p className="text-muted small mb-0">Mettre à jour les informations du compte</p>
              </div>
              <button className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
                onClick={() => navigate("/users/")}>
                <BsArrowLeft /> Retour
              </button>
            </div>

            <div className="row g-3 justify-content-center">
              <div className="col-lg-7">
                <div className="card-pro">

                  {/* Avatar preview */}
                  <div className="d-flex align-items-center gap-3 mb-4 pb-4"
                    style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <div style={{
                      width: 60, height: 60, borderRadius: "50%",
                      background: loaded ? color : "#e2e8f0", color: "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "1.3rem", fontWeight: 700, flexShrink: 0,
                      boxShadow: loaded ? `0 0 0 3px ${color}33` : "none",
                      transition: "background 0.2s",
                    }}>
                      {loaded ? initials : ""}
                    </div>
                    <div>
                      <div className="fw-bold" style={{ fontSize: "1rem", color: "#0f172a" }}>
                        {form.nom || "Nom"} {form.prenom || "Prénom"}
                      </div>
                      <div style={{ marginTop: 4 }}>
                        {isAdmin
                          ? <span style={{ background: "#eff6ff", color: "#2563eb", fontSize: "0.72rem", fontWeight: 600, padding: "3px 10px", borderRadius: 20, display: "inline-flex", alignItems: "center", gap: 5 }}>
                              <BsShieldFill size={10} /> Administrateur
                            </span>
                          : <span style={{ background: "#f8fafc", color: "#475569", fontSize: "0.72rem", fontWeight: 600, padding: "3px 10px", borderRadius: 20, display: "inline-flex", alignItems: "center", gap: 5 }}>
                              <BsPersonFill size={10} /> Utilisateur
                            </span>
                        }
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit}>
                    <div className="row g-3">

                      <div className="col-sm-6">
                        <label className="form-label">Nom *</label>
                        <input type="text" className="form-control form-control-sm"
                          value={form.nom}
                          onChange={e => setForm({ ...form, nom: e.target.value })}
                          placeholder="Ex: RAKOTO" autoFocus />
                      </div>

                      <div className="col-sm-6">
                        <label className="form-label">Prénom *</label>
                        <input type="text" className="form-control form-control-sm"
                          value={form.prenom}
                          onChange={e => setForm({ ...form, prenom: e.target.value })}
                          placeholder="Ex: Jean" />
                      </div>

                      <div className="col-sm-6">
                        <label className="form-label">Identifiant *</label>
                        <input type="text" className="form-control form-control-sm"
                          value={form.idPS}
                          onChange={e => setForm({ ...form, idPS: e.target.value })}
                          placeholder="Identifiant de connexion" />
                      </div>

                      <div className="col-sm-6">
                        <label className="form-label">
                          Nouveau mot de passe
                          <span className="text-muted ms-1" style={{ fontSize: "0.72rem", fontWeight: 400 }}>
                            (laisser vide = inchangé)
                          </span>
                        </label>
                        <div className="input-group input-group-sm">
                          <input
                            type={showPwd ? "text" : "password"}
                            className="form-control"
                            value={form.pwd}
                            onChange={e => setForm({ ...form, pwd: e.target.value })}
                            placeholder="••••••••" />
                          <button type="button" className="btn btn-outline-secondary"
                            onClick={() => setShowPwd(v => !v)}>
                            {showPwd ? <BsEyeSlashFill size={13} /> : <BsEyeFill size={13} />}
                          </button>
                        </div>
                      </div>

                      <div className="col-12">
                        <label className="form-label">Rôle</label>
                        <div className="d-flex gap-3 mt-1">
                          {[
                            { val: "0", label: "Utilisateur", Icon: BsPersonFill, bg: "#f8fafc", clr: "#475569" },
                            { val: "1", label: "Administrateur", Icon: BsShieldFill, bg: "#eff6ff", clr: "#2563eb" },
                          ].map(({ val, label, Icon, bg, clr }) => (
                            <label key={val} style={{
                              flex: 1, cursor: "pointer",
                              border: `2px solid ${form.karazana === val ? clr : "#e2e8f0"}`,
                              borderRadius: 10, padding: "12px 16px",
                              background: form.karazana === val ? bg : "#fff",
                              transition: "all 0.15s",
                              display: "flex", alignItems: "center", gap: 10,
                            }}>
                              <input type="radio" className="d-none"
                                value={val} checked={form.karazana === val}
                                onChange={() => setForm({ ...form, karazana: val })} />
                              <Icon style={{ color: form.karazana === val ? clr : "#94a3b8", fontSize: "1.1rem" }} />
                              <span style={{ fontSize: "0.82rem", fontWeight: 700, color: form.karazana === val ? clr : "#64748b" }}>
                                {label}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>

                    </div>

                    <div className="d-flex justify-content-end gap-2 mt-4 pt-3"
                      style={{ borderTop: "1px solid #f1f5f9" }}>
                      <button type="button" className="btn btn-outline-secondary btn-sm"
                        onClick={() => navigate("/users/")}>
                        Annuler
                      </button>
                      <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                        {saving ? "Enregistrement…" : "Enregistrer"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>

          </main>
        </div>
      </div>
    </Template>
  );
}
