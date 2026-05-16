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
  BsChevronLeft,
  BsChevronRight,
  BsGithub,
  BsFacebook,
  BsLinkedin,
  BsEnvelope,
} from "react-icons/bs";
import "./vitrine.css";
import hma from "../../assets/images/hma256.png";

const API_ORIGIN =
  (process.env.REACT_APP_OFFLINE_API_HEAD || "") +
  (process.env.REACT_APP_OFFLINE_API_IP_ADRESS || "") +
  (process.env.REACT_APP_OFFLINE_API_PORT || "");

function imgSrc(p) {
  if (!p) return "";
  if (p.startsWith("http")) return p;
  return API_ORIGIN + p;
}

export default function DetailBien() {
  const { id } = useParams();
  const [bien, setBien] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imgIdx, setImgIdx] = useState(0);

  useEffect(() => {
    setLoading(true);
    axios
      .get(`vitrine/biens/${id}`)
      .then((r) => setBien(r.data))
      .catch(() => setBien(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="vitrine-page">
        <VitrineNav />
        <div className="vitrine-empty">Chargement...</div>
      </div>
    );
  }

  if (!bien) {
    return (
      <div className="vitrine-page">
        <VitrineNav />
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

  const prevPhoto = () =>
    setImgIdx((i) => (i === 0 ? photos.length - 1 : i - 1));
  const nextPhoto = () =>
    setImgIdx((i) => (i === photos.length - 1 ? 0 : i + 1));

  return (
    <div className="vitrine-page">
      <VitrineNav />

      {/* Sous-bandeau breadcrumb */}
      <div className="detail-subnav">
        <div className="detail-subnav-inner">
          <Link to="/vitrine/" className="detail-back">
            <BsArrowLeft /> Retour aux annonces
          </Link>
          <span className="detail-breadcrumb">
            Vitrine <span className="sep">/</span>{" "}
            {bien.type === "VILLA" ? "Villa" : "Chambre"}{" "}
            <span className="sep">/</span>{" "}
            <span className="current">{bien.titre}</span>
          </span>
        </div>
      </div>

      <div className="vitrine-detail">
        <div className="row g-4">
          {/* ─── Left: gallery + content ─────────────────── */}
          <div className="col-lg-8">
            {/* Gallery */}
            <div className="detail-gallery">
              {currentPhoto ? (
                <>
                  <img src={imgSrc(currentPhoto)} alt={bien.titre} />
                  {photos.length > 1 && (
                    <>
                      <button
                        className="gallery-nav prev"
                        onClick={prevPhoto}
                        aria-label="Précédent"
                      >
                        <BsChevronLeft />
                      </button>
                      <button
                        className="gallery-nav next"
                        onClick={nextPhoto}
                        aria-label="Suivant"
                      >
                        <BsChevronRight />
                      </button>
                      <span className="gallery-counter">
                        {imgIdx + 1} / {photos.length}
                      </span>
                    </>
                  )}
                </>
              ) : (
                <div className="detail-gallery-placeholder">
                  {bien.type === "VILLA" ? "🏡" : "🏠"}
                </div>
              )}
            </div>

            {photos.length > 1 && (
              <div className="detail-thumbs">
                {photos.map((p, i) => (
                  <img
                    key={i}
                    src={imgSrc(p)}
                    alt=""
                    onClick={() => setImgIdx(i)}
                    className={i === imgIdx ? "active" : ""}
                  />
                ))}
              </div>
            )}

            {/* Header bloc */}
            <div className="detail-header">
              <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
                <span className={`badge-type ${bien.type?.toLowerCase()}`}>
                  {bien.type === "VILLA" ? "Villa" : "Chambre"}
                </span>
                <span
                  className={`badge-dispo ${bien.disponible ? "dispo" : "indispo"}`}
                >
                  {bien.disponible ? "Disponible" : "Indisponible"}
                </span>
              </div>
              <h1 className="detail-title">{bien.titre}</h1>
              {bien.localisation && (
                <div className="detail-location">
                  <BsGeoAlt /> {bien.localisation}
                </div>
              )}
              <div className="detail-price">
                {(bien.prix || 0).toLocaleString()} Ar
                <small> / mois</small>
              </div>

              {/* Infos rapides */}
              <div className="detail-quick-infos">
                {bien.surface && (
                  <div className="quick-info">
                    <BsHouseDoor />
                    <div>
                      <div className="qi-value">{bien.surface} m²</div>
                      <div className="qi-label">Surface</div>
                    </div>
                  </div>
                )}
                {bien.nbChambres ? (
                  <div className="quick-info">
                    <span style={{ fontSize: "1.1rem" }}>🛏</span>
                    <div>
                      <div className="qi-value">{bien.nbChambres}</div>
                      <div className="qi-label">Chambre(s)</div>
                    </div>
                  </div>
                ) : null}
                {bien.nbPieces ? (
                  <div className="quick-info">
                    <span style={{ fontSize: "1.1rem" }}>🚪</span>
                    <div>
                      <div className="qi-value">{bien.nbPieces}</div>
                      <div className="qi-label">Pièce(s)</div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Description */}
            {bien.description && (
              <div className="detail-card">
                <h6>Description</h6>
                <p>{bien.description}</p>
              </div>
            )}

            {/* Caractéristiques */}
            {bien.caracteristiques?.length > 0 && (
              <div className="detail-card">
                <h6>Caractéristiques</h6>
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

          {/* ─── Right: contact card (sticky) ─────────────── */}
          <div className="col-lg-4">
            <div className="contact-card">
              <h6>Intéressé par ce bien&nbsp;?</h6>
              <p className="contact-card-lead">
                Contactez-nous directement pour plus d'informations ou pour
                planifier une visite.
              </p>

              <a
                href={`https://wa.me/261000000000?text=${encodeURIComponent(
                  `Bonjour, je suis intéressé par le bien : ${bien.titre}`,
                )}`}
                className="btn-whatsapp-big mb-2"
                target="_blank"
                rel="noopener noreferrer"
              >
                <BsWhatsapp size={20} /> WhatsApp
              </a>
              <a href="tel:+261000000000" className="btn-call-big">
                <BsTelephoneFill /> Appeler
              </a>

              <div className="contact-card-agency">
                <img src={hma} alt="HMA" />
                <div>
                  <div className="agency-name">HMA Immobilier</div>
                  <div className="agency-loc">Madagascar</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="vitrine-footer">
        <span className="vitrine-footer-copy">
          © {new Date().getFullYear()} <strong>HMA Immobilier</strong> — Madagascar
        </span>
        <div className="vitrine-footer-links">
          <a href="https://github.com/lefortnuno" target="_blank" rel="noopener noreferrer" title="GitHub">
            <BsGithub />
          </a>
          <a href="https://www.facebook.com/tendo.lelouch.9/" target="_blank" rel="noopener noreferrer" title="Facebook">
            <BsFacebook />
          </a>
          <a href="https://www.linkedin.com/in/trofel-nuno-6bba76305/" target="_blank" rel="noopener noreferrer" title="LinkedIn">
            <BsLinkedin />
          </a>
          <a href="mailto:trofelnuno@gmail.com" title="Email">
            <BsEnvelope />
          </a>
        </div>
      </footer>
    </div>
  );
}

function VitrineNav() {
  return (
    <nav className="vitrine-nav">
      <Link
        to="/vitrine/"
        className="vitrine-nav-brand"
        style={{ textDecoration: "none" }}
      >
        <img src={hma} alt="HMA" />
        <div>
          <span>HMA Immobilier</span>
          <small>Votre logement idéal à Madagascar</small>
        </div>
      </Link>
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
  );
}
