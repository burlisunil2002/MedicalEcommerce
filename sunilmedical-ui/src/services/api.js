import axios from "axios";

const API = axios.create({
    baseURL:
        process.env.REACT_APP_API_URL ||
        "https://localhost:7030",
    withCredentials: true,
});

export default API;