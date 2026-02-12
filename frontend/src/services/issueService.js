import API_BASE_URL from "../config";

// Fetch all active issues
export const getActiveIssues = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/issues/active`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });
        if (!response.ok) {
            throw new Error("Failed to fetch active issues");
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching active issues:", error);
        throw error;
    }
};

// Report a new issue
export const reportIssue = async (issueData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/issues/report`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`, // Replace with actual token
            },
            body: formData,
        });
        if (!response.ok) {
            throw new Error("Failed to report issue");
        }
        return await response.json();
    } catch (error) {
        console.error("Error reporting issue:", error);
        throw error;
    }
};