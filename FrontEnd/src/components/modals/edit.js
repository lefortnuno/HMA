import React, { useState, useEffect } from "react";
import axios from "../../contexts/api/axios";
import { toast } from "react-toastify";

export default function EditModal({
  show,
  onClose,
  onConfirm,
  entity,
  entityName,
  auth,
  fieldsToEdit,
}) {
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);

  const fieldConfig = {
    nom: { type: "text" },
    prix: { type: "number" },
    fandrefesana: {
      type: "select",
      options: ["Litre", "Gramme", "Mètre", "Temps"],
    },
    karazana: { type: "select", options: ["Materiel", "Intellectuel"] },
    hk: { type: "select", options: ["Depense", "Gain"] },
    qte: { type: "number" },
    coms: { type: "text" },
  };

  useEffect(() => {
    if (entity) {
      const initialData = {};
      fieldsToEdit.forEach((field) => {
        if (entity[field] !== undefined) {
          initialData[field] = entity[field];
        }
      });
      setFormData(initialData);
    }
  }, [entity, fieldsToEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.put(
        `${entityName}/${entity.id}`,
        formData,
        auth
      );
      if (response.status === 200) {
        toast.success("Modification réussie !");
        onConfirm(); // Call the confirmation function to close the modal and refresh the data
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
          {Object.keys(formData).map((key) => {
            const config = fieldConfig[key] || { type: "text" }; // Default to text if not specified

            return (
              <div key={key}>
                <label>{key}</label>

                {config.type === "select" ? (
                  <select
                    name={key}
                    value={
                      // Use actual value for fandrefesana
                      key === "fandrefesana"
                        ? formData[key] || ""
                        : formData[key] !== undefined && formData[key] !== null
                        ? formData[key]
                        : ""
                    }
                    onChange={handleChange}
                  >
                    {config.options.map((option, index) => (
                      <option
                        key={index}
                        value={key === "fandrefesana" ? option : index}
                      >
                        {option}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={config.type}
                    name={key}
                    value={
                      formData[key] !== undefined && formData[key] !== null
                        ? formData[key]
                        : ""
                    }
                    onChange={handleChange}
                    autoComplete="off"
                  />
                )}
              </div>
            );
          })}
          <button type="submit" disabled={loading}>
            {loading ? "Enregistrement..." : "Enregistrer"}
          </button>
          <button type="button" onClick={onClose}>
            Annuler
          </button>
        </form>
      </div>
    </div>
  );
}
