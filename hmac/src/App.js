import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
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

// ─── Loyer ────────────────────────────────────────────────────
import Loyer from "./pages/loyer/loyer";
import Ofatrano from "./pages/loyer/ofatrano";
import Locataires from "./pages/loyer/locataires";
import Chambres from "./pages/loyer/chambres";
import AddLocataire from "./pages/loyer/add.locataire";
import EditLocataire from "./pages/loyer/edit.locataire";
import Factures from "./pages/loyer/factures";
import Depenses from "./pages/loyer/depenses";
import Benefices from "./pages/loyer/benefices";

// ─── Finance (VOLA) ───────────────────────────────────────────
import FinanceRevenus  from "./pages/finance/revenus";
import FinanceCasuel   from "./pages/finance/casuel";
import FinanceCharges  from "./pages/finance/charges";
import FinanceDepenses from "./pages/finance/depenses";
import FinanceBilan    from "./pages/finance/bilan";

// ─── Vitrine ──────────────────────────────────────────────────
import Vitrine from "./pages/vitrine/vitrine";
import DetailBien from "./pages/vitrine/detail.bien";
import AdminVitrine from "./pages/vitrine/admin.vitrine";
import AddBien from "./pages/vitrine/add.bien";
import EditBien from "./pages/vitrine/edit.bien";

function App() {
  return (
    <div className="App">
      <ToastContainer autoClose={3000} position="bottom-right" />
      <BrowserRouter>
        <Routes>
          {/* Auth */}
          <Route index element={<LogOutProtection Cmp={LogIn} />} />
          <Route path="/*" element={<SignInProtection Cmp={PageNotFound} />} />
          <Route path="home/" element={<SignInProtection Cmp={Home} />} />
          <Route path="about/" element={<SignInProtection Cmp={About} />} />

          {/* Users */}
          <Route path="users/" element={<SignInProtection Cmp={User} />} />
          <Route path="newUser/" element={<SignIn />} />
          <Route path="aboutUser/:id" element={<SignInProtection Cmp={UserDetails} />} />
          <Route path="editUser/:id" element={<SignInProtection Cmp={EditUser} />} />

          {/* Services */}
          <Route path="services/" element={<SignInProtection Cmp={Service} />} />
          <Route path="newService/" element={<SignInProtection Cmp={AddService} />} />
          <Route path="aboutService/:id" element={<SignInProtection Cmp={ServiceDetails} />} />
          <Route path="editService/:id" element={<SignInProtection Cmp={EditService} />} />

          {/* InComing */}
          <Route path="inComing/" element={<SignInProtection Cmp={InComing} />} />
          <Route path="newInComing/" element={<SignInProtection Cmp={AddInComing} />} />
          <Route path="aboutInComing/:id" element={<SignInProtection Cmp={InComingDetails} />} />
          <Route path="editIncoming/:id" element={<SignInProtection Cmp={EditInComing} />} />

          {/* OutGoing */}
          <Route path="outGoing/" element={<SignInProtection Cmp={OutGoing} />} />
          <Route path="newOutGoing/" element={<SignInProtection Cmp={AddOutGoing} />} />
          <Route path="aboutOutGoing/:id" element={<SignInProtection Cmp={OutGoingDetails} />} />
          <Route path="editOutGoing/:id" element={<SignInProtection Cmp={EditOutGoing} />} />

          {/* Boutiques */}
          <Route path="boutiques/" element={<SignInProtection Cmp={Boutique} />} />
          <Route path="newBoutique/" element={<SignInProtection Cmp={AddBoutique} />} />
          <Route path="aboutBoutique/:id" element={<SignInProtection Cmp={BoutiqueDetails} />} />
          <Route path="editBoutique/:id" element={<SignInProtection Cmp={EditBoutique} />} />

          {/* ── Loyer (protégé) ── */}
          <Route path="loyer/" element={<SignInProtection Cmp={Loyer} />} />
          <Route path="ofatrano/" element={<SignInProtection Cmp={Ofatrano} />} />
          <Route path="loyer/chambres/" element={<SignInProtection Cmp={Chambres} />} />
          <Route path="loyer/locataires/" element={<SignInProtection Cmp={Locataires} />} />
          <Route path="loyer/locataires/new" element={<SignInProtection Cmp={AddLocataire} />} />
          <Route path="loyer/locataires/edit/:id" element={<SignInProtection Cmp={EditLocataire} />} />
          <Route path="loyer/factures/" element={<SignInProtection Cmp={Factures} />} />
          <Route path="loyer/depenses/" element={<SignInProtection Cmp={Depenses} />} />
          <Route path="loyer/benefices/" element={<SignInProtection Cmp={Benefices} />} />

          {/* ── Finance (protégé) ── */}
          <Route path="finance/revenus/"  element={<SignInProtection Cmp={FinanceRevenus}  />} />
          <Route path="finance/charges/"  element={<SignInProtection Cmp={FinanceRevenus}  />} />
          <Route path="finance/casuel/"   element={<SignInProtection Cmp={FinanceCasuel}   />} />
          <Route path="finance/depenses/" element={<SignInProtection Cmp={FinanceCasuel}   />} />
          <Route path="finance/bilan/"    element={<SignInProtection Cmp={FinanceBilan}    />} />

          {/* ── Vitrine (public) ── */}
          <Route path="vitrine/" element={<Vitrine />} />
          <Route path="vitrine/bien/:id" element={<DetailBien />} />

          {/* ── Vitrine admin (protégé) ── */}
          <Route path="vitrine/admin/" element={<SignInProtection Cmp={AdminVitrine} />} />
          <Route path="vitrine/admin/new" element={<SignInProtection Cmp={AddBien} />} />
          <Route path="vitrine/admin/edit/:id" element={<SignInProtection Cmp={EditBien} />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
