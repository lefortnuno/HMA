import { useRef, useState } from "react";
import { BsUpload, BsTrash, BsPersonFill } from "react-icons/bs";

/**
 * Photos de profil (comptes + locataires).
 * - 3 avatars predefinis (SVG inline, aucun fichier a heberger)
 * - ou upload d'une photo, redimensionnee cote navigateur puis stockee
 *   en data URL base64 dans la base (le disque de Render est efface
 *   a chaque redeploiement, une URL de fichier ne survivrait pas).
 */

const svg = (s) => `data:image/svg+xml;utf8,${encodeURIComponent(s)}`;

export const AVATARS = [
  {
    id: "av1",
    label: "Bleu",
    src: svg(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="50" fill="#dbeafe"/><circle cx="50" cy="38" r="17" fill="#2563eb"/><path d="M18 92c0-18 14-30 32-30s32 12 32 30z" fill="#2563eb"/></svg>`
    ),
  },
  {
    id: "av2",
    label: "Vert",
    src: svg(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="50" fill="#dcfce7"/><circle cx="50" cy="38" r="17" fill="#16a34a"/><path d="M18 92c0-18 14-30 32-30s32 12 32 30z" fill="#16a34a"/></svg>`
    ),
  },
  {
    id: "av3",
    label: "Violet",
    src: svg(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="50" fill="#f3e8ff"/><circle cx="50" cy="38" r="17" fill="#7c3aed"/><path d="M18 92c0-18 14-30 32-30s32 12 32 30z" fill="#7c3aed"/></svg>`
    ),
  },
];

// Redimensionne + compresse l'image cote client (carre 256px, JPEG q0.82).
function resizeImage(file, taille = 256) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const cote = Math.min(img.width, img.height);
        const sx = (img.width - cote) / 2;
        const sy = (img.height - cote) / 2;
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = taille;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, sx, sy, cote, cote, 0, 0, taille, taille);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

// Affichage simple d'une photo (ou initiales en repli).
export function Avatar({ photo, nom = "", size = 40, style = {} }) {
  const base = {
    width: size,
    height: size,
    borderRadius: "50%",
    objectFit: "cover",
    flexShrink: 0,
    border: "1px solid #e2e8f0",
    background: "#f1f5f9",
    ...style,
  };
  if (photo) return <img src={photo} alt={nom} style={base} />;
  const initiales = nom
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((m) => m[0])
    .join("")
    .toUpperCase();
  return (
    <span
      style={{
        ...base,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#64748b",
        fontWeight: 700,
        fontSize: size * 0.38,
      }}
    >
      {initiales || <BsPersonFill size={size * 0.5} />}
    </span>
  );
}

export default function AvatarPicker({ value, onChange, nom = "", size = 84 }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    setBusy(true);
    try {
      onChange(await resizeImage(file));
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }

  return (
    <div className="d-flex align-items-center gap-3 flex-wrap">
      <Avatar photo={value} nom={nom} size={size} />

      <div className="d-flex flex-column gap-2">
        {/* Avatars predefinis */}
        <div className="d-flex align-items-center gap-2">
          <small className="text-muted" style={{ fontSize: "0.72rem", minWidth: 60 }}>
            Prédéfinis
          </small>
          {AVATARS.map((a) => (
            <button
              key={a.id}
              type="button"
              title={a.label}
              onClick={() => onChange(a.src)}
              style={{
                padding: 0,
                border: value === a.src ? "2px solid #2563eb" : "2px solid transparent",
                borderRadius: "50%",
                background: "none",
                cursor: "pointer",
                lineHeight: 0,
              }}
            >
              <img
                src={a.src}
                alt={a.label}
                style={{ width: 34, height: 34, borderRadius: "50%" }}
              />
            </button>
          ))}
        </div>

        {/* Upload / retrait */}
        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1"
            style={{ fontSize: "0.75rem" }}
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            <BsUpload size={12} /> {busy ? "Traitement..." : "Choisir une photo"}
          </button>
          {value && (
            <button
              type="button"
              className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1"
              style={{ fontSize: "0.75rem" }}
              onClick={() => onChange("")}
            >
              <BsTrash size={12} /> Retirer
            </button>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleFile}
          />
        </div>
      </div>
    </div>
  );
}
