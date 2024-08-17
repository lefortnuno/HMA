import axios from "../../contexts/api/axios";
import GetUserData from "../../contexts/api/udata";
import Template from "../../components/template/template";
import Pagination from "../../components/pagination/pagination";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import DeleteModal from "../../components/modals/delete";
import EditModal from "../../components/modals/edit";
import { Link } from "react-router-dom"; 

const url_req = `histo/incoming/`;
const histoPerPage = 5; // Nombre de histo à afficher par page

export default function InComing() {
  const u_info = GetUserData();
  const [histo, setHisto] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const histoFieldsToEdit = ["qte", "coms", "hk"];

  useEffect(() => {
    getHisto();
  }, []);

  function getHisto() {
    axios
      .get(url_req + `${u_info.u_id}`, u_info.opts)
      .then(function (response) {
        if (response.status === 200) {
          const allHisto = response.data;
          setHisto(allHisto);
          setTotalPages(Math.ceil(allHisto.length / histoPerPage)); // Calculer le nombre total de pages
        } else {
          toast.warning("Vous n'êtes pas autorisé à accéder à cette page!");
        }
      })
      .catch((error) => {
        toast.error("Erreur lors du chargement des histo.");
        setHisto([]); // Gérer l'erreur en réinitialisant les histo à un tableau vide
      });
  }

  // Calculer les histo à afficher pour la page actuelle
  const indexOfLastService = currentPage * histoPerPage;
  const indexOfFirstService = indexOfLastService - histoPerPage;
  const currentHisto = histo.slice(indexOfFirstService, indexOfLastService);

  const handleDeleteClick = (histo) => {
    setSelectedEntity(histo);
    setShowDeleteModal(true);
  };
  const handleDeleteConfirm = () => {
    setShowDeleteModal(false);
    getHisto(); // Recharger les histo après suppression
  };

  const handleEditClick = (service) => {
    setSelectedEntity(service);
    setShowEditModal(true);
  };

  const handleEditConfirm = () => {
    setShowEditModal(false);
    getHisto(); // Recharger les histo après modification
  };

  return (
    <Template>
      <h3>Historique d'entree d'argent</h3>
      <Link to={"/newIncoming/"}>
        {" "}
        <span>Ajout</span>
      </Link>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Date</th>
            <th>Nom</th>
            <th>Montant</th>
            <th>Coms</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {currentHisto.length > 0 ? (
            currentHisto.map((s, key) => (
              <tr key={key}>
                <td>{s.id}</td>
                <td>{s.date}</td>
                <td>{s.snom}</td>
                <td>{s.montant}</td>
                <td>{s.coms}</td>
                <td>
                  <span
                    style={{ color: "blue", cursor: "pointer" }}
                    onClick={() => handleEditClick(s)}
                  >
                    edit
                  </span>
                  <span
                    style={{ color: "red", cursor: "pointer" }}
                    onClick={() => handleDeleteClick(s)}
                  >
                    del
                  </span>
                  <span>details</span>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5">Aucun service disponible</td>
            </tr>
          )}
        </tbody>
      </table>
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
      {selectedEntity && (
        <DeleteModal
          show={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteConfirm}
          entity={selectedEntity}
          entityName={"histo"}
          auth={u_info.opts}
        />
      )}
      {selectedEntity && (
        <EditModal
          show={showEditModal}
          onClose={() => setShowEditModal(false)}
          onConfirm={handleEditConfirm}
          entity={selectedEntity}
          entityName="histo"
          auth={u_info.opts}
          fieldsToEdit={histoFieldsToEdit}
        />
      )}
    </Template>
  );
}
