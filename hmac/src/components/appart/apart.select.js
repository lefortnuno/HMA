import { useEffect, useState } from "react";
import axios from "../../contexts/api/axios";
import { BsBuilding } from "react-icons/bs";

// VILLA KINYA = appartement special code en dur (bienId 0), gere en grille de chambres.
// Les autres apparts viennent des biens du vitrine (type VILLA) et sont "mono-unite".
export const KINYA = { id: 0, nom: "VILLA KINYA", mono: false, prix: null };

// Persistance du choix d'appartement (partage entre les pages).
export function getSelectedBienId() {
  const v = localStorage.getItem("bienId");
  return v === null ? 0 : Number(v);
}
export function setSelectedBienId(id) {
  localStorage.setItem("bienId", String(id));
}

// Liste des appartements gerables : KINYA + biens VILLA du vitrine.
export function useAppartements() {
  const [list, setList] = useState([KINYA]);
  useEffect(() => {
    axios
      .get("vitrine/biens?type=VILLA")
      .then((r) => {
        const biens = (r.data || []).map((b) => ({
          id: b.id,
          nom: b.titre,
          mono: true,
          prix: b.prix,
        }));
        setList([KINYA, ...biens]);
      })
      .catch(() => setList([KINYA]));
  }, []);
  return list;
}

export default function ApartSelect({ list, value, onChange }) {
  if (!list || list.length <= 1) {
    // Un seul appartement (KINYA) : inutile d'afficher un selecteur.
    return null;
  }
  return (
    <div className="apart-select d-flex align-items-center gap-2">
      <BsBuilding className="text-primary" size={18} />
      <select
        className="form-select form-select-sm fw-semibold"
        style={{ maxWidth: 300, borderColor: "#bfdbfe" }}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        title="Choisir l'appartement à gérer"
      >
        {list.map((a) => (
          <option key={a.id} value={a.id}>
            {a.nom}
          </option>
        ))}
      </select>
    </div>
  );
}
