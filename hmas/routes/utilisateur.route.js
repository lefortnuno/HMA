const router = require("express").Router();
const UtilisateurController = require("../controllers/utilisateur.controller");
const admin = require("../middlewares/admin.middleware");
const connecte = require("../middlewares/connecte.middleware");


router.post("/", UtilisateurController.addUtilisateur);
router.post("/seConnecter", UtilisateurController.loginUtilisateur);
router.post(
  "/recherche",
  admin.checkUtilisateur,
  UtilisateurController.searchUtilisateur
);

router.get(
  "/",
  admin.checkUtilisateur,
  UtilisateurController.getAllUtilisateurs
);
router.get("/userTtl", admin.checkUtilisateur, UtilisateurController.getMyTotalOfUser);
router.get(
  "/:id",
  admin.checkUtilisateur,
  UtilisateurController.getIdUtilisateur
);

// Self-service : chaque utilisateur modifie SON propre compte, y compris un
// locataire (déclaré avant /:id pour ne pas être capturé par le paramètre).
router.put(
  "/me",
  connecte.checkUtilisateur,
  UtilisateurController.updateMonCompte
);

router.put(
  "/:id",
  admin.checkUtilisateur,
  UtilisateurController.updateUtilisateur
);

// Regenerer le code d acces d un compte (admin) : renvoie le nouveau code.
router.post(
  "/:id/acces",
  admin.checkUtilisateur,
  UtilisateurController.regenererAcces
);

router.delete(
  "/:id",
  admin.checkUtilisateur,
  UtilisateurController.deleteUtilisateur
);

module.exports = router;
