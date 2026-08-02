import React from "react";
import { Modal, Button } from "react-bootstrap";
import axios from "../../contexts/api/axios";
import { toast } from "react-toastify";

export default function DeleteModal({
  show,
  onClose,
  onConfirm,
  entity,
  entityName,
  auth,
}) {
  const handleDelete = () => {
    axios
      .delete(`${entityName}/${entity.id}`, auth)
      .then((response) => {
        if (response.status === 200) {
          toast.success(
            `${
              entityName.charAt(0).toUpperCase() + entityName.slice(1)
            } supprimé avec succès!`
          );
          onConfirm(); // Action à effectuer après suppression
        } else {
          toast.error(`Erreur lors de la suppression du ${entityName}.`);
        }
      })
      .catch((error) => {
        toast.error(`Erreur lors de la suppression du ${entityName}.`);
      });
  };

  return (
    <Modal show={show} onHide={onClose}>
      <Modal.Header closeButton>
        <Modal.Title>Confirmation de suppression</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        Êtes-vous sûr de vouloir supprimer {entityName}{" "}
        <strong>
          {entity.nom ? `${entity.nom} ${entity.prenom || ""}`.trim() : `#°${entity.id}`}
        </strong>{" "}
        ?
        {/* Un compte de locataire est lie a une fiche : on previent de la portee. */}
        {entity.locataireId && (
          <div
            className="mt-3 rounded-3 p-2"
            style={{ background: "#fef2f2", border: "1px solid #fecaca" }}
          >
            <small style={{ fontSize: "0.8rem", color: "#991b1b" }}>
              ⚠️ Ce compte est rattaché à un locataire
              {entity.chambre ? ` (chambre ${entity.chambre})` : ""}. Sa fiche{" "}
              <strong>et l'historique de ses paiements</strong> seront également
              supprimés.
            </small>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Annuler
        </Button>
        <Button variant="danger" onClick={handleDelete}>
          Supprimer
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
