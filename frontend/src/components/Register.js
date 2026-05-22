import axios from "axios";
import React, { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Apiurl } from "./Apiurl/Apiurl";
import "../photos/5401842_Coll_wavebreak_Blue_1280x720.mp4"

const Register = () => {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showGuestPopup, setShowGuestPopup] = useState(false);
  const [guestForm, setGuestForm] = useState({ email: "", receiverEmail: "", file: null });
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleGuestChange = (e) => setGuestForm({ ...guestForm, [e.target.name]: e.target.value });
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file.size > 1024 * 1024) {
      toast.error("File size exceeds 1MB. Please upload a smaller file.");
      return;
    }
    setGuestForm({ ...guestForm, file });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${Apiurl}/register`, form);
      if (response.data?.userId) {
        localStorage.setItem("userId", response.data.userId);
        localStorage.setItem("email", form.email); // Store email in local storage
        toast.success("Registration successful!");
        setTimeout(() => navigate("/login"), 2000);
      } else {
        toast.error("Registration failed.");
      }
    } catch (error) {
      console.error("Registration Error:", error);
      toast.error("Register Email Already Exist.");
    }
  };
  
  const handleGuestUpload = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("email", guestForm.email);
    formData.append("receiverEmail", guestForm.receiverEmail);
    formData.append("file", guestForm.file);

    try {
      const response = await axios.post(`${Apiurl}/guest-upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data?.success) {
        toast.success("File uploaded successfully!");
        setShowGuestPopup(false);
      } else {
        toast.warning("Register and login to continue");
      }
    } catch (error) {
      console.error("Guest Upload Error:", error);
      toast.error("Failed to upload file.");
    }
  };

  return (
    <div className="container min-vh-100 d-flex justify-content-center align-items-center py-5">
           {/* Background Video */}
           <video
        autoPlay
        loop
        muted
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          zIndex: -1,
        }}
      >
        <source
          src={require("../photos/5401842_Coll_wavebreak_Blue_1280x720.mp4")}
          type="video/mp4"
        />
        Your browser does not support the video tag.
      </video>
      <ToastContainer />

      <div className="card  shadow-lg rounded-lg " style={{ width: "100%", maxWidth: "400px",opacity:"0.9" }}>
        <div className="card-body">
          <h2 className="text-center text-2xl font-bold text-gray-800 mb-4">Create an Account</h2>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                name="name"
                className="form-control"
                // placeholder="John Doe"
                onChange={handleChange}
                value={form.name}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                name="email"
                className="form-control"
                // placeholder="example@email.com"
                onChange={handleChange}
                value={form.email}
                required
              />
            </div>

            <div className="mb-3 position-relative">
              <label className="form-label">Password</label>
              <div className="position-relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  className="form-control"
                  // placeholder="Enter your password"
                  onChange={handleChange}
                  value={form.password}
                  required
                />
                <button
                  type="button"
                  className="position-absolute top-50 end-0 translate-middle-y btn btn-link"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-100">
              Register
            </button>
          </form>

          <p className="mt-3 text-center">
            Already have an account?{" "}
            <span
              className="text-primary cursor-pointer"
              onClick={() => navigate("/login")}
            >
              Login
            </span>
          </p>

          <button
            className="btn btn-secondary w-100 mt-3"
            onClick={() => setShowGuestPopup(true)}
          >
             Guest
          </button>
        </div>
      </div>

      {showGuestPopup && (
        <div className="modal d-block" style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Guest Upload</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowGuestPopup(false)}
                ></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleGuestUpload}>
                  <div className="mb-3">
                    <label className="form-label">Your Email</label>
                    <input
                      type="email"
                      name="email"
                      className="form-control"
                      placeholder="Enter your email"
                      onChange={handleGuestChange}
                      value={guestForm.email}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Receiver Email</label>
                    <input
                      type="email"
                      name="receiverEmail"
                      className="form-control"
                      placeholder="Enter receiver's email"
                      onChange={handleGuestChange}
                      value={guestForm.receiverEmail}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Upload File</label>
                    <input
                      type="file"
                      className="form-control"
                      onChange={handleFileChange}
                      accept=".jpg, .png, .pdf, .docx"
                      required
                    />
                  </div>

                  <button type="submit" className="btn btn-primary w-100">
                    Upload
                  </button>
                </form>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary w-100"
                  onClick={() => setShowGuestPopup(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Register;
