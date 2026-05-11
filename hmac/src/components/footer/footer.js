import { BsGithub, BsFacebook, BsLinkedin, BsEnvelope } from "react-icons/bs";
import "./footer.css";

export default function Footer() {
  return (
    <footer className="app-footer">
      <span className="app-footer-copy">© {new Date().getFullYear()} HMA — Gestion Immobilière</span>
      <div className="app-footer-links">
        <a href="https://github.com/lefortnuno" target="_blank" rel="noopener noreferrer" title="GitHub">
          <BsGithub />
        </a>
        <a href="https://www.facebook.com/tendo.lelouch.9/" target="_blank" rel="noopener noreferrer" title="Facebook">
          <BsFacebook />
        </a>
        <a href="https://www.linkedin.com/in/trofel-nuno-6bba76305/" target="_blank" rel="noopener noreferrer" title="LinkedIn">
          <BsLinkedin />
        </a>
        <a href="mailto:trofelnuno@gmail.com" title="Email">
          <BsEnvelope />
        </a>
      </div>
    </footer>
  );
}
