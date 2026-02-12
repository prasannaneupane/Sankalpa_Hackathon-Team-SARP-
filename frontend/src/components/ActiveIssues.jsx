import React, { useEffect, useState } from "react";
import { getActiveIssues } from "../services/issueService";
import "../global.css"; // Import global styles

const ActiveIssues = () => {
    const [issues, setIssues] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchIssues = async () => {
            try {
                const data = await getActiveIssues();
                setIssues(data);
            } catch (err) {
                setError(err.message);
            }
        };

        fetchIssues();
    }, []);

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <div className="container">
            <h1>Active Issues</h1>
            <ul>
                {issues.map((issue) => (
                    <li key={issue.id}>
                        <strong>Description:</strong> {issue.description}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default ActiveIssues;