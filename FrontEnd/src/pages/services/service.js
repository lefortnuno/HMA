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
import { BsFillTrashFill, BsPencilSquare } from "react-icons/bs";

const url_req = `service/`;
const servicesPerPage = 5;

export default function Service() {
  //#region // FONC
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
    console.log("Editing service: ", service); // Debugging
    if (service) {
      setSelectedEntity(service);
      setShowEditModal(true);
    }
  };

  const handleEditConfirm = () => {
    setShowEditModal(false);
    getServices(); // Recharger les services après modification
  };
  //#endregion

  return (
    <Template>
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

      <div className="row">
        <div className="col-md-12">
          <div className="card">
            <div className="card-header ">
              <h4 className="card-title">Liste des services</h4>
            </div>
            <div className="card-body">
              <div className="table-responsive text-nowrap">
                <table className="table table-striped w-12">
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
                            <button
                              type="button"
                              className="btn btn-outline-primary btn-sm m-1 waves-effect"
                              variant="default"
                              style={{ color: "blue", cursor: "pointer" }}
                              onClick={() => handleEditClick(s)}
                            >
                              <BsPencilSquare />
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-danger btn-sm m-1 waves-effect"
                              variant="default"
                              style={{ color: "red", cursor: "pointer" }}
                              onClick={() => handleDeleteClick(s)}
                            >
                              <BsFillTrashFill />
                            </button>
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </Template>
  );
}
