import { useState, useEffect } from "react";
import axios from "../../contexts/api/axios";
import GetUserData from "../../contexts/api/udata";
import Template from "../../components/template/template";
import Header from "../../components/header/header";
import Sidebar from "../../components/sidebar/sidebar";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  BsClipboardData,
  BsGraphUp,
  BsGraphDown,
  BsCashStack,
  BsTrophyFill,
  BsStarFill,
} from "react-icons/bs";
import { SkBenefices } from "../../components/skeleton/skeleton";
import "../loyer/loyer.css";
import "./finance.css";

const MOIS_LABELS = [
  "",
  "Jan",
  "Fév",
  "Mar",
  "Avr",
  "Mai",
  "Jun",
  "Jul",
  "Aoû",
  "Sep",
  "Oct",
  "Nov",
  "Déc",
];
const ANNEES = [2023, 2024, 2025, 2026, 2027];

function fmtK(v) {
  return v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v;
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: 8,
        padding: "10px 14px",
        fontSize: "0.8rem",
      }}
    >
      <p className="fw-semibold mb-1" style={{ color: "#475569" }}>
        {MOIS_LABELS[label]}
      </p>
      {payload.map((p) => (
        <p key={p.name} className="mb-0" style={{ color: p.color }}>
          {p.name === "revenus" ? "Revenus" : "Dépenses"} :{" "}
          {(+p.value).toLocaleString()} Ar
        </p>
      ))}
    </div>
  );
}

export default function FinanceBilan() {
  const u_info = GetUserData();
  const now = new Date();
  const [mois, setMois] = useState(now.getMonth() + 1);
  const [annee, setAnnee] = useState(now.getFullYear());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState([]);
  const [chartLoad, setChartLoad] = useState(true);

  useEffect(() => {
    fetchBilan();
  }, [mois, annee]);
  useEffect(() => {
    fetchChart();
  }, [annee]);

  function fetchBilan() {
    setLoading(true);
    axios
      .get(
        `finance/bilan?mois=${mois}&annee=${annee}&userId=${u_info.u_id}`,
        u_info.opts,
      )
      .then((r) => setData(r.data || null))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }

  function fetchChart() {
    setChartLoad(true);
    axios
      .get(`finance/annuel?annee=${annee}&userId=${u_info.u_id}`, u_info.opts)
      .then((r) => setChartData(r.data || []))
      .catch(() => setChartData([]))
      .finally(() => setChartLoad(false));
  }

  const tr = data?.totalRevenus || 0;
  const tc = data?.totalCharges || 0;
  const td = data?.totalDepenses || 0;
  const tca = data?.totalCasuel || 0;
  const sol = data?.solde || 0;

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
                  <BsClipboardData /> Bilan Mensuel
                </h1>
                <p className="text-muted small mb-0">
                  Résultat — {MOIS_LABELS[mois]} {annee}
                </p>
              </div>
              <div className="d-flex gap-2">
                <select
                  className="form-select form-select-sm"
                  style={{ width: "auto" }}
                  value={mois}
                  onChange={(e) => setMois(+e.target.value)}
                >
                  {MOIS_LABELS.slice(1).map((m, i) => (
                    <option key={i + 1} value={i + 1}>
                      {m}
                    </option>
                  ))}
                </select>
                <select
                  className="form-select form-select-sm"
                  style={{ width: "auto" }}
                  value={annee}
                  onChange={(e) => setAnnee(+e.target.value)}
                >
                  {ANNEES.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {loading ? (
              <SkBenefices />
            ) : (
              <>
                {/* KPI cards */}
                <div className="row g-3 mb-4">
                  {[
                    {
                      label: "Revenus",
                      val: tr,
                      icon: <BsGraphUp />,
                      color: "green",
                    },
                    {
                      label: "Casuel",
                      val: tca,
                      icon: <BsStarFill />,
                      color: "amber",
                    },
                    {
                      label: "Charges",
                      val: tc,
                      icon: <BsGraphDown />,
                      color: "red",
                    },
                    {
                      label: "Dépenses",
                      val: td,
                      icon: <BsCashStack />,
                      color: "red",
                    },
                    {
                      label: "Solde net",
                      val: sol,
                      icon: <BsTrophyFill />,
                      color: sol >= 0 ? "blue" : "red",
                    },
                  ].map(({ label, val, icon, color }) => (
                    <div className="col-sm-6 col-lg-3" key={label}>
                      <div className="stat-card">
                        <div className={`stat-icon ${color}`}>{icon}</div>
                        <div className="stat-content">
                          <h3 style={{ fontSize: "1.15rem" }}>
                            {(val / 1000).toFixed(1)}k
                          </h3>
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
                      <h6 className="fw-bold mb-0 text-success">
                        <BsGraphUp className="me-1" />
                        Revenus
                      </h6>
                      <span className="fw-bold text-success">
                        {tr.toLocaleString()} Ar
                      </span>
                    </div>
                    {!data?.revenus?.length ? (
                      <p
                        className="text-muted text-center py-3"
                        style={{ fontSize: "0.82rem" }}
                      >
                        Aucun revenu
                      </p>
                    ) : (
                      <table className="table table-sm mb-0">
                        <tbody>
                          {data.revenus.map((r) => (
                            <tr key={r.id}>
                              <td style={{ fontSize: "0.85rem" }}>
                                {r.nom}
                                {r.est_epargne ? (
                                  <span className="finance-epargne-badge ms-2">
                                    Épargne
                                  </span>
                                ) : null}
                              </td>
                              <td
                                className="text-end fw-semibold text-success"
                                style={{ fontSize: "0.85rem" }}
                              >
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
                      <h6 className="fw-bold mb-0 text-danger">
                        <BsGraphDown className="me-1" />
                        Charges Fixes
                      </h6>
                      <span className="fw-bold text-danger">
                        {tc.toLocaleString()} Ar
                      </span>
                    </div>
                    {!data?.charges?.length ? (
                      <p
                        className="text-muted text-center py-3"
                        style={{ fontSize: "0.82rem" }}
                      >
                        Aucune charge
                      </p>
                    ) : (
                      <table className="table table-sm mb-0">
                        <tbody>
                          {data.charges.map((c) => (
                            <tr key={c.id}>
                              <td style={{ fontSize: "0.85rem" }}>{c.nom}</td>
                              <td
                                className="text-end fw-semibold text-danger"
                                style={{ fontSize: "0.85rem" }}
                              >
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
                      <h6 className="fw-bold mb-0">
                        <BsCashStack className="me-1" />
                        Dépenses variables — {MOIS_LABELS[mois]} {annee}
                      </h6>
                      <span className="fw-bold text-danger">
                        {td.toLocaleString()} Ar
                      </span>
                    </div>
                    <table className="table table-sm mb-0">
                      <tbody>
                        {data.parSemaine.map((s) => (
                          <tr key={s.semaine}>
                            <td style={{ fontSize: "0.85rem" }}>
                              Semaine {s.semaine}
                            </td>
                            <td
                              style={{ fontSize: "0.8rem", color: "#94a3b8" }}
                            >
                              {s.nb} dépense{s.nb > 1 ? "s" : ""}
                            </td>
                            <td
                              className="text-end fw-semibold text-danger"
                              style={{ fontSize: "0.85rem" }}
                            >
                              {(+s.total).toLocaleString()} Ar
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Solde final */}
                <div
                  className="card-pro mb-4"
                  style={{
                    borderLeft: `4px solid ${sol >= 0 ? "#10b981" : "#ef4444"}`,
                  }}
                >
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <p className="text-muted small mb-1">
                        Revenus + Casuel − Charges − Dépenses
                      </p>
                      <h4
                        className={`mb-0 fw-bold ${sol >= 0 ? "solde-positif" : "solde-negatif"}`}
                      >
                        {sol >= 0 ? "+" : ""}
                        {sol.toLocaleString()} Ar
                      </h4>
                    </div>
                    <div
                      className={`stat-icon ${sol >= 0 ? "green" : "red"}`}
                      style={{ width: 52, height: 52, fontSize: "1.4rem" }}
                    >
                      <BsTrophyFill />
                    </div>
                  </div>
                </div>

                {/* ── Graphique annuel ── */}
                <div className="card-pro mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="fw-bold mb-0">
                      Revenus vs Dépenses — {annee}
                    </h6>
                  </div>
                  {chartLoad ? (
                    <div
                      style={{
                        height: 220,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <span
                        className="text-muted"
                        style={{ fontSize: "0.85rem" }}
                      >
                        Chargement…
                      </span>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart
                        data={chartData}
                        margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis
                          dataKey="mois"
                          tickFormatter={(m) => MOIS_LABELS[m]}
                          tick={{ fontSize: 11, fill: "#94a3b8" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tickFormatter={fmtK}
                          tick={{ fontSize: 11, fill: "#94a3b8" }}
                          axisLine={false}
                          tickLine={false}
                          width={42}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                          formatter={(v) =>
                            v === "revenus" ? "Revenus" : "Dépenses"
                          }
                          iconType="circle"
                          iconSize={8}
                          wrapperStyle={{ fontSize: "0.78rem" }}
                        />
                        <Line
                          type="monotone"
                          dataKey="revenus"
                          stroke="#3b82f6"
                          strokeWidth={2.5}
                          dot={{ r: 3, fill: "#3b82f6", strokeWidth: 0 }}
                          activeDot={{ r: 5 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="depenses"
                          stroke="#ef4444"
                          strokeWidth={2.5}
                          dot={{ r: 3, fill: "#ef4444", strokeWidth: 0 }}
                          activeDot={{ r: 5 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
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
