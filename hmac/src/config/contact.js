// Coordonnées du bailleur / proprietaire — utilisees par la vitrine publique.
// Format international sans "+" pour les liens wa.me.
export const WHATSAPP_NUM = "261348658868"; // 034 86 588 68
export const TEL_AFFICHE = "034 86 588 68";
export const NOM_CONTACT = "LEFORT N. Nuno (Trofel)";

/**
 * Messenger ne permet pas de pre-remplir un message via une URL.
 * On ouvre donc la recherche Facebook sur le nom de la personne :
 * le message est copie dans le presse-papier, il ne reste qu'a coller.
 */
export function lienMessenger(nom) {
  if (!nom) return "https://www.facebook.com/messages/";
  return `https://www.facebook.com/search/people/?q=${encodeURIComponent(nom)}`;
}

// Copie un texte puis ouvre Messenger sur la bonne personne.
export function copierEtOuvrirMessenger(texte, nom) {
  const ouvrir = () => window.open(lienMessenger(nom), "_blank", "noopener");
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(texte).then(ouvrir, ouvrir);
  } else {
    ouvrir();
  }
}
