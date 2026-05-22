// ProtectedLayout.js
import React from "react";
import { Navigate } from "react-router-dom";
import Sidebar from "../sidebar/sidebar";  // Admin Sidebar
import Usersidebar from "../sidebar/Usersidebar";  // User Sidebar
import Navbar from "../components/navbar";

const ProtectedLayout = ({ children, role }) => {
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("role");

  // If not logged in, redirect to login page
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // If role mismatch for protected routes
  if ((role === "admin" && userRole !== "admin") || (role === "user" && userRole !== "user")) {
    alert("Unauthorized access!");
    return <Navigate to={userRole === "admin" ? "/dashboards" : "/dashboard"} replace />;
  }

  return (
    <div className="d-flex">
      {role === "admin" ? <Sidebar /> : <Usersidebar />}
      <div className="content">
        <Navbar />
        {children}
      </div>
    </div>
  );
};

export default ProtectedLayout;
