import axios from "../../contexts/api/axios";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";

const URL_DE_BASE = `utilisateur/`;

export default function SignInForm() {
  const navigate = useNavigate();

  const initialInputs = {
    nom: "",
    prenom: "",
    idPS: "",
    pwd: "",
    pwd0: "",
    pwd1: "",
    pwd2: "",
    pwd3: "",
  };

  const [inputs, setInputs] = useState(initialInputs);
  const [erreurs, setErreurs] = useState({
    nom: false,
    prenom: false,
    idPS: false,
    pwd: false,
  });
  const [messages, setMessages] = useState({
    nom: "",
    prenom: "",
    idPS: "",
    pwd: "",
  });

  const pwdRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  const [disabledInputs, setDisabledInputs] = useState({
    pwd0: true,
    pwd1: true,
    pwd2: true,
    pwd3: true,
  });

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    const inputValue = type === "checkbox" ? checked : value;

    setInputs((values) => ({ ...values, [name]: inputValue }));
    setErreurs((values) => ({ ...values, [name]: false }));
    setMessages((values) => ({ ...values, [name]: "" }));

    if (name === "idPS") {
      if (value.length === 0) {
        setErreurs((values) => ({ ...values, [name]: true }));
        setMessages((values) => ({
          ...values,
          [name]: "Champ obligatoire!",
        }));
      } else if (value.length < 4) {
        setErreurs((values) => ({ ...values, [name]: true }));
        setMessages((values) => ({
          ...values,
          [name]: "Valeur champ trop court",
        }));
      } else if (value.length > 12) {
        setErreurs((values) => ({ ...values, [name]: true }));
        setMessages((values) => ({
          ...values,
          [name]: "Valeur champ trop long",
        }));
      }
    }

    if (name === "nom" || name === "prenom") {
      if (value.length === 0) {
        setErreurs((values) => ({ ...values, [name]: true }));
        setMessages((values) => ({
          ...values,
          [name]: "Champ obligatoire!",
        }));
      } else if (value.length < 2) {
        setErreurs((values) => ({ ...values, [name]: true }));
        setMessages((values) => ({
          ...values,
          [name]: "Valeur champ trop court",
        }));
      } else if (value.length > 150) {
        setErreurs((values) => ({ ...values, [name]: true }));
        setMessages((values) => ({
          ...values,
          [name]: "Valeur champ trop long",
        }));
      }
    }
  };

  const handleChangePwd = (event) => {
    const { name, value } = event.target;

    if (/^[0-9]$/.test(value)) {
      setInputs((values) => ({ ...values, [name]: value }));
      setErreurs((values) => ({ ...values, pwd: false }));
      setMessages((values) => ({ ...values, pwd: "" }));

      switch (name) {
        case "pwd0":
          setDisabledInputs((prevState) => ({ ...prevState, pwd1: false }));
          setDisabledInputs((prevState) => ({ ...prevState, pwd0: true }));
          break;
        case "pwd1":
          setDisabledInputs((prevState) => ({ ...prevState, pwd2: false }));
          setDisabledInputs((prevState) => ({ ...prevState, pwd1: true }));
          break;
        case "pwd2":
          setDisabledInputs((prevState) => ({ ...prevState, pwd3: false }));
          setDisabledInputs((prevState) => ({ ...prevState, pwd2: true }));
          break;
        case "pwd3":
          break;
        default:
          break;
      }
    } else {
      setInputs((values) => ({ ...values, [name]: "" }));
      setErreurs((values) => ({ ...values, pwd: true }));
      setMessages((values) => ({
        ...values,
        pwd: "Valeur valide [0-9]",
      }));

      switch (name) {
        case "pwd0":
          break;
        case "pwd1":
          setDisabledInputs((prevState) => ({ ...prevState, pwd1: true }));
          setDisabledInputs((prevState) => ({ ...prevState, pwd0: false }));
          break;
        case "pwd2":
          setDisabledInputs((prevState) => ({ ...prevState, pwd2: true }));
          setDisabledInputs((prevState) => ({ ...prevState, pwd1: false }));
          break;
        case "pwd3":
          setDisabledInputs((prevState) => ({ ...prevState, pwd3: true }));
          setDisabledInputs((prevState) => ({ ...prevState, pwd2: false }));
          break;
        default:
          break;
      }
    }
  };

  const validation = (event) => {
    event.preventDefault();

    const inputsObligatoire = ["nom", "prenom", "idPS", "pwd"];

    let formIsValid = true;

    inputsObligatoire.forEach((element) => {
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
    axios.post(URL_DE_BASE, inputs).then((response) => {
      if (response.status === 200) {
        if (response.data.success) {
          toast.success(response.data.message);
          onClose();
        } else {
          toast.error(response.data.message);
        }
      } else {
        toast.error("Échec de l'ajout!");
      }
    });
  };

  function onClose() {
    setInputs(initialInputs);
    setErreurs({
      nom: false,
      prenom: false,
      idPS: false,
      pwd: false,
    });
    setDisabledInputs({
      pwd0: true,
      pwd1: true,
      pwd2: true,
      pwd3: true,
    }); 

    navigate("/");
  }

  useEffect(() => {
    pwdRefs.forEach((ref, index) => {
      if (!disabledInputs[`pwd${index}`] && ref.current) {
        ref.current.focus();
      }
    });
  }, [disabledInputs]);

  const isInfoCompleteAndValid =
    inputs.nom &&
    inputs.prenom &&
    inputs.idPS &&
    !erreurs.nom &&
    !erreurs.prenom &&
    !erreurs.idPS;

  useEffect(() => {
    if (isInfoCompleteAndValid) {
      setDisabledInputs((prevState) => ({ ...prevState, pwd0: false }));
    } else {
      setDisabledInputs((prevState) => ({
        ...prevState,
        pwd0: true,
        pwd1: true,
        pwd2: true,
        pwd3: true,
      }));
      setInputs((prevState) => ({
        ...prevState,
        pwd: "",
        pwd0: "",
        pwd1: "",
        pwd2: "",
        pwd3: "",
      }));
    }
  }, [isInfoCompleteAndValid]);

  const isPwdCompleteAndValid =
    inputs.pwd0 && inputs.pwd1 && inputs.pwd2 && inputs.pwd3;

  useEffect(() => {
    if (isPwdCompleteAndValid) {
      const newPwd = `${inputs.pwd0}${inputs.pwd1}${inputs.pwd2}${inputs.pwd3}`;
      setInputs((prevState) => ({ ...prevState, pwd: newPwd }));
    }
  }, [isPwdCompleteAndValid]);

  return (
    <>
      <form>
        <div>
          <label>Nom :</label>
          <input
            type="text"
            name="nom"
            onChange={handleChange}
            autoComplete="off"
            placeholder="Entrez votre Nom"
          />
          <small className="text-danger d-block">
            {erreurs.nom ? messages.nom : null}
          </small>
        </div>
        <div>
          <label>Prénom :</label>
          <input
            type="text"
            name="prenom"
            onChange={handleChange}
            autoComplete="off"
            placeholder="Entrez votre Prénom"
          />
          <small className="text-danger d-block">
            {erreurs.prenom ? messages.prenom : null}
          </small>
        </div>
        <div>
          <label>Identifiant :</label>
          <input
            type="text"
            name="idPS"
            onChange={handleChange}
            autoComplete="off"
            placeholder="Entrez votre identifiant"
          />
          <small className="text-danger d-block">
            {erreurs.idPS ? messages.idPS : null}
          </small>
        </div>
        {isInfoCompleteAndValid && (
          <div>
            <label>Mot de passe :</label>
            {pwdRefs.map((ref, index) => (
              <input
                key={index}
                type="password"
                name={`pwd${index}`}
                onChange={handleChangePwd}
                autoComplete="off"
                ref={ref}
                maxLength={1}
                value={inputs[`pwd${index}`]}
                disabled={disabledInputs[`pwd${index}`]}
              />
            ))}
            <small className="text-danger d-block">
              {erreurs.pwd ? messages.pwd : null}
            </small>
          </div>
        )}
        <div>
          <button onClick={onClose} type="button">
            <span> Annuler</span>
          </button>

          <button onClick={validation} type="submit">
            <span> Enregistrer</span>
          </button>
        </div>
      </form>
    </>
  );
}
