import { BrowserRouter as Router, Routes, Route } from "react-router";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import ForgotPassword from "./pages/AuthPages/ForgotPassword";
import VerifyCode from "./pages/AuthPages/VerifyCode";
import NewPassword from "./pages/AuthPages/NewPassword";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import Videos from "./pages/UiElements/Videos";
import Images from "./pages/UiElements/Images";
import Alerts from "./pages/UiElements/Alerts";
import Badges from "./pages/UiElements/Badges";
import Avatars from "./pages/UiElements/Avatars";
import Buttons from "./pages/UiElements/Buttons";
import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";
import Calendar from "./pages/Calendar";
import BasicTables from "./pages/Tables/BasicTables";
import FormElements from "./pages/Forms/FormElements";
import Blank from "./pages/Blank";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
// import Home from "./pages/Dashboard/Home";
import AllUser from "./pages/admin/AllUsers";
import UserReport from "./pages/admin/UserReport";
import Broker from "./pages/admin/Broker";
import Broadcast from "./pages/admin/Broadcast";
import ActivityLogs from "./pages/admin/ActivityLogs";
import LicenseReport from "./pages/admin/LicenseReport";
import ProtectedRoute from "./route/protectedRoute";
import ChangePassword from "./components/UserProfile/changePassword";
import TokenStatus from "./pages/admin/TokenStatus";
import Terms from "./pages/AuthPages/Terms";
import Layout from "./pages/Dashboard/Layout";
import LoginSuccess from "./components/auth/LoginSuccess";
import KiteLoginSuccess from "./components/auth/KiteLoginSuccess";
import GrowwLoginSuccess from "./components/auth/GrowwLoginSuccess";
import InstrumentForm from "./pages/Forms/InstrumentForm";
import OrderTables from "./pages/Tables/OrderTables";
import DashboardMain from "./pages/Dashboard/DashboardMain";
import TradeTables from "./pages/Tables/TradeTables";
import AngelOneCredential from "./pages/Forms/AngelOneCredential";

export default function App() {
  return (
    <>
          <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
      <Router>
        <ScrollToTop />
        <Routes>
          <Route element={<AppLayout />}>
            {/* <Route index path="/dashboard" element={<ProtectedRoute><Layout /></ProtectedRoute>} /> */}

             <Route index path="/dashboard" element={<ProtectedRoute><DashboardMain /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><UserProfiles /></ProtectedRoute>} />
            <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
            <Route path="/blank" element={<ProtectedRoute><Blank /></ProtectedRoute>} />
            <Route path="/form-elements" element={<ProtectedRoute><FormElements /></ProtectedRoute>} />
            <Route path="/basic-tables" element={<ProtectedRoute><BasicTables /></ProtectedRoute>} />
            <Route path="/alerts" element={<ProtectedRoute><Alerts /></ProtectedRoute>} />
            <Route path="/avatars" element={<ProtectedRoute><Avatars /></ProtectedRoute>} />
            <Route path="/badge" element={<ProtectedRoute><Badges /></ProtectedRoute>} />
            <Route path="/buttons" element={<ProtectedRoute><Buttons /></ProtectedRoute>} />
            <Route path="/images" element={<ProtectedRoute><Images /></ProtectedRoute>} />
            <Route path="/videos" element={<ProtectedRoute><Videos /></ProtectedRoute>} />
            <Route path="/line-chart" element={<ProtectedRoute><LineChart /></ProtectedRoute>} />
            <Route path="/bar-chart" element={<ProtectedRoute><BarChart /></ProtectedRoute>} />
            <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />


            <Route path="/instrument" element={<ProtectedRoute><InstrumentForm /></ProtectedRoute>} />
            <Route path="/order" element={<ProtectedRoute><OrderTables /></ProtectedRoute>} />
            <Route path="/trades" element={<ProtectedRoute><TradeTables /></ProtectedRoute>} />
            <Route path="/angelonecredential" element={<ProtectedRoute><AngelOneCredential /></ProtectedRoute>} />


              
                    <Route path="/new/deshboard" element={<ProtectedRoute><DashboardMain /></ProtectedRoute>} />

             


            {/*===================== admin ============================= */}

            <Route path="/all-users" element={<ProtectedRoute><AllUser /></ProtectedRoute>} />
            <Route path="/user-reports" element={<ProtectedRoute><UserReport /></ProtectedRoute>} />
            <Route path="/brokers" element={<ProtectedRoute><Broker /></ProtectedRoute>} />
            <Route path="/broadcast" element={<ProtectedRoute><Broadcast /></ProtectedRoute>} />
            <Route path="/activity-logs" element={<ProtectedRoute><ActivityLogs /></ProtectedRoute>} />
            <Route path="/license-report" element={<ProtectedRoute><LicenseReport /></ProtectedRoute>} />
            <Route path="/token-status" element={<ProtectedRoute><TokenStatus /></ProtectedRoute>} />

          </Route>

          {/* Auth Layout */}
          <Route path="/" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-code" element={<VerifyCode />} />
          <Route path="/new-password" element={<NewPassword />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/login-success" element={<LoginSuccess />} />
          <Route path="/kite-login-success" element={<KiteLoginSuccess/>}/>
          <Route path="/groww-login-success" element={<GrowwLoginSuccess/>}/>

        
          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />

        </Routes>
      </Router>
    </>
  );
}
