import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Garde commun a toutes les pages protegees :
 *  - pas de jeton -> connexion
 *  - mot de passe encore temporaire -> ecran de premier acces (obligatoire)
 *  - compte "locataire" (karazana 2) -> cantonne a son espace personnel
 *
 * `autorise` :
 *   "TOUS"      admin et utilisateurs, pas les locataires (defaut)
 *   "LOCATAIRE" espace personnel du locataire (et l'admin, pour depanner)
 *   "COMMUN"    tout compte connecte, locataires compris (ex. l'accueil,
 *               qui porte la politique interne)
 */
export default function LocataireProtection({ Cmp, autorise = "TOUS" }) {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const karazana = String(localStorage.getItem("karazana"));
  const doitChanger = String(localStorage.getItem("mdpTemporaire")) === "1";
  const estLocataire = karazana === "2";
  const locataireExclu = estLocataire && autorise === "TOUS";

  useEffect(() => {
    if (!token) return navigate("/");
    if (doitChanger) return navigate("/premier-acces/");
    if (locataireExclu) navigate("/mon-espace/");
    if (!estLocataire && autorise === "LOCATAIRE" && karazana !== "1") navigate("/home/");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!token || doitChanger) return null;
  if (locataireExclu) return null;

  return <Cmp />;
}
