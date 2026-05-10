import Header from "../header/header";
import Sidebar from "../sidebar/sidebar";
import "../../assets/styles/template.css";

export default function Template({ children }) {
  return (
    <div className="d-flex flex-column min-vh-100">

      {children}

    </div>
  );
}
