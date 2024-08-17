import React from "react";

export default function DetailModal({ show, onClose, entity }) {
  if (!show || !entity) return null;

  return (
    <div className="modal">
      <div className="modal-content">
        <h3>Détails pour {entity.snom}</h3>
        <p>ID: {entity.id}</p>
        <p>Date: {entity.date}</p>
        <p>Montant: {entity.montant}</p>
        <p>Commentaire: {entity.coms}</p>
        <p>HK: {entity.hk}</p>  
        <button onClick={onClose}>Fermer</button>
      </div>
    </div>
  );
}
