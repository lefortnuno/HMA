import hma from "../../assets/images/hma256.png";
import trofel from "../../assets/images/trofel.jpg";
import github from "../../assets/images/github.png";
import facebook from "../../assets/images/facebook.png";
import gmail from "../../assets/images/gmail.png";
import linkedin from "../../assets/images/linkedin.png";
import "./footer.css";

export default function Footer() {
  return (
    <div className="footer">
      <div className="footer-left">
        <div className="fl-text">
          <p>Suivez-moi sur :</p>
        </div>
        <div className="fl-no-text">
          <div className="fl-img">
            <a
              href="https://github.com/lefortnuno?tab=repositories"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src={github}
                alt="GitHub"
                className="img-fluid logo rounded-square me-2"
                style={{ width: "50px" }}
              />
            </a>
          </div>
          <div className="fl-img">
            <a
              href="https://www.facebook.com/tendo.lelouch.9/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src={facebook}
                alt="Facebook"
                className="img-fluid logo rounded-square me-2"
                style={{ width: "50px" }}
              />
            </a>
          </div>
          <div className="fl-img">
            <a
              href="mailto:trofelnuno@gmail.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src={gmail}
                alt="Gmail"
                className="img-fluid logo rounded-square me-2"
                style={{ width: "50px" }}
              />
            </a>
          </div>
          <div className="fl-img">
            <a
              href="https://www.linkedin.com/in/trofel-nuno-6bba76305/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src={linkedin}
                alt="LinkedIn"
                className="img-fluid logo rounded-square me-2"
                style={{ width: "50px" }}
              />
            </a>
          </div>
        </div>
      </div>
      <div className="footer-right">
        <div className="fr-img">
          <img
            src={hma}
            alt="hma"
            className="img-fluid logo rounded-square me-2"
          />
        </div>
        <div className="fr-img">
          <img
            src={trofel}
            alt="trofel"
            className="img-fluid logo rounded-square me-5"
          />
        </div>
      </div>
    </div>
  );
}
