import axios from "../../contexts/api/axios";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Template from "../../components/template/template";
import GetUserData from "../../contexts/api/udata";
import "../../assets/styles/maForm.css";

const url_req = `histo/`;

export default function EditInComing() {
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

  // Utilisation de useEffect pour soumettre après mise à jour de qte
  useEffect(() => {
    if (isSubmitting && inputs.qte) {
      onSubmit();
    }
  }, [inputs.qte, isSubmitting]);

  const onSubmit = () => {
    const finalInputs = {
      ...inputs,
      idM: u_info.u_id,
      karazana: 1,
    };

    axios
      .put(url_req + `${id}`, finalInputs, u_info.opts)
      .then((response) => {
        if (response.status === 200 && response.data.success) {
          toast.success(response.data.message);
          navigate("/incoming/");
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

  const onClose = () => {
    setInputs(initialInputs);
    setErreurs({ coms: false, qte: false });
    setMessages({ coms: "", qte: "" });
    navigate("/incoming/");
  };

  return (
    <Template>
      <div className="monContainer">
        <header>Modifier un Gain</header>
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
    </Template>
  );
}
