import axios from 'axios';
import React, { useState } from 'react';
import "../assets/addfile.css"
import { useNavigate } from 'react-router-dom';
import { Apiurl } from './Apiurl/Apiurl';

const AddFile = () => {
    const [file, setFile] = useState(null);
    const [email, setEmail] = useState('');
    const [fileId, setFileId] = useState('');
    const navigate = useNavigate();

    const handleFileChange = (e) => setFile(e.target.files[0]);
    const handleEmailChange = (e) => setEmail(e.target.value);

    const handleUpload = async () => {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await axios.post(`${Apiurl}/uploadfile`, formData);
            console.log(setFileId(res.data._id))
            setFileId(res.data._id);  // Save the file ID to state
            alert('File uploaded successfully');
        } catch (error) {
            alert('File upload failed');
        }
        navigate('/verify');   // Uncomment if you need navigation after upload
    };

   
    
    const handleSendOTP = async () => {
        try {
            await axios.post(`${Apiurl}/sendotp`, { fileId, email });
            alert('OTP sent to email');
            
            
        } catch (error) {
            alert('Failed to send OTP');
        }
    };

    return (
        <div className='Addfilecontent'>
            <h2>Add File</h2>
            <input type="file" onChange={handleFileChange} />
            <button onClick={handleUpload} className='Addfile' style={{fontSize:"small" ,padding:"10px", width:"80px"}}>Add</button>

            {fileId && (  // Only show the email and OTP section if fileId is present
                <div>
                    <h3>Send OTP for File Access</h3>
                    <input
                        type="email"
                        placeholder="Enter email"
                        value={email}   
                        onChange={handleEmailChange}
                    />
                    <button onClick={handleSendOTP}>Send OTP</button>
                </div>
            )}
        </div>
    );
};

export default AddFile;