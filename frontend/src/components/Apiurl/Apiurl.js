import axios from "axios";

// Define the constants
// const Apiurl = 'http://192.168.1.13:5001/api/';
const Apiurl = 'http://localhost:5001/api/';
const axiosInstance = axios.create({
    baseURL: Apiurl,
    headers: {
        "Content-Type": "application/json",
    },
});

// Export the constants
export { Apiurl, axiosInstance };
