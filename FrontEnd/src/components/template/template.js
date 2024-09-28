import Header from "../header/header";
import Sidebar from "../sidebar/sidebar";
import Footer from "../footer/footer";
import "../../assets/styles/template.css";

export default function Template({ children }) {
  return (
    <div className="d-flex flex-column min-vh-100">
      
      {children}

      <Footer />

      <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/js/bootstrap.bundle.min.js"></script>
    </div>
  );
}
