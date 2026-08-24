import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "../../contexts/api/axios";
import {
  BsPatchCheckFill,
  BsXCircleFill,
  BsHourglassSplit,
  BsFileEarmarkText,
  BsFileEarmarkRuled,
} from "react-icons/bs";
import hma from "../../assets/images/hma256.png";
import "./verification.css";

function ligneDetail(label, valeur) {
  if (valeur === undefined || valeur === null || valeur === "") return null;
  return (
    <div className="verif-ligne" key={label}>
      <span className="verif-label">{label}</span>
      <span className="verif-valeur">{valeur}</span>
    </div>
  );
}

function DetailsRecu({ d }) {
  return (
    <>
      {ligneDetail("Locataire", d.locataire)}
      {ligneDetail("Chambre", `${d.chambre} (${d.etage === "RDC" ? "Rez-de-chaussée" : "1er étage"})`)}
      {ligneDetail("Période", `${d.mois} ${d.annee}`)}
      {ligneDetail("Loyer réglé", d.loyerPaye != null ? `${Number(d.loyerPaye).toLocaleString()} Ar` : null)}
      {ligneDetail("JIRAMA", d.jirama != null ? `${Number(d.jirama).toLocaleString()} Ar` : null)}
      {ligneDetail("Statut loyer", d.statutLoyer)}
      {ligneDetail("Statut JIRAMA", d.statutJirama)}
      {ligneDetail("Date de paiement", d.datePaiement)}
      {ligneDetail("N° de reçu", d.recuId)}
    </>
  );
}

function DetailsBail({ d }) {
  return (
    <>
      {d.locataire && ligneDetail("Locataire", d.locataire)}
      {d.chambre && ligneDetail("Chambre", d.chambre)}
      {d.cin && ligneDetail("CIN", d.cin)}
      {Array.isArray(d.locataires) && (
        <div className="verif-ligne verif-ligne-liste">
          <span className="verif-label">Locataires couverts</span>
          <span className="verif-valeur">
            {d.locataires.map((l) => `${l.chambre} — ${l.nom}`).join(", ")}
          </span>
        </div>
      )}
      {ligneDetail("Bailleur", d.bailleur)}
    </>
  );
}

export default function Verification() {
  const { code } = useParams();
  const [etat, setEtat] = useState("chargement"); // chargement | ok | introuvable
  const [doc, setDoc] = useState(null);

  useEffect(() => {
    axios
      .get(`verification/${code}`)
      .then((r) => {
        setDoc(r.data);
        setEtat("ok");
      })
      .catch(() => setEtat("introuvable"));
  }, [code]);

  const dateGeneration = doc?.createdAt
    ? new Date(doc.createdAt).toLocaleString("fr-FR", {
        day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
      })
    : null;

  return (
    <div className="verif-page">
      <div className="verif-card">
        <img src={hma} alt="HMA" className="verif-logo" />

        {etat === "chargement" && (
          <div className="verif-etat">
            <BsHourglassSplit size={40} className="verif-icone verif-icone-attente" />
            <p>Vérification en cours…</p>
          </div>
        )}

        {etat === "introuvable" && (
          <div className="verif-etat">
            <BsXCircleFill size={44} className="verif-icone verif-icone-ko" />
            <h2>Document non reconnu</h2>
            <p className="verif-souligne">
              Ce code ne correspond à aucun document émis par Villa Kinya. Il
              peut s'agir d'un lien erroné ou d'un document falsifié.
            </p>
          </div>
        )}

        {etat === "ok" && doc && (
          <div className="verif-etat">
            <BsPatchCheckFill size={44} className="verif-icone verif-icone-ok" />
            <h2>Document authentique</h2>
            <p className="verif-titre-doc">
              {doc.type === "RECU" ? <BsFileEarmarkText /> : <BsFileEarmarkRuled />}
              {doc.titre}
            </p>
            <div className="verif-details">
              {doc.type === "RECU" ? (
                <DetailsRecu d={doc.details || {}} />
              ) : (
                <DetailsBail d={doc.details || {}} />
              )}
            </div>
            {dateGeneration && (
              <p className="verif-emis">Émis le {dateGeneration}</p>
            )}
          </div>
        )}

        <p className="verif-pied">
          <Link to="/">Villa Kinya</Link> — vérification officielle des documents
        </p>
      </div>
    </div>
  );
}
