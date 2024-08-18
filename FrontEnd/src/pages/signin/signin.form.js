import axios from "../../contexts/api/axios";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";

const URL_DE_BASE = `utilisateur/`;

export default function SignInForm() {
  //#region // FONC
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
          [name]: "Identifiant obligatoire!",
        }));
      } else if (value.length < 4) {
        setErreurs((values) => ({ ...values, [name]: true }));
        setMessages((values) => ({
          ...values,
          [name]: "Identifiant trop court!",
        }));
      } else if (value.length > 12) {
        setErreurs((values) => ({ ...values, [name]: true }));
        setMessages((values) => ({
          ...values,
          [name]: "Identifiant trop long!",
        }));
      }
    }

    if (name === "nom") {
      if (value.length === 0) {
        setErreurs((values) => ({ ...values, [name]: true }));
        setMessages((values) => ({
          ...values,
          [name]: "Nom obligatoire!",
        }));
      } else if (value.length < 2) {
        setErreurs((values) => ({ ...values, [name]: true }));
        setMessages((values) => ({
          ...values,
          [name]: "Nom trop court!",
        }));
      } else if (value.length > 25) {
        setErreurs((values) => ({ ...values, [name]: true }));
        setMessages((values) => ({
          ...values,
          [name]: "Nom trop long!",
        }));
      }
    }
    if (name === "prenom") {
      if (value.length === 0) {
        setErreurs((values) => ({ ...values, [name]: true }));
        setMessages((values) => ({
          ...values,
          [name]: "Prénom obligatoire!",
        }));
      } else if (value.length < 2) {
        setErreurs((values) => ({ ...values, [name]: true }));
        setMessages((values) => ({
          ...values,
          [name]: "Prénom trop court!",
        }));
      } else if (value.length > 50) {
        setErreurs((values) => ({ ...values, [name]: true }));
        setMessages((values) => ({
          ...values,
          [name]: "Prénom trop long!",
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
        pwd: "Valeur valide [0-9]!",
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
        formIsValid = false;
        setErreurs((values) => ({ ...values, [element]: true }));
        switch (element) {
          case "idPS":
            setMessages((values) => ({
              ...values,
              [element]: "Identifiant obligatoire!",
            }));
            break;
          case "pwd":
            setMessages((values) => ({
              ...values,
              [element]: "Code secret obligatoire!",
            }));
            break;
          case "nom":
            setMessages((values) => ({
              ...values,
              [element]: "Nom obligatoire!",
            }));
            break;
          case "prenom":
            setMessages((values) => ({
              ...values,
              [element]: "Prénom obligatoire!",
            }));
            break;
          default:
            // Optionnel : gérer les cas non spécifiés si nécessaire
            break;
        }
      }
    });

    if (formIsValid) {
      onSubmit();
    }
  };

  const onSubmit = () => {
    axios
      .post(URL_DE_BASE, inputs)
      .then((response) => {
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
      })
      .catch((error) => {
        setErreurs((values) => ({ ...values, messageErreur: true }));
        setMessages((values) => ({
          ...values,
          messageErreur: "Veuillez vous connecter au serveur!",
        }));
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
  //#endregion

  return (
    <>
      <form>
        <span>
          {erreurs.messageErreur ? (
            <p className="text-danger d-block">{messages.messageErreur}</p>
          ) : null}
        </span>
        <div className="idAndName">
          <div className="labelInput">
            <label>Identifiant :</label>
            <div className="inputRow">
              <input
                type="text"
                name="idPS"
                onChange={handleChange}
                autoComplete="off"
                placeholder="Créez votre Identifiant"
              />
            </div>
            <small className="text-danger d-block text-center">
              {erreurs.idPS ? messages.idPS : null}
            </small>
          </div>
          <div className="labelInput">
            <label>Nom :</label>
            <div className="inputRow">
              <input
                type="text"
                name="nom"
                onChange={handleChange}
                autoComplete="off"
                placeholder="Entrez votre Nom"
              />
            </div>
            <small className="text-danger d-block text-center">
              {erreurs.nom ? messages.nom : null}
            </small>
          </div>
        </div>
        <div className="labelInput">
          <label>Prénom :</label>
          <div className="inputRow">
            <input
              type="text"
              name="prenom"
              onChange={handleChange}
              autoComplete="off"
              placeholder="Entrez votre Prénom"
            />
          </div>
          <small className="text-danger d-block text-center">
            {erreurs.prenom ? messages.prenom : null}
          </small>
        </div>
        {isInfoCompleteAndValid && (
          <div className="labelInput">
            <label>Veuillez créer votre code HMA : </label>
            <div className="groupPwdPlace">
              <div className="groupPwd">
                {pwdRefs.map((ref, index) => (
                  <div className="inputPwd">
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
                  </div>
                ))}
              </div>
            </div>
            <small className="text-danger d-block text-center">
              {erreurs.pwd ? messages.pwd : null}
            </small>
          </div>
        )}
        <div>
          <div className="inputFP">
            <span>Besoin d'assistance? </span>
          </div>
          <button onClick={validation} type="submit">
            <span> Enregistrer</span>
          </button>
        </div>
      </form>
      <p>
        Vous avez déjà un compte? <span onClick={onClose}>Se connecter</span>
      </p>
    </>
  );
}
