import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Protege une page reservee a l'admin (karazana == 1).
// - Pas de token -> retour a la connexion.
// - Token mais pas admin -> redirige vers l'accueil (page autorisee).
export default function AdminProtection(props) {
  const Cmp = props.Cmp;
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const isAdmin = String(localStorage.getItem("karazana")) === "1";

  useEffect(() => {
    if (!token) navigate("/");
    else if (!isAdmin) navigate("/home/");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!token || !isAdmin) return null;

  return <Cmp />;
}
