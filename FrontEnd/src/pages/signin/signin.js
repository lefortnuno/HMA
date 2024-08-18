import SignInForm from "./signin.form";
import "../../assets/styles/auth.css";
import "./signin.css";
import hma from '../../assets/images/hma256.png'

export default function SignIn() {
  return (
    <div className="bodyArtific">
      <div className="containerContent">
        <h3>Bienvenue!</h3>
        <h1>S'enregistrer</h1>
        <SignInForm />
      </div>
      <div className="containerImg">
        <img
          src={hma}
          alt="logo-hma"
        />
      </div> 
    </div>
  );
}
