import React from "react";
import { useNavigate } from "react-router-dom";

export default function PageNotFound() {
  const navigate = useNavigate();
  const redirectedToHome = () => {
    navigate("/accueil");
  };

  return (
    <>
      <h3>Page non trouver !</h3>
      <p onClick={redirectedToHome}> Accueil </p>
    </>
  );
}
