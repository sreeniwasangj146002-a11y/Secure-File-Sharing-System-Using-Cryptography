import React, { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import axios from "axios"; // Add this import statement
import { Apiurl } from "./Apiurl/Apiurl";
// import "../assets/Dashboards.css";

const Dashboards = ({ token }) => {
  const [graphData, setGraphData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [overallStats, setOverallStats] = useState({ files: 0, shared: 0 });
  const [todayStats, setTodayStats] = useState({ files: 0, shared: 0 });
  const [userStats, setUserStats] = useState({ registered: 0, unregistered: 0 });

  useEffect(() => {
    fetchAdminDashboard();
    fetchUsers(); // Fetch the users' shared file count (otpSentCount)
  }, []);

  // Fetch overall dashboard data
  async function fetchAdminDashboard() {
    try {
      console.log("📡 Fetching Data...");

      const response = await axios.get(`${Apiurl}/uploadfilesssd`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      console.log("🟢 API Response:", response.data);

      // Ensure the response is an object and contains the necessary fields
      if (!response.data || typeof response.data !== "object") {
        throw new Error("Invalid API response format");
      }

      const { formattedData, overall, today, users } = response.data;

      // Check if formattedData is an array
      if (!Array.isArray(formattedData)) {
        console.error("🚨 formattedData is not an array:", formattedData);
        throw new Error("Invalid API response format: formattedData is not an array");
      }

      // Set state only if data is valid
      setGraphData(formattedData);
      setOverallStats(overall || { files: 0, shared: 0 });
      setTodayStats(today || { files: 0, shared: 0 });
      setUserStats(users || { registered: 0, unregistered: 0 });
    } catch (error) {
      console.error("⚠️ Fetch Error:", error.message);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  // Fetching the users and their shared file count (otpSentCount)
  async function fetchUsers() {
    try {
      console.log("📡 Fetching Users' Shared Files...");

      const response = await axios.get(`${Apiurl}/allusers`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      console.log("🟢 API Response (Users):", response.data);

      if (response.data && Array.isArray(response.data)) {
        // Sum the otpSentCount (shared files) from all users
        const totalSharedFiles = response.data.reduce((acc, user) => {
          return acc + (user.otpSentCount || 0); // Add otpSentCount if it exists
        }, 0);

        // Update the overall shared files count with the total otpSentCount
        setOverallStats((prevStats) => ({
          ...prevStats,
          shared: totalSharedFiles, // Update the shared count
        }));
      }
    } catch (error) {
      console.error("⚠️ Fetch Error (Users):", error.message);
      setError(error.message);
    }
  }

  return (
    <div className="container mt-5">
      <h2 className="fw-bold mb-4 ">Admin Dashboard</h2>

      {/* Top 3 Cards */}
      <div className="col-md-12">
      <div className="row mb-4">
        
          <div className="card shadow-sm p-3">
            <h5 className="fw-bold text-center">Overall File Uploads</h5>
            <p><strong>Files:</strong> {overallStats.files}</p>
            <p><strong>Shared:</strong> {overallStats.shared}</p>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card shadow-sm p-3">
            <h5 className="fw-bold text-center">Today’s Files</h5>
            <p><strong>Files:</strong> {todayStats.files}</p>
            <p><strong>Shared:</strong> {todayStats.shared}</p>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card shadow-sm p-3">
            <h5 className="fw-bold text-center">Users</h5>
            <p><strong>Registered:</strong> {userStats.registered}</p>
            <p><strong>Unregistered:</strong> {userStats.unregistered}</p>
          </div>
        </div>
      </div>

      {/* Graph Section */}
      <div className="row">
        <div className="col-lg-12">
          <div className="card shadow-sm p-3">
            <h5 className="text-center fw-bold">File Activity (Last 30 Days)</h5>
            <div style={{ width: "100%", height: 500 }}>
              {graphData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400} style={{ zIndex: "-1" }}>
                  <BarChart data={graphData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 14 }} />
                    <YAxis tick={{ fontSize: 14 }} tickCount={6} domain={[0, "auto"]} />
                    <Tooltip wrapperStyle={{ fontSize: "14px" }} />
                    <Legend wrapperStyle={{ fontSize: "16px" }} />
                    <Bar dataKey="fileUploads" fill="#4CAF50" name="Files Uploaded" barSize={50} />
                    <Bar dataKey="fileShares" fill="#FFC107" name="Files Shared" barSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center">No data available</p>
              )}
            </div>
          </div>
        </div>
      </div>
     
    </div>
    
  );
};

export default Dashboards;
