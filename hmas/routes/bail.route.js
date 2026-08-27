const router = require("express").Router();
const ctrl = require("../controllers/bail.controller");
const admin = require("../middlewares/admin.middleware");
const locataire = require("../middlewares/locataire.middleware");

/**
 * Contrats de bail signes electroniquement.
 *
 * `locataire.checkUtilisateur` ouvre la route a l'admin comme au locataire :
 * c'est le controleur qui decide ensuite qui signe de quel cote, et qui
 * refuse a un locataire le contrat d'un autre.
 */

// Mise a la signature et suivi : cote bailleur uniquement.
router.post("/", admin.checkUtilisateur, ctrl.creer);
router.get("/", admin.checkUtilisateur, ctrl.lister);

// Avant "/:id", sinon Express prendrait "mien" pour un identifiant.
router.get("/mien", locataire.checkUtilisateur, ctrl.leMien);

router.get("/:id", locataire.checkUtilisateur, ctrl.detail);
router.get("/:id/pdf", locataire.checkUtilisateur, ctrl.pdf);
router.post("/:id/signer", locataire.checkUtilisateur, ctrl.signer);
router.post("/:id/figer", locataire.checkUtilisateur, ctrl.figer);

router.delete("/:id", admin.checkUtilisateur, ctrl.supprimer);

module.exports = router;
