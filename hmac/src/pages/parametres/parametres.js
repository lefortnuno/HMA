import { useState } from "react";
import axios from "../../contexts/api/axios";
import GetUserData from "../../contexts/api/udata";
import Template from "../../components/template/template";
import Header from "../../components/header/header";
import Sidebar from "../../components/sidebar/sidebar";
import { toast } from "react-toastify";
import { BsGear, BsPersonCircle, BsShieldLock } from "react-icons/bs";
import AvatarPicker from "../../components/avatar/avatar";
import PinInput from "../../components/pin/pin.input";
import "../loyer/loyer.css";

export default function Parametres() {
  const u_info = GetUserData();
  const isAdmin = String(u_info.u_karazana) === "1";

  // ── Profil ──
  const [nom, setNom] = useState(u_info.u_nom || "");
  const [prenom, setPrenom] = useState(u_info.u_prenom || "");
  const [photo, setPhoto] = useState(localStorage.getItem("photo") || "");
  const [savingProfil, setSavingProfil] = useState(false);

  // ── Mot de passe ──
  const [pwdActuel, setPwdActuel] = useState("");
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [savingPwd, setSavingPwd] = useState(false);

  function saveProfil(e) {
    e.preventDefault();
    if (!nom.trim()) return toast.warning("Le nom est requis");
    setSavingProfil(true);
    axios
      .put("utilisateur/me", { nom, prenom, photo }, u_info.opts)
      .then((r) => {
        toast.success("Profil mis à jour !");
        // Met a jour l'affichage (header) sans deconnexion.
        localStorage.setItem("nom", r.data.nom ?? nom);
        localStorage.setItem("prenom", r.data.prenom ?? prenom);
        if (photo) localStorage.setItem("photo", photo);
        else localStorage.removeItem("photo");
        window.dispatchEvent(new Event("hma-profil-maj"));
      })
      .catch((err) => toast.error(err.response?.data?.message || "Erreur lors de la mise à jour"))
      .finally(() => setSavingProfil(false));
  }

  function savePwd(e) {
    e.preventDefault();
    if (pwdActuel.length !== 4) return toast.warning("Entre ton code actuel (4 chiffres)");
    if (pwd.length !== 4) return toast.warning("Le nouveau code doit faire 4 chiffres");
    if (pwd !== pwd2) return toast.warning("Les deux codes ne correspondent pas");
    setSavingPwd(true);
    axios
      .put("utilisateur/me", { pwdActuel, pwd }, u_info.opts)
      .then(() => {
        toast.success("Code changé !");
        localStorage.setItem("mdpTemporaire", "0");
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
                    <div className="mb-3 pb-3 border-bottom">
                      <label className="form-label">Photo de profil</label>
                      <AvatarPicker
                        value={photo}
                        onChange={setPhoto}
                        nom={`${nom} ${prenom}`}
                      />
                    </div>
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
                    <BsShieldLock className="text-primary" /> Changer mon code
                  </h6>
                  <p className="text-muted mb-4" style={{ fontSize: "0.78rem" }}>
                    Votre code d&apos;accès est composé de 4 chiffres, comme à la connexion.
                  </p>
                  <form onSubmit={savePwd}>
                    <div className="mb-4">
                      <label className="form-label fw-semibold" style={{ fontSize: "0.85rem" }}>
                        Code actuel
                      </label>
                      <PinInput value={pwdActuel} onChange={setPwdActuel} id="actuel" />
                    </div>
                    <div className="mb-4">
                      <label className="form-label fw-semibold" style={{ fontSize: "0.85rem" }}>
                        Nouveau code
                      </label>
                      <PinInput value={pwd} onChange={setPwd} id="nouveau" />
                    </div>
                    <div className="mb-4">
                      <label className="form-label fw-semibold" style={{ fontSize: "0.85rem" }}>
                        Confirmer le nouveau code
                      </label>
                      <PinInput value={pwd2} onChange={setPwd2} id="confirme" />
                      {pwd2.length === 4 && pwd !== pwd2 && (
                        <small className="text-danger d-block mt-1" style={{ fontSize: "0.75rem" }}>
                          Les deux codes ne correspondent pas.
                        </small>
                      )}
                    </div>
                    <div className="d-flex justify-content-end">
                      <button type="submit" className="btn btn-primary btn-sm"
                        disabled={savingPwd || pwdActuel.length !== 4 || pwd.length !== 4 || pwd !== pwd2}>
                        {savingPwd ? "Changement..." : "Changer mon code"}
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
