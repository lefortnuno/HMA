/**
 * Vérification de document par QR code (reçus & contrats de bail).
 *
 * Chaque PDF généré embarque un QR pointant vers /verification/<code>.
 * Le code est créé côté serveur (table document_verification) au moment de
 * la génération, avec un instantané des faits vérifiables — pas les
 * données du QR lui-même, sinon n'importe qui pourrait fabriquer un faux
 * QR "valide" sans jamais toucher au serveur.
 */
import axios from "../contexts/api/axios";
import QRCode from "qrcode";

export async function creerVerification(opts, { type, bienId, titre, details }) {
  const { data } = await axios.post(
    "verification",
    { type, bienId, titre, details },
    opts
  );
  return data.code;
}

export function urlVerification(code) {
  return `${window.location.origin}/verification/${code}`;
}

/** Data-URL PNG du QR, prête pour doc.addImage(). */
export async function qrDataUrlPour(url) {
  return QRCode.toDataURL(url, {
    margin: 1,
    width: 240,
    color: { dark: "#000000", light: "#FFFFFF" },
  });
}

/**
 * Crée l'enregistrement de vérification puis génère directement le QR
 * correspondant. Ne doit jamais faire échouer la génération du PDF : en cas
 * de souci réseau, on continue sans QR plutôt que de bloquer un reçu/bail.
 */
export async function genererQrVerification(opts, params) {
  try {
    const code = await creerVerification(opts, params);
    const dataUrl = await qrDataUrlPour(urlVerification(code));
    return { code, dataUrl };
  } catch (e) {
    return { code: null, dataUrl: null };
  }
}
