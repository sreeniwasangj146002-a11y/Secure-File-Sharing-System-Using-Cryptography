import { useState } from 'react';
import axios from 'axios';

const PasswordResetRequest = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    
    try {
      const response = await axios.post('/api/auth/send-password-otp', { email });
      setMessage(response.data.message);
      setSuccess(true);
      // Navigate to OTP verification page with email in state
      window.location.href = `/verify-otp?email=${encodeURIComponent(email)}`;
    } catch (error) {
      setMessage(error.response?.data?.message || 'Something went wrong');
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Reset Your Password</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
            Email Address
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="flex items-center justify-between">
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Reset Instructions'}
          </button>
        </div>
      </form>
      {message && (
        <div className={`mt-4 p-3 rounded ${success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message}
        </div>
      )}
    </div>
  );
};

export default PasswordResetRequest;