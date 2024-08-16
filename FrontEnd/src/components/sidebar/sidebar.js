import GetUserData from "../../contexts/api/udata";
import { Link } from "react-router-dom";

export default function Sidebar() {
  const u_info = GetUserData();
  return (
    <>
      <ul>
        <li>
          <Link to="/home/">
            <p>Accueil</p>
          </Link>
        </li>
        <li>
          <Link to="/incoming/">
            <p>Gain</p>
          </Link>
        </li>
        <li>
          <Link to="/outcoming/">
            <p>Depense</p>
          </Link>
        </li>
        <li>
          <Link to="/service/">
            <p>Services</p>
          </Link>
        </li>
        {u_info.u_karazana == 1 ? (
          <>
            <li>
              <Link to="/users/">
                <p>Utilisateurs</p>
              </Link>
            </li>
          </>
        ) : null}
        <li> </li>
        <li>
          <Link to="/about/">
            <p>Apropos</p>
          </Link>
        </li>
      </ul>
    </>
  );
}
