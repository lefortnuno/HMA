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

// Telephone ou tablette : le lien doit viser l'application, pas le site.
export function surMobile() {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || "");
}

/**
 * Adresse web de la conversation. Toujours valable, jamais un lien profond.
 * Sert d'affichage sur ordinateur, et de secours quand l'application ne
 * repond pas sur telephone.
 */
export function lienMessengerWeb(nom, messengerId) {
  const id = extraireMessengerId(messengerId);
  if (id) return `https://www.facebook.com/messages/t/${id}`;
  if (!nom) return "https://www.facebook.com/messages/";
  return `https://www.facebook.com/search/people/?q=${encodeURIComponent(nom)}`;
}

/**
 * Lien vers la conversation.
 *
 * Sur telephone on passe par le schema de l'application Messenger. Les deux
 * adresses web echouent chacune a leur maniere :
 *
 *   facebook.com/messages/t/...  ouvre Facebook, pas la messagerie ;
 *   m.me/...                     ne resout que des noms d'utilisateur et des
 *                                pages. Ce qu'on enregistre est un identifiant
 *                                de conversation : m.me ne le reconnait pas et
 *                                renvoie vers l'App Store.
 *
 * `fb-messenger://user-thread/<id>` ouvre directement la bonne discussion.
 * Il ne dit pas s'il a abouti : l'appelant prevoit un secours vers le web
 * (voir le composant de rappel).
 */
export function lienMessenger(nom, messengerId) {
  const id = extraireMessengerId(messengerId);
  if (id && surMobile()) return `fb-messenger://user-thread/${id}`;
  return lienMessengerWeb(nom, messengerId);
}

/**
 * Copie un texte et ouvre la conversation Messenger.
 *
 * L'ouverture passe EN PREMIER, et la copie ensuite. Attendre la promesse du
 * presse-papiers avant d'ouvrir faisait perdre le lien avec le clic de
 * l'utilisateur : le navigateur considerait alors la fenetre comme une
 * publicite et la bloquait — systematiquement sur mobile.
 *
 * Fenetre nommee plutot que `_blank` : on retombe sur l'onglet Messenger
 * deja ouvert au lieu d'en empiler un nouveau a chaque envoi.
 */
export function copierEtOuvrirMessenger(texte, nom, messengerId) {
  window.open(lienMessenger(nom, messengerId), "messenger");
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(texte).catch(() => {});
  }
}

/** Lien WhatsApp avec message pre-rempli. Numero au format international. */
export function lienWhatsApp(tel, texte) {
  const num = String(tel || "").replace(/\s+/g, "").replace(/^\+/, "");
  if (!num) return null;
  const suffixe = texte ? `?text=${encodeURIComponent(texte)}` : "";
  return `https://wa.me/${num}${suffixe}`;
}
