import axios from "../../contexts/api/axios";
import GetUserData from "../../contexts/api/udata";

import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import Header from "../../components/header/header";
import Sidebar from "../../components/sidebar/sidebar";
import Template from "../../components/template/template";

import "../../assets/styles/maForm.css";

const url_req = `histo/`;
const searchUrl = `service/recherche/`;

export default function AddOutGoing() {
  //#region //-variable
  const navigate = useNavigate();
  const u_info = GetUserData();

  const initialInputs = {
    coms: "",
    qte: "",
    idS: "",
    nomS: "",
  };

  const [inputs, setInputs] = useState(initialInputs);
  const [erreurs, setErreurs] = useState({
    coms: false,
    qte: false,
    idS: false,
    nomS: "",
  });
  const [messages, setMessages] = useState({
    coms: "",
    qte: "",
    idS: "",
    nomS: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false); // Ajout d'un état de soumission
  const [filteredServices, setFilteredServices] = useState([]);
  const [isServiceSelected, setIsServiceSelected] = useState(false);
  //#endregion

  //#region //-getService
  const getSomeService = (val) => {
    setIsServiceSelected(false);
    axios
      .post(searchUrl, { query: val }, u_info.opts)
      .then((response) => {
        if (response.status === 200) {
          setFilteredServices(response.data.res);
        } else {
          toast.error(
            response.data.message ||
              "Erreur lors de la récupération des services."
          );
        }
      })
      .catch(() => {
        toast.error("Erreur lors de la recherche des services.");
      });
  };
  //#endregion

  //#region //-handleChange
  const handleChange = (event) => {
    const { name, value } = event.target;
    setInputs((values) => ({ ...values, [name]: value }));
    setErreurs((values) => ({ ...values, [name]: false }));
    setMessages((values) => ({ ...values, [name]: "" }));

    if (name === "qte" && isNaN(value)) {
      setErreurs((values) => ({ ...values, qte: true }));
      setMessages((values) => ({
        ...values,
        qte: "La quantité doit être un nombre",
      }));
    }

    if (name === "coms" && value.length > 150) {
      setErreurs((values) => ({ ...values, coms: true }));
      setMessages((values) => ({
        ...values,
        coms: "Commentaire trop long",
      }));
    }

    if (name === "nomS") {
      getSomeService(value);
    }
  };
  //#endregion

  //#region //-handleSelect
  const handleSelectService = (serviceId, serviceNom) => {
    setInputs((values) => ({
      ...values,
      idS: serviceId,
      nomS: serviceNom,
    }));
    setFilteredServices([]);
    setIsServiceSelected(true);
    setErreurs((values) => ({ ...values, nomS: false }));
    setMessages((values) => ({ ...values, nomS: "" }));
  };
  //#endregion

  //#region //-validation
  const validation = (event) => {
    event.preventDefault();
    let formIsValid = true;

    if (!inputs["idS"]) {
      setErreurs((values) => ({ ...values, nomS: true }));
      setMessages((values) => ({
        ...values,
        nomS: "Champ service obligatoire!",
      }));
      formIsValid = false;
    }

    if (!inputs["qte"]) {
      setInputs((prevInputs) => ({
        ...prevInputs,
        qte: 1,
      }));
    }

    if (formIsValid) {
      setIsSubmitting(true); // Déclencher la soumission après mise à jour
    }
  };
  //#endregion

  //#region //-useEffect
  // Utilisation de useEffect pour soumettre après mise à jour de qte
  useEffect(() => {
    if (isSubmitting && inputs.qte) {
      onSubmit();
    }
  }, [inputs.qte, isSubmitting]);
  //#endregion

  //#region //-onSubmit
  const onSubmit = () => {
    const finalInputs = {
      ...inputs,
      idM: u_info.u_id,
      karazana: 0,
    };

    axios
      .post(url_req, finalInputs, u_info.opts)
      .then((response) => {
        if (response.status === 200 && response.data.success) {
          toast.success(response.data.message);
          navigate("/outGoing/");
        } else {
          toast.error(response.data.message || "Échec de l'ajout!");
        }
      })
      .catch(() => {
        toast.error("Erreur lors de l'ajout du service.");
      })
      .finally(() => {
        setIsSubmitting(false); // Réinitialiser après soumission
      });
  };
  //#endregion

  //#region //-onClose
  const onClose = () => {
    setInputs(initialInputs);
    setErreurs({ coms: false, qte: false, idS: false });
    setMessages({ coms: "", qte: "", idS: "" });
    navigate("/outGoing/");
  };
  //#endregion

  //#region //-design
  return (
    <Template>
      <Header></Header>

      <div className="container-fluid flex-grow-1">
        <div className="row">
          <Sidebar />

          <main className="col-md-9 ms-sm-auto col-lg-10 px-md-4 main">
            {/* -------------------------- PAGE CONTENT -------------------------- */}
            <div className="pt-3 pb-2 mb-3">
              <div className="monContainer bg-white card mb-3">
                <header>Ajouter un Dépense</header>
                <form>
                  <div className="form first">
                    <div className="details personal">
                      <div className="fields">
                        <div className="input-field">
                          <label>Service :</label>
                          <input
                            name="nomS"
                            onChange={handleChange}
                            type="text"
                            value={inputs.nomS}
                            placeholder="Recherchez un service..."
                            autoComplete="off"
                          />
                          <small className="text-danger d-block">
                            {erreurs.nomS ? messages.nomS : null}
                          </small>
                          {inputs.nomS &&
                            !isServiceSelected &&
                            (filteredServices.length > 0 ? (
                              <ul>
                                {filteredServices.map((service) => (
                                  <li
                                    key={service.id}
                                    onClick={() =>
                                      handleSelectService(
                                        service.id,
                                        service.nom
                                      )
                                    }
                                  >
                                    {service.nom}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <ul className="aucuneUl">
                                <li className="aucuneLi">aucune</li>
                              </ul>
                            ))}
                        </div>
                        <div className="input-field">
                          <label>Quantité :</label>
                          <input
                            type="number"
                            name="qte"
                            onChange={handleChange}
                            value={inputs.qte}
                            placeholder="Entrez la quantité du service"
                            autoComplete="off"
                            min={0}
                            max={99999}
                          />
                          <small className="text-danger d-block">
                            {erreurs.qte ? messages.qte : null}
                          </small>
                        </div>
                        <div className="input-field">
                          <label>Commentaires :</label>
                          <input
                            type="text"
                            name="coms"
                            onChange={handleChange}
                            value={inputs.coms}
                            placeholder="Entrez un commentaire"
                            autoComplete="off"
                          />
                          <small className="text-danger d-block">
                            {erreurs.coms ? messages.coms : null}
                          </small>
                        </div>
                      </div>

                      <div className="buttons">
                        <button
                          onClick={onClose}
                          type="button"
                          className="backBtn btn btn-danger"
                        >
                          <span>Annuler</span>
                        </button>
                        <button
                          onClick={validation}
                          type="submit"
                          className="nextBtn btn btn-success"
                        >
                          <span>Enregistrer</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>
            {/* -------------------------- FIN -------------------------- */}
          </main>
        </div>
      </div>
    </Template>
  );
  //#endregion
}
