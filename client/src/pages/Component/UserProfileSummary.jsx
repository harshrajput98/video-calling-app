import React, { useState } from "react";

export default function UserProfileSummary({ user }) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [username, setUsername] = useState(user?.username || "");
  const [status, setStatus] = useState(user?.status || "Active");

  const openEditModal = () => setIsEditModalOpen(true);
  const closeEditModal = () => setIsEditModalOpen(false);

  const handleSaveChanges = () => {
    // Simulate saving changes (API integration here)
    console.log("Updated Username:", username);
    console.log("Updated Status:", status);
    setIsEditModalOpen(false);
  };

  return (
   <div className="w-full bg-gray-900 p-6 rounded-xl shadow-lg text-white mb-6">
  <div className="flex items-center justify-between flex-wrap gap-4">
    <div className="flex items-center gap-4">
      <img
        src={user?.profilepic || "/boy.png"}
        alt="User Avatar"
        className="w-20 h-20 rounded-full border-4 border-blue-500 object-cover"
      />
      <div>
        <h2 className="text-2xl font-bold">{user?.username || "Guest"} </h2>
        <p className="text-gray-400 text-sm">
          Status: {user?.status || "Active"}
        </p>
      </div>
    </div>
    <button
      onClick={openEditModal}
      className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium"
    >
      Edit Profile
    </button>
  </div>

  {/* Edit Modal */}
  {isEditModalOpen && (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md mx-4">
        <h3 className="text-xl font-bold mb-4 text-white">Edit Profile</h3>
        <div className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="p-2 rounded bg-gray-700 text-white border border-gray-600"
          />
          <input
            type="text"
            placeholder="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="p-2 rounded bg-gray-700 text-white border border-gray-600"
          />
          <div className="flex justify-end gap-3 mt-4">
            <button
              onClick={closeEditModal}
              className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveChanges}
              className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-500"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )}
</div>
  );
}
