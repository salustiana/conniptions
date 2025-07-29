import React from "react";
import { useAuth } from "../context/AuthContext";

const UserPage: React.FC = () => {
  const { user } = useAuth();
  return (
    <div style={{ padding: "2rem" }}>
      <h2>User Profile</h2>
      {user ? (
        <p>Username: {user}</p>
      ) : (
        <p>You are not logged in.</p>
      )}
    </div>
  );
};

export default UserPage; 