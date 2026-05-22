import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../photos/54290.jpg"; // Ensure the image path is correct

const Sidebar = () => {
  const [activeItem, setActiveItem] = useState(null);
  const [isUserSubMenuOpen, setIsUserSubMenuOpen] = useState(false);

  const handleClick = (item) => {
    if (item === "userlist") {
      setIsUserSubMenuOpen(!isUserSubMenuOpen);
    } else {
      setActiveItem(item);
      setIsUserSubMenuOpen(false);
    }
  };

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
          overflowY: "auto", // Enable scrolling if content exceeds the height
        }}
      >
        {/* Sidebar Logo */}
        <div className="text-center mb-4">
          <img
            src={require("../photos/54290.jpg")}
            alt="Logo"
            className="logo-img"
            style={{ width: "140px", height: "auto" }}
          />
        </div>

        {/* Sidebar Menu */}
        <ul className="list-unstyled">
          {/* Dashboard Item */}
          <li
            className={`sidebar-item mb-3 ${activeItem === "dashboard" ? "bg-primary rounded-3" : ""}`}
            onClick={() => handleClick("dashboard")}
          >
            <Link
              to="/dashboards"
              className="text-white d-flex align-items-center py-2 px-3 rounded-2 text-decoration-none"
            >
              <i className="fa-solid fa-gauge me-2"></i> <span>Dashboard</span>
            </Link>
          </li>

          {/* User Menu */}
          <li className="sidebar-item mb-3">
            <div
              onClick={() => handleClick("userlist")}
              className="sidebar-link d-flex align-items-center cursor-pointer py-2 px-3 rounded-2 text-decoration-none"
            >
              <i className="fa-solid fa-user me-2"></i>
              <span>User</span>
            </div>
          </li>

          {/* User Submenu */}
          {isUserSubMenuOpen && (
            <ul className="submenu list-unstyled ms-3">
              <li className="mb-2">
                <Link
                  to="/registereduser"
                  className={`text-white d-flex align-items-center py-2 px-3 rounded-2 text-decoration-none ${activeItem === "registereduser" ? "bg-primary rounded-3" : ""}`}
                  onClick={() => handleClick("registereduser")}
                >
                  <i className="fa-solid fa-user-check me-2"  ></i> <span>Registered User</span>
                </Link>
              </li>
              <li className="mb-2">
                <Link
                  to="/unregistereduser"
                  className={`text-white d-flex align-items-center py-2 px-3 rounded-2 text-decoration-none ${activeItem === "unregistereduser" ? "bg-primary rounded-3" : ""}`}
                  onClick={() => handleClick("unregistereduser")}
                >
                  <i className="fa-solid fa-user-times me-2"></i> <span>Guest User</span>
                </Link>
              </li>
            </ul>
          )}

          {/* File Shared Item */}
          <li
            className={`sidebar-item mb-3 ${activeItem === "Filelist" ? "bg-primary rounded-3" : ""}`}
            onClick={() => handleClick("Filelist")}
          >
            <Link
              to="/Filelist"
              className="text-white d-flex align-items-center py-2 px-3 rounded-2 text-decoration-none"
            >
              <i className="fa-solid fa-tachograph-digital me-2"></i> <span>File Shared</span>
            </Link>
          </li>

          {/* Logout Item */}
          <li
            className={`sidebar-item mb-3 ${activeItem === "logout" ? "bg-primary rounded-3" : ""}`}
            onClick={() => handleClick("logout")}
          >
            <Link
              to="/"
              className="text-white d-flex align-items-center py-2 px-3 rounded-2 text-decoration-none"
            >
              <i className="fa-solid fa-right-from-bracket me-2"></i> <span>LogOut</span>
            </Link>
          </li>
        </ul>
      </div>

      {/* Main content to ensure sidebar does not overlap */}
      <div style={{ marginLeft: "250px", paddingTop: "20px" }}>
        {/* Your main content goes here */}
      </div>
    </div>
  );
};

export default Sidebar;
