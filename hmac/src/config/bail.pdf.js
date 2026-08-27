import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  BAILLEUR, VILLE, SOUS_TITRE,
  article1, ARTICLE_2, ARTICLE_3, ARTICLE_4, ARTICLE_5, ARTICLE_6,
} from "./bail";
import { formatDate } from "./dates";

/**
 * Contrat de bail individuel, en PDF.
 *
 * Le même document sert au brouillon que l'on fait relire et au contrat
 * signé : seules les signatures changent. Une seule fonction pour les deux,
 * sinon les deux versions finiraient par diverger et le locataire signerait
 * un texte différent de celui qu'on lui a montré.
 *
 * `contrat` porte les valeurs figées à la mise à la signature (nom légal,
 * CIN, chambre, loyer) plutôt que la fiche vivante du locataire : un contrat
 * signé ne doit plus bouger si la fiche évolue ensuite.
 */

const MG = 15;

function enTete(doc) {
  const W = doc.internal.pageSize.getWidth();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.text("CONTRAT DE BAIL", W / 2, 18, { align: "center" });
  doc.setFont("helvetica", "italic");
  doc.setFontSize(10.5);
  doc.text(SOUS_TITRE, W / 2, 25, { align: "center" });
  doc.setFont("helvetica", "normal");
  return 36;
}

function dessinerQr(doc, R, dataUrl) {
  if (!dataUrl) return;
  const taille = 22;
  doc.addImage(dataUrl, "PNG", R - taille, 8, taille, taille);
}

function assurerPlace(doc, y, besoin) {
  if (y + besoin > 288) {
    doc.addPage();
    return 20;
  }
  return y;
}

function ecrireArticle(doc, y, titre, texte, R) {
  doc.setFont("helvetica", "bold");
  const largeurTitre = doc.getTextWidth(titre + " : ");
  doc.setFont("helvetica", "normal");
  const lignes = doc.splitTextToSize(texte, R - MG - largeurTitre);
  y = assurerPlace(doc, y, lignes.length * 5 + 3);

  doc.setFont("helvetica", "bold");
  doc.text(titre + " : ", MG, y);
  doc.setFont("helvetica", "normal");
  doc.text(lignes[0], MG + largeurTitre, y);
  lignes.slice(1).forEach((l, i) => doc.text(l, MG, y + (i + 1) * 5));
  return y + lignes.length * 5 + 3;
}

/**
 * Appose une signature sous son intitulé.
 *
 * Un tracé est une image PNG à fond transparent ; un nom tapé est écrit en
 * italique. Dans les deux cas la date de signature suit, en petit : c'est
 * elle qui donne sa valeur à la signature.
 */
function apposer(doc, sig, x, y, align) {
  if (!sig || !sig.data) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8.5);
    doc.setTextColor(120);
    doc.text("(non signé)", x, y, { align });
    doc.setTextColor(0);
    return;
  }

  if (sig.type === "DESSIN") {
    const largeur = 46;
    const hauteur = 18;
    // L'image se pose au-dessus de la ligne de base, alignée sur x.
    const gauche = align === "right" ? x - largeur : x;
    try {
      doc.addImage(sig.data, "PNG", gauche, y - hauteur + 3, largeur, hauteur);
    } catch {
      // Une image illisible ne doit pas empêcher l'édition du contrat.
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.text("(signature enregistrée)", x, y, { align });
    }
  } else {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(13);
    doc.text(String(sig.data), x, y, { align });
  }

  if (sig.le) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(90);
    doc.text(`signé le ${formatDate(sig.le)}`, x, y + 5, { align });
    doc.setTextColor(0);
  }
}

function pied(doc, y, R, sigBailleur, sigLocataire, dateContrat) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(
    dateContrat
      ? `Fait à ${VILLE}, le ${formatDate(dateContrat)}`
      : `Fait à ${VILLE}, le ..…/..…/…..….`,
    R, y, { align: "right" },
  );
  y += 14;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("LE PROPRIÉTAIRE", MG, y);
  doc.text("LE LOCATAIRE", R, y, { align: "right" });

  y += 20;
  apposer(doc, sigBailleur, MG, y, "left");
  apposer(doc, sigLocataire, R, y, "right");
}

/** Hauteur réservée au pied : intitulés, signatures et date. */
const HAUTEUR_PIED = 46;

/**
 * @param contrat   { nomLegal, cin, chambre, etage, loyer,
 *                    sigBailleur:{type,data,le}, sigLocataire:{type,data,le},
 *                    dateContrat }
 * @param qrDataUrl QR de vérification, facultatif.
 */
export function construireBailIndividuel(contrat, qrDataUrl) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const R = doc.internal.pageSize.getWidth() - MG;
  let y = enTete(doc);
  dessinerQr(doc, R, qrDataUrl);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.text("Entre les soussignés", MG, y);
  y += 6;

  autoTable(doc, {
    startY: y,
    theme: "grid",
    margin: { left: MG, right: MG },
    styles: { fontSize: 10, textColor: 0, lineColor: 0, lineWidth: 0.2, cellPadding: 1.4 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 28 } },
    body: [
      ["Nom :", contrat.bailleurNom || BAILLEUR.nom],
      ["Adresse :", BAILLEUR.adresse],
      ["CIN :", contrat.bailleurCin || BAILLEUR.cin],
    ],
  });
  y = doc.lastAutoTable.finalY + 5;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9.5);
  doc.text("Ci-après « LE PROPRIÉTAIRE », d'une part", R, y, { align: "right" });
  y += 10;

  autoTable(doc, {
    startY: y,
    theme: "grid",
    margin: { left: MG, right: MG },
    styles: { fontSize: 10, textColor: 0, lineColor: 0, lineWidth: 0.2, cellPadding: 1.4 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 28 } },
    body: [
      ["Nom :", contrat.nomLegal || ""],
      ["Adresse :", `Villa Kinya, chambre ${contrat.chambre}, Andrainjato, ${VILLE}`],
      ["CIN :", contrat.cin || ""],
    ],
  });
  y = doc.lastAutoTable.finalY + 5;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9.5);
  doc.text("Ci-après « LE LOCATAIRE », d'autre part", R, y, { align: "right" });
  y += 12;

  const articles = [
    ["Article 1", article1(new Set([contrat.etage]))],
    ["Article 2", ARTICLE_2],
    ["Article 3", ARTICLE_3],
    ["Article 4", ARTICLE_4],
    ["Article 5", ARTICLE_5],
    ["Article 6", ARTICLE_6],
  ];

  y = assurerPlace(doc, y, 7);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.text("Il a été arrêté et convenu ce qui suit :", MG, y);
  y += 7;
  doc.setFontSize(10);
  for (const [titre, texte] of articles) {
    y = ecrireArticle(doc, y, titre, texte, R);
  }

  y += 6;
  y = assurerPlace(doc, y, HAUTEUR_PIED);
  if (y === 20) dessinerQr(doc, R, qrDataUrl);
  pied(doc, y, R, contrat.sigBailleur, contrat.sigLocataire, contrat.dateContrat);

  const nomFichier = `Contrat_de_bail_${String(contrat.nomLegal || "locataire")
    .replace(/\s+/g, "_")}.pdf`;
  return { doc, filename: nomFichier };
}

/** Remet une fiche serveur au format attendu par le constructeur. */
export function depuisContratServeur(c) {
  return {
    nomLegal: c.nomLegal,
    cin: c.cin,
    chambre: c.chambre,
    etage: c.etage,
    loyer: c.loyer,
    bailleurNom: c.bailleurNom,
    bailleurCin: c.bailleurCin,
    sigLocataire: c.sigLocataireLe
      ? { type: c.sigLocataireType, data: c.sigLocataireData, le: c.sigLocataireLe }
      : null,
    sigBailleur: c.sigBailleurLe
      ? { type: c.sigBailleurType, data: c.sigBailleurData, le: c.sigBailleurLe }
      : null,
    dateContrat:
      c.sigLocataireLe && c.sigBailleurLe
        ? (new Date(c.sigLocataireLe) > new Date(c.sigBailleurLe)
            ? c.sigLocataireLe
            : c.sigBailleurLe)
        : null,
  };
}
