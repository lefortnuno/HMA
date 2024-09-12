import Header from "../header/header";
import Sidebar from "../sidebar/sidebar";
import Footer from "../footer/footer";
import "../../assets/styles/template.css";

export default function Template({ children }) {
  return (
    <>
      <Sidebar />
      <Header />
      {/* il faut coder le css du class container */}
      <div className="container">
        <div className="contenu">{children}</div>
      </div>
      <Footer />
    </>
  );
}
