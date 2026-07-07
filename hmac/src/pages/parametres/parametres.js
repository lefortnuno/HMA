import { useState } from "react";
import axios from "../../contexts/api/axios";
import GetUserData from "../../contexts/api/udata";
import Template from "../../components/template/template";
import Header from "../../components/header/header";
import Sidebar from "../../components/sidebar/sidebar";
import { toast } from "react-toastify";
import { BsGear, BsPersonCircle, BsShieldLock, BsEye, BsEyeSlash } from "react-icons/bs";
import "../loyer/loyer.css";

export default function Parametres() {
  const u_info = GetUserData();
  const isAdmin = String(u_info.u_karazana) === "1";

  // ── Profil ──
  const [nom, setNom] = useState(u_info.u_nom || "");
  const [prenom, setPrenom] = useState(u_info.u_prenom || "");
  const [savingProfil, setSavingProfil] = useState(false);

  // ── Mot de passe ──
  const [pwdActuel, setPwdActuel] = useState("");
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);

  function saveProfil(e) {
    e.preventDefault();
    if (!nom.trim()) return toast.warning("Le nom est requis");
    setSavingProfil(true);
    axios
      .put("utilisateur/me", { nom, prenom }, u_info.opts)
      .then((r) => {
        toast.success("Profil mis à jour !");
        // Met a jour l'affichage (header) sans deconnexion.
        localStorage.setItem("nom", r.data.nom ?? nom);
        localStorage.setItem("prenom", r.data.prenom ?? prenom);
      })
      .catch((err) => toast.error(err.response?.data?.message || "Erreur lors de la mise à jour"))
      .finally(() => setSavingProfil(false));
  }

  function savePwd(e) {
    e.preventDefault();
    if (!pwdActuel) return toast.warning("Entre ton mot de passe actuel");
    if (!pwd || pwd.length < 4) return toast.warning("Nouveau mot de passe : 4 caractères minimum");
    if (pwd !== pwd2) return toast.warning("Les deux mots de passe ne correspondent pas");
    setSavingPwd(true);
    axios
      .put("utilisateur/me", { pwdActuel, pwd }, u_info.opts)
      .then(() => {
        toast.success("Mot de passe changé !");
        setPwdActuel(""); setPwd(""); setPwd2("");
      })
      .catch((err) => toast.error(err.response?.data?.message || "Erreur lors du changement"))
      .finally(() => setSavingPwd(false));
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
                  <BsGear /> Paramètres de compte
                </h1>
                <p className="text-muted small mb-0">
                  Connecté en tant que <strong>{u_info.u_nom}</strong> · {isAdmin ? "Administrateur" : "Utilisateur"} · identifiant : <strong>{u_info.u_idPS}</strong>
                </p>
              </div>
            </div>

            <div className="row g-3">
              {/* ── Profil ── */}
              <div className="col-lg-6">
                <div className="card-pro h-100">
                  <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
                    <BsPersonCircle className="text-primary" /> Mon profil
                  </h6>
                  <form onSubmit={saveProfil}>
                    <div className="mb-3">
                      <label className="form-label">Nom *</label>
                      <input type="text" className="form-control form-control-sm"
                        value={nom} onChange={(e) => setNom(e.target.value)} />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Prénom</label>
                      <input type="text" className="form-control form-control-sm"
                        value={prenom} onChange={(e) => setPrenom(e.target.value)} />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Identifiant de connexion</label>
                      <input type="text" className="form-control form-control-sm"
                        value={u_info.u_idPS || ""} disabled
                        style={{ background: "#f8fafc", color: "#94a3b8" }} />
                      <small className="text-muted" style={{ fontSize: "0.72rem" }}>
                        L'identifiant ne peut pas être modifié.
                      </small>
                    </div>
                    <div className="d-flex justify-content-end">
                      <button type="submit" className="btn btn-primary btn-sm" disabled={savingProfil}>
                        {savingProfil ? "Enregistrement..." : "Enregistrer le profil"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* ── Mot de passe ── */}
              <div className="col-lg-6">
                <div className="card-pro h-100">
                  <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
                    <BsShieldLock className="text-primary" /> Changer le mot de passe
                  </h6>
                  <form onSubmit={savePwd}>
                    <div className="mb-3">
                      <label className="form-label">Mot de passe actuel *</label>
                      <input type={showPwd ? "text" : "password"} className="form-control form-control-sm"
                        value={pwdActuel} onChange={(e) => setPwdActuel(e.target.value)}
                        autoComplete="current-password" />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Nouveau mot de passe *</label>
                      <div className="input-group input-group-sm">
                        <input type={showPwd ? "text" : "password"} className="form-control"
                          value={pwd} onChange={(e) => setPwd(e.target.value)}
                          autoComplete="new-password" />
                        <button type="button" className="btn btn-outline-secondary"
                          onClick={() => setShowPwd((s) => !s)}
                          title={showPwd ? "Masquer" : "Afficher"}>
                          {showPwd ? <BsEyeSlash /> : <BsEye />}
                        </button>
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Confirmer le nouveau mot de passe *</label>
                      <input type={showPwd ? "text" : "password"} className="form-control form-control-sm"
                        value={pwd2} onChange={(e) => setPwd2(e.target.value)}
                        autoComplete="new-password" />
                      {pwd2 && pwd !== pwd2 && (
                        <small className="text-danger" style={{ fontSize: "0.72rem" }}>
                          Les mots de passe ne correspondent pas.
                        </small>
                      )}
                    </div>
                    <div className="d-flex justify-content-end">
                      <button type="submit" className="btn btn-primary btn-sm"
                        disabled={savingPwd || (pwd2 && pwd !== pwd2)}>
                        {savingPwd ? "Changement..." : "Changer le mot de passe"}
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
