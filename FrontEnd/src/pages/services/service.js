import axios from "../../contexts/api/axios";
import GetUserData from "../../contexts/api/udata";
import Template from "../../components/template/template";
import Pagination from "../../components/pagination/pagination";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import DeleteModal from "../../components/modals/delete";
import EditModal from "../../components/modals/edit"; 
import AddServiceModal from "./add.service.modal";
import { Link } from "react-router-dom";

const url_req = `service/`;
const servicesPerPage = 5; // Nombre de services à afficher par page

export default function Service() {
  const u_info = GetUserData();
  const [services, setService] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const serviceFieldsToEdit = ["nom", "prix", "fandrefesana", "karazana"];
  const [isLargeScreen, setIsLargeScreen] = useState(window.innerWidth > 720);

  useEffect(() => {
    getServices();

    const handleResize = () => {
      setIsLargeScreen(window.innerWidth > 720);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  function getServices() {
    axios
      .get(url_req, u_info.opts)
      .then(function (response) {
        if (response.status === 200) {
          const allServices = response.data;
          setService(allServices);
          setTotalPages(Math.ceil(allServices.length / servicesPerPage)); // Calculer le nombre total de pages
        } else {
          toast.warning("Vous n'êtes pas autorisé à accéder à cette page!");
        }
      })
      .catch((error) => {
        toast.error("Erreur lors du chargement des services.");
        setService([]); // Gérer l'erreur en réinitialisant les services à un tableau vide
      });
  }

  // Calculer les services à afficher pour la page actuelle
  const indexOfLastService = currentPage * servicesPerPage;
  const indexOfFirstService = indexOfLastService - servicesPerPage;
  const currentServices = services.slice(
    indexOfFirstService,
    indexOfLastService
  );

  const handleDeleteClick = (service) => {
    setSelectedEntity(service);
    setShowDeleteModal(true);
  };
  const handleDeleteConfirm = () => {
    setShowDeleteModal(false);
    getServices(); // Recharger les services après suppression
  };

  const handleEditClick = (service) => {
    setSelectedEntity(service);
    setShowEditModal(true);
  };

  const handleEditConfirm = () => {
    setShowEditModal(false);
    getServices(); // Recharger les services après modification
  };

  return (
    <Template>
      <h3>Service</h3>
      {isLargeScreen ? (
        <Link to={"/newService/"}>
          {" "}
          <span>Ajout</span>
        </Link>
      ) : (
        <button onClick={() => setShowEditModal(true)}>
          Ajouter un service
        </button>
      )}
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Nom</th>
            <th>Prix</th>
            <th>Unité</th>
            <th>Type</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {currentServices.length > 0 ? (
            currentServices.map((s, key) => (
              <tr key={key}>
                <td>{s.id}</td>
                <td>{s.nom}</td>
                <td>{s.prix}</td>
                <td>{s.fandrefesana}</td>
                <td>{s.karazana}</td>
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
          entityName="service"
          auth={u_info.opts}
        />
      )}
      {selectedEntity && (
        <EditModal
          show={showEditModal}
          onClose={() => setShowEditModal(false)}
          onConfirm={handleEditConfirm}
          entity={selectedEntity}
          entityName="service"
          auth={u_info.opts}
          fieldsToEdit={serviceFieldsToEdit}
        />
      )}
      {!isLargeScreen && (
        <AddServiceModal
          show={showEditModal}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </Template>
  );
}
