import { useState, useMemo } from "react";
import axios from "../../contexts/api/axios";
import GetUserData from "../../contexts/api/udata";
import Template from "../../components/template/template";
import Header from "../../components/header/header";
import Sidebar from "../../components/sidebar/sidebar";
import { toast } from "react-toastify";
import { useEffect } from "react";
import {
  BsFileEarmarkText,
  BsPerson,
  BsPeopleFill,
  BsFileEarmarkPdf,
  BsCheckSquare,
  BsSquare,
  BsExclamationTriangle, 
  BsShare,
} from "react-icons/bs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ApartSelect, {
  useAppartements,
  getSelectedBienId,
  setSelectedBienId,
  KINYA,
} from "../../components/appart/apart.select";
import {
  BAILLEUR,
  VILLE,
  SOUS_TITRE,
  LOYER,
  article1,
  ARTICLE_2,
  ARTICLE_3,
  nomLegalDe,
  cinDe,
} from "../../config/bail";
import { genererQrVerification } from "../../config/verification";
import { SkListeLignes } from "../../components/skeleton/skeleton";
import "./loyer.css";
import "./bail.css";

/**
 * Contrat de bail — génération PDF.
 *
 * Deux formats, à la demande :
 *
 *  · Individuel — le modèle à deux parties classique (propriétaire /
 *    locataire), pour un seul occupant.
 *  · Groupe — un contrat unique listant les locataires sélectionnés dans un
 *    tableau par étage, celui que le bailleur signe pour toute la résidence
 *    (ou une sélection personnalisée).
 *
 * Le texte reprend celui du contrat déjà validé pour la résidence : mêmes
 * trois articles, même mise en page. Rien n'est envoyé au serveur — tout se
 * construit dans le navigateur, comme les autres PDF de l'application.
 */

const RDC = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
const PREMIER = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
const ordreChambre = (c, etage) => (etage === "RDC" ? RDC : PREMIER).indexOf(c);

export default function ContratBail() {
  const u_info = GetUserData();
  const [bienId, setBienId] = useState(getSelectedBienId());
  const apparts = useAppartements(bienId, setBienId);
  const current = apparts.find((a) => a.id === bienId) || KINYA;

  const [locataires, setLocataires] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState("GROUPE"); // GROUPE | INDIVIDUEL
  const [selection, setSelection] = useState(() => new Set());
  const [individuelId, setIndividuelId] = useState(null);

  useEffect(() => {
    setLoading(true);
    axios
      .get(`loyer/locataires?bienId=${bienId}`, u_info.opts)
      .then((r) => {
        const actifs = (r.data || []).filter((l) => l.actif);
        setLocataires(actifs);
        setSelection(new Set(actifs.map((l) => l.id)));
        setIndividuelId(actifs[0]?.id ?? null);
      })
      .catch(() => setLocataires([]))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bienId]);

  function changeAppart(id) {
    setBienId(id);
    setSelectedBienId(id);
  }

  const parEtage = useMemo(() => {
    const tri = (etage) =>
      locataires
        .filter((l) => l.etage === etage)
        .sort(
          (a, b) =>
            ordreChambre(a.chambre, etage) - ordreChambre(b.chambre, etage),
        );
    return { RDC: tri("RDC"), "1ER": tri("1ER") };
  }, [locataires]);

  const nbSansCin = locataires.filter(
    (l) => selection.has(l.id) && !cinDe(l),
  ).length;

  function basculer(id) {
    setSelection((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }
  function toutEtage(etage, actif) {
    setSelection((s) => {
      const n = new Set(s);
      parEtage[etage].forEach((l) => (actif ? n.add(l.id) : n.delete(l.id)));
      return n;
    });
  }

  // ── Mise en page commune ───────────────────────────────────────────────
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

  // QR de vérification, coin haut-droit — ne bloque jamais la génération du
  // contrat si le serveur est indisponible (repli silencieux, pas de QR).
  // Séparé en deux : la génération interroge le serveur une seule fois,
  // dessinerQr peut ensuite le reposer sur une page suivante sans reissue.
  function dessinerQr(doc, R, dataUrl) {
    if (!dataUrl) return;
    const taille = 22;
    doc.addImage(dataUrl, "PNG", R - taille, 8, taille, taille);
  }

  async function ajouterQr(doc, R, params) {
    const { dataUrl } = await genererQrVerification(u_info.opts, params);
    dessinerQr(doc, R, dataUrl);
    return dataUrl;
  }

  function tableauBailleur(doc, y, aere = false) {
    autoTable(doc, {
      startY: y,
      theme: "grid",
      margin: { left: 15, right: 15 },
      styles: {
        fontSize: 10,
        textColor: 0,
        lineColor: 0,
        lineWidth: 0.2,
        cellPadding: aere ? 2.2 : 1.4,
      },
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 28 } },
      body: [
        ["Nom :", BAILLEUR.nom],
        ["Adresse :", BAILLEUR.adresse],
        ["CIN :", BAILLEUR.cin],
      ],
    });
    return doc.lastAutoTable.finalY + (aere ? 9 : 5);
  }

  // jsPDF n'ajoute jamais de page tout seul : un texte écrit trop bas dans
  // la page finit hors de la feuille — invisible, pas juste mal placé.
  // Toute écriture de bloc doit donc passer par ici avant de dessiner.
  function assurerPlace(doc, y, besoin) {
    if (y + besoin > 288) {
      doc.addPage();
      return 20;
    }
    return y;
  }

  // Un article : titre en gras suivi du texte, avec retour à la ligne géré
  // à la main — jsPDF ne le fait pas tout seul.
  function ecrireArticle(doc, y, titre, texte, mg, R) {
    doc.setFont("helvetica", "bold");
    const largeurTitre = doc.getTextWidth(titre + " : ");
    doc.setFont("helvetica", "normal");
    const lignes = doc.splitTextToSize(texte, R - mg - largeurTitre);
    y = assurerPlace(doc, y, lignes.length * 5 + 3);

    doc.setFont("helvetica", "bold");
    doc.text(titre + " : ", mg, y);
    doc.setFont("helvetica", "normal");
    doc.text(lignes[0], mg + largeurTitre, y);
    lignes.slice(1).forEach((l, i) => doc.text(l, mg, y + (i + 1) * 5));
    return y + lignes.length * 5 + 3;
  }

  // Hauteur réellement occupée par le pied — sert à décider s'il tient sur
  // la page en cours plutôt que de le renvoyer systématiquement seul sur
  // une nouvelle page dès qu'un seuil arbitraire était dépassé.
  const HAUTEUR_PIED = { AVEC_LOCATAIRE: 38, SEUL: 42 };

  // aere : mise en page plus respirée, pour la page dédiée des grandes
  // sélections (voir construireGroupe) — largement la place d'y aller.
  function pied(doc, y, mg, R, avecLocataire, aere = false) {
    const centreX = (mg + R) / 2;
    const gFait = aere ? 22 : 14;
    const gSignature = avecLocataire ? (aere ? 22 : 16) : aere ? 18 : 14;
    const gNote = aere ? 12 : 7;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Fait à ${VILLE}, le ..…/..…/…..….`, R, y, { align: "right" });
    y += gFait;
    if (avecLocataire) {
      doc.setFont("helvetica", "bold");
      doc.text("LE PROPRIÉTAIRE", mg, y);
      doc.text("LE LOCATAIRE", R, y, { align: "right" });
      y += gSignature;
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8.5);
      doc.text("(signature)", mg, y);
      doc.text("(signature)", R, y, { align: "right" });
    } else {
      doc.setFont("helvetica", "bold");
      doc.text("LE PROPRIÉTAIRE", R, y, { align: "right" });
      y += gSignature;
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8.5);
      doc.text("(signature)", R, y, { align: "right" });
      y += gNote;
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      const note = doc.splitTextToSize(
        "La signature de chaque locataire figure dans la colonne « Signature » du tableau correspondant à sa chambre.",
        R - mg,
      );
      doc.text(note, centreX, y, { align: "center" });
    }
  }

  // Ne saute une page que si le pied n'entre vraiment plus, au lieu d'un
  // seuil fixe qui l'isolait seul sur une page 2 même quand il restait de
  // la place.
  function placerPied(doc, y, mg, R, avecLocataire) {
    const besoin = avecLocataire ? HAUTEUR_PIED.AVEC_LOCATAIRE : HAUTEUR_PIED.SEUL;
    y = assurerPlace(doc, y, besoin);
    pied(doc, y, mg, R, avecLocataire);
  }

  // ── Format groupe ────────────────────────────────────────────────────
  async function construireGroupe(choisis) {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const mg = 15;
    const R = doc.internal.pageSize.getWidth() - mg;
    let y = enTete(doc);
    // Au-delà de 10 locataires, les articles et le pied partent sur leur
    // propre page (plus bas) : la première n'a donc plus qu'à porter les
    // deux tableaux, avec de la place pour respirer davantage.
    const grande = choisis.length > 10;

    const qrDataUrl = await ajouterQr(doc, R, {
      type: "BAIL",
      bienId: current.id,
      titre: `Contrat de bail groupe — ${choisis.length} locataire${choisis.length > 1 ? "s" : ""} — ${current.nom}`,
      details: {
        bailleur: BAILLEUR.nom,
        locataires: choisis.map((l) => ({
          chambre: l.chambre,
          nom: nomLegalDe(l),
        })),
      },
    });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.text("Entre les soussignés", mg, y);
    y += grande ? 10 : 6;

    y = tableauBailleur(doc, y, grande);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9.5);
    doc.text("Ci-après « LE PROPRIÉTAIRE », d'une part", R, y, {
      align: "right",
    });
    y += grande ? 14 : 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const intro = doc.splitTextToSize(
      "Et, d'autre part, les locataires de la résidence désignés ci-après, " +
        "chacun pour la chambre qu'il occupe (répartis par étage), ci-après " +
        "« LE LOCATAIRE » :",
      R - mg,
    );
    doc.text(intro, mg, y);
    y += intro.length * 5 + (grande ? 12 : 6);

    const etagesPresents = new Set(choisis.map((l) => l.etage));

    const tableauEtage = (etage, titre) => {
      const lignes = choisis.filter((l) => l.etage === etage);
      if (!lignes.length) return;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.text(
        `${titre} — loyer mensuel : ${LOYER[etage].toLocaleString()} Ar`,
        mg,
        y,
      );
      y += grande ? 6 : 3;
      autoTable(doc, {
        startY: y,
        margin: { left: mg, right: mg },
        theme: "grid",
        styles: {
          fontSize: 9.5,
          textColor: 0,
          lineColor: 0,
          lineWidth: 0.2,
          cellPadding: grande ? 2 : 1.2,
        },
        headStyles: {
          fontStyle: "bold",
          fillColor: [255, 255, 255],
          textColor: 0,
          lineColor: 0,
        },
        head: [["Chambre", "Nom complet", "CIN", "Signature"]],
        body: lignes
          .sort(
            (a, b) =>
              ordreChambre(a.chambre, etage) - ordreChambre(b.chambre, etage),
          )
          .map((l) => [
            l.chambre,
            nomLegalDe(l),
            cinDe(l) || "",
            "",
          ]),
        columnStyles: {
          0: { cellWidth: 20 },
          2: { cellWidth: 34 },
          3: { cellWidth: 32 },
        },
      });
      y = doc.lastAutoTable.finalY + (grande ? 12 : 6);
    };
    tableauEtage("RDC", "REZ-DE-CHAUSSÉE");
    tableauEtage("1ER", "1ER ÉTAGE");

    if (grande) {
      // Grande résidence : les deux tableaux remplissent déjà la première
      // page. Plutôt que de tasser la suite en bas ou risquer un pied de
      // page isolé, elle prend sa propre page, largement respirée — la
      // place ne manque pas une fois les tableaux partis.
      doc.addPage();
      dessinerQr(doc, R, qrDataUrl);
      y = 45;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.text("Il a été arrêté et convenu ce qui suit :", mg, y);
      y += 14;
      doc.setFontSize(10);
      y = ecrireArticle(doc, y, "Article 1", article1(etagesPresents), mg, R);
      y += 8;
      y = ecrireArticle(doc, y, "Article 2", ARTICLE_2, mg, R);
      y += 8;
      y = ecrireArticle(doc, y, "Article 3", ARTICLE_3, mg, R);
      y += 18;
      pied(doc, y, mg, R, false, true);
    } else {
      y = assurerPlace(doc, y, 7);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.text("Il a été arrêté et convenu ce qui suit :", mg, y);
      y += 7;
      doc.setFontSize(10);
      y = ecrireArticle(doc, y, "Article 1", article1(etagesPresents), mg, R);
      y = ecrireArticle(doc, y, "Article 2", ARTICLE_2, mg, R);
      y = ecrireArticle(doc, y, "Article 3", ARTICLE_3, mg, R);

      placerPied(doc, y, mg, R, false);
    }

    return {
      doc,
      filename: `Contrat_de_bail_${current.nom.replace(/\s+/g, "_")}.pdf`,
    };
  }

  async function handleGenererGroupe() {
    const choisis = locataires.filter((l) => selection.has(l.id));
    if (!choisis.length)
      return toast.warning("Sélectionnez au moins un locataire");
    const { doc, filename } = await construireGroupe(choisis);
    doc.save(filename);
    toast.success(
      `Contrat généré — ${choisis.length} locataire${choisis.length > 1 ? "s" : ""}`,
    );
  }

  // ── Format individuel ────────────────────────────────────────────────
  async function construireIndividuel(loc) {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const mg = 15;
    const R = doc.internal.pageSize.getWidth() - mg;
    let y = enTete(doc);

    await ajouterQr(doc, R, {
      type: "BAIL",
      bienId: current.id,
      titre: `Contrat de bail — ${nomLegalDe(loc)} — chambre ${loc.chambre} — ${current.nom}`,
      details: {
        bailleur: BAILLEUR.nom,
        locataire: nomLegalDe(loc),
        chambre: loc.chambre,
        cin: cinDe(loc) || undefined,
      },
    });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.text("Entre les soussignés", mg, y);
    y += 6;

    y = tableauBailleur(doc, y);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9.5);
    doc.text("Ci-après « LE PROPRIÉTAIRE », d'une part", R, y, {
      align: "right",
    });
    y += 10;

    autoTable(doc, {
      startY: y,
      theme: "grid",
      margin: { left: 15, right: 15 },
      styles: { fontSize: 10, textColor: 0, lineColor: 0, lineWidth: 0.2 },
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 28 } },
      body: [
        ["Nom :", nomLegalDe(loc)],
        [
          "Adresse :",
          `Villa Kinya, chambre ${loc.chambre} — Andrainjato, ${VILLE}`,
        ],
        ["CIN :", cinDe(loc) || ""],
      ],
    });
    y = doc.lastAutoTable.finalY + 6;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9.5);
    doc.text("Ci-après « LE LOCATAIRE », d'autre part", R, y, {
      align: "right",
    });
    y += 12;

    y = assurerPlace(doc, y, 7);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.text("Il a été arrêté et convenu ce qui suit :", mg, y);
    y += 7;
    doc.setFontSize(10);
    y = ecrireArticle(
      doc,
      y,
      "Article 1",
      article1(new Set([loc.etage])),
      mg,
      R,
    );
    y = ecrireArticle(doc, y, "Article 2", ARTICLE_2, mg, R);
    y = ecrireArticle(doc, y, "Article 3", ARTICLE_3, mg, R);

    y += 6;
    placerPied(doc, y, mg, R, true);

    const nomFichier = nomLegalDe(loc).replace(/\s+/g, "_");
    return { doc, filename: `Contrat_de_bail_${nomFichier}.pdf` };
  }

  async function handleGenererIndividuel(loc) {
    if (!loc) return toast.warning("Choisissez un locataire");
    const { doc, filename } = await construireIndividuel(loc);
    doc.save(filename);
    toast.success(`Contrat généré — ${loc.nom}`);
  }

  const messageBail = (loc) =>
    `Bonjour ${loc.nom},\n` +
    `Voici votre contrat de bail Villa Kinya pour la chambre ${loc.chambre}.\n` +
    `Merci de le lire, le signer et de nous le retourner.\n— ${BAILLEUR.nom}`;

  /**
   * Envoi réel du contrat au locataire — pas juste un lien WhatsApp vide.
   *
   * Sur mobile, la feuille de partage du système reçoit le PDF en pièce
   * jointe : WhatsApp/Messenger l'envoient tel quel dans la conversation.
   * Sur ordinateur, aucune API web ne permet d'attacher un fichier à
   * WhatsApp Web : le contrat est donc téléchargé et la conversation
   * s'ouvre avec le message prêt, la pièce jointe restant à glisser.
   */
  async function handleEnvoyerIndividuel(loc) {
    if (!loc) return toast.warning("Choisissez un locataire");
    let doc, filename;
    try {
      ({ doc, filename } = await construireIndividuel(loc));
    } catch {
      return toast.error("Erreur génération PDF");
    }

    const message = messageBail(loc);
    const fichier = new File([doc.output("blob")], filename, {
      type: "application/pdf",
    });

    if (navigator.canShare?.({ files: [fichier] })) {
      try {
        await navigator.share({
          files: [fichier],
          title: filename,
          text: message,
        });
        return toast.success(`Contrat envoyé — ${loc.nom}`);
      } catch (err) {
        if (err?.name === "AbortError") return; // partage annulé, rien à signaler
      }
    }

    doc.save(filename);
    const tel = (loc.tel || "").replace(/\s+/g, "").replace(/^\+/, "");
    if (tel) {
      window.open(
        `https://wa.me/${tel}?text=${encodeURIComponent(message)}`,
        "whatsapp",
      );
      toast.info(
        "PDF téléchargé — joignez-le dans la conversation WhatsApp ouverte.",
      );
    } else {
      toast.info(
        "PDF téléchargé — aucun téléphone enregistré pour l'envoyer automatiquement.",
      );
    }
  }

  const nbSelectionnes = selection.size;

  return (
    <Template>
      <Header />
      <div className="container-fluid flex-grow-1">
        <div className="row g-0">
          <Sidebar />
          <main className="col-md-9 ms-sm-auto col-lg-10 px-md-4 main">
            <div className="page-header">
              <div>
                <h1 className="page-title">
                  <BsFileEarmarkText /> Contrat de bail
                </h1>
                <p className="text-muted small mb-0">
                  {current.nom} · génération PDF, individuelle ou groupée
                </p>
              </div>
              <ApartSelect
                list={apparts}
                value={bienId}
                onChange={changeAppart}
              />
            </div>

            <div className="bail-onglets mb-3">
              <button
                className={mode === "GROUPE" ? "actif" : ""}
                onClick={() => setMode("GROUPE")}
              >
                <BsPeopleFill /> Groupe
              </button>
              <button
                className={mode === "INDIVIDUEL" ? "actif" : ""}
                onClick={() => setMode("INDIVIDUEL")}
              >
                <BsPerson /> Individuel
              </button>
            </div>

            {loading ? (
              <div className="card-pro">
                <SkListeLignes lignes={6} />
              </div>
            ) : locataires.length === 0 ? (
              <div className="card-pro text-center py-5 text-muted">
                Aucun locataire actif pour ce bien.
              </div>
            ) : mode === "INDIVIDUEL" ? (
              <div className="card-pro">
                <h6 className="fw-bold mb-3">Choisir le locataire</h6>
                <div className="row g-3 align-items-end">
                  <div className="col-sm-6">
                    <select
                      className="form-select"
                      value={individuelId ?? ""}
                      onChange={(e) => setIndividuelId(Number(e.target.value))}
                    >
                      {["RDC", "1ER"].map((etage) =>
                        parEtage[etage].length ? (
                          <optgroup
                            key={etage}
                            label={
                              etage === "RDC" ? "Rez-de-chaussée" : "1er étage"
                            }
                          >
                            {parEtage[etage].map((l) => (
                              <option key={l.id} value={l.id}>
                                {l.chambre} — {l.nom} {l.prenom}
                                {!cinDe(l) ? " (CIN à compléter)" : ""}
                              </option>
                            ))}
                          </optgroup>
                        ) : null,
                      )}
                    </select>
                  </div>
                  <div className="col-sm-3">
                    <button
                      className="btn btn-outline-secondary w-100 d-inline-flex align-items-center justify-content-center gap-2"
                      onClick={() =>
                        handleEnvoyerIndividuel(
                          locataires.find((l) => l.id === individuelId),
                        )
                      }
                    >
                      <BsShare /> Partager
                    </button>
                  </div>
                  <div className="col-sm-3">
                    <button
                      className="btn btn-outline-danger w-100 d-inline-flex align-items-center justify-content-center gap-2"
                      onClick={() =>
                        handleGenererIndividuel(
                          locataires.find((l) => l.id === individuelId),
                        )
                      }
                    >
                      <BsFileEarmarkPdf /> Télécharger
                    </button>
                  </div>
                </div>
                {individuelId &&
                  !cinDe(locataires.find((l) => l.id === individuelId)) && (
                    <div className="bail-alerte mt-3">
                      <BsExclamationTriangle size={14} />
                      <span>
                        Le CIN de ce locataire n'est pas encore renseigné : la
                        case restera vide sur le contrat. Complétez sa fiche
                        depuis Locataires pour l'inclure.
                      </span>
                    </div>
                  )}
              </div>
            ) : (
              <>
                <div className="card-pro mb-3">
                  <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-1">
                    <h6 className="fw-bold mb-0">
                      {nbSelectionnes} locataire{nbSelectionnes > 1 ? "s" : ""}{" "}
                      sélectionné
                      {nbSelectionnes > 1 ? "s" : ""}
                    </h6>
                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() =>
                          setSelection(new Set(locataires.map((l) => l.id)))
                        }
                      >
                        Tout sélectionner
                      </button>
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => setSelection(new Set())}
                      >
                        Tout désélectionner
                      </button>
                      <button
                        className="btn btn-danger btn-sm d-inline-flex align-items-center gap-2"
                        onClick={handleGenererGroupe}
                        disabled={!nbSelectionnes}
                      >
                        <BsFileEarmarkPdf /> Générer le PDF
                      </button>
                    </div>
                  </div>
                  {nbSansCin > 0 && (
                    <div className="bail-alerte mt-2">
                      <BsExclamationTriangle size={14} />
                      <span>
                        {nbSansCin} locataire{nbSansCin > 1 ? "s" : ""}{" "}
                        sélectionné
                        {nbSansCin > 1 ? "s" : ""} sans CIN renseigné — la
                        case restera vide sur le contrat pour{" "}
                        {nbSansCin > 1 ? "eux" : "lui/elle"}.
                      </span>
                    </div>
                  )}
                </div>

                <div className="row g-3">
                  {["RDC", "1ER"].map((etage) =>
                    parEtage[etage].length ? (
                      <div className="col-12 col-lg-6" key={etage}>
                        <div className="card-pro p-0 bail-section">
                          <div className="bail-section-tete">
                            <span>
                              {etage === "RDC"
                                ? "Rez-de-chaussée"
                                : "1er étage"}{" "}
                              — {LOYER[etage].toLocaleString()} Ar
                            </span>
                            <div className="d-flex gap-1">
                              <button onClick={() => toutEtage(etage, true)}>
                                Tout
                              </button>
                              <button onClick={() => toutEtage(etage, false)}>
                                Aucun
                              </button>
                            </div>
                          </div>
                          <ul className="bail-liste">
                            {parEtage[etage].map((l) => {
                              const coche = selection.has(l.id);
                              return (
                                <li key={l.id} className="bail-item-ligne">
                                  <button
                                    className="bail-item"
                                    onClick={() => basculer(l.id)}
                                    aria-pressed={coche}
                                  >
                                    {coche ? <BsCheckSquare /> : <BsSquare />}
                                    <span
                                      className={
                                        etage === "RDC"
                                          ? "badge-rdc"
                                          : "badge-1er"
                                      }
                                    >
                                      {l.chambre}
                                    </span>
                                    <span className="bail-nom">
                                      {l.nom} {l.prenom}
                                    </span>
                                    {!cinDe(l) && (
                                      <em className="bail-manque">
                                        CIN manquant
                                      </em>
                                    )}
                                  </button>
                                  <button
                                    className="bail-envoyer"
                                    title={`Envoyer son contrat individuel à ${l.nom}`}
                                    onClick={() => handleEnvoyerIndividuel(l)}
                                  >
                                    <BsShare size={12} />
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      </div>
                    ) : null,
                  )}
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </Template>
  );
}
