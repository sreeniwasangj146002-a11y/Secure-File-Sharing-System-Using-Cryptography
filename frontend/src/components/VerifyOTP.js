import React, { useState } from "react";
import { Button, Form, Container, Row, Col, Card, Alert } from "react-bootstrap";
import { Apiurl } from "./Apiurl/Apiurl";

const VerifyOTP = () => {
    const [fileId, setFileId] = useState("");
    const [otp, setOtp] = useState("");
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleVerifyOTP = async () => {
        setError("");
        if (!email || !fileId || !otp) {
            setError("⚠️ Please enter all required fields (Email, File ID, OTP).");
            return;
        }

        try {
            setLoading(true);
            const response = await fetch(
                `${Apiurl}/verifyotp?email=${email}&fileId=${fileId}&otp=${otp}`
            );

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || "Verification failed. Try again.");
            }

            if (data.fileDownloadLink) {
                window.location.href = data.fileDownloadLink; // ✅ Corrected download URL handling
            } else {
                throw new Error("File link not found.");
            }
        } catch (error) {
            setError(error.message || "Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container className="mt-5 pt-5">
            <Row className="justify-content-center">
                <Col md={8} lg={6}>
                    <Card className="shadow-lg p-4">
                        <Card.Body>
                            <h2 className="text-center mb-4">Verify OTP & Download File</h2>

                            {error && <Alert variant="danger">{error}</Alert>}

                            <Form>
                                <Form.Group controlId="email" className="mb-3">
                                    <Form.Label>Email Address</Form.Label>
                                    <Form.Control 
                                        type="email"
                                        value={email}
                                        placeholder="Enter Your Email"
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </Form.Group>

                                <Form.Group controlId="fileId" className="mb-3">
                                    <Form.Label>File ID</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={fileId}
                                        placeholder="Enter File ID"
                                        onChange={(e) => setFileId(e.target.value)}
                                        required
                                    />
                                </Form.Group>

                                <Form.Group controlId="otp" className="mb-4">
                                    <Form.Label>OTP</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={otp}
                                        placeholder="Enter OTP"
                                        onChange={(e) => setOtp(e.target.value)}
                                        required
                                    />
                                </Form.Group>

                                <Button
                                    variant="primary"
                                    className="w-100 py-2"
                                    onClick={handleVerifyOTP}
                                    disabled={loading}
                                >
                                    {loading ? "Verifying..." : "Download File"}
                                </Button>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default VerifyOTP;
