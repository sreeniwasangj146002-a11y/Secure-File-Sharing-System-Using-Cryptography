import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Table, Spinner, Container, Button } from "react-bootstrap";
import { Apiurl } from "./Apiurl/Apiurl";
import { Modal, Badge } from 'react-bootstrap';
// import "../assets/registereduser.css";

const RegisteredUser = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [fileInfoModalOpen, setFileInfoModalOpen] = useState(false);
  const [selectedFileInfo, setSelectedFileInfo] = useState(null);

  const Navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${Apiurl}/allusers`);

      // Access the "users" array within the response data
      const responseData = response.data?.users;

      // Ensure the data is an array and handle possible formats
      if (Array.isArray(responseData)) {
        setData(responseData);
      } else {
        setData([]); // Default to an empty array if the data is not usable
      }

    } catch (error) {
      console.error("Error fetching data:", error);
      setData([]); // Set to an empty array on error
    } finally {
      setLoading(false);
    }
  };


  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await axios.delete(`${Apiurl}/delete/${userId}`);
      fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user");
    }
  };

  const handleEditClick = (user) => {
    setSelectedUser({ ...user });
    setIsEditing(true);
  };

  const handleInputChange = (e) => {
    setSelectedUser({ ...selectedUser, [e.target.name]: e.target.value });
  };

  const handleUpdateUser = async () => {
    try {
      await axios.put(`${Apiurl}/edit/${selectedUser._id}`, selectedUser);
      setIsEditing(false);
      fetchUsers();
    } catch (error) {
      console.error("Error updating user:", error);
      alert("Failed to update user");
    }
  };

  // Function to handle opening File Info Modal
  const handleFileInfo = (user) => {
    setSelectedFileInfo(user);
    setFileInfoModalOpen(true);
  };

  return (
    <Container fluid className="pt-4">

      {loading ? (
        <div className="text-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      ) : (
        <div style={{ overflowX: "auto", height: "calc(100vh - 100px)" }} className="mt-5">
          <h3 className="text-center mt-5 mb-4">Registered Users</h3>
          <Table striped bordered hover className="text-center w-100" style={{ tableLayout: "fixed" }}>
            <thead className="table-dark">
              <tr>
                <th>S.No</th>
                <th>Name</th>
                <th>Email</th>
                <th>Total Files</th>
                {/* <th>Shared Files</th> */}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((user, index) => {
              //  const totalOtpSharedCount = user.otps?.reduce((sum, otp) => sum + (otp.sharedCounts || 0), 0) || 0;

                return (
                  <tr key={user._id}>
                    <td>{index + 1}</td>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.files?.length || 0}</td>
                    {/* <td>{totalOtpSharedCount}</td> */}
                    <td>
                      <Button variant="warning" size="md" onClick={() => handleEditClick(user)}>
                        <i className="fa-solid fa-pen-to-square"></i>
                      </Button>{" "}
                      <Button variant="danger" size="md" className="mx-3" onClick={() => handleDeleteUser(user._id)}>
                        <i className="fa-solid fa-trash-can"></i>
                      </Button>{" "}
                      <Button
                        variant="warning"
                        size="sm"
                        className="mx-2"
                        onClick={() => handleFileInfo(user)}
                      >
                        <i className="fa-solid fa-info-circle"></i>
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </div>
      )}



      {/* Modal for User & File Information */}
      <Modal show={fileInfoModalOpen} onHide={() => setFileInfoModalOpen(false)}>
        <Modal.Header closeButton>
          <Modal.Title>User & File Information</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedFileInfo ? (
            <>
              <h5>📁 File Information:</h5>
              {selectedFileInfo.files?.map((file, index) => (
                <div key={index}>
                  <p><strong>File Name:</strong> {file.originalname || "Unknown"}</p>
                  {/* <p><strong>Shared Count:</strong> {file.sharedCount || "0"}</p> */}

                  <p>
                    <strong>Upload Date:</strong>{" "}
                    {new Date(file.createdAt).toLocaleDateString() || "Unknown"}
                  </p>
                  <hr />
                </div>
              ))}
              <h5>👤 User Information:</h5>
              <p><strong>Name:</strong> {selectedFileInfo.name || "Admin"}</p>
              <p><strong>Email:</strong> {selectedFileInfo.email || "Admin@gmail.com"}</p>
              <p><strong>Total Files:</strong> {selectedFileInfo.fileCount || "0"}</p> {/* 🟢 Total Files Count */}
            </>
          ) : (
            <p>No file information available.</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setFileInfoModalOpen(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>



      {isEditing && selectedUser && (
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog" id="editing">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit User</h5>
                <button className="btn-close" onClick={() => setIsEditing(false)}></button>
              </div>
              <div className="modal-body">
                <input
                  type="text"
                  className="form-control mb-2"
                  name="name"
                  value={selectedUser.name || ""}
                  onChange={handleInputChange}
                  placeholder="Enter Name"
                />
                <input
                  type="email"
                  className="form-control mb-2"
                  name="email"
                  value={selectedUser.email || ""}
                  onChange={handleInputChange}
                  placeholder="Enter Email"
                />
                <input
                  type="number"
                  className="form-control mb-2"
                  name="fileCount"
                  value={selectedUser.fileCount || 0}
                  onChange={handleInputChange}
                  placeholder="Total File Count"
                />
                <input
                  type="number"
                  className="form-control"
                  name="totalSharedCount"
                  value={
                    selectedUser.files?.reduce((sum, file) => sum + (file.sharedCount || 0), 0) || 0
                  }
                  onChange={handleInputChange}
                  placeholder="Total Shared Files"
                />

              </div>
              <div className="modal-footer">
                <button className="btn btn-success" onClick={handleUpdateUser}>Save</button>
                <button className="btn btn-secondary" onClick={() => setIsEditing(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Container>
  );
};

export default RegisteredUser;
