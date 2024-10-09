import axios from "../../contexts/api/axios";
import GetUserData from "../../contexts/api/udata";

import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import Header from "../../components/header/header";
import Sidebar from "../../components/sidebar/sidebar";
import Template from "../../components/template/template";

import "../../assets/styles/maForm.css";

const url_req = `boutique/`;

export default function EditBoutique() {
  //#region //-useEffect
  const { id } = useParams();
  const navigate = useNavigate();
  const u_info = GetUserData();

  const initialInputs = {
    nom: "",
    prix: "",
    idB: "",
  };

  const [inputs, setInputs] = useState(initialInputs);
  const [erreurs, setErreurs] = useState({
    nom: false,
    prix: false,
    idB: false,
  });
  const [messages, setMessages] = useState({
    nom: "",
    prix: "",
    idB: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  //#endregion

  //#region //-handleChange
  const handleChange = (event) => {
    const { name, value } = event.target;
    setInputs((values) => ({ ...values, [name]: value }));
    setErreurs((values) => ({ ...values, [name]: false }));
    setMessages((values) => ({ ...values, [name]: "" }));

    if (name === "prix" && isNaN(value)) {
      setErreurs((values) => ({ ...values, prix: true }));
      setMessages((values) => ({
        ...values,
        prix: "Le prix doit être un nombre",
      }));
    }

    if (name === "idB" && isNaN(value)) {
      setErreurs((values) => ({ ...values, idB: true }));
      setMessages((values) => ({
        ...values,
        idB: "Le IDB doit être un nombre",
      }));
    }

    if (name === "nom" && value.length > 50) {
      setErreurs((values) => ({ ...values, nom: true }));
      setMessages((values) => ({
        ...values,
        nom: "Nom trop long",
      }));
    }
  };
  //#endregion

  //#region //-validation
  const validation = (event) => {
    event.preventDefault();
    let formIsValid = true;

    if (!inputs["prix"]) {
      setInputs((prevInputs) => ({
        ...prevInputs,
        prix: 0,
      }));
    }

    if (!inputs["idB"]) {
      setInputs((prevInputs) => ({
        ...prevInputs,
        idB: 1,
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
      .get(`boutique/${id}`, u_info.opts)
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

  // Utilisation de useEffect pour soumettre après mise à jour de prix
  useEffect(() => {
    if (isSubmitting && inputs.prix) {
      onSubmit();
    }
  }, [inputs.prix, isSubmitting]);
  //#endregion

  //#region //-onSubmit
  const onSubmit = () => {
    axios
      .put(url_req + `${id}`, inputs, u_info.opts)
      .then((response) => {
        if (response.status === 200 && response.data.success) {
          toast.success(response.data.message);
          navigate("/boutiques/");
        } else {
          toast.error(
            response.data.message || "Échec lors de la modification!"
          );
        }
      })
      .catch(() => {
        toast.error("Erreur lors de la modification du boutique.");
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };
  //#endregion

  //#region //-onClose
  const onClose = () => {
    setInputs(initialInputs);
    setErreurs({ nom: false, prix: false, idB: false });
    setMessages({ nom: "", prix: "", idB: "" });
    navigate("/boutiques/");
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
                <header>Modifier une Boutique</header>
                <form>
                  <div className="form first">
                    <div className="details personal">
                      <div className="fields">
                        <div className="input-field">
                          <label>Nom :</label>
                          <input
                            type="text"
                            name="nom"
                            onChange={handleChange}
                            value={inputs.nom}
                            placeholder="Entrez le nom du boutique"
                            autoComplete="off"
                          />
                        </div>
                        <div className="input-field">
                          <label>Prix :</label>
                          <input
                            type="number"
                            name="prix"
                            onChange={handleChange}
                            value={inputs.prix}
                            placeholder="Entrez le prix proposé"
                            autoComplete="off"
                            min={0}
                            max={99999}
                          />
                          <small className="text-danger d-block">
                            {erreurs.prix ? messages.prix : null}
                          </small>
                        </div>
                        <div className="input-field">
                          <label>IDB :</label>
                          <input
                            type="number"
                            name="idB"
                            onChange={handleChange}
                            value={inputs.idB}
                            placeholder="Entrez l'service associer"
                            autoComplete="off"
                            min={0}
                            max={99999}
                          />
                          <small className="text-danger d-block">
                            {erreurs.idB ? messages.idB : null}
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
