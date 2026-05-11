import { useState } from "react";
import Template from "../../components/template/template";
import Header from "../../components/header/header";
import Sidebar from "../../components/sidebar/sidebar";
import {
  BsCode,        BsGlobe,       BsBugFill,     BsGear,
  BsServer,      BsCpu,         BsBoxArrowUpRight, BsDownload,
  BsEnvelope,    BsTelephone,   BsLinkedin,    BsFacebook,
  BsInstagram,   BsGithub,      BsPerson,
} from "react-icons/bs";
import "./about.css";

/* ─── DATA ─────────────────────────────────────────────────── */
const SERVICES = [
  {
    Icon: BsCode,
    title: "Analyse & Modélisation",
    desc: "Identification des besoins projet et transformation en modèles structurés (UML, JIRA). Représentation précise des fonctionnalités et workflows pour aligner les parties prenantes.",
    tag: "Disponible",
  },
  {
    Icon: BsGlobe,
    title: "Développement Full-Stack",
    desc: "Développement complet web, mobile et desktop — front-end et back-end. Applications réactives, efficaces, sécurisées et évolutives avec les frameworks modernes.",
    tag: "Disponible",
  },
  {
    Icon: BsBugFill,
    title: "Tests Logiciels",
    desc: "Assurance qualité par des processus de test rigoureux (manuel & automatisé). Identification des bugs, amélioration des performances, conformité aux exigences utilisateur.",
    tag: "Disponible",
  },
  {
    Icon: BsGear,
    title: "Code Review & Maintenance",
    desc: "Bonnes pratiques de codage, code propre et maintenable bien documenté. Mises à jour régulières pour garder l'application sécurisée et à jour.",
    tag: "Disponible",
  },
  {
    Icon: BsServer,
    title: "DevOps & Automatisation",
    desc: "Streamlining des processus de développement et déploiement avec Docker, Kubernetes, Jenkins et plateformes cloud. CI/CD pipelines efficaces.",
    tag: "Bientôt",
    soon: true,
  },
  {
    Icon: BsCpu,
    title: "Implémentation IA",
    desc: "Conception et implémentation de modèles ML avec TensorFlow, PyTorch ou Scikit-learn. Systèmes prédictifs et solutions IA adaptées aux objectifs métier.",
    tag: "Bientôt",
    soon: true,
  },
];

const PROJECTS = [
  {
    title: "MC-Multimedia Agency",
    desc: "Site moderne pour une agence de production multimédia — clips vidéo, documentaires et services audiovisuels de Madagascar.",
    link: "https://masoandrocapital.com/",
    cats: ["Web"],
    color: "#3b82f6",
  },
  {
    title: "e-BOA",
    desc: "Solution mobile & web pour la gestion des présences, personnalisée pour BOA Fianarantsoa, Madagascar.",
    link: "https://eboa.vercel.app/",
    cats: ["Mobile", "Web"],
    color: "#10b981",
  },
  {
    title: "e-Tokotany",
    desc: "Plateforme web de gestion et suivi des ventes foncières pour la CDF de Fianarantsoa, Madagascar.",
    link: "https://etokotany.vercel.app/",
    cats: ["Web"],
    color: "#f59e0b",
  },
  {
    title: "SIA-Dodge",
    desc: "Système de gestion de données de production industrielle avec outils avancés d'analyse en temps réel.",
    link: "https://sia-dodge-prod.vercel.app/",
    cats: ["Web"],
    color: "#8b5cf6",
  },
  {
    title: "LexiAI",
    desc: "Système de messagerie assisté par IA pour corriger automatiquement le contenu. Architecture microservices — LLM, Keycloak, Kafka, Docker, React, Spring Boot.",
    link: "https://ms.vercel.app/",
    cats: ["Web"],
    color: "#ef4444",
  },
  {
    title: "IoT-Santé",
    desc: "Solution IoT de pointe axée sur l'amélioration des services de santé par l'intégration de smart devices et l'analyse de données en temps réel.",
    link: "https://github.com/lefortnuno/IoT-3S",
    cats: ["Mobile"],
    color: "#06b6d4",
  },
  {
    title: "e-Sakafo",
    desc: "Application mobile qui simplifie la commande et la livraison de repas, apportant de la commodité aux utilisateurs et restaurants locaux.",
    link: "https://github.com/lefortnuno/appESakafo",
    cats: ["Mobile"],
    color: "#f97316",
  },
  {
    title: "BOT — LeRELAIS",
    desc: "Application R&D de suivi de l'historique du trafic de véhicules. Frontend Laravel + Python backend + Ubuntu Server.",
    link: "https://github.com/lefortnuno/LeRELAIS_IA_BOT",
    cats: ["Web"],
    color: "#64748b",
  },
];

const EDUCATION = [
  {
    date: "2024 – en cours",
    title: "Master Professionnel en Informatique | OFFSHORING",
    school: "Faculté des Sciences de Rabat (FSR), Maroc – Rabat",
    desc: "Spécialisation en IA, data science, génie logiciel et interaction humain-machine. Projets de recherche avancés.",
    grad: "En cours",
  },
  {
    date: "2018 – 2022",
    title: "Licence Professionnelle en Informatique | Génie Logiciel & BD",
    school: "École Nationale d'Informatique (ENI), Madagascar – Fianarantsoa",
    desc: "Formation complète en langages de programmation, gestion de bases de données, méthodologies et réseaux.",
    grad: "Mention Bien",
  },
  {
    date: "2017 – 2018",
    title: "Baccalauréat Série C (Sciences & Mathématiques)",
    school: "Saint Joseph de Cluny Tambohobe (SJC), Madagascar – Fianarantsoa",
    desc: "Cursus rigoureux en mathématiques, physique, chimie et biologie. Solides bases analytiques.",
    grad: "Mention Bien",
  },
];

const EXPERIENCE = [
  {
    date: "Nov 2024 – Déc 2024",
    company: "SIA-Dodge",
    title: "Site de gestion de données de production industrielle",
    org: "Faculté des Sciences (FSR) | Maroc – Rabat | Projet Étudiant",
    stack: ["React", "Bootstrap", "Node/Express", "Python", "Power BI", "PostgreSQL"],
    link: { label: "SIA-Dodge", url: "https://sia-dodge-prod.vercel.app/" },
  },
  {
    date: "Août 2023 – Nov 2023",
    company: "e-BOA",
    title: "Application R&D de gestion des présences | web & mobile",
    org: "Bank Of Africa (BOA) | Madagascar – Fianarantsoa | Fullstack Developer",
    stack: ["React", "React Native", "Node/Express", "UML", "PostgreSQL"],
    link: { label: "e-BOA", url: "https://eboa.vercel.app/" },
  },
  {
    date: "Sep 2022 – Déc 2022",
    company: "e-Tokotany",
    title: "Application R&D de gestion des fichiers CDF | web",
    org: "Circonscription Domaniale et Foncière (CDF) | Madagascar – Fianarantsoa | Fullstack Developer",
    stack: ["React", "Bootstrap", "Node/Express", "UML", "MySQL"],
    link: { label: "e-Tokotany", url: "https://etokotany.vercel.app/" },
  },
  {
    date: "Mars 2021 – Mai 2021",
    company: "BOT",
    title: "Application R&D de suivi d'historique de trafic | web",
    org: "LeRELAIS | Madagascar – Fianarantsoa | Junior Developer",
    stack: ["Laravel", "Bootstrap", "Python", "Merise", "MySQL", "Ubuntu Server"],
    link: { label: "BOT", url: "https://github.com/lefortnuno/LeRELAIS_IA_BOT" },
  },
];

const CATS = ["Tous", "Web", "Mobile"];

/* ─── Component ─────────────────────────────────────────────── */
export default function About() {
  const [cat, setCat] = useState("Tous");

  const visible = cat === "Tous"
    ? PROJECTS
    : PROJECTS.filter(p => p.cats.includes(cat));

  return (
    <Template>
      <Header />
      <div className="container-fluid flex-grow-1">
        <div className="row g-0">
          <Sidebar />
          <main className="col-md-9 ms-sm-auto col-lg-10 px-md-4 main pb-5">

            {/* ── Hero ── */}
            <div className="pf-hero">
              <div className="d-flex align-items-start gap-4 flex-wrap">
                <div className="pf-avatar">TN</div>
                <div>
                  <h1>LEFORT Nomenjanahary Nuno</h1>
                  <h2>Software Engineer · Full-Stack Developer</h2>
                  <p>
                    Ingénieur logiciel passionné par le développement web, mobile et desktop.
                    Expert en React, Node.js, Python et bases de données relationnelles.
                    Actuellement en Master Professionnel à la FSR — Rabat, Maroc.
                  </p>
                  <div className="d-flex gap-2 flex-wrap">
                    <a
                      href="https://trofel.vercel.app/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary btn-sm d-inline-flex align-items-center gap-1"
                    >
                      <BsGlobe size={13} /> Portfolio
                    </a>
                    <a
                      href="/files/lefort-cv.pdf"
                      download
                      className="btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-1"
                    >
                      <BsDownload size={13} /> Télécharger CV
                    </a>
                    <a
                      href="https://github.com/lefortnuno"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-1"
                    >
                      <BsGithub size={13} /> GitHub
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Services ── */}
            <div className="mb-5">
              <div className="pf-section-title">Mes Services</div>
              <div className="row g-3">
                {SERVICES.map((s, i) => (
                  <div key={i} className="col-lg-4 col-md-6">
                    <div className="pf-service-card">
                      <div className="pf-service-icon"><s.Icon /></div>
                      <div className="pf-service-title">{s.title}</div>
                      <div className="pf-service-desc">{s.desc}</div>
                      <span className={`pf-service-badge ${s.soon ? "soon" : ""}`}>{s.tag}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Projets ── */}
            <div className="mb-5">
              <div className="pf-section-title">Projets</div>
              <div className="d-flex gap-2 mb-3 flex-wrap">
                {CATS.map(c => (
                  <button
                    key={c}
                    className={`pf-filter-btn ${cat === c ? "active" : ""}`}
                    onClick={() => setCat(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <div className="row g-3">
                {visible.map((p, i) => (
                  <div key={i} className="col-lg-4 col-md-6">
                    <div className="pf-project-card">
                      <div className="pf-project-icon" style={{ background: p.color }} />
                      <div className="pf-project-cats">
                        {p.cats.map(c => <span key={c} className="pf-cat-badge">{c}</span>)}
                      </div>
                      <div className="pf-project-title">{p.title}</div>
                      <div className="pf-project-desc">{p.desc}</div>
                      <a
                        href={p.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="pf-project-link"
                      >
                        Voir <BsBoxArrowUpRight size={11} />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Résumé ── */}
            <div className="mb-5">
              <div className="pf-section-title">Parcours</div>
              <div className="row g-4">
                {/* Education */}
                <div className="col-lg-6">
                  <div className="card-pro p-4 h-100">
                    <h6 className="fw-bold mb-3" style={{ color: "#2563eb", fontSize: "0.9rem" }}>
                      Formation
                    </h6>
                    <div className="pf-timeline">
                      {EDUCATION.map((e, i) => (
                        <div key={i} className="pf-tl-item">
                          <div className="pf-tl-date">{e.date}</div>
                          <div className="pf-tl-title">{e.title}</div>
                          <div className="pf-tl-sub">{e.school}</div>
                          <div className="pf-tl-text">{e.desc}</div>
                          <div className="pf-tl-text mt-1">
                            <span className="fw-semibold">Diplôme :</span> {e.grad}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                {/* Experience */}
                <div className="col-lg-6">
                  <div className="card-pro p-4 h-100">
                    <h6 className="fw-bold mb-3" style={{ color: "#2563eb", fontSize: "0.9rem" }}>
                      Expérience
                    </h6>
                    <div className="pf-timeline">
                      {EXPERIENCE.map((e, i) => (
                        <div key={i} className="pf-tl-item">
                          <div className="pf-tl-date">
                            {e.date} · <span className="fw-bold" style={{ color: "#0f172a" }}>{e.company}</span>
                          </div>
                          <div className="pf-tl-title">{e.title}</div>
                          <div className="pf-tl-sub">{e.org}</div>
                          <div className="pf-tl-text">
                            {e.stack.map(t => (
                              <span key={t} className="pf-skill-badge">{t}</span>
                            ))}
                          </div>
                          <div className="pf-tl-link mt-1">
                            <a href={e.link.url} target="_blank" rel="noopener noreferrer">
                              {e.link.label} <BsBoxArrowUpRight size={10} />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Contact ── */}
            <div className="mb-4">
              <div className="pf-section-title">Contact</div>
              <div className="row g-3">
                <div className="col-lg-6">
                  <div className="card-pro p-4 h-100">
                    <h6 className="fw-bold mb-3" style={{ fontSize: "0.88rem", color: "#2563eb" }}>
                      <BsPerson className="me-1" /> Localisation
                    </h6>
                    {[
                      ["Pays",     "Maroc"],
                      ["Ville",    "Rabat"],
                      ["Région",   "Salé"],
                      ["Code postal", "11000"],
                      ["Quartier", "Salé Tabriquet"],
                    ].map(([k, v]) => (
                      <div key={k} className="pf-contact-row">
                        <span className="pf-contact-label">{k}</span>
                        <span style={{ fontSize: "0.85rem", color: "#0f172a", fontWeight: 500 }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="col-lg-6">
                  <div className="card-pro p-4 h-100">
                    <h6 className="fw-bold mb-3" style={{ fontSize: "0.88rem", color: "#2563eb" }}>
                      <BsEnvelope className="me-1" /> Coordonnées
                    </h6>
                    {[
                      [BsTelephone, "Téléphone",  "tel:+212642359184",   "+212 (0)6 42 35 91 84"],
                      [BsEnvelope,  "Email",      "mailto:trofel.2025@gmail.com", "trofel.2025@gmail.com"],
                      [BsLinkedin, "LinkedIn",
                        "https://www.linkedin.com/in/lefort-nomenjanahary-nuno-07a77b339/",
                        "LEFORT N. Nuno"],
                      [BsFacebook, "Facebook",   "https://www.facebook.com/tendo.lelouch/", "Trofel"],
                      [BsInstagram,"Instagram",
                        "https://www.instagram.com/_trofel_?igsh=OHpvZ25ncnRneDJ4&utm_source=qr",
                        "Trofel"],
                    ].map(([Icon, label, href, val]) => (
                      <div key={label} className="pf-contact-row">
                        <span className="pf-contact-label d-flex align-items-center gap-1">
                          <Icon size={13} /> {label}
                        </span>
                        <span className="pf-contact-val">
                          <a href={href} target="_blank" rel="noopener noreferrer">{val}</a>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </main>
        </div>
      </div>
    </Template>
  );
}
