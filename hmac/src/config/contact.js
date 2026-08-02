// Coordonnées du bailleur / proprietaire — utilisees par la vitrine publique.
// Format international sans "+" pour les liens wa.me.
export const WHATSAPP_NUM = "261348658868"; // 034 86 588 68
export const TEL_AFFICHE = "034 86 588 68";
export const NOM_CONTACT = "LEFORT N. Nuno (Trofel)";

// Numero du bailleur imprime sur les quittances de loyer.
export const TEL_BAILLEUR = "+212 642 359 184";

// Adresse de l application, transmise aux locataires avec leurs acces.
export const URL_APP = "https://e-hma.vercel.app/";

/**
 * Identifiant de conversation Messenger.
 *
 * On accepte aussi bien un identifiant brut ("9918260078190044") qu'une URL
 * complete collee depuis le navigateur :
 *   https://www.facebook.com/messages/e2ee/t/9918260078190044
 *   https://www.facebook.com/messages/t/9918260078190044
 *   https://m.me/9918260078190044
 */
export function extraireMessengerId(saisie) {
  if (!saisie) return "";
  const texte = String(saisie).trim();
  const m = texte.match(/(?:messages\/(?:e2ee\/)?t\/|m\.me\/)([A-Za-z0-9._-]+)/);
  if (m) return m[1];
  // Identifiant seul (chiffres ou pseudo Facebook)
  if (/^[A-Za-z0-9._-]+$/.test(texte)) return texte;
  return "";
}

/**
 * Lien vers la conversation.
 * Avec un identifiant enregistre, on ouvre directement la discussion.
 * Sinon, faute de mieux, on ouvre une recherche Facebook sur le nom.
 */
export function lienMessenger(nom, messengerId) {
  const id = extraireMessengerId(messengerId);
  if (id) return `https://www.facebook.com/messages/t/${id}`;
  if (!nom) return "https://www.facebook.com/messages/";
  return `https://www.facebook.com/search/people/?q=${encodeURIComponent(nom)}`;
}

// Copie un texte puis ouvre la conversation Messenger de la personne.
export function copierEtOuvrirMessenger(texte, nom, messengerId) {
  const ouvrir = () =>
    window.open(lienMessenger(nom, messengerId), "_blank", "noopener");
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(texte).then(ouvrir, ouvrir);
  } else {
    ouvrir();
  }
}
