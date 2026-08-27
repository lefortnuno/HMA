import { useState, useEffect } from "react";
import axios from "../../contexts/api/axios";
import { toast } from "react-toastify";
import { BsFileEarmarkText, BsDownload, BsCheckCircleFill } from "react-icons/bs";
import SignaturePad from "./signature.pad";
import {
  construireBailIndividuel,
  depuisContratServeur,
} from "../../config/bail.pdf";
import { formatDate } from "../../config/dates";

/**
 * Fenêtre de signature d'un contrat de bail.
 *
 * Le même écran sert aux deux parties : le serveur déduit du compte qui
 * signe, le client n'a rien à lui dire là-dessus. Celui qui appose la
 * seconde signature produit le PDF définitif et l'envoie au serveur, qui le
 * conserve tel quel : c'est cette copie qui fait foi ensuite.
 */
export default function SignerBail({ contratId, opts, onFini, onClose }) {
  const [contrat, setContrat] = useState(null);
  const [signature, setSignature] = useState(null);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    axios
      .get(`bail/${contratId}`, opts)
      .then((r) => setContrat(r.data))
      .catch(() => setErreur("Contrat introuvable."));
  }, [contratId, opts]);

  useEffect(() => {
    const k = (e) => e.key === "Escape" && !envoi && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose, envoi]);

  function apercu() {
    if (!contrat) return;
    const { doc, filename } = construireBailIndividuel(
      depuisContratServeur(contrat),
    );
    doc.save(filename);
  }

  async function valider() {
    if (!signature) return;
    setEnvoi(true);
    try {
      const r = await axios.post(
        `bail/${contratId}/signer`,
        { type: signature.type, data: signature.data },
        opts,
      );
      const maj = r.data?.contrat;

      // Seconde signature : c'est à ce poste de produire le document final.
      if (maj && maj.sigLocataireLe && maj.sigBailleurLe) {
        const { doc } = construireBailIndividuel(depuisContratServeur(maj));
        const base64 = doc.output("datauristring").split(",")[1];
        await axios.post(`bail/${contratId}/figer`, { pdf: base64 }, opts);
        toast.success("Contrat signé par les deux parties et archivé.");
      } else {
        toast.success("Signature enregistrée. En attente de l'autre partie.");
      }
      onFini && onFini();
      onClose();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Signature refusée.");
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={() => !envoi && onClose()}>
      <div
        className="modal-content-pro"
        style={{ maxWidth: 620 }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-header-pro">
          <h6>
            <BsFileEarmarkText className="me-2" /> Signer le contrat de bail
          </h6>
          <button className="btn-close" onClick={onClose} disabled={envoi} />
        </div>

        <div className="p-3">
          {erreur ? (
            <p className="text-danger mb-0">{erreur}</p>
          ) : !contrat ? (
            <p className="text-muted mb-0">Chargement…</p>
          ) : (
            <>
              <div
                className="rounded-3 p-3 mb-3"
                style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}
              >
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="fw-bold" style={{ fontSize: "0.9rem" }}>
                    {contrat.nomLegal}
                  </span>
                  <span className="fw-bold">
                    {Number(contrat.loyer || 0).toLocaleString()} Ar/mois
                  </span>
                </div>
                <small className="text-muted" style={{ fontSize: "0.78rem" }}>
                  Chambre {contrat.chambre} (
                  {contrat.etage === "RDC" ? "rez-de-chaussée" : "1er étage"})
                  {contrat.cin ? ` · CIN ${contrat.cin}` : ""}
                </small>
                <div className="d-flex gap-3 mt-2" style={{ fontSize: "0.76rem" }}>
                  <span className={contrat.sigBailleurLe ? "text-success" : "text-muted"}>
                    {contrat.sigBailleurLe ? <BsCheckCircleFill /> : "○"} Propriétaire
                    {contrat.sigBailleurLe ? ` (${formatDate(contrat.sigBailleurLe)})` : ""}
                  </span>
                  <span className={contrat.sigLocataireLe ? "text-success" : "text-muted"}>
                    {contrat.sigLocataireLe ? <BsCheckCircleFill /> : "○"} Locataire
                    {contrat.sigLocataireLe ? ` (${formatDate(contrat.sigLocataireLe)})` : ""}
                  </span>
                </div>
              </div>

              <button
                type="button"
                className="btn btn-outline-secondary btn-sm w-100 mb-3 d-inline-flex align-items-center justify-content-center gap-2"
                onClick={apercu}
              >
                <BsDownload /> Lire le contrat avant de signer
              </button>

              <p className="text-muted mb-2" style={{ fontSize: "0.8rem" }}>
                Votre signature vaut acceptation des termes du contrat ci-dessus.
              </p>

              <SignaturePad onChange={setSignature} />

              <div className="d-flex justify-content-end gap-2 mt-3">
                <button
                  className="btn btn-outline-secondary btn-sm"
                  onClick={onClose}
                  disabled={envoi}
                >
                  Annuler
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={valider}
                  disabled={!signature || envoi}
                >
                  {envoi ? "Enregistrement…" : "Signer le contrat"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
