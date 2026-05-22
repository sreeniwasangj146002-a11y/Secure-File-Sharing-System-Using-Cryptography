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

const Dashboards = () => {
  const [graphData, setGraphData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [overallStats, setOverallStats] = useState({ files: 0, shared: 0 });
  const [todayStats, setTodayStats] = useState({ files: 0, shared: 0 });
  const [userStats, setUserStats] = useState({ registered: 0, unregistered: 0 });

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetchDashboardData(token);
  }, []);

  async function fetchDashboardData(token) {
    try {
      console.log("📡 Fetching Dashboard Data...");

      const [registeredResponse, unregisteredResponse] = await Promise.all([
        axios.get(`${Apiurl}/allusers`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }),
        axios.get(`${Apiurl}/guest-uploads`),
      ]);

      const registeredUsers = Array.isArray(registeredResponse.data?.users)
        ? registeredResponse.data.users
        : [];

      const unregisteredUploads = Array.isArray(unregisteredResponse.data?.uploads)
        ? unregisteredResponse.data.uploads
        : [];

      const unregisteredUserCount = new Set(
        unregisteredUploads.map((upload) => upload.email)
      ).size;

      setUserStats({
        registered: registeredUsers.length,
        unregistered: unregisteredUserCount,
      });

      const registeredFiles = registeredUsers.flatMap((user) =>
        Array.isArray(user.files) ? user.files : []
      );

      const allOtps = registeredUsers.flatMap((user) =>
        Array.isArray(user.otps) ? user.otps : []
      );

      processData(registeredFiles, allOtps);
    } catch (error) {
      console.error("⚠️ Fetch Error:", error.message);
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function processData(files = [], otps = []) {
    let totalFiles = 0;
    let totalSharedFiles = 0;
    let todayFiles = 0;
    let todayShared = 0;

    const today = new Date();
    const todayString = today.toLocaleDateString("en-GB");

    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      return {
        date: date.toLocaleDateString("en-GB"),
        dayName: date.toLocaleDateString("en-US", { weekday: "short" }), // "Mon", "Tue"
      };
    }).reverse();

    const dateDataMap = last30Days.reduce((acc, { date, dayName }) => {
      acc[date] = { dayName, fileUploads: 0, fileShares: 0 };
      return acc;
    }, {});

    files.forEach((file) => {
      totalFiles += 1;
      totalSharedFiles += parseInt(file.sharedCounts) || 0;

      const fileDateString = new Date(file.createdAt).toLocaleDateString("en-GB");

      if (fileDateString in dateDataMap) {
        dateDataMap[fileDateString].fileUploads += 1;
        dateDataMap[fileDateString].fileShares += parseInt(file.sharedCounts) || 0;
      }

      if (fileDateString === todayString) {
        todayFiles += 1;
        todayShared += parseInt(file.sharedCounts) || 0;
      }
    });

    otps.forEach((otp) => {
      const otpDateString = new Date(otp.createdAt).toLocaleDateString("en-GB");
      totalSharedFiles += parseInt(otp.sharedCounts) || 0;
      if (otpDateString === todayString) {
        todayShared += parseInt(otp.sharedCounts) || 0;
      }
      if (otpDateString in dateDataMap) {
        dateDataMap[otpDateString].fileShares += parseInt(otp.sharedCounts) || 0;
      }
    });

    setGraphData(Object.values(dateDataMap));
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
    <div className="container mt-5 pt-3 dashboard-container overflow-hidden"style={{position:"relative",zIndex:"-1"}}>
      <h2 className="fw-bold mt-5 text-center">Admin Dashboard</h2>

      <div className="row mb-4">
        <div className="col-md-4">
          <div className="card shadow-sm p-3">
            <h5 className="fw-bold text-center">Overall File Stats</h5>
            <p><strong>Total Files:</strong> {overallStats.files}</p>
            <p><strong>Files Shared:</strong> {overallStats.shared}</p>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card shadow-sm p-3">
            <h5 className="fw-bold text-center">Today's Stats</h5>
            <p><strong>Files Uploaded:</strong> {todayStats.files}</p>
            <p><strong>Files Shared:</strong> {todayStats.shared}</p>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card shadow-sm p-3">
            <h5 className="fw-bold text-center">Users</h5>
            <p><strong>Registered Users:</strong> {userStats.registered}</p>
            <p><strong>Unregistered Users:</strong> {userStats.unregistered}</p>
          </div>
        </div>
      </div>

      <div className="row mx-auto">
        <div className="col-12">
          <div className="card shadow-lg border-0 p-4 rounded-3">
            <h5 className="text-center fw-bold text-dark mb-4">File Activity (Last 30 Days)</h5>
            <div className="w-full" style={{ height: "400px" }}>
              {graphData.length > 0 ? (
                <ResponsiveContainer width={1060}>
                  <BarChart data={graphData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="dayName" tick={{ fontSize: 12 }} />
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
  );
};

export default Dashboards;
