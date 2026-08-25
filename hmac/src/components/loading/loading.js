import { Sk } from "../skeleton/skeleton";

// Squelette generique (quelques lignes de texte) pour les zones de detail
// qui attendent encore leur reponse — meme animation verte que le reste
// de l'application, plus de spinner ni de texte "Chargement...".
export default function Loading() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <Sk w="90%" h={14} className="sk-h3" />
      <Sk w="75%" h={14} className="sk-h3" />
      <Sk w="82%" h={14} className="sk-h3" />
      <Sk w="55%" h={14} className="sk-h3" />
    </div>
  );
}
