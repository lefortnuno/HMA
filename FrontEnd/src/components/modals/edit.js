import React, { useState, useEffect } from 'react';
import axios from "../../contexts/api/axios";
import { toast } from 'react-toastify';

export default function EditModal({ show, onClose, onConfirm, entity, entityName, auth }) {
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (entity) {
      // Initialisez les données du formulaire avec les informations de l'entité
      setFormData(entity);
    }
  }, [entity]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.put(`${entityName}/${entity.id}`, formData, auth);
      if (response.status === 200) {
        toast.success("Modification réussie !");
        onConfirm(); // Appeler la fonction de confirmation pour fermer la modal et rafraîchir les données
      }
    } catch (error) {
      toast.error("Erreur lors de la modification.");
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="modal">
      <div className="modal-content">
        <h3>Éditer {entityName}</h3>
        <form onSubmit={handleSubmit}>
          {Object.keys(formData).map((key) => (
            <div key={key}>
              <label>{key}</label>
              <input
                type="text"
                name={key}
                value={formData[key] || ''}
                onChange={handleChange}
              />
            </div>
          ))}
          <button type="submit" disabled={loading}>
            {loading ? 'Enregistrement...' : 'Enregistrer'}
          </button>
          <button type="button" onClick={onClose}>
            Annuler
          </button>
        </form>
      </div>
    </div>
  );
}
