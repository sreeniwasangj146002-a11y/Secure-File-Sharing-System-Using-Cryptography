import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button, Table, Modal, Form, Badge, ToastContainer, Pagination, InputGroup } from 'react-bootstrap';
import { Apiurl } from './Apiurl/Apiurl';
import { toast } from 'react-toastify';

const FileList = () => {
    const [files, setFiles] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [fileToShare, setFileToShare] = useState(null);
    const [email, setEmail] = useState("");
    const navigate = useNavigate();
    const [fileInfoModalOpen, setFileInfoModalOpen] = useState(false);
    const [selectedFileInfo, setSelectedFileInfo] = useState(null);
    const [loading, setLoading] = useState(false);
    // Get user details from localStorage
    const userRole = localStorage.getItem("role"); // "admin" or "user"
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");

    // Function to fetch files from the backend
    const fetchFiles = async () => {
        if (!userRole || !userId || !token) {
            alert("User not logged in.");
            navigate("/login");
            return;
        }

        try {
            let response;
            if (userRole === "admin") {
                response = await axios.get(`${Apiurl}files-with-users`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
            } else {
                response = await axios.get(`${Apiurl}files-with-users/${userId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
            }
            console.log('Error fetching files:', response.data);
            setFiles(response.data);
        } catch (error) {
            console.error('Error fetching files:', error);
            alert("Failed to fetch files");
        }
    };



    // Fetch files when the component mounts
    useEffect(() => {
        fetchFiles();
    }, [userRole, userId, token, navigate]);




    // 🟢 Initial fetch and auto-refresh every 30 seconds
    useEffect(() => {
        fetchFiles();

        const interval = setInterval(() => {
            fetchFiles();
        }, 30000); // 30 seconds

        return () => clearInterval(interval);
    }, [userRole, userId, token, navigate]);


    // The handleDeleteUser function expects only userId
    const handleDeleteUser = async (fileId) => {
        console.log("🔍 fileId received:", fileId); // Add this line to debug fileId

        if (!fileId) {
            alert("Invalid file ID. Cannot delete.");
            return;
        }

        const confirmDelete = window.confirm("Are you sure you want to delete this file?");
        if (!confirmDelete) return;

        try {
            const response = await axios.delete(`${Apiurl}delete-file/${fileId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            console.log("🟢 API Response:", response.data); // Check the API response

            if (response.status === 200) {
                alert("File deleted successfully.");
                fetchFiles(); // Refresh the file list
            } else {
                alert("Failed to delete file.");
            }
        } catch (error) {
            console.error("File deletion error:", error.response?.data || error.message);
            alert("File deletion failed.");
        }
    };


    // Open Share Modal
    const handleShare = (file) => {

        setFileToShare(file);
        setModalOpen(true);

    };
    const [dateTimelink, setDateTime] = useState('');
    // Handle Email Submission for Sharing File
    const handleEmailSubmit = async () => {
        if (!fileToShare || !email) {
            alert("Please enter an email and select a file.");
            return;
        }

        const fileId = fileToShare._id;
        console.log("file is saldkad", fileId)// Get the fileId directly from fileToShare
        if (!fileId) {
            alert("File ID is missing.");
            return;
        }

        const userId = localStorage.getItem("userId");
        if (!userId) {
            alert("User ID not found. Please log in again.");
            navigate("/login");
            return;
        }

        try {
            setLoading(true);
            const { originalname, filename } = fileToShare;

            console.log("📨 Sending Request with:", {
                email,
                fileId, // Ensure fileId is included
                userId,
                originalname,
                filename
            });




            await axios.post(`${Apiurl}sendotp`, {
                email,
                fileId, // Correctly sending fileId to the backend
                userId,
                originalname,
                filename,
            });

            const defaultTime = new Date();
            defaultTime.setHours(15, 46, 0, 0); 
            const newExpiryTime =defaultTime
            console.log("Expiry time updated:", newExpiryTime);
            const updateResponse = await axios.put(`${Apiurl}update-expiry/${fileId}`, {
                expiryTime_default: dateTimelink,
            });
    
            console.log("Expiry time updated:", updateResponse.data);

            setDateTime('')





            setTimeout(() => { setLoading(false) }, 300)
            alert(`File link sent to ${email}`);


            // Reset states after successful share
            setFileToShare(null);
            setEmail("");
            setModalOpen(false);

        } catch (error) {
            console.error("🚨 Error sending file link:", error.response?.data || error.message);
            toast.error("❌ Failed to send email. Please try again.");
        }
    };


    // 🟢 Function to format file size
    // const formatFileSize = (sizeInBytes) => {
    //     if (!sizeInBytes) return "Unknown";
    //     if (typeof sizeInBytes === "string" && sizeInBytes.includes("KB") || sizeInBytes.includes("MB")) {
    //         return sizeInBytes; // Already formatted
    //     }
    //     sizeInBytes = Number(sizeInBytes); // Ensure it's a number
    //     if (sizeInBytes < 1024) return `${sizeInBytes} Bytes`;
    //     if (sizeInBytes < 1024 * 1024) return `${(sizeInBytes / 1024).toFixed(2)} KB`;
    //     return `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`;
    // };

    // Function to handle opening File Info Modal
    const handleFileInfo = (file) => {
        setSelectedFileInfo(file);
        setFileInfoModalOpen(true);
    };

    // 🟢 Function to format file size
    const formatFileSize = (sizeInBytes) => {
        if (!sizeInBytes) return "Unknown";

        // Convert to a number if needed
        sizeInBytes = Number(sizeInBytes);

        const ONE_KB = 1024;
        const ONE_MB = ONE_KB * ONE_KB; // 1 MB = 1024 * 1024 bytes
        const LIMIT = 100 * ONE_MB;     // 100 MB limit in bytes

        // If file size is greater than or equal to 100 MB, return error message
        if (sizeInBytes >= LIMIT) {
            return "File size exceeds limit of 100 MB";
        }

        // Format file size into Bytes, KB, or MB accordingly
        if (sizeInBytes < ONE_KB) {
            return `${sizeInBytes} Bytes`;
        } else if (sizeInBytes < ONE_MB) {
            return `${(sizeInBytes / ONE_KB).toFixed(2)} KB`;
        } else {
            return `${(sizeInBytes / ONE_MB).toFixed(2)} MB`;
        }
    };

    // Pagination and search states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState("");


    // Filter files based on search term
    const filteredFiles = files.filter(file => {
        return (
            (file.originalname && file.originalname.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (file.user && file.user.name && file.user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (file.user && file.user.email && file.user.email.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    });

    // Calculate pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentFiles = filteredFiles.slice(indexOfFirstItem, indexOfLastItem);
    console.log("ejqjejwqe", currentFiles)
    // Calculate total pages
    const totalPages = Math.ceil(filteredFiles.length / itemsPerPage);

    // Handle page change
    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    // Generate pagination items
    const getPaginationItems = () => {
        const items = [];

        // Add "Previous" button
        items.push(
            <Pagination.Prev
                key="prev"
                onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
            />
        );

        // Show first page
        items.push(
            <Pagination.Item
                key={1}
                active={1 === currentPage}
                onClick={() => handlePageChange(1)}
            >
                1
            </Pagination.Item>
        );

        // Add ellipsis if needed
        if (currentPage > 3) {
            items.push(<Pagination.Ellipsis key="ellipsis1" disabled />);
        }

        // Add pages around current page
        for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
            if (i > 1 && i < totalPages) {
                items.push(
                    <Pagination.Item
                        key={i}
                        active={i === currentPage}
                        onClick={() => handlePageChange(i)}
                    >
                        {i}
                    </Pagination.Item>
                );
            }
        }

        // Add ellipsis if needed
        if (currentPage < totalPages - 2) {
            items.push(<Pagination.Ellipsis key="ellipsis2" disabled />);
        }

        // Show last page if there's more than one page
        if (totalPages > 1) {
            items.push(
                <Pagination.Item
                    key={totalPages}
                    active={totalPages === currentPage}
                    onClick={() => handlePageChange(totalPages)}
                >
                    {totalPages}
                </Pagination.Item>
            );
        }

        // Add "Next" button
        items.push(
            <Pagination.Next
                key="next"
                onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || totalPages === 0}
            />
        );

        return items;
    };


    return (
        <>
            {loading && (
                <div className="loading-overlay">
                    <div className="loading-message">
                        <img className="loadinggif" src={require("../photos/Animation - 1741089389885.gif")} alt="Loading..." />
                    </div>
                </div>
            )}
            <div className="container" >

                <h2 className="text-center mb-4">
                    {userRole === "admin" ? "Admin Files List" : "Your Files"}
                </h2>

                <div className="d-flex flex-wrap gap-2 justify-content-center justify-content-md-between pt-5">
                    <Button variant="primary" onClick={() => navigate('/upload')}>Upload File</Button>
                    {/* <Button variant="secondary" onClick={() => navigate('/verify')}>Verify OTP & Download</Button> */}
                </div>

                <div className="row mt-4 mb-3">
                    <div className="col-md-8 ">
                        <Form.Select
                            style={{ width: '150px', display: 'inline-block' }}
                            value={itemsPerPage}
                            onChange={(e) => {
                                setItemsPerPage(Number(e.target.value));
                                setCurrentPage(1); // Reset to first page when changing items per page
                            }}
                        >
                            <option value={5}>Show 5</option>
                            <option value={10}>Show 10</option>
                            <option value={20}>Show 20</option>
                            <option value={50}>Show 50</option>
                        </Form.Select>
                    </div>

                    <div className="col-md-4 text-end">
                        <InputGroup>
                            <InputGroup.Text>
                                <i className="fa-solid fa-search"></i>
                            </InputGroup.Text>
                            <Form.Control
                                type="text"
                                placeholder="Search by file name, user name or email..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1); // Reset to first page when searching
                                }}
                            />
                        </InputGroup>
                    </div>
          
            </div>
            {/* Full Screen Table */}
            {/* <div style={{ height: "calc(100vh - 100px)", overflowX: "auto", overflowY: "hidden" }}> */}
            <div >
                <h3 className="text-center mt-5 mb-4"> File Shared</h3>
                <Table striped bordered hover className="text-center" style={{ tableLayout: "fixed" }}>
                    <thead className="table-dark">
                        <tr>
                            <th>S.No</th>
                            <th>File Name</th>
                            <th>File Size</th>
                            <th>User Name</th>
                            <th>Receiver</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentFiles.length > 0 ? (
                            currentFiles.map((file, index) => (
                                <tr key={file._id}>
                                    <td>{index + 1}</td>
                                    <td className="text-truncate" style={{ maxWidth: "150px" }}>
                                        {file.originalname || "Unknown"}
                                    </td>
                                    <td>{(file.size)}</td>
                                    <td>{file.user.name ? file.user.name : "admin"}</td>
                                    {/* <td>{file.user ? file.user.email : "Unknown"}</td> */}
                                    <td className="col-md-6">{file.recivermail}</td>
                                    <td>
                                        <Badge
                                            bg={
                                                file.otpDetails?.downloaded === "Downloaded"
                                                    ? "success"
                                                    : file.otpDetails?.downloaded === "Download"
                                                        ? "warning"
                                                        : "secondary"
                                            }
                                        >
                                            {file.otpDetails?.downloaded || "Pending"}
                                        </Badge>
                                    </td>
                                    <td className="d-flex justify-content-center">
                                        <Button variant="info" size="sm" onClick={() => handleShare(file)}>
                                            <i className="fa-solid fa-share-nodes"></i>
                                        </Button>
                                        <Button
                                            variant="warning"
                                            size="sm"
                                            className="mx-2"
                                            onClick={() => handleFileInfo(file)}
                                        >
                                            <i className="fa-solid fa-info-circle"></i>
                                        </Button>
                                        <Button
                                            variant="danger"
                                            size="sm"
                                            onClick={() => handleDeleteUser(file._id)}
                                        >
                                            <i className="fa-solid fa-trash"></i>
                                        </Button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7" className="text-center">No files available.</td>
                            </tr>
                        )}
                    </tbody>
                </Table>
            </div>

            <div className="d-flex justify-content-between align-items-center mt-3">
                <div>
                    Showing {currentFiles.length > 0 ? indexOfFirstItem + 1 : 0} to {Math.min(indexOfLastItem, filteredFiles.length)} of {filteredFiles.length} entries
                </div>
                <Pagination>{getPaginationItems()}</Pagination>
            </div>

            {/* User Info Modal */}
            {/* Modal for User & File Information */}
            <Modal show={fileInfoModalOpen} onHide={() => setFileInfoModalOpen(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>User & File Information</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedFileInfo ? (
                        <>
                            <h5>📁 File Information:</h5>
                            <p><strong>File Name:</strong> {selectedFileInfo.originalname || "Unknown"}</p>
                            <p><strong>File Size:</strong> {(selectedFileInfo.size)}</p>
                            <p>
                                <strong>Download Status:</strong>{" "}
                                <Badge
                                    bg={
                                        selectedFileInfo.otpDetails?.downloaded === "Downloaded"
                                            ? "success"
                                            : selectedFileInfo.otpDetails?.downloaded === "Download"
                                                ? "warning"
                                                : "secondary"
                                    }
                                >
                                    {selectedFileInfo.otpDetails?.downloaded || "Pending"}
                                </Badge>
                            </p>
                            {/* <p><strong>Shared Count:</strong> {selectedFileInfo.sharedCount || "0"}</p> */}
                            <p>
                                <strong>Upload Date:</strong>{" "}
                                {new Date(selectedFileInfo.createdAt).toLocaleDateString() || "Unknown"}
                            </p>

                            <h5>User Information:</h5>
                            <p><strong>Name:</strong> {selectedFileInfo.user?.name || "Admin"}</p>
                            <p><strong>Email:</strong> {selectedFileInfo.user?.email || "Admin@gmail.com"}</p>

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


            {/* Modal for Sharing File */}
            <Modal show={modalOpen} onHide={() => setModalOpen(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Share File</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group controlId="email">
                        <Form.Label>Email Address</Form.Label>
                        <Form.Control
                            type="email"
                            placeholder="Enter recipient email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                               <Form.Control
                                  type="datetime-local"
                                  placeholder="Select Date and Time"
                                  value={dateTimelink}
                                  onChange={(e) => setDateTime(e.target.value)}
                                  style={{ marginTop: '10px' }}
                                />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setModalOpen(false)}>
                        Close
                    </Button>
                    <Button variant="primary" onClick={handleEmailSubmit}>
                        Send Link
                    </Button>
                </Modal.Footer>
            </Modal>
            <ToastContainer />

        </div >
                </>
                );
};

export default FileList;
