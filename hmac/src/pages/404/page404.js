import React from "react";
import { useNavigate } from "react-router-dom";
import "../../assets/styles/pageNotFound.css";
import p2_404 from "../../assets/images/p404_2.png";
import p7_404 from "../../assets/images/p404_7.png"; 

export default function PageNotFound() {
  const navigate = useNavigate();
  const redirectedToHome = () => {
    navigate("/home/");
  };

  return (
    <>
      <div className="wrapper_404">
        <div className="container_404">
          <div className="grid-row">
            <div className="colmun colmun-left">
              <img
                src={p2_404}
                alt="image-left"
              />
              <h1 className="px-spc-b-20">
                Nous ne trouvons la page que vous demandez.
              </h1>

              <button
                className="go-home btn button_404"
                onClick={redirectedToHome}
              >
                <i className="fa fa-home"></i> Retour à l'accueil
              </button>
            </div>
            <div className="colmun colmun-right">
              <img
                src={p7_404}
                alt="right-shape"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
