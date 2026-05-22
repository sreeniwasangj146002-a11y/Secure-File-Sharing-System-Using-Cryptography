import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import axios from "axios";
import { Apiurl } from "./Apiurl/Apiurl";

const Navbar = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [username, setUsername] = useState("Admin");
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsername = async () => {
      try {
        const loggedInUserId = localStorage.getItem("userId");
        
        if (!loggedInUserId) {
          setUsername("Admin");
          return;
        }

        // 🟢 FIXED: Add the trailing slash to the API URL
        const response = await axios.get(`${Apiurl}/allusers`);
        console.log("API Full Response:", response);

        // 🟢 SAFE DATA ACCESS: Ensure response.data is an array
        const users = Array.isArray(response.data) ? response.data : response.data?.users;

        if (!Array.isArray(users)) {
          console.error("Invalid data format. Expected an array of users.");
          setUsername("Admin");
          return;
        }

        // 🟢 FIND USER BY ID
        const loggedInUser = users.find(user => user._id === loggedInUserId);
        setUsername(loggedInUser?.name || "Admin");

      } catch (error) {
        console.error("Failed to fetch username:", error.message);
        setUsername("Admin");
      }
    };

    fetchUsername();
  }, [location]);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <nav className="navbar navbar-expand-md navbar-dark bg-dark py-3 w-100 position-fixed top-0 left-0 z-index-10">
      <div className="container-fluid d-flex justify-content-between align-items-center">
        <Link to="/collegeimage" className="navbar-brand">
          <span className="brand-text">College</span>
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded={isDropdownOpen ? "true" : "false"}
          aria-label="Toggle navigation"
          onClick={toggleDropdown}
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            <li
              className="nav-item dropdown"
              style={{ position: "absolute", right: "20%", top: "10px" }}
            >
              <button
                className="nav-link dropdown-toggle d-flex align-items-center bg-dark border-0"
                id="navbarDropdown"
                role="button"
                aria-expanded={isDropdownOpen ? "true" : "false"}
                onClick={toggleDropdown}
              >
                <img
                  src={require("../photos/profile.png")}
                  alt="Profile"
                  className="profile-img rounded-circle me-2"
                  width="30"
                  height="30"
                />
                <span className="text-light">{username}</span>
              </button>

              <ul
                className={`dropdown-menu dropdown-menu-end ${isDropdownOpen ? "show" : ""}`}
                aria-labelledby="navbarDropdown"
              >
                <li>
                  <button className="dropdown-item" onClick={handleLogout}>
                    Logout
                  </button>
                </li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
