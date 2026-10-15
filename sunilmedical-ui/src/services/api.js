
import axios from "axios";

const API = axios.create({
    baseURL:
        process.env.REACT_APP_API_URL ||
        window.location.origin,

    // Required when ASP.NET Core uses cookie authentication.
    withCredentials: true,

    timeout: 60000,
});

// Extract a useful message from common ASP.NET Core responses.
export const getApiErrorMessage = (error) => {
    const status = error?.response?.status;
    const data = error?.response?.data;

    if (!error?.response) {
        if (error?.code === "ECONNABORTED") {
            return "The request timed out. Please try again.";
        }

        return "Unable to connect to the server. Check your connection and try again.";
    }

    if (status === 401) {
        return "Your session has expired or you are not authenticated. Please sign in again.";
    }

    if (status === 403) {
        return (
            data?.message ||
            "You do not have permission to perform this action."
        );
    }

    if (status === 400) {
        return (
            data?.message ||
            "Please check the submitted information and try again."
        );
    }

    if (status >= 500) {
        return (
            data?.message ||
            "A server error occurred. Please try again later."
        );
    }

    return (
        data?.message ||
        data?.title ||
        error?.message ||
        "Something went wrong. Please try again."
    );
};

export default API;
