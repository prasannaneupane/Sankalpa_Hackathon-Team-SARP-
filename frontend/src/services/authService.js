import API_BASE_URL from "../config";

// Login a user
export const login = async (credentials) => {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(credentials),
        });
        if (!response.ok) {
            throw new Error("Failed to login");
        }
        return await response.json();
    } catch (error) {
        console.error("Error logging in:", error);
        throw error;
    }
};

// Register a user
export const register = async (userData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(userData),
        });
        if (!response.ok) {
            throw new Error("Failed to register");
        }
        return await response.json();
    } catch (error) {
        console.error("Error registering user:", error);
        throw error;
    }
};