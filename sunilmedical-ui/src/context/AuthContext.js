import {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback
} from "react";

import API from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);

    const loadUser = useCallback(async () => {
        try {
            setAuthLoading(true);

            const res = await API.get("/api/user");

            const data = res.data;

            console.log("AUTH USER:", data);

            setUser(data);
        } catch (error) {
            console.error(
                "Auth user load error:",
                error.response?.data || error.message
            );

            setUser(null);
        } finally {
            setAuthLoading(false);
        }
    }, []);

    useEffect(() => {
        loadUser();
    }, [loadUser]);

    return (
        <AuthContext.Provider
            value={{
                user,
                setUser,
                reloadUser: loadUser,
                authLoading
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);

    if (context === null) {
        throw new Error(
            "useAuth() must be used inside <AuthProvider>"
        );
    }

    return context;
};