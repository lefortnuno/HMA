import { useState, useEffect } from "react";
import axios from "../../contexts/api/axios";
import { Link } from "react-router-dom";
import {
  BsBuilding,
  BsGeoAlt,
  BsHouseDoor,
  BsSearch,
  BsWhatsapp,
} from "react-icons/bs";
import "./vitrine.css";
import hma from "../../assets/images/hma256.png";

export default function Vitrine() {
  const [biens, setBiens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtre, setFiltre] = useState({ type: "", dispo: "", search: "" });

  useEffect(() => {
    fetchBiens();
  }, []);

  function fetchBiens() {
    axios
      .get("vitrine/biens")
      .then((r) => setBiens(r.data || []))
      .catch(() => setBiens([]))
      .finally(() => setLoading(false));
  }

  const biensFiltres = biens.filter((b) => {
    if (filtre.type && b.type !== filtre.type) return false;
    if (filtre.dispo === "dispo" && !b.disponible) return false;
    if (filtre.dispo === "indispo" && b.disponible) return false;
    if (filtre.search && !b.titre?.toLowerCase().includes(filtre.search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="vitrine-page">
      {/* Navbar */}
      <nav className="vitrine-nav">
        <a href="/vitrine/" className="vitrine-nav-brand">
          <img src={hma} alt="HMA" />
          <div>
            <span>HMA Immobilier</span>
            <small>Votre logement idéal à Madagascar</small>
          </div>
        </a>
        <div className="vitrine-nav-actions">
          <a
            href="https://wa.me/261000000000"
            className="btn-whatsapp"
            target="_blank"
            rel="noopener noreferrer"
          >
            <BsWhatsapp /> Nous contacter
          </a>
        </div>
      </nav>

      {/* Hero */}
      <div className="vitrine-hero">
        <h1>Trouvez votre logement idéal</h1>
        <p>Chambres et villas disponibles à Madagascar</p>
      </div>

      {/* Filters */}
      <div className="vitrine-filters">
        <span className="filter-label">Filtrer :</span>
        <div style={{ position: "relative" }}>
          <BsSearch
            style={{
              position: "absolute",
              left: 10,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#94a3b8",
            }}
          />
          <input
            type="text"
            placeholder="Rechercher..."
            value={filtre.search}
            onChange={(e) => setFiltre({ ...filtre, search: e.target.value })}
            style={{ paddingLeft: 30 }}
          />
        </div>
        <select
          value={filtre.type}
          onChange={(e) => setFiltre({ ...filtre, type: e.target.value })}
        >
          <option value="">Tous les types</option>
          <option value="CHAMBRE">Chambre</option>
          <option value="VILLA">Villa</option>
        </select>
        <select
          value={filtre.dispo}
          onChange={(e) => setFiltre({ ...filtre, dispo: e.target.value })}
        >
          <option value="">Toutes disponibilités</option>
          <option value="dispo">Disponible</option>
          <option value="indispo">Indisponible</option>
        </select>
        <span style={{ fontSize: "0.78rem", color: "#64748b", marginLeft: "auto" }}>
          {biensFiltres.length} bien(s) trouvé(s)
        </span>
      </div>

      {/* Grid */}
      <div className="vitrine-container">
        {loading ? (
          <div className="vitrine-empty">
            <p>Chargement des biens...</p>
          </div>
        ) : biensFiltres.length === 0 ? (
          <div className="vitrine-empty">
            <BsBuilding />
            <h5>Aucun bien disponible</h5>
            <p>Revenez bientôt pour découvrir nos nouvelles offres.</p>
          </div>
        ) : (
          <div className="vitrine-grid">
            {biensFiltres.map((bien) => (
              <BienCard key={bien.id} bien={bien} />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="vitrine-footer">
        <p className="mb-1">
          <strong style={{ color: "#f1f5f9" }}>HMA Immobilier</strong> — Madagascar
        </p>
        <p className="mb-0">
          &copy; {new Date().getFullYear()} — Tous droits réservés
        </p>
      </footer>
    </div>
  );
}

function BienCard({ bien }) {
  return (
    <Link to={`/vitrine/bien/${bien.id}`} className="bien-card">
      {bien.photos?.[0] ? (
        <img src={bien.photos[0]} alt={bien.titre} className="bien-card-img" />
      ) : (
        <div className="bien-card-img-placeholder">
          {bien.type === "VILLA" ? "🏡" : "🏠"}
        </div>
      )}
      <div className="bien-card-body">
        <div className="bien-card-badges">
          <span className={`badge-type ${bien.type?.toLowerCase()}`}>
            {bien.type === "VILLA" ? "Villa" : "Chambre"}
          </span>
          <span className={`badge-dispo ${bien.disponible ? "dispo" : "indispo"}`}>
            {bien.disponible ? "Disponible" : "Indisponible"}
          </span>
        </div>
        <div className="bien-card-title">{bien.titre}</div>
        {bien.localisation && (
          <div className="bien-card-location">
            <BsGeoAlt /> {bien.localisation}
          </div>
        )}
        <div className="bien-card-meta">
          {bien.surface && <span><BsHouseDoor /> {bien.surface} m²</span>}
          {bien.nbChambres && <span>🛏 {bien.nbChambres} ch.</span>}
          {bien.nbPieces && <span>🚪 {bien.nbPieces} pièces</span>}
        </div>
        <div className="bien-card-price">
          {(bien.prix || 0).toLocaleString()} Ar
          <small> / mois</small>
        </div>
      </div>
    </Link>
  );
}
