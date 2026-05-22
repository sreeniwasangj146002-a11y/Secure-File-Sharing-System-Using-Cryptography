import React, { useEffect, useState } from "react";
import axios from "axios";
import { Table, Spinner, Container, Button, Modal, Form } from "react-bootstrap";
import { Apiurl } from "./Apiurl/Apiurl";

const UnregisteredUser = () => {
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUpload, setSelectedUpload] = useState(null);
  const [receiverEmail, setReceiverEmail] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    fetchUploads();
  }, []);

  const fetchUploads = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${Apiurl}/guest-uploads`);
      setUploads(response.data.uploads);
    } catch (error) {
      console.error("Error fetching guest uploads:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle opening the edit modal with pre-filled data
  const handleEdit = (upload) => {
    setSelectedUpload(upload);
    setReceiverEmail(upload.receiverEmail);
    setShowEditModal(true);
  };

  // Handle updating the guest upload
  const handleUpdate = async () => {
    if (!selectedUpload) return;

    const formData = new FormData();
    formData.append("receiverEmail", receiverEmail);
    if (selectedFile) {
      formData.append("file", selectedFile);
    }

    try {
      await axios.put(`${Apiurl}/guest-upload/${selectedUpload._id}`, formData);
      setShowEditModal(false);
      fetchUploads(); // Refresh the data after updating
    } catch (error) {
      console.error("Error updating guest upload:", error);
    }
  };

  // Handle deleting the guest upload
  const handleDelete = async (_id) => {
    if (window.confirm("Are you sure you want to delete this upload?")) {
      try {
        await axios.delete(`${Apiurl}/guest-upload/${_id}`);
        fetchUploads(); // Refresh the data after deleting
      } catch (error) {
        console.error("Error deleting guest upload:", error);
      }
    }
  };

  return (
    <Container fluid style={{ height: "100vh" }}>
      {loading ? (
        <div className="text-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      ) : (
        <div style={{ overflowX: "auto", height: "calc(100vh - 100px)" }} className="mt-5">
          <h3 className="text-center mb-3 mt-5">Guest Uploads</h3>
          <Table striped bordered hover className="text-center w-100" style={{ tableLayout: "fixed" }}>
            <thead className="table-dark">
              <tr>
                <th>S.No</th>
                <th>Sender Email</th>
                <th>Receiver Email</th>
                <th>File Name</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {uploads.length > 0 ? (
                uploads.map((upload, index) => (
                  <tr key={upload._id}>
                    <td>{index + 1}</td>
                    <td>{upload.email}</td>
                    <td>{upload.receiverEmail}</td>
                    <td>{upload.originalname}</td>
                    <td>
                      <a
                        href={`${Apiurl}/guest-download/${upload._id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="info" size="sm" className="me-2">
                          Download
                        </Button>
                      </a>
                      <Button
                        variant="warning"
                        size="sm"
                        className="me-2"
                        onClick={() => handleEdit(upload)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(upload._id)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5">No guest uploads available.</td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
      )}

      {/* Edit Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Guest Upload</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Receiver Email</Form.Label>
              <Form.Control
                type="email"
                value={receiverEmail}
                onChange={(e) => setReceiverEmail(e.target.value)}
                placeholder="Enter receiver's email"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Upload New File (Optional)</Form.Label>
              <Form.Control
                type="file"
                onChange={(e) => setSelectedFile(e.target.files[0])}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleUpdate}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default UnregisteredUser;
