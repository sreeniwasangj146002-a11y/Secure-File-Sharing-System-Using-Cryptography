import axios from "axios";
import React, { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { Apiurl } from "./Apiurl/Apiurl";
import "../assets/login.css";

const Login = ({ setIsLoggedIn }) => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError(""); // Clear error when user starts typing
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return; // Prevent multiple submissions

    setLoading(true);

    try {
      const response = await axios.post(`${Apiurl}login`, form);
      const { token, role, userId } = response.data;

      if (!token || !role) throw new Error("Invalid response from server");

      // ✅ Store user details in localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("role", role);
      localStorage.setItem("email", form.email);
      if (userId) localStorage.setItem("userId", userId);

      setIsLoggedIn(true);

      // ✅ Redirect based on role
      if (role === "admin") {
        window.location.href = "/dashboards";
      } else {
        window.location.href = "/dashboard";
      }
    } catch (error) {
      console.error("Login Error:", error.response?.data || error.message);
      setError(error.response?.data?.error || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    try {
      const email = form.email
      const response = await axios.post(`${Apiurl}send-password-otp`, { email }); // adjust your API endpoint
      alert('OTP sent to your email!');
    } catch (error) {
      console.error(error);
      alert('Failed to send OTP. Try again.');
    }
  };



  return (
    <>
      {loading && (
        <div className="loading-overlay">
          <div className="loading-message">
            <img className="loadinggif" src={require("../photos/Book.gif")} alt="Loading..." />
          </div>
        </div>
      )}


      <div className="d-flex justify-content-center align-items-center min-vh-100 bg-light">
        <div className="card shadow-lg" style={{ width: "100%", maxWidth: "400px" }}>
          <div className="card-body">
            <h2 className="text-center text-dark mb-4">Login</h2>

            {error && <p className="text-danger text-center mb-4">{error}</p>}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  placeholder="Enter your email"
                  className="form-control"
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mb-3 position-relative">
                <label className="form-label">Password</label>
                <div className="position-relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={form.password}
                    placeholder="Enter your password"
                    className="form-control"
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    className="position-absolute top-50 end-0 translate-middle-y btn btn-link text-dark"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>

                </div>
                <p className="text-center mt-3">
                  Don't have an account?{" "}
                  <Link to="/" className="text-primary">
                    Register
                  </Link>
                </p>
                <div className="text-center">
                  <p onClick={handleSendOtp} className="btn btn-primary p-1">
                    Forgot password
                  </p>
                </div>
                </div>
                <button type="submit" className="btn btn-dark w-100 py-2" disabled={loading}>
                  {loading ? "Logging in..." : "Login"}
                </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
