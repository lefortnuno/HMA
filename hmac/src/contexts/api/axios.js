import axios from "axios";

const instance = axios.create({
  baseURL:
    process.env.REACT_APP_SUN_API_HEAD +
    process.env.REACT_APP_SUN_API_IP_ADRESS +
    process.env.REACT_APP_SUN_API_PORT +
    `/api/`,
});

/**
 * Session expiree / jeton invalide.
 *
 * Les pages ne verifiaient que la PRESENCE d'un token dans le navigateur :
 * avec un jeton perime (ex. apres rotation du secret cote serveur), l'appli
 * affichait le nom de l'utilisateur mais toutes les requetes renvoyaient 401
 * et chaque page paraissait vide, sans le moindre message.
 *
 * On force donc la reconnexion des qu'une reponse 401 arrive.
 */
let redirectionEnCours = false;

instance.interceptors.response.use(
  (reponse) => reponse,
  (erreur) => {
    const statut = erreur?.response?.status;
    const url = erreur?.config?.url || "";
    const estConnexion = url.includes("seConnecter");

    // 401 : jeton invalide/expire.
    // 431 : en-tete trop volumineux — cas d'un ancien jeton surdimensionne
    //       (il embarquait la photo de profil) ; seule une reconnexion le purge.
    const sessionInvalide = statut === 401 || statut === 431;

    if (sessionInvalide && !estConnexion && !redirectionEnCours) {
      redirectionEnCours = true;
      localStorage.clear();
      // Message recupere par la page de connexion.
      sessionStorage.setItem(
        "sessionExpiree",
        statut === 431
          ? "Session obsolète, merci de vous reconnecter."
          : "Votre session a expiré, merci de vous reconnecter."
      );
      window.location.replace("/");
    }
    return Promise.reject(erreur);
  }
);

export default instance;
