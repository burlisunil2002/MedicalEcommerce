import axios from "axios";

const API = axios.create({
    baseURL:
        window.location.hostname === "localhost"
            ? "https://localhost:7030"
            : window.location.origin,
    withCredentials: true
});

export default API;