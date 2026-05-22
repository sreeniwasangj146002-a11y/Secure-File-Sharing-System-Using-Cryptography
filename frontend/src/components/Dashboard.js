import React, { useEffect, useState } from "react";
import axios from "axios";
import { Apiurl } from "./Apiurl/Apiurl";
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

const Dashboard = () => {
  const [userData, setUserData] = useState(null);
  const [graphData, setGraphData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [overallStats, setOverallStats] = useState({ files: 0, shared: 0 });
  const [todayStats, setTodayStats] = useState({ files: 0, shared: 0 });

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    console.log("🆔 User ID from localStorage:", userId);

    if (userId) {
      fetchDashboardData(userId, token);
    } else {
      console.warn("⚠️ No User ID found in local storage");
      setLoading(false);
    }
  }, []);

  async function fetchDashboardData(userId, token) {
    try {
      console.log("📡 Fetching All Files Data...");

      const response = await axios.get(`${Apiurl}/files-with-users`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      console.log("✅ API Response:", response.data); // Log response to see the format

      let filesData = response.data;

      if (Array.isArray(filesData)) {
        const userFiles = filesData.filter((file) => file.user._id === userId);

        if (userFiles.length > 0) {
          const userData = userFiles[0].user;
          setUserData(userData);
          console.log("✅ User Data:", userData);

          const fileDetails = userFiles.map((file) => ({
            fileId: file._id,
            filename: file.filename,
            originalname: file.originalname,
            size: file.size,
            sharedCount: file.sharedCount,
            createdAt: file.createdAt,
            otpDetails: file.otpDetails,
          }));

          console.log("✅ Processed File Data:", fileDetails);
          processData(fileDetails);
        } else {
          console.warn("⚠️ No files found for the current user.");
          setUserData(null);
          setGraphData([]);
        }
      } else {
        console.error("❌ Unexpected API response format", filesData);
      }

      setError(null);
    } catch (error) {
      console.error("⚠️ Fetch Error:", error.message);
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function processData(files = []) {
    let totalFiles = 0;
    let totalSharedFiles = 0;
    let todayFiles = 0;
    let todayShared = 0;
  
    const today = new Date();
    
    // Generate last 30 days with day names
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(today.getDate() - i);
      
      return {
        date: date.toLocaleDateString("en-GB"), // Keep full date for reference
        dayName: date.toLocaleDateString("en-US", { weekday: "short" }), // "Mon", "Tue"
      };
    }).reverse();
  
    const dateDataMap = last30Days.reduce((acc, { date, dayName }) => {
      acc[date] = { dayName, fileUploads: 0, fileShares: 0 };
      return acc;
    }, {});
  
    files.forEach((file) => {
      if (!file || !file.createdAt) return;
  
      totalFiles += 1;
  
      const fileDate = new Date(file.createdAt);
      const fileDateString = fileDate.toLocaleDateString("en-GB");
      const fileDayName = fileDate.toLocaleDateString("en-US", { weekday: "short" });
  
      let fileSharedCount = file.otpDetails?.sharedCounts ? parseInt(file.otpDetails.sharedCounts) : 0;
      totalSharedFiles += fileSharedCount;
  
      if (dateDataMap[fileDateString]) {
        dateDataMap[fileDateString].fileUploads += 1;
        dateDataMap[fileDateString].fileShares += fileSharedCount;
      }
  
      if (fileDateString === today.toLocaleDateString("en-GB")) {
        todayFiles += 1;
        todayShared += fileSharedCount;
      }
    });
  
    setGraphData(Object.values(dateDataMap)); // Store only day names for X-axis
    setOverallStats({ files: totalFiles, shared: totalSharedFiles });
    setTodayStats({ files: todayFiles, shared: todayShared });
  }
  


  if (loading) {
    return <div className="text-center mt-5">Loading...</div>;
  }

  if (error) {
    return <div className="alert alert-danger text-center mt-5">{error}</div>;
  }

  return (
    <div className="dashboard-wrapper" style={{position:"absolute",zIndex:"-1"}}>
      <div className="container mt-5 pt-3 dashboard-container">
        <h2 className="fw-bold mt-5 text-center">User Dashboard</h2>

        <div className="row mb-4 justify-content-center">
          <div className="col-md-5 p-4">
            <div className="card shadow-sm p-3">
              <h5 className="fw-bold text-center">Overall File Stats</h5>
              <p><strong>Total Files:</strong> {overallStats.files}</p>
              <p><strong>Files Shared:</strong> {overallStats.shared}</p>
            </div>
          </div>

          <div className="col-md-5 p-4">
            <div className="card shadow-sm p-3 mx-2">
              <h5 className="fw-bold text-center">Today's Stats</h5>
              <p><strong>Files Uploaded:</strong> {todayStats.files}</p>
              <p><strong>Files Shared:</strong> {todayStats.shared}</p>
            </div>
          </div>
        </div>

        <div className="row p-4">
          <div className="col-12 mb-5">
            <div className="card shadow-lg border-0 p-4 rounded-3">
              <h5 className="text-center fw-bold text-dark mb-4">File Activity (Last 30 Days)</h5>
              <div style={{ height: "500px" }}>
                {graphData.length > 0 ? (
                  <ResponsiveContainer width={1050}>
                  <BarChart data={graphData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="dayName" tick={{ fontSize: 12 }} /> {/* Shows "Mon", "Tue", etc. */}
                    <YAxis tick={{ fontSize: 14 }} />
                    <Tooltip wrapperStyle={{ fontSize: "14px" }} />
                    <Legend wrapperStyle={{ fontSize: "16px" }} />
                    <Bar dataKey="fileUploads" fill="#3498db" name="Files Uploaded" barSize={20} />
                    <Bar dataKey="fileShares" fill="#e74c3c" name="Files Shared" barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
                
                ) : (
                  <p className="text-center text-muted">No data available</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
