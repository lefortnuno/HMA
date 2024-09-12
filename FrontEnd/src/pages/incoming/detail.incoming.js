import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "../../contexts/api/axios";
import GetUserData from "../../contexts/api/udata";
import Template from "../../components/template/template";
import { toast } from "react-toastify";

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
          <div>ID: {details.id}</div>
          <div>Date: {details.date}</div>
          <div>Nom: {details.snom}</div>
          <div>Montant: {details.montant} dhs</div>
          <div>Commentaires: {details.coms}</div>
          <div>qte: {details.qte}</div>
          <button onClick={onClose} className="retourBtn btn btn-primary">
            Retour
          </button>
        </div>
      </div>
    </Template>
  );
}
