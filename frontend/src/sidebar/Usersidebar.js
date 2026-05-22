import React, { useState } from "react";
import { Link } from "react-router-dom";
import sidebarLogo from "../photos/54290.jpg"; // Properly imported image

const UserSidebar = () => {
  const [activeItem, setActiveItem] = useState(null);

  return (
    <div className="d-flex">
      <div
        className="sidebar bg-dark text-white p-4 fixed-top"
        style={{
          width: "250px",
          height: "100vh",
          position: "fixed",
          top: 0,
          bottom: 0,
          left: 0,
          zIndex: 1000,
          overflowY: "auto", // Ensure scrolling if content exceeds the height
        }}
      >
        {/* Sidebar Logo */}
        <div className="text-center mb-4">
          <img
            src={sidebarLogo}
            alt="Logo"
            className="logo-img"
            style={{ width: "140px", height: "auto" }}
          />
        </div>

        {/* Sidebar Menu */}
        <ul className="list-unstyled">
          {/* Dashboard Item */}
          <li
            className={`nav-item mb-3 ${activeItem === "dashboard" ? "bg-primary text-white" : ""}`}
            onClick={() => setActiveItem("dashboard")}
          >
            <Link
              to="/dashboard"
              className="nav-link text-white d-flex align-items-center px-3 py-2 rounded-2"
            >
              <i className="fa-solid fa-gauge me-3"></i>
              <span>Dashboard</span>
            </Link>
          </li>

          {/* Profile Item */}
          <li
            className={`nav-item mb-3 ${activeItem === "profile" ? "bg-primary text-white" : ""}`}
            onClick={() => setActiveItem("profile")}
          >
            <Link
              to="/profile"
              className="nav-link text-white d-flex align-items-center px-3 py-2 rounded-2"
            >
              <i className="fa-solid fa-user me-3"></i>
              <span>Profile</span>
            </Link>
          </li>

          {/* File Shares Item */}
          <li
            className={`nav-item mb-3 ${activeItem === "Filelister" ? "bg-primary text-white" : ""}`}
            onClick={() => setActiveItem("Filelister")}
          >
            <Link
              to="/Filelister"
              className="nav-link text-white d-flex align-items-center px-3 py-2 rounded-2"
            >
              <i className="fa-solid fa-tachograph-digital me-3"></i>
              <span>File Shares</span>
            </Link>
          </li>

          {/* Logout Item */}
          <li
            className={`nav-item mb-3 ${activeItem === "logout" ? "bg-primary text-white" : ""}`}
            onClick={() => setActiveItem("logout")}
          >
            <Link
              to="/"
              className="nav-link text-white d-flex align-items-center px-3 py-2 rounded-2"
            >
              <i className="fa-solid fa-right-from-bracket me-3"></i>
              <span>LogOut</span>
            </Link>
          </li>
        </ul>
      </div>

      {/* Main content to ensure sidebar does not overlap */}
      <div style={{ marginLeft: "250px", paddingTop: "20px" }}>
        {/* Main content goes here */}
      </div>
    </div>
  );
};

export default UserSidebar;
