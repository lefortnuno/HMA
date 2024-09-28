import axios from "../../contexts/api/axios";
import GetUserData from "../../contexts/api/udata";
import Header from "../../components/header/header";
import Sidebar from "../../components/sidebar/sidebar";
import Footer from "../../components/footer/footer";
import Pagination from "../../components/pagination/pagination";
import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import DeleteModal from "../../components/modals/delete";
import { Link, useNavigate } from "react-router-dom";
import { FaPlus } from "react-icons/fa";
import {
  BsFillTrashFill,
  BsPencilSquare,
  BsEye,
  BsPersonPlusFill,
  BsSearch,
} from "react-icons/bs";
import "./incoming.css";

const url_req = `histo/incoming/`;
const histoPerPage = 5;

export default function InComing() {
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
    }else{
      getHisto();
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
  function getTotaly() {
    axios
      .get(`histo/incomingTtl/${u_info.u_id}`, u_info.opts)
      .then(function (response) {
        if (response.status === 200) {
          const allHisto = response.data[0];
          setTotaly(allHisto);
        } else {
          toast.warning("Vous n'êtes pas autorisé à accéder à cette page!");
        }
      })
      .catch((error) => {
        toast.error("Erreur lors du chargement des histo.");
        setTotaly([]);
      });
  }
  //#endregion

  //#region //-modals
  const indexOfLastService = currentPage * histoPerPage;
  const indexOfFirstService = indexOfLastService - histoPerPage;
  const currentHisto = histo.slice(indexOfFirstService, indexOfLastService);

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
    navigate(`/editIncoming/${entity.id}`, { state: { entity } });
  };

  const handleDetailClick = (entity) => {
    navigate(`/aboutIncoming/${entity.id}`, { state: { entity } });
  };
  //#endregion

  //#region //-search
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
        idM: u_info.u_id,
        val: valeur,
      };

      axios
        .post(`histo/recherche`, finalInputs, u_info.opts)
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

  return (
    <>
      <Sidebar />
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
            className="form-control text-primary"
            ref={searchInputRef}
            onBlur={() => setSearchVisible(false)} 
            onChange={rechercheElement}
          />
        )}
      </Header>
      <div className="container">
        <div className="contenu">
          <div className="text-center my-3 mt-0">
            <div className="d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center">
                <h5 className="mb-0 me-2 position-relative d-inline-block">
                  Historique d'entree d'argent :-
                  <Link
                    to={"/newIncoming/"}
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
                  {totaly.montantTtl !== null && totaly.montantTtl !== undefined
                    ? totaly.montantTtl
                    : "0.0"}
                </span>{" "}
                dhs
              </h5>
            </div>
          </div>

          <div className="table-responsive text-nowrap">
            <table className="table table-striped w-100">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Nom</th>
                  <th>Montant</th>
                  <th>Coms</th>
                  <th>+Details</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentHisto.length > 0 ? (
                  currentHisto.map((s, key) => (
                    <tr key={key}>
                      <td>{s.date}</td>
                      <td>{s.snom}</td>
                      <td>{s.montant}</td>
                      <td>{s.coms == "" ? "/" : s.coms} </td>
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
              entityName={"histo"}
              auth={u_info.opts}
            />
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
