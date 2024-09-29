// import axios from "../../contexts/api/axios";
// import { useNavigate } from "react-router-dom";
// import { useState } from "react";
// import { toast } from "react-toastify";
// import Template from "../../components/template/template";
// import GetUserData from "../../contexts/api/udata";

// const url_req = `service/`;

// export default function AddService() {
//   const navigate = useNavigate();
//   const u_info = GetUserData();

//   const initialInputs = {
//     nom: "",
//     prix: "",
//     fandrefesana: "",
//     karazana: "",
//   };

//   const [inputs, setInputs] = useState(initialInputs);
//   const [erreurs, setErreurs] = useState({
//     nom: false,
//     prix: false,
//     fandrefesana: false,
//     karazana: false,
//   });
//   const [messages, setMessages] = useState({
//     nom: "",
//     prix: "",
//     fandrefesana: "",
//     karazana: "",
//   });

//   const handleChange = (event) => {
//     const { name, value } = event.target;
//     setInputs((values) => ({ ...values, [name]: value }));
//     setErreurs((values) => ({ ...values, [name]: false }));
//     setMessages((values) => ({ ...values, [name]: "" }));

//     if (name === "prix" && isNaN(value)) {
//       setErreurs((values) => ({ ...values, prix: true }));
//       setMessages((values) => ({
//         ...values,
//         prix: "Le prix doit être un nombre",
//       }));
//     }

//     if (name === "nom") {
//       if (value.length < 2) {
//         setErreurs((values) => ({ ...values, nom: true }));
//         setMessages((values) => ({
//           ...values,
//           nom: "Le nom doit contenir au moins 2 caractères",
//         }));
//       } else if (value.length > 150) {
//         setErreurs((values) => ({ ...values, nom: true }));
//         setMessages((values) => ({
//           ...values,
//           nom: "Le nom ne peut pas dépasser 150 caractères",
//         }));
//       } else {
//         setErreurs((values) => ({ ...values, nom: false }));
//         setMessages((values) => ({ ...values, nom: "" }));
//       }
//     }
//   };

//   const validation = (event) => {
//     event.preventDefault();

//     const inputsObligatoires = ["nom", "prix", "fandrefesana", "karazana"];

//     let formIsValid = true;

//     inputsObligatoires.forEach((element) => {
//       if (!inputs[element]) {
//         setErreurs((values) => ({ ...values, [element]: true }));
//         setMessages((values) => ({
//           ...values,
//           [element]: "Champ obligatoire!",
//         }));
//         formIsValid = false;
//       }
//     });

//     if (formIsValid) {
//       onSubmit();
//     }
//   };

//   const onSubmit = () => {
//     axios
//       .post(url_req, inputs, u_info.opts)
//       .then((response) => {
//         if (response.status === 200) {
//           if (response.data.success) {
//             toast.success(response.data.message);
//             navigate("/service/"); // Redirige vers la page des services après ajout
//           } else {
//             toast.error(response.data.message);
//           }
//         } else {
//           toast.error("Échec de l'ajout!");
//         }
//       })
//       .catch((error) => {
//         toast.error("Erreur lors de l'ajout du service.");
//       });
//   };

//   const onClose = () => {
//     setInputs(initialInputs); // Réinitialise les champs du formulaire
//     setErreurs({
//       nom: false,
//       prix: false,
//       fandrefesana: false,
//       karazana: false,
//     });
//     setMessages({
//       nom: "",
//       prix: "",
//       fandrefesana: "",
//       karazana: "",
//     });
//     navigate("/service/"); // Redirige vers la page des services
//   };

//   return (
//     <>
//       <Template>
//         <div>
//           <h2>Ajouter un Service</h2>
//           <form>
//             <div>
//               <label>Nom :</label>
//               <input
//                 type="text"
//                 name="nom"
//                 onChange={handleChange}
//                 value={inputs.nom}
//                 placeholder="Entrez le nom du service"
//                 autoComplete="off"
//               />
//               <small className="text-danger d-block">
//                 {erreurs.nom ? messages.nom : null}
//               </small>
//             </div>
//             <div>
//               <label>Prix :</label>
//               <input
//                 type="number"
//                 name="prix"
//                 onChange={handleChange}
//                 value={inputs.prix}
//                 placeholder="Entrez le prix du service"
//                 autoComplete="off"
//               />
//               <small className="text-danger d-block">
//                 {erreurs.prix ? messages.prix : null}
//               </small>
//             </div>
//             <div>
//               <label>Unité :</label>
//               <select
//                 name="fandrefesana"
//                 onChange={handleChange}
//                 value={inputs.fandrefesana}
//               >
//                 <option value="">Sélectionner une unité</option>
//                 <option value="litre">Litre</option>
//                 <option value="gramme">Gramme</option>
//                 <option value="mètre">Mètre</option>
//                 <option value="temps">Temps</option>
//                 {/* Ajoutez d'autres unités si nécessaire */}
//               </select>
//               <small className="text-danger d-block">
//                 {erreurs.fandrefesana ? messages.fandrefesana : null}
//               </small>
//             </div>
//             <div>
//               <label>Type :</label>
//               <select
//                 name="karazana"
//                 onChange={handleChange}
//                 value={inputs.karazana}
//               >
//                 <option value="">Sélectionner un type</option>
//                 <option value="0">Materiel</option>
//                 <option value="1">Intellectuel</option>
//               </select>
//               <small className="text-danger d-block">
//                 {erreurs.karazana ? messages.karazana : null}
//               </small>
//             </div>
//             <div>
//               <button className="btn btn-danger" onClick={onClose} type="button">
//                  Annuler
//               </button>
//               <button className="btn btn-success" onClick={validation} type="submit">
//                 Ajouter
//               </button>
//             </div>
//           </form>
//         </div>
//       </Template>
//     </>
//   );
// }

import axios from "../../contexts/api/axios";
import GetUserData from "../../contexts/api/udata";

import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import Header from "../../components/header/header";
import Sidebar from "../../components/sidebar/sidebar";
import Template from "../../components/template/template";

import "../../assets/styles/maForm.css";

const url_req = `service/`;
const searchUrl = `service/recherche/`;

export default function AddService() {
  //#region //-variable
  const navigate = useNavigate();
  const u_info = GetUserData();

  const initialInputs = {
    nom: "",
    prix: "",
    karazana: "",
    fandrefesana: "",
  };

  const [inputs, setInputs] = useState(initialInputs);
  const [erreurs, setErreurs] = useState({
    nom: false,
    prix: false,
    karazana: false,
    fandrefesana: false,
  });
  const [messages, setMessages] = useState({
    nom: "",
    prix: "",
    karazana: "",
    fandrefesana: "",
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

    if (!inputs["nom"]) {
      setErreurs((values) => ({ ...values, nom: true }));
      setMessages((values) => ({
        ...values,
        nom: "Champ nom service obligatoire!",
      }));
      formIsValid = false;
    }

    if (!inputs["prix"]) {
      setInputs((prevInputs) => ({
        ...prevInputs,
        prix: 0,
      }));
    }

    if (formIsValid) {
      setIsSubmitting(true); // Déclencher la soumission après mise à jour
    }
  };
  //#endregion

  //#region //-useEffect
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
      .post(url_req, inputs, u_info.opts)
      .then((response) => {
        if (response.status === 200 && response.data.success) {
          toast.success(response.data.message);
          navigate("/services/");
        } else {
          toast.error(response.data.message || "Échec de l'ajout!");
        }
      })
      .catch(() => {
        toast.error("Erreur lors de l'ajout du services.");
      })
      .finally(() => {
        setIsSubmitting(false); // Réinitialiser après soumission
      });
  };
  //#endregion

  //#region //-onClose
  const onClose = () => {
    setInputs(initialInputs);
    setErreurs({ nom: false, prix: false });
    setMessages({ nom: "", prix: "" });
    navigate("/services/");
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
                <header>Ajouter un Service</header>
                <form>
                  <div className="form first">
                    <div className="details personal">
                      <div className="fields">
                        <div className="input-field">
                          <label>Service :</label>
                          <input
                            name="nom"
                            onChange={handleChange}
                            type="text"
                            value={inputs.nom}
                            placeholder="Recherchez un service..."
                            autoComplete="off"
                          />
                          <small className="text-danger d-block">
                            {erreurs.nom ? messages.nom : null}
                          </small>
                        </div>
                        <div className="input-field">
                          <label>Prix :</label>
                          <input
                            type="number"
                            name="prix"
                            onChange={handleChange}
                            value={inputs.prix}
                            placeholder="Entrez le prix du service"
                            autoComplete="off"
                            min={0}
                            max={99999}
                          />
                          <small className="text-danger d-block">
                            {erreurs.prix ? messages.prix : null}
                          </small>
                        </div>
                        <div className="input-field">
                          <label>Unité :</label>
                          <select
                            name="fandrefesana"
                            onChange={handleChange}
                            value={inputs.fandrefesana}
                          >
                            <option value="">Sélectionner une unité</option>
                            <option value="litre">Litre</option>
                            <option value="gramme">Gramme</option>
                            <option value="mètre">Mètre</option>
                            <option value="temps">Temps</option>
                            {/* Ajoutez d'autres unités si nécessaire */}
                          </select>
                          <small className="text-danger d-block">
                            {erreurs.fandrefesana
                              ? messages.fandrefesana
                              : null}
                          </small>
                        </div>
                        <div className="input-field">
                          <label>Type :</label>
                          <select
                            name="karazana"
                            onChange={handleChange}
                            value={inputs.karazana}
                          >
                            <option value="">Sélectionner un type</option>
                            <option value="0">Materiel</option>
                            <option value="1">Intellectuel</option>
                          </select>
                          <small className="text-danger d-block">
                            {erreurs.karazana ? messages.karazana : null}
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
