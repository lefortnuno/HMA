import { useState, useEffect } from "react";
import axios from "../../contexts/api/axios";
import GetUserData from "../../contexts/api/udata";
import Template from "../../components/template/template";
import Header from "../../components/header/header";
import Sidebar from "../../components/sidebar/sidebar";
import { BsClipboardData, BsGraphUp, BsGraphDown, BsCurrencyExchange, BsTrophyFill } from "react-icons/bs";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { SkBenefices } from "../../components/skeleton/skeleton";
import ApartSelect, {
  useAppartements,
  getSelectedBienId,
  setSelectedBienId,
  KINYA,
} from "../../components/appart/apart.select";
import { MoisPicker, AnneePicker } from "../../components/jour/periode.picker";
import FeuilleProvenance from "../../components/provenance/feuille.provenance";
import "./loyer.css";
import { MOIS_COURT_1 as MOIS_LABELS } from "../../config/dates";


export default function Benefices() {
  const u_info = GetUserData();
  const now = new Date();
  const [bienId, setBienId] = useState(getSelectedBienId());
  const apparts = useAppartements(bienId, setBienId);
  const current = apparts.find((a) => a.id === bienId) || KINYA;
  // Le résultat mensuel porte sur le mois clos : on ouvre donc sur M-1
  // (en janvier, cela renvoie à décembre de l'année précédente).
  // Le graphique annuel, lui, couvre les 12 mois de l'année sélectionnée.
  const moisPrecedent = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const [mois, setMois] = useState(moisPrecedent.getMonth() + 1);
  const [annee, setAnnee] = useState(moisPrecedent.getFullYear());
  const [data, setData] = useState(null);
  const [anneeData, setAnneeData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBenefices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mois, annee, bienId]);

  function changeAppart(id) {
    setBienId(id);
    setSelectedBienId(id);
  }

  function fetchBenefices() {
    // Skeleton uniquement au tout premier chargement : les changements de
    // mois/annee/appartement rafraichissent en arriere-plan.
    if (!data) setLoading(true);
    Promise.all([
      axios
        .get(`loyer/benefices?mois=${mois}&annee=${annee}&bienId=${bienId}`, u_info.opts)
        .then((r) => setData(r.data || null))
        .catch(() => setData(null)),
      axios
        .get(`loyer/benefices/annee?annee=${annee}&bienId=${bienId}`, u_info.opts)
        .then((r) =>
          setAnneeData(
            (r.data?.mois || []).map((m) => ({
              nom: MOIS_LABELS[m.mois],
              Recettes: (m.totalLoyers || 0) + (m.totalJIRAMA || 0),
              "Dépenses": m.totalDepenses || 0,
              "Bénéfice": m.benefice || 0,
            }))
          )
        )
        .catch(() => setAnneeData([])),
    ]).finally(() => setLoading(false));
  }

  const loyers = data?.totalLoyers || 0;
  const jirama = data?.totalJIRAMA || 0;
  const depenses = data?.totalDepenses || 0;
  const recettes = loyers + jirama;
  const benefice = recettes - depenses;
  // Part des recettes réellement arrivée entre les mains du bailleur.
  const encaisse = (data?.encaisseLoyers || 0) + (data?.encaisseJIRAMA || 0);
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
                  <BsClipboardData /> Bénéfices
                </h1>
                <p className="text-muted small mb-0">
                  {current.nom} · résultat mensuel — {MOIS_LABELS[mois]} {annee}
                </p>
              </div>
              <div className="d-flex gap-2 flex-wrap align-items-center">
                <ApartSelect list={apparts} value={bienId} onChange={changeAppart} />
                <MoisPicker value={mois} onChange={setMois} />
                <AnneePicker value={annee} onChange={setAnnee} />
              </div>
            </div>

            {loading ? (
              <SkBenefices />
            ) : (
              <>
                {/* KPI cards */}
                <div className="row g-3 mb-4">
                  <div className="col-sm-6 col-lg-3">
                    <div className="stat-card">
                      <div className="stat-icon green"><BsGraphUp /></div>
                      <div className="stat-content">
                        <h3>{(loyers / 1000).toFixed(0)}k</h3>
                        <p>Loyers perçus (Ar)</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-sm-6 col-lg-3">
                    <div className="stat-card">
                      <div className="stat-icon blue"><BsGraphUp /></div>
                      <div className="stat-content">
                        <h3>{(jirama / 1000).toFixed(0)}k</h3>
                        <p>JIRAMA perçu (Ar)</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-sm-6 col-lg-3">
                    <div className="stat-card">
                      <div className="stat-icon red"><BsGraphDown /></div>
                      <div className="stat-content">
                        <h3>{(depenses / 1000).toFixed(0)}k</h3>
                        <p>Dépenses (Ar)</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-sm-6 col-lg-3">
                    <div className="stat-card">
                      <div className={`stat-icon ${benefice >= 0 ? "green" : "red"}`}>
                        <BsTrophyFill />
                      </div>
                      <div className="stat-content">
                        <h3 className={benefice >= 0 ? "text-success" : "text-danger"}>
                          {benefice >= 0 ? "+" : ""}{(benefice / 1000).toFixed(0)}k
                        </h3>
                        <p>Bénéfice net (Ar)</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Évolution annuelle */}
                <div className="card-pro mb-4">
                  <h6 className="fw-bold mb-1">Évolution {annee} — {current.nom}</h6>
                  <p className="text-muted mb-3" style={{ fontSize: "0.78rem" }}>
                    Recettes et dépenses par mois, avec le bénéfice net en ligne
                  </p>
                  <div style={{ width: "100%", height: 300 }}>
                    <ResponsiveContainer>
                      <ComposedChart data={anneeData} margin={{ top: 8, right: 12, left: 8, bottom: 0 }} barGap={2}>
                        <CartesianGrid stroke="#eef2f7" vertical={false} />
                        <XAxis dataKey="nom" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={{ stroke: "#e2e8f0" }} tickLine={false} />
                        <YAxis
                          tick={{ fontSize: 11, fill: "#64748b" }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                          width={44}
                        />
                        <Tooltip
                          formatter={(v) => `${Number(v).toLocaleString()} Ar`}
                          contentStyle={{ fontSize: "0.8rem", borderRadius: 8, border: "1px solid #e2e8f0" }}
                        />
                        <Legend wrapperStyle={{ fontSize: "0.78rem" }} />
                        <ReferenceLine y={0} stroke="#94a3b8" />
                        <Bar dataKey="Recettes" fill="#16a34a" radius={[4, 4, 0, 0]} maxBarSize={22} />
                        <Bar dataKey="Dépenses" fill="#dc2626" radius={[4, 4, 0, 0]} maxBarSize={22} />
                        <Line type="monotone" dataKey="Bénéfice" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Résumé détaillé */}
                <div className="row g-3">
                  <div className="col-lg-6">
                    <div className="card-pro">
                      <h6 className="fw-bold mb-3">Récapitulatif — {MOIS_LABELS[mois]} {annee}</h6>
                      <div className="d-flex flex-column gap-3">
                        <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                          <span className="text-muted">Loyers perçus</span>
                          <span className="fw-bold text-success">+ {loyers.toLocaleString()} Ar</span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                          <span className="text-muted">JIRAMA perçu</span>
                          <span className="fw-bold text-success">+ {jirama.toLocaleString()} Ar</span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                          <span className="text-muted">Total recettes</span>
                          <span className="fw-bold text-success">+ {recettes.toLocaleString()} Ar</span>
                        </div>
                        {/* Placé juste après les recettes : le « dont » s'y
                            rapporte. Passerelle vers la feuille de provenance
                            — les recettes sont celles de la maison, cette
                            ligne dit ce qui est arrivé entre vos mains. */}
                        <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                          <span className="text-muted">
                            dont encaissé en main propre
                            {recettes > 0 && (
                              <small className="d-block" style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
                                {recettes === encaisse
                                  ? "la totalité des recettes"
                                  : `${(recettes - encaisse).toLocaleString()} Ar réglés sur place`}
                              </small>
                            )}
                          </span>
                          <span className={`fw-bold ${recettes === encaisse ? "text-success" : "text-warning"}`}>
                            {encaisse.toLocaleString()} Ar
                          </span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                          <span className="text-muted">Total dépenses</span>
                          <span className="fw-bold text-danger">− {depenses.toLocaleString()} Ar</span>
                        </div>
                        <div
                          className="d-flex justify-content-between align-items-center p-3 rounded-3"
                          style={{
                            background: benefice >= 0 ? "#f0fdf4" : "#fff5f5",
                            border: `2px solid ${benefice >= 0 ? "#bbf7d0" : "#fecaca"}`,
                          }}
                        >
                          <span className="fw-bold">Bénéfice net</span>
                          <span className={`fw-bold fs-5 ${benefice >= 0 ? "text-success" : "text-danger"}`}>
                            {benefice >= 0 ? "+" : ""}{benefice.toLocaleString()} Ar
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Provenance — qui a réellement encaissé. Le récapitulatif
                      ci-contre donne le résultat de la maison ; celui-ci dit
                      ce qui est arrivé entre les mains du bailleur. */}
                  <div className="col-lg-6">
                    <FeuilleProvenance
                      mois={mois}
                      annee={annee}
                      bienId={bienId}
                      paiements={data?.paiements || []}
                      provenance={data?.provenance || null}
                      onChange={fetchBenefices}
                    />
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
