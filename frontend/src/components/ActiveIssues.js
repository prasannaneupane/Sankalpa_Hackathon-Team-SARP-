import React, { useEffect, useState } from "react";
import { getActiveIssues } from "../services/issueService";

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
        <div>
            <h1>Active Issues</h1>
            <ul>
                {issues.map((issue) => (
                    <li key={issue.id}>{issue.description}</li>
                ))}
            </ul>
        </div>
    );
};

export default ActiveIssues;