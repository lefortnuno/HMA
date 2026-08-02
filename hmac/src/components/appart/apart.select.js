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
//
// bienId / onReset (optionnels) : si l'appartement memorise dans le navigateur
// n'existe plus (bien supprime, renomme, ou selection restee sur un appart
// vide), on revient automatiquement sur VILLA KINYA. Sans ce garde-fou, toutes
// les pages filtrent sur un appartement introuvable et paraissent vides.
export function useAppartements(bienId, onReset) {
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
        const complete = [KINYA, ...biens];
        setList(complete);
        if (
          bienId !== undefined &&
          !complete.some((a) => a.id === Number(bienId))
        ) {
          setSelectedBienId(0);
          if (onReset) onReset(0);
        }
      })
      .catch(() => setList([KINYA]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return list;
}

export default function ApartSelect({ list, value, onChange }) {
  // On masque le selecteur uniquement s'il n'y a qu'un appartement ET qu'on est
  // deja dessus : sinon l'utilisateur serait bloque sur un appart sans donnees.
  if ((!list || list.length <= 1) && Number(value) === 0) {
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
