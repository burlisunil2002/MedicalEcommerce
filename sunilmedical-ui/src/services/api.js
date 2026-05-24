import axios from "axios";

const API = axios.create({
    baseURL: "https://localhost:7030", // ✅ ONLY base domain
    withCredentials: true
});

export default API;