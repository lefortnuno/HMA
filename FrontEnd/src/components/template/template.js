import Header from "../header/header";
import Sidebar from "../sidebar/sidebar";
import Footer from "../footer/footer";
import "../../assets/styles/template.css";

export default function Template({ children }) {
  return (
    <>
      <Header />
      <Sidebar />
      <div className="container" style={{width:"100%", marginTop:"5%"}}>
        <div className="contenu">{children}</div>
      </div>
      <Footer />
    </>
  );
}
