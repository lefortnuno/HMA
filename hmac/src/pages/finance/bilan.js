import { useState, useEffect } from "react";
import axios from "../../contexts/api/axios";
import GetUserData from "../../contexts/api/udata";
import Template from "../../components/template/template";
import Header from "../../components/header/header";
import Sidebar from "../../components/sidebar/sidebar";
import { BsClipboardData, BsGraphUp, BsGraphDown, BsCashStack, BsTrophyFill, BsStarFill } from "react-icons/bs";
import { SkBenefices } from "../../components/skeleton/skeleton";
import "../loyer/loyer.css";
import "./finance.css";

const MOIS_LABELS = ["","Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
const ANNEES = [2023, 2024, 2025, 2026, 2027];

export default function FinanceBilan() {
  const u_info = GetUserData();
  const now    = new Date();
  const [mois,    setMois]    = useState(now.getMonth() + 1);
  const [annee,   setAnnee]   = useState(now.getFullYear());
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetch(); }, [mois, annee]);

  function fetch() {
    setLoading(true);
    axios.get(`finance/bilan?mois=${mois}&annee=${annee}&userId=${u_info.u_id}`, u_info.opts)
      .then(r  => setData(r.data || null))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }

  const tr  = data?.totalRevenus   || 0;
  const tc  = data?.totalCharges   || 0;
  const td  = data?.totalDepenses  || 0;
  const tca = data?.totalCasuel    || 0;
  const sol = data?.solde          || 0;

  return (
    <Template>
      <Header />
      <div className="container-fluid flex-grow-1">
        <div className="row g-0">
          <Sidebar />
          <main className="col-md-9 ms-sm-auto col-lg-10 px-md-4 main">

            <div className="page-header">
              <div>
                <h1 className="page-title"><BsClipboardData /> Bilan Mensuel</h1>
                <p className="text-muted small mb-0">Résultat — {MOIS_LABELS[mois]} {annee}</p>
              </div>
              <div className="d-flex gap-2">
                <select className="form-select form-select-sm" style={{ width: "auto" }} value={mois} onChange={e => setMois(+e.target.value)}>
                  {MOIS_LABELS.slice(1).map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
                </select>
                <select className="form-select form-select-sm" style={{ width: "auto" }} value={annee} onChange={e => setAnnee(+e.target.value)}>
                  {ANNEES.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            </div>

            {loading ? <SkBenefices /> : (
              <>
                {/* KPI cards */}
                <div className="row g-3 mb-4">
                  {[
                    { label: "Revenus",    val: tr,  icon: <BsGraphUp />,    color: "green"  },
                    { label: "Casuel",     val: tca, icon: <BsStarFill />,   color: "amber"  },
                    { label: "Charges",    val: tc,  icon: <BsGraphDown />,  color: "red"    },
                    { label: "Dépenses",   val: td,  icon: <BsCashStack />,  color: "red"    },
                    { label: "Solde net",  val: sol, icon: <BsTrophyFill />, color: sol >= 0 ? "blue" : "red" },
                  ].map(({ label, val, icon, color }) => (
                    <div className="col-sm-6 col-lg-3" key={label}>
                      <div className="stat-card">
                        <div className={`stat-icon ${color}`}>{icon}</div>
                        <div className="stat-content">
                          <h3 style={{ fontSize: "1.15rem" }}>{(val / 1000).toFixed(1)}k</h3>
                          <p>{label} (Ar)</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Revenus vs Charges */}
                <div className="bilan-section mb-4">
                  <div className="card-pro p-0">
                    <div className="p-3 border-bottom d-flex justify-content-between">
                      <h6 className="fw-bold mb-0 text-success"><BsGraphUp className="me-1" />Revenus</h6>
                      <span className="fw-bold text-success">{tr.toLocaleString()} Ar</span>
                    </div>
                    {!data?.revenus?.length ? (
                      <p className="text-muted text-center py-3" style={{ fontSize: "0.82rem" }}>Aucun revenu</p>
                    ) : (
                      <table className="table table-sm mb-0">
                        <tbody>
                          {data.revenus.map(r => (
                            <tr key={r.id}>
                              <td style={{ fontSize: "0.85rem" }}>
                                {r.nom}
                                {r.est_epargne ? <span className="finance-epargne-badge ms-2">Épargne</span> : null}
                              </td>
                              <td className="text-end fw-semibold text-success" style={{ fontSize: "0.85rem" }}>
                                {(+r.montant).toLocaleString()} Ar
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>

                  <div className="card-pro p-0">
                    <div className="p-3 border-bottom d-flex justify-content-between">
                      <h6 className="fw-bold mb-0 text-danger"><BsGraphDown className="me-1" />Charges Fixes</h6>
                      <span className="fw-bold text-danger">{tc.toLocaleString()} Ar</span>
                    </div>
                    {!data?.charges?.length ? (
                      <p className="text-muted text-center py-3" style={{ fontSize: "0.82rem" }}>Aucune charge</p>
                    ) : (
                      <table className="table table-sm mb-0">
                        <tbody>
                          {data.charges.map(c => (
                            <tr key={c.id}>
                              <td style={{ fontSize: "0.85rem" }}>{c.nom}</td>
                              <td className="text-end fw-semibold text-danger" style={{ fontSize: "0.85rem" }}>
                                {(+c.montant).toLocaleString()} Ar
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

                {/* Dépenses par semaine */}
                {data?.parSemaine?.length > 0 && (
                  <div className="card-pro p-0 mb-4">
                    <div className="p-3 border-bottom d-flex justify-content-between">
                      <h6 className="fw-bold mb-0"><BsCashStack className="me-1" />Dépenses variables — {MOIS_LABELS[mois]} {annee}</h6>
                      <span className="fw-bold text-danger">{td.toLocaleString()} Ar</span>
                    </div>
                    <table className="table table-sm mb-0">
                      <tbody>
                        {data.parSemaine.map(s => (
                          <tr key={s.semaine}>
                            <td style={{ fontSize: "0.85rem" }}>Semaine {s.semaine}</td>
                            <td style={{ fontSize: "0.8rem", color: "#94a3b8" }}>{s.nb} dépense{s.nb > 1 ? "s" : ""}</td>
                            <td className="text-end fw-semibold text-danger" style={{ fontSize: "0.85rem" }}>
                              {(+s.total).toLocaleString()} Ar
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Solde final */}
                <div className="card-pro" style={{ borderLeft: `4px solid ${sol >= 0 ? "#10b981" : "#ef4444"}` }}>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <p className="text-muted small mb-1">Revenus + Casuel − Charges − Dépenses</p>
                      <h4 className={`mb-0 fw-bold ${sol >= 0 ? "solde-positif" : "solde-negatif"}`}>
                        {sol >= 0 ? "+" : ""}{sol.toLocaleString()} Ar
                      </h4>
                    </div>
                    <div className={`stat-icon ${sol >= 0 ? "green" : "red"}`} style={{ width: 52, height: 52, fontSize: "1.4rem" }}>
                      <BsTrophyFill />
                    </div>
                  </div>
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </Template>
  );
}
