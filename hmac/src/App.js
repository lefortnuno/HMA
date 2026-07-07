import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "bootstrap/dist/css/bootstrap.min.css";

import SignInProtection from "./contexts/ptotections/signin.protection";
import AdminProtection from "./contexts/ptotections/admin.protection";
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
import Historique from "./pages/loyer/historique";
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

          {/* Users (admin) */}
          <Route path="users/" element={<AdminProtection Cmp={User} />} />
          <Route path="newUser/" element={<SignIn />} />
          <Route path="aboutUser/:id" element={<AdminProtection Cmp={UserDetails} />} />
          <Route path="editUser/:id" element={<AdminProtection Cmp={EditUser} />} />

          {/* Services (admin) */}
          <Route path="services/" element={<AdminProtection Cmp={Service} />} />
          <Route path="newService/" element={<AdminProtection Cmp={AddService} />} />
          <Route path="aboutService/:id" element={<AdminProtection Cmp={ServiceDetails} />} />
          <Route path="editService/:id" element={<AdminProtection Cmp={EditService} />} />

          {/* InComing (admin) */}
          <Route path="inComing/" element={<AdminProtection Cmp={InComing} />} />
          <Route path="newInComing/" element={<AdminProtection Cmp={AddInComing} />} />
          <Route path="aboutInComing/:id" element={<AdminProtection Cmp={InComingDetails} />} />
          <Route path="editIncoming/:id" element={<AdminProtection Cmp={EditInComing} />} />

          {/* OutGoing (admin) */}
          <Route path="outGoing/" element={<AdminProtection Cmp={OutGoing} />} />
          <Route path="newOutGoing/" element={<AdminProtection Cmp={AddOutGoing} />} />
          <Route path="aboutOutGoing/:id" element={<AdminProtection Cmp={OutGoingDetails} />} />
          <Route path="editOutGoing/:id" element={<AdminProtection Cmp={EditOutGoing} />} />

          {/* Boutiques (admin) */}
          <Route path="boutiques/" element={<AdminProtection Cmp={Boutique} />} />
          <Route path="newBoutique/" element={<AdminProtection Cmp={AddBoutique} />} />
          <Route path="aboutBoutique/:id" element={<AdminProtection Cmp={BoutiqueDetails} />} />
          <Route path="editBoutique/:id" element={<AdminProtection Cmp={EditBoutique} />} />

          {/* ── Loyer (Immobilier — tous les users connectés) ── */}
          <Route path="loyer/" element={<SignInProtection Cmp={Loyer} />} />
          <Route path="ofatrano/" element={<SignInProtection Cmp={Ofatrano} />} />
          <Route path="loyer/chambres/" element={<SignInProtection Cmp={Chambres} />} />
          <Route path="loyer/locataires/" element={<SignInProtection Cmp={Locataires} />} />
          <Route path="loyer/locataires/new" element={<SignInProtection Cmp={AddLocataire} />} />
          <Route path="loyer/locataires/edit/:id" element={<SignInProtection Cmp={EditLocataire} />} />
          <Route path="loyer/factures/" element={<SignInProtection Cmp={Factures} />} />
          <Route path="loyer/depenses/" element={<SignInProtection Cmp={Depenses} />} />
          <Route path="loyer/benefices/" element={<SignInProtection Cmp={Benefices} />} />
          <Route path="loyer/historique/" element={<SignInProtection Cmp={Historique} />} />

          {/* ── Finance (admin) ── */}
          <Route path="finance/revenus/"  element={<AdminProtection Cmp={FinanceRevenus}  />} />
          <Route path="finance/charges/"  element={<AdminProtection Cmp={FinanceRevenus}  />} />
          <Route path="finance/casuel/"   element={<AdminProtection Cmp={FinanceCasuel}   />} />
          <Route path="finance/depenses/" element={<AdminProtection Cmp={FinanceCasuel}   />} />
          <Route path="finance/bilan/"    element={<AdminProtection Cmp={FinanceBilan}    />} />

          {/* ── Vitrine (public) ── */}
          <Route path="vitrine/" element={<Vitrine />} />
          <Route path="vitrine/bien/:id" element={<DetailBien />} />

          {/* ── Vitrine admin (admin) ── */}
          <Route path="vitrine/admin/" element={<AdminProtection Cmp={AdminVitrine} />} />
          <Route path="vitrine/admin/new" element={<AdminProtection Cmp={AddBien} />} />
          <Route path="vitrine/admin/edit/:id" element={<AdminProtection Cmp={EditBien} />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
