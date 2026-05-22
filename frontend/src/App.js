import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./components/Dashboard"; // User Dashboard
import Dashboards from "./components/Dashbaoards"; // Admin Dashboard
import Login from "./components/Login";
import Register from "./components/Register";
import UploadFile from "./components/UploadFile";
import VerifyOTP from "./components/VerifyOTP";
import AddFile from "./components/Addimage";
import Filesharing from "./components/filesharing";
import FileList from "./components/Filelist";
import Filelister from "./components/Filelister";
import Profile from "./components/profile";
import Userfileinfo from "./components/userfileinfo";
import Collegeimage from "./components/collegeimage";
import Registereduser from "./components/Registereduser";
import Unregistereduser from "./components/Unregistereduser";
import Sidebar from "./sidebar/sidebar"; // Admin Sidebar
import Usersidebar from "./sidebar/Usersidebar"; // User Sidebar
import Navbar from "./components/navbar";
import PasswordResetRequest from "./components/passwordforget/PasswordResetRequest ";
import ResetPassword from "./components/passwordforget/ResetPassword ";
import VerifyOTPS from "./components/passwordforget/VerifyOTPS ";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true); // Added loading state

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userRole = localStorage.getItem("role");

    if (token && userRole) {
      setIsLoggedIn(true);
      setRole(userRole);
    }
    else {
      setIsLoggedIn(false)
      setRole("");
    }
    setLoading(false); // Stop loading after checking authentication
  }, []);

  if (loading) {
    return <div>Loading...</div>; // Show a loader while checking authentication
  }

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Register />} />
        <Route path="/login" element={<Login setIsLoggedIn={setIsLoggedIn} />} />

        {/* Protected Routes */}
        {isLoggedIn ? (
          <>
            {/* Admin Routes */}
            {role === "admin" && (
              <>
                <Route
                  path="/dashboards"
                  element={
                    <div className="d-flex">
                      <Sidebar />
                      <div className="content">
                        <Navbar />
                        <Dashboards />
                      </div>
                    </div>
                  }
                />
                <Route
                  path="/*"
                  element={
                    <div className="d-flex">
                      <Sidebar />
                      <div className="content">
                        <Navbar />
                        <Routes>
                          <Route path="/upload" element={<UploadFile />} />
                          <Route path="/addimage" element={<AddFile />} />
                          <Route path="/filesharing" element={<Filesharing />} />
                          <Route path="/verify" element={<VerifyOTP />} />
                          <Route path="/collegeimage" element={<Collegeimage />} />
                          <Route path="/filelist" element={<FileList />} />
                          <Route path="/filelister" element={<Filelister />} />
                          <Route path="/profile" element={<Profile />} />
                          <Route path="/userinfo" element={<Userfileinfo />} />
                          <Route path="/unregistereduser" element={<Unregistereduser />} />
                          <Route path="/registereduser" element={<Registereduser />} />

                        </Routes>


                      </div>
                    </div>
                  }
                />
              </>
            )}

            {/* User Routes */}
            {role === "user" && (
              <>
                <Route
                  path="/dashboard"
                  element={
                    <div className="d-flex">
                      <Usersidebar />
                      <div className="content">
                        <Navbar />
                        <Dashboard />
                      </div>
                    </div>
                  }
                />
                <Route
                  path="/*"
                  element={
                    <div className="d-flex">
                      <Usersidebar />
                      <div className="content">
                        <Navbar />
                        <Routes>
                          <Route path="/upload" element={<UploadFile />} />
                          <Route path="/addimage" element={<AddFile />} />
                          <Route path="/filesharing" element={<Filesharing />} />
                          <Route path="/verify" element={<VerifyOTP />} />
                          <Route path="/collegeimage" element={<Collegeimage />} />
                          <Route path="/filelist" element={<FileList />} />
                          <Route path="/filelister" element={<Filelister />} />
                          <Route path="/profile" element={<Profile />} />
                          <Route path="/userinfo" element={<Userfileinfo />} />

                        </Routes>

                      </div>
                      {/* <div>
                        <Routes>
                        <Route path="/forgot-password" element={<PasswordResetRequest />} />
                          <Route path="/verify-otp" element={<VerifyOTPS />} />
                          <Route path="/reset-password/:token" element={<ResetPassword />} />

                        </Routes>
                      </div> */}
                    </div>
                  }
                />
              </>
            )}
          </>
        ) : (
          <Route path="/*" element={<Navigate to="/login" />} />
        )}
         <Route path="/forgot-password" element={<PasswordResetRequest />} />
                          <Route path="/verify-otp" element={<VerifyOTPS />} />
                          <Route path="/reset-password/:token" element={<ResetPassword />} />
      </Routes>
    </Router>
  );
}

export default App;
