import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { Apiurl } from '../Apiurl/Apiurl';
const ResetPassword = () => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [tokenValid, setTokenValid] = useState(false);

    const { token } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        // Verify token is valid before showing reset form
        const verifyToken = async () => {
            try {
                const response = await axios.get(`${Apiurl}/api/auth/verify-reset-token/${token}`);
                if (!response.data.otpVerified) {
                    // If OTP not verified, redirect to OTP verification
                    navigate(`/verify-otp?token=${token}`);
                    return;
                }
                setTokenValid(true);
            } catch (error) {
                setMessage('Invalid or expired reset link. Please request a new one.');
                setTokenValid(false);
            }
        };

        // if (token) {
        //   verifyToken();
        // }
    }, [token, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate passwords
        // if (newPassword !== confirmPassword) {
        //   setMessage('Passwords do not match');
        //   setSuccess(false);
        //   return;
        // }

        // if (newPassword.length < 8) {
        //   setMessage('Password must be at least 8 characters long');
        //   setSuccess(false);
        //   return;
        // }

        setLoading(true);
        setMessage('');

        try {
            const response = await axios.post(`${Apiurl}/api/auth/reset-password`, {
                resetToken: token,
                newPassword
            });

            setMessage(response.data.message);
            setSuccess(true);

            // Redirect to login page after successful password reset
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (error) {
            setMessage(error.response?.data?.message || 'Failed to reset password');
            setSuccess(false);
        } finally {
            setLoading(false);
        }
    };

    if (!tokenValid && message) {
        return (
            <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
                <div className="p-3 rounded bg-red-100 text-red-700">
                    {message}
                </div>
                {/* <div className="mt-4">
          <a href="/forgot-password" className="text-blue-500 hover:text-blue-700">
            Request a new password reset
          </a>
        </div> */}
            </div>
        );
    }

    return (
        // <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
        //   <h2 className="text-2xl font-bold mb-6">Reset Your Password</h2>
        //   <form onSubmit={handleSubmit}>
        //     <div className="mb-4">
        //       <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="newPassword">
        //         New Password
        //       </label>
        //       <input
        //         className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        //         id="newPassword"
        //         type="password"
        //         placeholder="Enter new password"
        //         value={newPassword}
        //         onChange={(e) => setNewPassword(e.target.value)}
        //         required
        //       />
        //     </div>
        //     <div className="flex items-center justify-between">
        //       <button
        //         className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        //         type="submit"
        //         disabled={loading}
        //       >
        //         {loading ? 'Resetting...' : 'Reset Password'}
        //       </button>
        //     </div>
        //   </form>
        //   {message && (
        //     <div className={`mt-4 p-3 rounded ${success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
        //       {message}
        //     </div>
        //   )}
        // </div>
        <div className="container d-flex justify-content-center align-items-center vh-100">
            <div className="card p-4 shadow" style={{ maxWidth: '400px', width: '100%'}}>
                <h2 className="mb-4 text-center">Reset Your Password</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label htmlFor="newPassword" className="form-label">New Password</label>
                        <input
                            type="password"
                            className="form-control"
                            id="newPassword"
                            placeholder="Enter new password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div className="d-grid">
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Resetting...' : 'Reset Password'}
                        </button>
                    </div>
                </form>

                {message && (
                    <div className={`alert mt-3 ${success ? 'alert-success' : 'alert-danger'}`} role="alert">
                        {message}
                    </div>
                )}
            </div>
        </div>

    );
};

export default ResetPassword;
