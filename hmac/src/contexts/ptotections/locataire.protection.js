import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Garde commun a toutes les pages protegees :
 *  - pas de jeton -> connexion
 *  - mot de passe encore temporaire -> ecran de premier acces (obligatoire)
 *  - compte "locataire" (karazana 2) -> cantonne a son espace personnel
 */
export default function LocataireProtection({ Cmp, autorise = "TOUS" }) {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const karazana = String(localStorage.getItem("karazana"));
  const doitChanger = String(localStorage.getItem("mdpTemporaire")) === "1";
  const estLocataire = karazana === "2";

  useEffect(() => {
    if (!token) return navigate("/");
    if (doitChanger) return navigate("/premier-acces/");
    if (estLocataire && autorise !== "LOCATAIRE") navigate("/mon-espace/");
    if (!estLocataire && autorise === "LOCATAIRE" && karazana !== "1") navigate("/home/");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!token || doitChanger) return null;
  if (estLocataire && autorise !== "LOCATAIRE") return null;

  return <Cmp />;
}
