import { useState, useEffect, useCallback } from "react";
import axios from "../../contexts/api/axios";
import GetUserData from "../../contexts/api/udata";
import {
  BsBoxArrowInRight, BsFileEarmarkText, BsPeopleFill, BsInfoCircle,
  BsChevronLeft, BsChevronRight, BsPhone, BsLaptop,
} from "react-icons/bs";
import { formatDateHeure } from "../../config/dates";

/**
 * Journal des connexions et des pages consultées.
 *
 * Rien n'était tracé avant la mise en service de cet écran : l'historique
 * commence à cette date, il n'existe nulle part ailleurs.
 *
 * La pagination est faite par le serveur et les totaux sont agrégés en base.
 * C'est délibéré : cette table grossit à chaque changement de page, et tout
 * ramener au navigateur pour le compter ici rendrait l'écran de plus en plus
 * lent à mesure qu'on s'en sert.
 */

const ROLES = { 0: "Utilisateur", 1: "Admin", 2: "Locataire" };

const IconeAppareil = ({ appareil }) =>
  ["Android", "iOS"].includes(appareil) ? (
    <BsPhone size={12} />
  ) : (
    <BsLaptop size={12} />
  );

export default function Visites() {
  const u_info = GetUserData();
  const [type, setType] = useState("TOUS"); // TOUS | CONNEXION | PAGE
  const [parPage, setParPage] = useState(15);
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const charger = useCallback(() => {
    setLoading(true);
    const q = new URLSearchParams({
      limite: String(parPage),
      decalage: String((page - 1) * parPage),
      jours: "30",
    });
    if (type !== "TOUS") q.set("type", type);
    axios
      .get(`visite?${q.toString()}`, u_info.opts)
      .then((r) => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, parPage, page]);

  useEffect(() => {
    charger();
  }, [charger]);

  // Changer de filtre ramène en première page, sinon on atterrit sur un vide.
  useEffect(() => {
    setPage(1);
  }, [type, parPage]);

  const lignes = data?.lignes || [];
  const total = data?.total || 0;
  const nbPages = Math.max(1, Math.ceil(total / parPage));
  const resume = data?.resume || [];
  const pagesVues = data?.pages || [];

  const nbConnexions = resume.reduce((s, r) => s + Number(r.connexions || 0), 0);
  const nbPagesVues = resume.reduce((s, r) => s + Number(r.pages || 0), 0);

  const CARTES = [
    { cle: "CONNEXION", label: "Connexions", valeur: nbConnexions, Icon: BsBoxArrowInRight, couleur: "#2563eb" },
    { cle: "PAGE", label: "Pages consultées", valeur: nbPagesVues, Icon: BsFileEarmarkText, couleur: "#0891b2" },
    { cle: "TOUS", label: "Comptes actifs", valeur: resume.length, Icon: BsPeopleFill, couleur: "#7c3aed" },
  ];

  return (
    <>
      {/* Cartes-filtres, même principe que les autres vues de la page */}
      <div className="row g-2 mb-3">
        {CARTES.map(({ cle, label, valeur, Icon, couleur }) => {
          const actif = type === cle;
          const cliquable = cle !== "TOUS" || type !== "TOUS";
          return (
            <div className="col-6 col-lg-4" key={label}>
              <button
                className="w-100 text-start p-3 rounded-3"
                onClick={() => cliquable && setType(actif ? "TOUS" : cle)}
                style={{
                  background: actif ? "#eff6ff" : "#fff",
                  border: `1px solid ${actif ? "#bfdbfe" : "#e2e8f0"}`,
                  cursor: cliquable ? "pointer" : "default",
                }}
              >
                <div className="d-flex align-items-center gap-2 mb-1" style={{ color: couleur }}>
                  <Icon size={14} />
                  <span style={{ fontSize: "0.74rem", fontWeight: 600 }}>{label}</span>
                </div>
                <div className="fw-bold" style={{ fontSize: "1.15rem" }}>{valeur}</div>
                <small className="text-muted" style={{ fontSize: "0.68rem" }}>
                  30 derniers jours
                </small>
              </button>
            </div>
          );
        })}
      </div>

      {/* Le journal ne remonte pas plus loin que sa mise en service : mieux
          vaut le dire que laisser croire à un historique complet. */}
      <div
        className="d-flex gap-2 align-items-start p-2 rounded-3 mb-3"
        style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}
      >
        <BsInfoCircle size={14} style={{ color: "#94a3b8", flex: "0 0 auto", marginTop: 2 }} />
        <small className="text-muted" style={{ fontSize: "0.76rem", lineHeight: 1.4 }}>
          Le suivi démarre à la mise en service de cet écran : les connexions
          antérieures n'ont jamais été enregistrées et ne peuvent pas être
          reconstituées. Les entrées sont conservées{" "}
          {data?.retentionJours || 120} jours.
        </small>
      </div>

      <div className="row g-3">
        {/* Journal détaillé */}
        <div className="col-12 col-xl-8">
          <div className="table-pro">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 px-3 py-3 border-bottom">
              <h6 className="fw-bold mb-0 d-flex align-items-center gap-2">
                <BsBoxArrowInRight style={{ color: "#2563eb" }} />
                {type === "CONNEXION"
                  ? "Connexions"
                  : type === "PAGE"
                    ? "Pages consultées"
                    : "Journal complet"}
              </h6>
              <div className="d-flex align-items-center gap-2">
                <span className="text-muted" style={{ fontSize: "0.78rem" }}>
                  {total} entrée{total > 1 ? "s" : ""}
                </span>
                <select
                  className="form-select form-select-sm"
                  style={{ width: "auto" }}
                  value={parPage}
                  onChange={(e) => setParPage(Number(e.target.value))}
                >
                  {[15, 30, 50, 100].map((n) => (
                    <option key={n} value={n}>{n} / page</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>Quand</th>
                    <th>Qui</th>
                    <th>Action</th>
                    <th>Appareil</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="text-center text-muted py-4" style={{ fontSize: "0.85rem" }}>
                        Chargement…
                      </td>
                    </tr>
                  ) : lignes.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center text-muted py-4" style={{ fontSize: "0.85rem" }}>
                        Aucune entrée pour l'instant — le journal se remplira à
                        la prochaine connexion.
                      </td>
                    </tr>
                  ) : (
                    lignes.map((v) => (
                      <tr key={v.id}>
                        <td style={{ whiteSpace: "nowrap", fontSize: "0.82rem" }}>
                          {formatDateHeure(v.dateAction)}
                        </td>
                        <td style={{ fontSize: "0.85rem" }}>
                          <span className="fw-semibold">{v.nom || "—"}</span>
                          <small className="d-block text-muted" style={{ fontSize: "0.7rem" }}>
                            {ROLES[v.karazana] || "—"}
                          </small>
                        </td>
                        <td>
                          {v.type === "CONNEXION" ? (
                            <span className="badge-paye" style={{ fontSize: "0.7rem" }}>
                              Connexion
                            </span>
                          ) : (
                            <>
                              <span style={{ fontSize: "0.82rem" }}>{v.titre || v.chemin}</span>
                              {v.titre && v.titre !== v.chemin && (
                                <small className="d-block text-muted" style={{ fontSize: "0.68rem" }}>
                                  {v.chemin}
                                </small>
                              )}
                            </>
                          )}
                        </td>
                        <td className="text-muted" style={{ fontSize: "0.78rem", whiteSpace: "nowrap" }}>
                          <IconeAppareil appareil={v.appareil} />{" "}
                          {v.appareil || "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {nbPages > 1 && (
              <div className="d-flex justify-content-between align-items-center px-3 py-2 border-top flex-wrap gap-2">
                <small className="text-muted" style={{ fontSize: "0.76rem" }}>
                  Page {page} sur {nbPages}
                </small>
                <div className="d-flex gap-1">
                  <button
                    className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    <BsChevronLeft size={11} /> Précédent
                  </button>
                  <button
                    className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1"
                    onClick={() => setPage((p) => Math.min(nbPages, p + 1))}
                    disabled={page >= nbPages}
                  >
                    Suivant <BsChevronRight size={11} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Repères : qui vient, et où */}
        <div className="col-12 col-xl-4">
          <div className="card-pro mb-3">
            <h6 className="fw-bold mb-1">Dernière venue</h6>
            <p className="text-muted mb-3" style={{ fontSize: "0.76rem" }}>
              Par compte, sur 30 jours
            </p>
            {resume.length === 0 ? (
              <p className="text-muted text-center py-3 mb-0" style={{ fontSize: "0.82rem" }}>
                Aucune activité enregistrée
              </p>
            ) : (
              <ul className="list-unstyled mb-0">
                {resume.map((r) => (
                  <li
                    key={`${r.utilisateurId}-${r.nom}`}
                    className="d-flex justify-content-between align-items-start gap-2 py-2"
                    style={{ borderBottom: "1px solid #f1f5f9" }}
                  >
                    <div>
                      <div className="fw-semibold" style={{ fontSize: "0.84rem" }}>
                        {r.nom || "—"}
                      </div>
                      <small className="text-muted" style={{ fontSize: "0.7rem" }}>
                        {r.connexions} connexion{r.connexions > 1 ? "s" : ""} ·{" "}
                        {r.pages} page{r.pages > 1 ? "s" : ""}
                      </small>
                    </div>
                    <small className="text-muted text-end" style={{ fontSize: "0.72rem", whiteSpace: "nowrap" }}>
                      {formatDateHeure(r.derniere)}
                    </small>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card-pro">
            <h6 className="fw-bold mb-1">Pages les plus consultées</h6>
            <p className="text-muted mb-3" style={{ fontSize: "0.76rem" }}>
              Sur 30 jours
            </p>
            {pagesVues.length === 0 ? (
              <p className="text-muted text-center py-3 mb-0" style={{ fontSize: "0.82rem" }}>
                Rien à afficher pour l'instant
              </p>
            ) : (
              <ul className="list-unstyled mb-0">
                {pagesVues.map((p) => {
                  const max = Number(pagesVues[0].vues) || 1;
                  const part = (Number(p.vues) / max) * 100;
                  return (
                    <li key={p.chemin} className="py-2">
                      <div className="d-flex justify-content-between align-items-center gap-2 mb-1">
                        <span style={{ fontSize: "0.82rem" }}>{p.titre || p.chemin}</span>
                        <strong style={{ fontSize: "0.8rem" }}>{p.vues}</strong>
                      </div>
                      {/* Barre proportionnelle : le classement se lit d'un
                          coup d'œil, sans comparer des nombres. */}
                      <div style={{ height: 5, borderRadius: 99, background: "#eef2f7" }}>
                        <div
                          style={{
                            width: `${Math.max(part, 3)}%`,
                            height: "100%",
                            borderRadius: 99,
                            background: "linear-gradient(90deg,#38bdf8,#0891b2)",
                          }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
