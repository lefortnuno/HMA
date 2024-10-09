import axios from "../../contexts/api/axios";
import GetUserData from "../../contexts/api/udata";

import Header from "../../components/header/header";
import Sidebar from "../../components/sidebar/sidebar";
import More from "../../components/more/more";
import Template from "../../components/template/template";
import Pagination from "../../components/pagination/pagination";
import DeleteModal from "../../components/modals/delete";

import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { FaPlus } from "react-icons/fa";
import {
  BsFillTrashFill,
  BsPencilSquare,
  BsEye,
  BsPersonPlusFill,
  BsSearch,
} from "react-icons/bs";

// import "./service.css";

const url_req = `boutique/`;
const histoPerPage = 5;

export default function Boutique() {
  //#region //-variable
  const u_info = GetUserData();
  const [histo, setHisto] = useState([]);
  const [totaly, setTotaly] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const navigate = useNavigate();
  const [searchVisible, setSearchVisible] = useState(false);
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (searchVisible && searchInputRef.current) {
      searchInputRef.current.focus(); // Met l'auto-focus sur l'input quand il est visible
      setCurrentPage(1);
    }
  }, [searchVisible]);

  useEffect(() => {
    getHisto();
    getTotaly();
  }, []);
  //#endregion

  //#region //-histo
  function getHisto() {
    axios
      .get(url_req, u_info.opts)
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
        toast.error("Erreur lors du chargement des données!");
        setHisto([]); // Gérer l'erreur en réinitialisant les histo à un tableau vide
      });
  }
  function getTotaly() {
    axios
      .get(url_req + `boutiqueTtl/`, u_info.opts)
      .then(function (response) {
        if (response.status === 200) {
          const allHisto = response.data[0];
          setTotaly(allHisto);
        } else {
          toast.warning("Vous n'êtes pas autorisé à accéder à cette page!");
        }
      })
      .catch((error) => {
        toast.error("Erreur lors du chargement des données!");
        setTotaly([]);
      });
  }
  //#endregion

  //#region //-modals
  const handleDeleteClick = (histo) => {
    setSelectedEntity(histo);
    setShowDeleteModal(true);
  };
  const handleDeleteConfirm = () => {
    setShowDeleteModal(false);
    getHisto();
    getTotaly();
  };

  const handleEditClick = (entity) => {
    navigate(`/editBoutique/${entity.id}`, { state: { entity } });
  };

  const handleDetailClick = (entity) => {
    navigate(`/aboutBoutique/${entity.id}`, { state: { entity } });
  };
  //#endregion

  //#region //-search
  const indexOfLastService = currentPage * histoPerPage;
  const indexOfFirstService = indexOfLastService - histoPerPage;
  const currentHisto = histo.slice(indexOfFirstService, indexOfLastService);

  const toggleSearch = () => {
    setSearchVisible(!searchVisible);
  };
  const [contenuTab, setContenuTab] = useState(false);

  function rechercheElement(event) {
    const valeur = event.target.value;
    if (!valeur) {
      getHisto();
      setContenuTab(false);
    } else {
      const finalInputs = {
        val: valeur,
      };

      axios
        .post(url_req + `recherche/`, finalInputs, u_info.opts)
        .then((response) => {
          if (response.data.success) {
            setHisto(response.data.res);
            setContenuTab(true);
          } else {
            setHisto(response.data.res);
            setContenuTab(false);
          }
        });
    }
  }
  //#endregion

  //#region //-html
  return (
    <Template>
      <Header>
        {!searchVisible && (
          <BsSearch className="searchIcon" onClick={toggleSearch} />
        )}
        {searchVisible && (
          <input
            type="text"
            name="searchValue"
            placeholder="Rechercher ...."
            autoComplete="off"
            className="form-control text-dark"
            ref={searchInputRef}
            onBlur={() => setSearchVisible(false)}
            onChange={rechercheElement}
          />
        )}
      </Header>

      <div className="container-fluid flex-grow-1">
        <div className="row">
          <Sidebar />

          <main className="col-md-9 ms-sm-auto col-lg-10 px-md-4 main">
            <div className="pt-3 pb-2 mb-3">
              {/* -------------------------- PAGE CONTENT -------------------------- */}
              <div className="text-center my-3 mt-0">
                <div className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center">
                    <h5 className="mb-0 me-2 position-relative d-inline-block">
                      Liste des Boutiques :-
                      <Link
                        to={"/newBoutique/"}
                        className="add-icon mx-1"
                        title="Ajout"
                      >
                        <FaPlus />
                      </Link>
                      -:
                      <span className="green-underline"></span>
                    </h5>
                  </div>
                  <h5 className="mb-0 me-2 position-relative d-inline-block">
                    Total :{" "}
                    <span className="totaly">
                      {totaly.isaTtl !== null && totaly.isaTtl !== undefined
                        ? totaly.isaTtl
                        : "0"}
                    </span>{" "}
                    !
                  </h5>
                </div>
              </div>

              <div className="table-responsive text-nowrap">
                <table className="table table-striped w-100">
                  <thead>
                    <tr>
                      <th>Nom</th>
                      <th>Prix</th>
                      <th>IDB</th>
                      <th>+Details</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentHisto.length > 0 ? (
                      currentHisto.map((s, key) => (
                        <tr key={key}>
                          <td>{s.nom}</td>
                          <td>{s.prix}</td>
                          <td>{s.idB}</td>
                          <td>
                            <span
                              className="btn btn-outline-success btn-sm pt-0 mx-1 waves-effect"
                              onClick={() => handleDetailClick(s)}
                            >
                              <BsEye />
                            </span>
                          </td>
                          <td>
                            <span
                              className="btn btn-outline-primary btn-sm pt-0 mx-1 waves-effect"
                              onClick={() => handleEditClick(s)}
                            >
                              <BsPencilSquare />
                            </span>
                            <span
                              className="btn btn-outline-danger btn-sm pt-0 mx-1 waves-effect"
                              onClick={() => handleDeleteClick(s)}
                            >
                              <BsFillTrashFill />
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="10">Aucune donnée disponible</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

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
                  entityName={"boutique"}
                  auth={u_info.opts}
                />
              )}
              {/* -------------------------- FIN -------------------------- */}
            </div>
            <More />
          </main>
        </div>
      </div>
    </Template>
  );
  //#endregion
}
