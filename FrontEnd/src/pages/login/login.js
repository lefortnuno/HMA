import LogInForm from "./login.form";
import "./login.css";

export default function LogIn() {
  return ( 
      <div className="bodyArtific">
        <div className="containerContent">
          <h3>Bienvenue!</h3>
          <h1>S'authentifier</h1>
          <LogInForm />
        </div>
        <div className="containerImg">
          <img src="HMA256.png" alt="bg-hma" />
        </div>
      </div> 
  );
}
