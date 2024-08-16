import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import SignInProtection from "./contexts/ptotections/signin.protection";
import LogOutProtection from "./contexts/ptotections/logout.protection";

import PageNotFound from "./pages/404/page404";
import LogIn from "./pages/login/login";
import SignIn from "./pages/signin/signin";

import Home from "./pages/home/home";
import About from "./pages/about/about";
import Service from "./pages/services/service";
import AddService from "./pages/services/add.service";

function App() {
  return (
    <div className="App">
      <ToastContainer autoClose={3000} position={"bottom-right"} />
      <BrowserRouter>
        <Routes>
          <Route index element={<LogOutProtection Cmp={LogIn} />} />
          {/* <Route index element={<LogIn/>} /> */}
          <Route path="/*" element={<SignInProtection Cmp={PageNotFound} />} />
          <Route path="newUser/" element={<SignIn />} />
          <Route path="home/" element={<SignInProtection Cmp={Home}/>} />
          <Route path="about/" element={<SignInProtection Cmp={About}/>} />
          <Route path="service/" element={<SignInProtection Cmp={Service}/>} />
          <Route path="newService/" element={<SignInProtection Cmp={AddService}/>} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
