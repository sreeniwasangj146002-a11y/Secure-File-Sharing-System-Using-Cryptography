import axios from "axios";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Form, Container, Row, Col, Card, Spinner } from "react-bootstrap";
import { Apiurl } from "./Apiurl/Apiurl";
import { ToastContainer } from "react-toastify";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; // Make sure this is imported

const UploadFile = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sizeError, setSizeError] = useState(''); // New state for size error
  const navigate = useNavigate();

  // Define maximum file size: 7KB
  const MAX_FILE_SIZE = 7 * 1024;

  // Role and User ID management
  const [userId, setUserId] = useState(null);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    const storedUserRole = localStorage.getItem("role"); // "admin" or "user"

    console.log("Fetched userId:", storedUserId, "Role:", storedUserRole);

    setUserId(storedUserId);
    setUserRole(storedUserRole);

    // Redirect if not logged in
    if (!storedUserRole) {
      alert("Session expired. Please log in again.");
      navigate("/login");
    }
  }, [navigate]);

  // Handle File Selection with Size Validation
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    
    // Reset error state
    setSizeError('');
    
    if (selectedFile) {
      // Check file size
      if (selectedFile.size > MAX_FILE_SIZE) {
        setSizeError(`File size exceeds 7KB limit (${(selectedFile.size / 1024).toFixed(1)}KB)`);
      }
      setFile(selectedFile);
    }
  };

  // File Upload Logic
  const handleUpload = async () => {
    if (!file) {
      toast.warning("Please select a file.");
      return;
    }

    // Double-check file size before upload
    if (file.size > MAX_FILE_SIZE) {
      setSizeError(`File size exceeds 7KB limit (${(file.size / 1024).toFixed(1)}KB)`);
      toast.error("File size exceeded 7KB limit");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    // Determine the API endpoint based on user role
    const endpoint = userRole === "admin" ? "/admin/uploadfile" : "/uploadfile";
    console.log("Uploading to endpoint:", endpoint);

    if (userId) {
      formData.append("userId", userId);
    } else {
      toast.error("Invalid upload attempt. Please log in.");
      navigate("/login");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(`${Apiurl}${endpoint}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("File upload response:", res.data);

      toast.success("File uploaded successfully");

      // Redirect to Dashboard & Reset Form
      const role = localStorage.getItem('role');
      if(role == "user"){
        navigate("/dashboard", { state: { refresh: true } });
      }else{
          navigate("/dashboards", { state: { refresh: true } });
      }
    
      setFile(null); // Clear selected file
    } catch (error) {
      console.error("Upload error:", error.response?.data || error.message);
      toast.error("File size exceeded");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="mt-5 pt-5 mx-5">
      <Row className="justify-content-center mx-5">
        <Col md={6} lg={5} xl={12}>
          <Card className="shadow-lg p-4 mt-4 mx-5">
            <Card.Body>
              <h2 className="text-center mb-4">Upload File</h2>
              <Form>
                <Form.Group controlId="file" className="mb-3">
                  <Form.Label>Choose a File</Form.Label>
                  <Form.Control
                    type="file"
                    onChange={handleFileChange}
                    required
                    isInvalid={!!sizeError}
                  />
                  {sizeError && (
                    <Form.Control.Feedback type="invalid">
                      {sizeError}
                    </Form.Control.Feedback>
                  )}
                  <Form.Text className="text-muted">
                    Maximum file size: 7KB
                  </Form.Text>
                </Form.Group>

                <Button
                  variant="primary"
                  className="w-100 py-2"
                  onClick={handleUpload}
                  disabled={loading || !!sizeError}
                >
                  {loading ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Uploading...
                    </>
                  ) : (
                    "Upload"
                  )}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
        <ToastContainer position="top-right" autoClose={5000} />
      </Row>
    </Container>
  );
};

export default UploadFile;