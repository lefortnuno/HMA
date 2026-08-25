import { SkTableRows } from "../skeleton/skeleton";

// Lignes de tableau en chargement — delegue au squelette vert commun
// plutot que d'afficher une ligne "Chargement des donnees...".
export default function LoadingTable({ cols = 5, rows = 6 }) {
  return <SkTableRows cols={cols} rows={rows} />;
}
