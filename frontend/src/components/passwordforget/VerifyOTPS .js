// VerifyOTP.jsx - Form to verify the OTP code
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { Apiurl } from '../Apiurl/Apiurl';
const VerifyOTPS = () => {
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resetToken, setResetToken] = useState('');
  
  const location = useLocation();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Extract email from URL query params
    const params = new URLSearchParams(location.search);
    const emailParam = params.get('email');
    const tokenParam = params.get('token');
    
    if (emailParam) {
      setEmail(emailParam);
    }
    
    if (tokenParam) {
      setResetToken(tokenParam);
      // If we have a token, verify it's valid
      verifyResetToken(tokenParam);
    }
  }, [location]);
  
  const verifyResetToken = async (token) => {
    try {
      const response = await axios.get(`${Apiurl}/api/auth/verify-reset-token/${token}`);
      if (response.data.otpVerified) {
        // If OTP is already verified, go directly to reset password page
        navigate(`/reset-password/${token}`);
      } else {
        setEmail(response.data.email);
      }
    } catch (error) {
      // setMessage('Invalid or expired reset link. Please request a new one.');
      setSuccess(false);
    }
  };
  // In your VerifyOTP.jsx component
const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setMessage('');
  
  try {
    // Make sure this URL matches the route prefix in your Express app
    const response = await axios.post(`${Apiurl}/verify-otp`, { email, otp });
    setMessage(response.data.message);
    setSuccess(true);
    
    // After successful OTP verification, redirect to password reset page
    setTimeout(() => {
      navigate(`/reset-password/${response.data.resetToken}`);
    }, 1500);
  } catch (error) {
    setMessage(error.response?.data?.message || 'Failed to verify OTP');
    setSuccess(false);
  } finally {
    setLoading(false);
  }
};
  
  return (
    // <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
    //   <h2 className="text-2xl font-bold mb-6">Verify OTP Code</h2>
    //   <form onSubmit={handleSubmit}>
    //     <div className="mb-4">
    //       <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
    //         Email Address
    //       </label>
    //       <input
    //         className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
    //         id="email"
    //         type="email"
    //         value={email}
    //         onChange={(e) => setEmail(e.target.value)}
    //         required
    //         readOnly={!!email}
    //       />
    //     </div>
    //     <div className="mb-6">
    //       <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="otp">
    //         OTP Code
    //       </label>
    //       <input
    //         className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
    //         id="otp"
    //         type="text"
    //         placeholder="Enter 6-digit OTP"
    //         value={otp}
    //         onChange={(e) => setOtp(e.target.value)}
    //         maxLength={6}
    //         required
    //       />
    //       <p className="text-sm text-gray-500 mt-1">
    //         Please enter the 6-digit code sent to your email
    //       </p>
    //     </div>
    //     <div className="flex items-center justify-between">
    //       <button
    //         className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
    //         type="submit"
    //         disabled={loading}
    //       >
    //         {loading ? 'Verifying...' : 'Verify OTP'}
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
  <div className="card p-4 shadow" style={{ maxWidth: '400px', width: '100%' }}>
    <h2 className="mb-4 text-center">Verify OTP Code</h2>
    <form onSubmit={handleSubmit}>
      <div className="mb-3">
        <label htmlFor="email" className="form-label">Email Address</label>
        <input
          type="email"
          className="form-control"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          readOnly={!!email}
        />
      </div>

      <div className="mb-3">
        <label htmlFor="otp" className="form-label">OTP Code</label>
        <input
          type="text"
          className="form-control"
          id="otp"
          placeholder="Enter 6-digit OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          maxLength={6}
          required
        />
        <small className="text-muted">Please enter the 6-digit code sent to your email</small>
      </div>

      <div className="d-grid">
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Verifying...' : 'Verify OTP'}
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

export default VerifyOTPS;
