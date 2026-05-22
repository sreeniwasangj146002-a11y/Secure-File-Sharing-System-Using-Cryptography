import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaEye, FaEyeSlash } from "react-icons/fa"; // Import eye icons
import { Apiurl } from "./Apiurl/Apiurl";

const Profile = () => {
  const [user, setUser] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // Toggle password visibility
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");

      if (!token || !userId) throw new Error("No token or user ID found. Please log in again.");

      const response = await axios.get(`${Apiurl}/alluserss`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const matchedUser = response.data.find((u) => u._id === userId);
      if (!matchedUser) throw new Error("User not found.");

      setUser({
        name: matchedUser.name,
        email: matchedUser.email,
        password: matchedUser.password,
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      setError(error.response?.data?.message || "Failed to load profile");
    }
  };

  const handleUpdatePassword = async () => {
    try {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");

      await axios.put(
        `${Apiurl}/edit/${userId}`,
        { password: newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Password updated successfully!");

      setUser((prevUser) => ({
        ...prevUser,
        password: newPassword,
      }));

      setIsEditing(false);
      setNewPassword("");
    } catch (error) {
      console.error("Error updating password:", error);
      setError("Failed to update password");
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center min-vh-100 mx-5" >
      <div className="card shadow-lg p-4 rounded-3 mx-5" style={{ width: "100%", maxWidth: "600px",position:"absolute",left:"37%" }}>
        <div className="text-center ">
          <h2 className="mb-4">Profile</h2>
          <div className="fs-1 mb-3">
            <i className="fa-solid fa-user"></i>
          </div>
        </div>

        {error && <p className="text-danger text-center">{error}</p>}

        <div className="table-responsive mb-4">
          <table className="table table-bordered table-striped">
            <tbody>
              <tr>
                <td className="fw-bold">Name:</td>
                <td>{user.name}</td>
              </tr>
              <tr>
                <td className="fw-bold">Email:</td>
                <td>{user.email}</td>
              </tr>
              <tr>
                <td className="fw-bold">Password:</td>
                {/* <td>{user.password}</td> */}
                <td>{"********"}</td> {/* Hiding actual password */}
              </tr>
            </tbody>
          </table>
        </div>

        <div className="text-center">
          <button className="btn btn-primary" onClick={() => setIsEditing(true)}>
            Edit Password
          </button>
        </div>
      </div>

      {isEditing && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}>
          <div className="modal-dialog" id="editing">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Password</h5>
                <button className="btn-close" onClick={() => setIsEditing(false)}></button>
              </div>
              <div className="modal-body">
                <div className="input-group">
                  <input
                    type={showPassword ? "text" : "password"} // Toggle input type
                    className="form-control"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                  <button
                    className="btn btn-outline-secondary"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-success" onClick={handleUpdatePassword}>
                  Save
                </button>
                <button className="btn btn-secondary" onClick={() => setIsEditing(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
