import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "../../contexts/api/axios";
import GetUserData from "../../contexts/api/udata";
import Template from "../../components/template/template";
import { toast } from "react-toastify";
import hma from "../../assets/images/hma256.png";

export default function InComingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const u_info = GetUserData();
  const [details, setDetails] = useState(null);

  useEffect(() => {
    axios
      .get(`histo/${id}`, u_info.opts)
      .then((response) => {
        if (response.status === 200) {
          setDetails(response.data[0]);
          console.log(response.data[0]);
        } else {
          toast.warning("Détails non disponibles.");
        }
      })
      .catch((error) => {
        toast.error("Erreur lors du chargement des détails.");
      });
  }, []);

  if (!details) return <div>Chargement...</div>;

  const onClose = () => {
    navigate("/incoming/");
  };
  return (
    <Template>
      <div className="monContainer">
        <header>Détails de l'entrée d'argent</header>

        <div className="mt-2">
          <div className="row">
            <div className="col-md-4">
              <div className="u-img">
                <img src={hma} alt="pdp" />
              </div>
            </div>
            <div className="col-md-8">
              <p>
                <b>- </b>
                Le produit numéroté <b>N°{details.id}</b>, nommé{" "}
                <b>{details.snom}</b>, est proposé à un prix unitaire de{" "}
                <b>{details.prix}</b>dhs (en <b>{details.fandrefesana}</b>).
              </p>
              <p>
                <b>- </b>
                <b>{details.hk == 1 ? "Gain" : "Dépense"}</b> d'argent pour{" "}
                <b>
                  {details.mnom} {details.prenom}
                </b>{" "}
                réalisé le <b>{details.date}</b> pour une quantité de{" "}
                <b>{details.qte}</b>, soit un montant total de{" "}
                <b>{details.montant}</b>dhs, lié à un service de type{" "}
                <b>{details.sk == 1 ? "Intellectuel" : "Matériel"}</b>.
              </p>
              <p>
                <b>- Commentaire : </b>
                {details.coms !== "" ? details.coms : "Aucun commentaire"}.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="retourBtn btn btn-primary">
            Retour
          </button>
        </div>
      </div>
    </Template>
  );
}
