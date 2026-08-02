import { useRef, useEffect } from "react";

/**
 * Bannière d'accueil : la vidéo de la résidence, en boucle silencieuse.
 *
 * Le fichier vit dans `public/media` plutôt que dans les sources : il n'a rien
 * à gagner à passer par webpack, et le navigateur peut le diffuser en flux
 * (encodé avec `faststart`) sans attendre le téléchargement complet.
 */
export default function BanniereAccueil() {
  const videoRef = useRef(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    // Certains navigateurs refusent la lecture automatique tant que la vidéo
    // n'est pas explicitement muette : on le confirme côté script.
    v.muted = true;
    const lecture = v.play();
    if (lecture && lecture.catch) lecture.catch(() => {});
  }, []);

  return (
    <>
      <video
        ref={videoRef}
        className="banniere-video"
        src="/media/accueil.mp4"
        poster="/media/accueil.jpg"
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        aria-hidden="true"
      />
      <div className="banniere-voile" />
      <div className="banniere-titre">
        <span className="banniere-sigle">HMA</span>
        <span className="banniere-sous-titre">HABITAT MANAGEMENT APP</span>
      </div>
    </>
  );
}
