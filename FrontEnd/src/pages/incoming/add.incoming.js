import axios from "../../contexts/api/axios";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Template from "../../components/template/template";
import GetUserData from "../../contexts/api/udata";

const url_req = `histo/`;
const searchUrl = `service/recherche/`;

export default function AddInComing() {
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

  const [filteredServices, setFilteredServices] = useState([]);
  const [isServiceSelected, setIsServiceSelected] = useState(false); // Nouvel état

  const getSomeService = (val) => {
    setIsServiceSelected(false); // Réinitialiser lorsque l'utilisateur commence à taper
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
      .catch((error) => {
        toast.error("Erreur lors de la recherche des services.");
      });
  };

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

    if (name === "coms") {
      if (value.length > 150) {
        setErreurs((values) => ({ ...values, coms: true }));
        setMessages((values) => ({
          ...values,
          coms: "Commentaire trop long",
        }));
      }
    }

    if (name === "nomS") {
      getSomeService(value);
    }
  };

  const handleSelectService = (serviceId, serviceNom) => {
    setInputs((values) => ({
      ...values,
      idS: serviceId,
      nomS: serviceNom,
    }));
    setFilteredServices([]);
    setIsServiceSelected(true); // Mettre à jour lorsqu'un service est sélectionné
  };

  const validation = (event) => {
    event.preventDefault();

    const inputsObligatoires = ["qte", "idS"];

    let formIsValid = true;

    inputsObligatoires.forEach((element) => {
      if (!inputs[element]) {
        setErreurs((values) => ({ ...values, [element]: true }));
        setMessages((values) => ({
          ...values,
          [element]: "Champ obligatoire!",
        }));
        formIsValid = false;
      }
    });

    if (formIsValid) {
      onSubmit();
    }
  };

  const onSubmit = () => {
    const updatedInputs = {
      ...inputs,
      idM: u_info.u_id,
      karazana: 1,
    };
    axios
      .post(url_req, updatedInputs, u_info.opts)
      .then((response) => {
        if (response.status === 200 && response.data.success) {
          toast.success(response.data.message);
          navigate("/incoming/");
        } else {
          toast.error(response.data.message || "Échec de l'ajout!");
        }
      })
      .catch((error) => {
        toast.error("Erreur lors de l'ajout du service.");
      });
  };

  const onClose = () => {
    setInputs(initialInputs);
    setErreurs({ coms: false, qte: false, idS: false });
    setMessages({ coms: "", qte: "", idS: "" });
    navigate("/incoming/");
  };

  return (
    <Template>
      <div>
        <h2>Ajouter un Service</h2>
        <form>
          <div>
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
            {inputs.nomS && !isServiceSelected &&
              (filteredServices.length > 0 ? (
                <ul>
                  {filteredServices.map((service) => (
                    <li
                      key={service.id}
                      onClick={() =>
                        handleSelectService(service.id, service.nom)
                      }
                    >
                      {service.nom}
                    </li>
                  ))}
                </ul>
              ) : (
                <span>aucune</span>
              ))}
          </div>
          <div>
            <label>Quantité :</label>
            <input
              type="number"
              name="qte"
              onChange={handleChange}
              value={inputs.qte}
              placeholder="Entrez la quantité du service"
              autoComplete="off"
              maxLength={1}
              min={0}
              max={99999}
            />
            <small className="text-danger d-block">
              {erreurs.qte ? messages.qte : null}
            </small>
          </div>
          <div>
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
          <div>
            <button onClick={validation} type="submit">
              <span>Ajouter</span>
            </button>
            <button onClick={onClose} type="button">
              <span>Annuler</span>
            </button>
          </div>
        </form>
      </div>
    </Template>
  );
}
