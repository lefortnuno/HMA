import axios from "../../contexts/api/axios";
import GetUserData from "../../contexts/api/udata";

import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import Header from "../../components/header/header";
import Sidebar from "../../components/sidebar/sidebar";
import Template from "../../components/template/template";

import "../../assets/styles/maForm.css";

const url_req = `histo/`;

export default function EditOutGoing() {
  //#region //-useEffect
  const { id } = useParams();
  const navigate = useNavigate();
  const u_info = GetUserData();

  const initialInputs = {
    coms: "",
    qte: "",
  };

  const [inputs, setInputs] = useState(initialInputs);
  const [erreurs, setErreurs] = useState({
    coms: false,
    qte: false,
  });
  const [messages, setMessages] = useState({
    coms: "",
    qte: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
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
  };
  //#endregion

  //#region //-validation
  const validation = (event) => {
    event.preventDefault();
    let formIsValid = true;

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
  useEffect(() => {
    axios
      .get(`histo/${id}`, u_info.opts)
      .then((response) => {
        if (response.status === 200) {
          setInputs(response.data[0]);
        } else {
          toast.warning("Détails non disponibles.");
        }
      })
      .catch((error) => {
        toast.error("Erreur lors du chargement des détails.");
      });
  }, []);

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
      .put(url_req + `${id}`, finalInputs, u_info.opts)
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
        setIsSubmitting(false);
      });
  };
  //#endregion

  //#region //-onClose
  const onClose = () => {
    setInputs(initialInputs);
    setErreurs({ coms: false, qte: false });
    setMessages({ coms: "", qte: "" });
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
              <div className="monContainer bg-white card mb-3 ">
                <header>Modifier une Dépense</header>
                <form>
                  <div className="form first">
                    <div className="details personal">
                      <div className="fields">
                        <div className="input-field">
                          <label>Service :</label>
                          <input
                            style={{
                              backgroundColor: "rgb(218, 218, 218)",
                              fontWeight: "800",
                            }}
                            value={inputs.snom}
                            disabled={true}
                          />
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
