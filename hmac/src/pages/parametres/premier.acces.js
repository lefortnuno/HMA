import { useState } from "react";
import axios from "../../contexts/api/axios";
import GetUserData from "../../contexts/api/udata";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { BsShieldLock, BsCheckCircleFill } from "react-icons/bs";
import PinInput from "../../components/pin/pin.input";
import hma from "../../assets/images/hma256.png";

/**
 * Premiere connexion avec le code fourni par le proprietaire :
 * l'utilisateur DOIT choisir son propre code avant d'acceder a l'application.
 */
export default function PremierAcces() {
  const u_info = GetUserData();
  const navigate = useNavigate();
  const [ancien, setAncien] = useState("");
  const [nouveau, setNouveau] = useState("");
  const [confirme, setConfirme] = useState("");
  const [saving, setSaving] = useState(false);

  const complet = ancien.length === 4 && nouveau.length === 4 && confirme.length === 4;
  const identiques = nouveau === confirme;
  const differentDeLancien = nouveau !== ancien;

  function valider(e) {
    e.preventDefault();
    if (!complet) return toast.warning("Merci de remplir les trois codes");
    if (!identiques) return toast.warning("Les deux nouveaux codes ne correspondent pas");
    if (!differentDeLancien)
      return toast.warning("Choisissez un code différent de celui reçu");

    setSaving(true);
    axios
      .put("utilisateur/me", { pwdActuel: ancien, pwd: nouveau }, u_info.opts)
      .then(() => {
        localStorage.setItem("mdpTemporaire", "0");
        toast.success("Code enregistré, bienvenue !");
        // Un locataire n a acces qu a son espace personnel.
        const locataire = String(localStorage.getItem("karazana")) === "2";
        navigate(locataire ? "/mon-espace/" : "/loyer/");
      })
      .catch((err) =>
        toast.error(err.response?.data?.message || "Erreur lors du changement")
      )
      .finally(() => setSaving(false));
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f8fafc",
        padding: 16,
      }}
    >
      <div
        className="card-pro"
        style={{ maxWidth: 460, width: "100%", background: "#fff", borderRadius: 16, padding: 28 }}
      >
        <div className="text-center mb-4">
          <img src={hma} alt="HMA" style={{ width: 56, height: 56, borderRadius: 12 }} />
          <h5 className="fw-bold mt-3 mb-1">Bienvenue {u_info.u_nom} 👋</h5>
          <p className="text-muted mb-0" style={{ fontSize: "0.85rem" }}>
            Pour votre sécurité, choisissez votre propre code avant de continuer.
          </p>
        </div>

        <div
          className="rounded-3 p-2 mb-4 d-flex align-items-center gap-2"
          style={{ background: "#eff6ff", border: "1px solid #bfdbfe" }}
        >
          <BsShieldLock color="#2563eb" size={18} />
          <small style={{ fontSize: "0.78rem", color: "#1e40af" }}>
            Le code reçu du propriétaire ne fonctionnera plus après cette étape.
          </small>
        </div>

        <form onSubmit={valider}>
          <div className="mb-4">
            <label className="form-label fw-semibold" style={{ fontSize: "0.85rem" }}>
              Code reçu
            </label>
            <PinInput value={ancien} onChange={setAncien} autoFocus id="ancien" />
          </div>

          <div className="mb-4">
            <label className="form-label fw-semibold" style={{ fontSize: "0.85rem" }}>
              Votre nouveau code
            </label>
            <PinInput value={nouveau} onChange={setNouveau} id="nouveau" />
            {nouveau.length === 4 && !differentDeLancien && (
              <small className="text-danger" style={{ fontSize: "0.75rem" }}>
                Choisissez un code différent de celui reçu.
              </small>
            )}
          </div>

          <div className="mb-4">
            <label className="form-label fw-semibold" style={{ fontSize: "0.85rem" }}>
              Confirmez le nouveau code
            </label>
            <PinInput value={confirme} onChange={setConfirme} id="confirme" />
            {confirme.length === 4 && !identiques && (
              <small className="text-danger" style={{ fontSize: "0.75rem" }}>
                Les deux codes ne correspondent pas.
              </small>
            )}
            {confirme.length === 4 && identiques && differentDeLancien && (
              <small className="text-success d-flex align-items-center gap-1" style={{ fontSize: "0.75rem" }}>
                <BsCheckCircleFill size={11} /> Codes identiques
              </small>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100 fw-semibold"
            disabled={saving || !complet || !identiques || !differentDeLancien}
          >
            {saving ? "Enregistrement..." : "Enregistrer mon code"}
          </button>
        </form>
      </div>
    </div>
  );
}
