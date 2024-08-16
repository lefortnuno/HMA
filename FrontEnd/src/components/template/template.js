import Header from "../header/header";
import Sidebar from "../sidebar/sidebar";
import Footer from "../footer/footer";

export default function Template({ children }) {
  return (
    <>
      <Header />
      <Sidebar />
      {children}
      <Footer />
    </>
  );
}
