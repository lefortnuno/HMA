import LogInForm from "./login.form";
import "../../assets/styles/auth.css";
import hma from '../../assets/images/hma256.png'

export default function LogIn() {
  return (
    <div className="bodyArtific">
      <div className="containerContent">
        <h3>Bienvenue!</h3>
        <h1>S'authentifier</h1>
        <LogInForm />
      </div>
      <div className="containerImg">
      <img
        src={hma}
        alt="bg-hma"
      /> 
      </div> 
    </div>
  );
}
