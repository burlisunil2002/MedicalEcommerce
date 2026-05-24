const API_BASE_URL =
    window.location.hostname === "localhost"
        ? "http://localhost:5000"
        : window.location.origin;

export default API_BASE_URL;