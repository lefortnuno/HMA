import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "bootstrap/dist/css/bootstrap.min.css";

import SignInProtection from "./contexts/ptotections/signin.protection";
import LogOutProtection from "./contexts/ptotections/logout.protection";

import PageNotFound from "./pages/404/page404";
import LogIn from "./pages/login/login";

import Home from "./pages/home/home";
import About from "./pages/about/about";

import User from "./pages/users/user";
import SignIn from "./pages/signin/signin";
import UserDetails from "./pages/users/detail.user";
import EditUser from "./pages/users/edit.user";

import Service from "./pages/services/service";
import AddService from "./pages/services/add.service";
import ServiceDetails from "./pages/services/detail.service";
import EditService from "./pages/services/edit.service";

import InComing from "./pages/inComing/inComing";
import AddInComing from "./pages/inComing/add.inComing";
import InComingDetails from "./pages/inComing/detail.inComing";
import EditInComing from "./pages/inComing/edit.inComing";

import OutGoing from "./pages/outGoing/outGoing";
import AddOutGoing from "./pages/outGoing/add.outGoing";
import OutGoingDetails from "./pages/outGoing/detail.outGoing";
import EditOutGoing from "./pages/outGoing/edit.outGoing";

import Boutique from "./pages/boutiques/boutique";
import AddBoutique from "./pages/boutiques/add.boutique";
import BoutiqueDetails from "./pages/boutiques/detail.boutique";
import EditBoutique from "./pages/boutiques/edit.boutique";

function App() {
  return (
    <div className="App">
      <ToastContainer autoClose={3000} position={"bottom-right"} />
      <BrowserRouter>
        <Routes>
          <Route index element={<LogOutProtection Cmp={LogIn} />} />
          {/* <Route index element={<LogIn/>} /> */}
          <Route path="/*" element={<SignInProtection Cmp={PageNotFound} />} />
          <Route path="home/" element={<SignInProtection Cmp={Home} />} />
          <Route path="about/" element={<SignInProtection Cmp={About} />} />

          <Route path="users/" element={<SignInProtection Cmp={User} />} />
          <Route path="newUser/" element={<SignIn />} />
          <Route
            path="aboutUser/:id"
            element={<SignInProtection Cmp={UserDetails} />}
          />
          <Route
            path="editUser/:id"
            element={<SignInProtection Cmp={EditUser} />}
          />

          <Route
            path="services/"
            element={<SignInProtection Cmp={Service} />}
          />
          <Route
            path="newService/"
            element={<SignInProtection Cmp={AddService} />}
          />
          <Route
            path="aboutService/:id"
            element={<SignInProtection Cmp={ServiceDetails} />}
          />
          <Route
            path="editService/:id"
            element={<SignInProtection Cmp={EditService} />}
          />

          <Route
            path="inComing/"
            element={<SignInProtection Cmp={InComing} />}
          />
          <Route
            path="newInComing/"
            element={<SignInProtection Cmp={AddInComing} />}
          />
          <Route
            path="aboutInComing/:id"
            element={<SignInProtection Cmp={InComingDetails} />}
          />
          <Route
            path="editIncoming/:id"
            element={<SignInProtection Cmp={EditInComing} />}
          />

          <Route
            path="outGoing/"
            element={<SignInProtection Cmp={OutGoing} />}
          />
          <Route
            path="newOutGoing/"
            element={<SignInProtection Cmp={AddOutGoing} />}
          />
          <Route
            path="aboutOutGoing/:id"
            element={<SignInProtection Cmp={OutGoingDetails} />}
          />
          <Route
            path="editOutGoing/:id"
            element={<SignInProtection Cmp={EditOutGoing} />}
          />
          
          <Route
            path="boutiques/"
            element={<SignInProtection Cmp={Boutique} />}
          />
          <Route
            path="newBoutique/"
            element={<SignInProtection Cmp={AddBoutique} />}
          />
          <Route
            path="aboutBoutique/:id"
            element={<SignInProtection Cmp={BoutiqueDetails} />}
          />
          <Route
            path="editBoutique/:id"
            element={<SignInProtection Cmp={EditBoutique} />}
          />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
