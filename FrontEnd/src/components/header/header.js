import GetUserData from "../../contexts/api/udata";
import { useNavigate } from "react-router-dom"; 
import './header.css'

export default function Header(props) {
  const u_info = GetUserData();
  const navigate = useNavigate();

  const seDeconnecterDuSession = (event) => {
    event.preventDefault();
    localStorage.clear();
    navigate("/");
  };
  return (
    <>
      {u_info.u_token ? (
        <div className="header">
          <div>
            <span>logo</span>
            <p>Bonjour {u_info.u_nom}</p>
          </div>
          <div>
            <span>recherche: </span>
            <input type="text" value={props.children} />
          </div>
          <div>
            <span>Votre Solde</span>
            <p> {u_info.u_karazana} $</p>
          </div>
          <div>
            <button onClick={(e) => seDeconnecterDuSession(e)}>
              Se déconnecter
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
