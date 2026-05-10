import { useState, useEffect } from "react";
import axios from "../../contexts/api/axios";
import { useParams, Link } from "react-router-dom";
import {
  BsGeoAlt,
  BsHouseDoor,
  BsWhatsapp,
  BsTelephoneFill,
  BsArrowLeft,
  BsBuilding,
  BsCheckCircleFill,
} from "react-icons/bs";
import "./vitrine.css";
import hma from "../../assets/images/hma256.png";

export default function DetailBien() {
  const { id } = useParams();
  const [bien, setBien] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imgIdx, setImgIdx] = useState(0);

  useEffect(() => {
    axios
      .get(`vitrine/biens/${id}`)
      .then((r) => setBien(r.data))
      .catch(() => setBien(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="vitrine-page">
        <VitrinaNav />
        <div className="vitrine-empty">Chargement...</div>
      </div>
    );
  }

  if (!bien) {
    return (
      <div className="vitrine-page">
        <VitrinaNav />
        <div className="vitrine-empty">
          <BsBuilding />
          <h5>Bien introuvable</h5>
          <Link to="/vitrine/" className="btn btn-primary mt-3">
            Retour aux annonces
          </Link>
        </div>
      </div>
    );
  }

  const photos = bien.photos || [];
  const currentPhoto = photos[imgIdx];

  return (
    <div className="vitrine-page">
      <VitrinaNav />

      <div className="vitrine-detail">
        {/* Back */}
        <Link to="/vitrine/" className="d-inline-flex align-items-center gap-1 text-muted mb-4" style={{ fontSize: "0.875rem" }}>
          <BsArrowLeft /> Retour aux annonces
        </Link>

        <div className="row g-4">
          {/* Left: gallery + details */}
          <div className="col-lg-8">
            {/* Gallery */}
            <div className="detail-gallery">
              {currentPhoto ? (
                <img src={currentPhoto} alt={bien.titre} />
              ) : (
                <div style={{ color: "#475569", fontSize: "4rem", textAlign: "center" }}>
                  {bien.type === "VILLA" ? "🏡" : "🏠"}
                </div>
              )}
            </div>
            {photos.length > 1 && (
              <div className="d-flex gap-2 mb-4" style={{ overflowX: "auto" }}>
                {photos.map((p, i) => (
                  <img
                    key={i}
                    src={p}
                    alt=""
                    onClick={() => setImgIdx(i)}
                    style={{
                      width: 72,
                      height: 52,
                      objectFit: "cover",
                      borderRadius: 8,
                      cursor: "pointer",
                      border: i === imgIdx ? "2px solid #2563eb" : "2px solid transparent",
                      flexShrink: 0,
                    }}
                  />
                ))}
              </div>
            )}

            {/* Title + badges */}
            <div className="d-flex align-items-start gap-2 mb-2 flex-wrap">
              <span className={`badge-type ${bien.type?.toLowerCase()}`}>
                {bien.type === "VILLA" ? "Villa" : "Chambre"}
              </span>
              <span className={`badge-dispo ${bien.disponible ? "dispo" : "indispo"}`}>
                {bien.disponible ? "Disponible" : "Indisponible"}
              </span>
            </div>
            <h1 className="detail-title">{bien.titre}</h1>
            {bien.localisation && (
              <div className="d-flex align-items-center gap-2 text-muted mb-3" style={{ fontSize: "0.9rem" }}>
                <BsGeoAlt /> {bien.localisation}
              </div>
            )}
            <div className="detail-price">
              {(bien.prix || 0).toLocaleString()} Ar
              <small> / mois</small>
            </div>

            {/* Infos */}
            <div className="d-flex flex-wrap gap-3 mb-4">
              {bien.surface && (
                <div className="feature-tag">
                  <BsHouseDoor /> {bien.surface} m²
                </div>
              )}
              {bien.nbChambres && (
                <div className="feature-tag">🛏 {bien.nbChambres} chambre(s)</div>
              )}
              {bien.nbPieces && (
                <div className="feature-tag">🚪 {bien.nbPieces} pièce(s)</div>
              )}
            </div>

            {/* Description */}
            {bien.description && (
              <div className="card-pro mb-4">
                <h6 className="fw-bold mb-3">Description</h6>
                <p style={{ fontSize: "0.9rem", color: "#334155", lineHeight: 1.7 }}>
                  {bien.description}
                </p>
              </div>
            )}

            {/* Features */}
            {bien.caracteristiques?.length > 0 && (
              <div className="card-pro">
                <h6 className="fw-bold mb-3">Caractéristiques</h6>
                <div className="d-flex flex-wrap gap-2">
                  {bien.caracteristiques.map((c, i) => (
                    <span key={i} className="feature-tag">
                      <BsCheckCircleFill color="#2563eb" /> {c}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: contact card */}
          <div className="col-lg-4">
            <div className="contact-card">
              <h6>Intéressé par ce bien ?</h6>
              <div className="mb-3" style={{ fontSize: "0.875rem", color: "#94a3b8" }}>
                Contactez-nous directement pour plus d'informations ou pour planifier une visite.
              </div>
              <a
                href={`https://wa.me/261000000000?text=Bonjour, je suis intéressé par le bien : ${bien.titre}`}
                className="btn-whatsapp-big mb-3"
                target="_blank"
                rel="noopener noreferrer"
              >
                <BsWhatsapp size={20} /> WhatsApp
              </a>
              <a
                href="tel:+261000000000"
                className="btn btn-outline-light w-100 d-flex align-items-center justify-content-center gap-2"
              >
                <BsTelephoneFill /> Appeler
              </a>

              <div className="mt-4 pt-3" style={{ borderTop: "1px solid #334155" }}>
                <div className="d-flex align-items-center gap-3">
                  <img src={hma} alt="HMA" style={{ width: 40, height: 40, borderRadius: 8 }} />
                  <div>
                    <div style={{ fontSize: "0.875rem", color: "#f1f5f9", fontWeight: 600 }}>
                      HMA Immobilier
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                      Madagascar
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="vitrine-footer">
        <p className="mb-1">
          <strong style={{ color: "#f1f5f9" }}>HMA Immobilier</strong> — Madagascar
        </p>
        <p className="mb-0">&copy; {new Date().getFullYear()} — Tous droits réservés</p>
      </footer>
    </div>
  );
}

function VitrinaNav() {
  return (
    <nav className="vitrine-nav">
      <Link to="/vitrine/" className="vitrine-nav-brand" style={{ textDecoration: "none" }}>
        <img src={hma} alt="HMA" />
        <div>
          <span>HMA Immobilier</span>
          <small>Votre logement idéal à Madagascar</small>
        </div>
      </Link>
      <div className="vitrine-nav-actions">
        <a href="https://wa.me/261000000000" className="btn-whatsapp" target="_blank" rel="noopener noreferrer">
          <BsWhatsapp /> Nous contacter
        </a>
      </div>
    </nav>
  );
}
