import { useNavigate } from "react-router-dom";

import Template from "../../components/template/template";
import Header from "../../components/header/header";
import Sidebar from "../../components/sidebar/sidebar";
import More from "../../components/more/more";

export default function Home() {
  const navigate = useNavigate();
  return (
    <Template>
      <Header></Header>

      <div className="container-fluid flex-grow-1">
        <div className="row">
          <Sidebar />

          <main className="col-md-9 ms-sm-auto col-lg-10 px-md-4 main">
            <div className="pt-3 pb-2 mb-3">
              {/* -------------------------- PAGE CONTENT -------------------------- */}
              <h2>Home</h2>
              {/* -------------------------- FIN -------------------------- */}
            </div>
            <More />
          </main>
        </div>
      </div>
    </Template>
  );
}
