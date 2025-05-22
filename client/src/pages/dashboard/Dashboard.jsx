import React, { useEffect, useRef, useState } from "react";
import socketInstance from "../Component/socketio/VideoCallSocket";
import UserProfileSummary from "../Component/UserProfileSummary";
import {
  FaBars,
  FaTimes,
  FaPhoneAlt,
  FaMicrophone,
  FaVideo,
  FaVideoSlash,
  FaMicrophoneSlash,
} from "react-icons/fa";
import Lottie from "lottie-react";
import { Howl } from "howler";
import wavingAnimation from "../../assets/waving.json";
import { FaPhoneSlash } from "react-icons/fa6";
import apiClient from "../../apiClient";
import { useUser } from "../../context/UserContextApi";
import { RiLogoutBoxLine } from "react-icons/ri";
import { useNavigate } from "react-router-dom";
import Peer from "simple-peer";
// import { Buffer } from "buffer";

// if (!window.Buffer) window.Buffer = Buffer;

const Dashboard = () => {
  const { user, updateUser } = useUser();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [userOnline, setUserOnline] = useState([]);
  const [stream, setStream] = useState(null);
  const [me, setMe] = useState("");
  const [showUserDetailModal, setShowUserDetailModal] = useState(false);
  const [modalUser, setModalUser] = useState(null);
  const myVideo = useRef(null);
  const reciverVideo = useRef(null);
  const connectionRef = useRef(null);
  const hasJoined = useRef(false);

  const [reciveCall, setReciveCall] = useState(false);
  const [caller, setCaller] = useState(null);
  const [callerName, setCallerName] = useState("");
  const [callerSignal, setCallerSignal] = useState(null);
  const [callAccepted, setCallAccepted] = useState(false);
  const [callerWating, setCallerWating] = useState(false);

  const [callRejectedPopUp, setCallRejectedPopUp] = useState(false);
  const [rejectorData, setCallrejectorData] = useState(null);

  // 🔹 State to track microphone & video status
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);

  // 🔥 Load ringtone
  const ringtone = new Howl({
    src: ["/ringtone.mp3"], // ✅ Replace with your ringtone file
    loop: false, // ✅ Keep ringing until stopped
    volume: 1.0, // ✅ Full volume
  });

  const socket = socketInstance.getSocket();

  useEffect(() => {
    // Check if `user` and `socket` exist and if the user has not already joined the socket room.
    if (user && socket && !hasJoined.current) {
      // Emit a "join" event to the server with the user's ID and username.
      socket.emit("join", { id: user._id, name: user.username });
      // Mark `hasJoined.current` as `true` to ensure the user does not join multiple times.
      hasJoined.current = true;
    }
    // Listen for the "me" event, which provides the current user's socket ID.
    socket.on("me", (id) => setMe(id));
    // Listen for "callToUser" event, which means another user is calling the current user.
    socket.on("callToUser", (data) => {
      setReciveCall(true); // Set state to indicate an incoming call.
      setCaller(data); // Store caller's information in state.
      setCallerName(data.name); // Store caller's name.
      setCallerSignal(data.signal); // Store WebRTC signal data for the call.
      // ✅ Start playing ringtone
      ringtone.play();
    });
    // Listen for "callRejected" event, which is triggered when the other user declines the call.
    socket.on("callRejected", (data) => {
      setCallRejectedPopUp(true);
      setCallrejectorData(data);
      // ✅ Stop ringtone in case call is ended before acceptance
      // ✅ Stop ringtone when call is accepted
      ringtone.stop();
    });
    // Listen for "callEnded" event, which is triggered when the other user ends the call.
    socket.on("callEnded", (data) => {
      console.log("Call ended by", data.name); // Log the event in the console.
      // ✅ Stop ringtone in case call is ended before acceptance
      ringtone.stop();
      endCallCleanup(); // Call a function to clean up the call state.
    });
    // Listen for "userUnavailable" event, meaning the user being called is not online.
    socket.on("userUnavailable", (data) => {
      alert(data.message || "User is not available."); // Show an alert.
    });
    // Listen for "userBusy" event, meaning the user is already on another call.
    socket.on("userBusy", (data) => {
      alert(data.message || "User is currently in another call."); // Show an alert.
    });
    // Listen for "online-users" event, which provides the list of currently online users.
    socket.on("online-users", (onlineUsers) => {
      setUserOnline(onlineUsers); // Update state with the list of online users.
    });
    // Cleanup function: Runs when the component unmounts or dependencies change.
    return () => {
      socket.off("me"); // Remove listener for "me" event.
      socket.off("callToUser"); // Remove listener for incoming calls.
      socket.off("callRejected"); // Remove listener for call rejection.
      socket.off("callEnded"); // Remove listener for call ending.
      socket.off("userUnavailable"); // Remove listener for unavailable user.
      socket.off("userBusy"); // Remove listener for busy user.
      socket.off("online-users"); // Remove listener for online users list.
    };
  }, [user, socket]); // Dependencies: This effect runs whenever `user` or `socket` changes.

  const startCall = async () => {
    try {
      // ✅ Request access to the user's media devices (camera & microphone)
      const currentStream = await navigator.mediaDevices.getUserMedia({
        video: true, // Enable video
        audio: {
          echoCancellation: true, // ✅ Reduce echo in audio
          noiseSuppression: true, // ✅ Reduce background noise
        },
      });
      // ✅ Store the stream in state so it can be used later
      setStream(currentStream);
      // ✅ Assign the stream to the local video element for preview
      if (myVideo.current) {
        myVideo.current.srcObject = currentStream;
        myVideo.current.muted = true; // ✅ Mute local audio to prevent feedback
        myVideo.current.volume = 0; // ✅ Set volume to zero to avoid echo
      }
      // ✅ Ensure that the audio track is enabled
      currentStream.getAudioTracks().forEach((track) => (track.enabled = true));
      // ✅ Close the sidebar (if open) and set the selected user for the call
      setCallRejectedPopUp(false);
      setIsSidebarOpen(false);
      setCallerWating(true); //wating to join reciver
      setSelectedUser(modalUser._id);
      // ✅ Create a new Peer connection (WebRTC) as the call initiator
      const peer = new Peer({
        initiator: true, // ✅ This user starts the call
        trickle: false, // ✅ Prevents trickling of ICE candidates, ensuring a single signal exchange
        stream: currentStream, // ✅ Attach the local media stream
      });
      // ✅ Handle the "signal" event (this occurs when the WebRTC handshake is initiated)
      peer.on("signal", (data) => {
        // ✅ Emit a "callToUser" event to the server with necessary call details
        socket.emit("callToUser", {
          callToUserId: modalUser._id, // ✅ ID of the user being called
          signalData: data, // ✅ WebRTC signal data required for establishing connection
          from: me, // ✅ ID of the caller
          name: user.username, // ✅ Caller’s name
          email: user.email, // ✅ Caller’s email
          profilepic: user.profilepic, // ✅ Caller’s profile picture
        });
      });
      // ✅ Handle the "stream" event (this is triggered when the remote user's media stream is received)
      peer.on("stream", (remoteStream) => {
        if (reciverVideo.current) {
          reciverVideo.current.srcObject = remoteStream; // ✅ Assign remote stream to video element
          reciverVideo.current.muted = false; // ✅ Ensure audio from the remote user is not muted
          reciverVideo.current.volume = 1.0; // ✅ Set volume to normal level
        }
      });
      // ✅ Listen for "callAccepted" event from the server (when the recipient accepts the call)
      socket.once("callAccepted", (data) => {
        setCallRejectedPopUp(false);
        setCallAccepted(true); // ✅ Mark call as accepted
        setCallerWating(false); //reciver join the call
        setCaller(data.from); // ✅ Store caller's ID
        peer.signal(data.signal); // ✅ Pass the received WebRTC signal to establish the connection
      });
      // ✅ Store the peer connection reference to manage later (like ending the call)
      connectionRef.current = peer;
      // ✅ Close the user detail modal after initiating the call
      setShowUserDetailModal(false);
    } catch (error) {
      console.error("Error accessing media devices:", error); // ✅ Handle permission errors or device access failures
    }
  };

  const handelacceptCall = async () => {
    // ✅ Stop ringtone when call is accepted
    ringtone.stop();
    try {
      // ✅ Request access to the user's media devices (camera & microphone)
      const currentStream = await navigator.mediaDevices.getUserMedia({
        video: true, // Enable video
        audio: {
          echoCancellation: true, // ✅ Reduce echo in audio
          noiseSuppression: true, // ✅ Reduce background noise
        },
      });

      // ✅ Store the stream in state so it can be used later
      setStream(currentStream);

      // ✅ Assign the stream to the local video element for preview
      if (myVideo.current) {
        myVideo.current.srcObject = currentStream;
      }

      // ✅ Ensure that the audio track is enabled
      currentStream.getAudioTracks().forEach((track) => (track.enabled = true));

      // ✅ Update call state
      setCallAccepted(true); // ✅ Mark call as accepted
      setReciveCall(true); // ✅ Indicate that the user has received the call
      setCallerWating(false); //reciver join the call
      setIsSidebarOpen(false); // ✅ Close the sidebar (if open)

      // ✅ Create a new Peer connection as the receiver (not the initiator)
      const peer = new Peer({
        initiator: false, // ✅ This user is NOT the call initiator
        trickle: false, // ✅ Prevents trickling of ICE candidates, ensuring a single signal exchange
        stream: currentStream, // ✅ Attach the local media stream
      });

      // ✅ Handle the "signal" event (this occurs when the WebRTC handshake is completed)
      peer.on("signal", (data) => {
        // ✅ Emit an "answeredCall" event to the server with necessary response details
        socket.emit("answeredCall", {
          signal: data, // ✅ WebRTC signal data required for establishing connection
          from: me, // ✅ ID of the receiver (this user)
          to: caller.from, // ✅ ID of the caller
        });
      });

      // ✅ Handle the "stream" event (this is triggered when the remote user's media stream is received)
      peer.on("stream", (remoteStream) => {
        if (reciverVideo.current) {
          reciverVideo.current.srcObject = remoteStream; // ✅ Assign remote stream to video element
          reciverVideo.current.muted = false; // ✅ Ensure audio from the remote user is not muted
          reciverVideo.current.volume = 1.0; // ✅ Set volume to normal level
        }
      });

      // ✅ If there's an incoming signal (from the caller), process it
      if (callerSignal) peer.signal(callerSignal);

      // ✅ Store the peer connection reference to manage later (like ending the call)
      connectionRef.current = peer;
    } catch (error) {
      console.error("Error accessing media devices:", error); // ✅ Handle permission errors or device access failures
    }
  };

  const handelrejectCall = () => {
    // ✅ Stop ringtone when call is accepted
    ringtone.stop();
    // ✅ Update the state to indicate that the call is rejected
    setCallerWating(false); //reciver reject the call
    setReciveCall(false); // ✅ The user is no longer receiving a call
    setCallAccepted(false); // ✅ Ensure the call is not accepted

    // ✅ Notify the caller that the call was rejected
    socket.emit("reject-call", {
      to: caller.from, // ✅ The caller's ID (who initiated the call)
      name: user.username, // ✅ The name of the user rejecting the call
      profilepic: user.profilepic, // ✅ Placeholder profile picture of the user rejecting the call
    });
  };

  const handelendCall = () => {
    // ✅ Stop ringtone when call is accepted
    console.log("🔴 Sending call-ended event...");
    // ✅ Stop ringtone when call is accepted
    ringtone.stop();
    // ✅ Notify the other user that the call has ended
    socket.emit("call-ended", {
      to: caller?.from || selectedUser, // ✅ Send call end signal to the caller or selected user
      name: user.username, // ✅ Send the username to inform the other party
    });

    // ✅ Perform cleanup actions after ending the call
    endCallCleanup();
  };

  const endCallCleanup = () => {
    // ✅ Stop all media tracks (video & audio) to release device resources
    console.log("🔴 Stopping all media streams and resetting call...");
    if (stream) {
      stream.getTracks().forEach((track) => track.stop()); // ✅ Stops camera and microphone
    }
    // ✅ Clear the receiver's video (Remote user)
    if (reciverVideo.current) {
      console.log("🔴 Clearing receiver video");
      reciverVideo.current.srcObject = null;
    }
    // ✅ Clear the user's own video
    if (myVideo.current) {
      console.log("🔴 Clearing my video");
      myVideo.current.srcObject = null;
    }
    // ✅ Destroy the peer-to-peer connection if it exists
    connectionRef.current?.destroy();
    // ✅ Reset all relevant states to indicate call has ended
    // ✅ Stop ringtone when call is accepted
    ringtone.stop();
    setCallerWating(false);
    setStream(null); // ✅ Remove video/audio stream
    setReciveCall(false); // ✅ Indicate no ongoing call
    setCallAccepted(false); // ✅ Ensure call is not mistakenly marked as ongoing
    setSelectedUser(null); // ✅ Reset the selected user
    setTimeout(() => {
  navigate('/dashboard');
}, 100);
  };

  // 🎤 Toggle Microphone
  const toggleMic = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isMicOn;
        setIsMicOn(audioTrack.enabled);
      }
    }
  };

  const toggleCam = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isCamOn;
        setIsCamOn(videoTrack.enabled);
      }
    }
  };

  const allusers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/user");
      if (response.data.success !== false) {
        setUsers(response.data.users);
      }
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    allusers();
  }, []);

  const isOnlineUser = (userId) => userOnline.some((u) => u.userId === userId);

  const handelSelectedUser = (userId) => {
    if (callAccepted || reciveCall) {
      alert("You must end the current call before starting a new one.");
      return;
    }
    const selected = filteredUsers.find((user) => user._id === userId);
    setModalUser(selected);
    setShowUserDetailModal(true);
  };

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLogout = async () => {
    if (callAccepted || reciveCall) {
      alert("You must end the call before logging out.");
      return;
    }
    try {
      await apiClient.post("/auth/logout");
      socket.off("disconnect");
      socket.disconnect();
      socketInstance.setSocket();
      updateUser(null);
      localStorage.removeItem("userData");
      navigate("/login");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  console.log(callerWating);

  return (
    <div className="flex min-h-screen bg-white">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-10 md:hidden bg-black bg-opacity-30"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`bg-white text-gray-800 border-r border-blue-200 w-64 h-full p-4 space-y-4 fixed z-20 transition-transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-blue-600">Users</h1>
          <button
            type="button"
            className="md:hidden text-blue-600"
            onClick={() => setIsSidebarOpen(false)}
          >
            <FaTimes />
          </button>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search user..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 rounded-md bg-blue-50 text-gray-700 border border-blue-300 mb-2 placeholder:text-blue-400"
        />

        {/* User List */}
        <ul className="space-y-3 overflow-y-auto">
          {filteredUsers.map((user) => (
            <li
              key={user._id}
              className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${
                selectedUser === user._id
                  ? "bg-blue-100 border border-blue-500"
                  : "hover:bg-blue-50"
              }`}
              onClick={() => handelSelectedUser(user._id)}
            >
              <div className="relative">
                <img
                  src={user.profilepic || "/boy.png"}
                  alt={`${user.username}'s profile`}
                  className="w-10 h-10 rounded-full border border-blue-200"
                />
                {isOnlineUser(user._id) && (
                  <span className="absolute top-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full shadow-lg animate-bounce"></span>
                )}
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-sm text-gray-800">
                  {user.username}
                </span>
                <span className="text-xs text-gray-500 truncate w-32">
                  {user.email}
                </span>
              </div>
            </li>
          ))}
        </ul>

        {/* Logout */}
        {user && (
          <div
            onClick={handleLogout}
            className="absolute bottom-2 left-4 right-4 flex items-center gap-2 bg-blue-100 text-blue-600 px-4 py-2 cursor-pointer rounded-lg hover:bg-blue-200"
          >
            <RiLogoutBoxLine />
            Logout
          </div>
        )}
      </aside>
      {/* Main Content */}
      {selectedUser || reciveCall || callAccepted ? (
        <div className="relative w-full h-screen bg-gradient-to-br from-blue-900 via-blue-950 to-black flex items-center justify-center">
          {/* Remote Video */}
          {callerWating ? (
            <div>
              <div className="flex flex-col items-center">
                <p className="font-black text-xl mb-2 text-white">
                  User Details
                </p>
                <img
                  src={modalUser.profilepic || "/default-avatar.png"}
                  alt="User"
                  className="w-20 h-20 rounded-full border-4 border-blue-400 animate-bounce shadow-lg"
                />
                <h3 className="text-lg font-bold mt-3 text-white">
                  {modalUser.username}
                </h3>
                <p className="text-sm text-blue-200">{modalUser.email}</p>
              </div>
            </div>
          ) : (
            <video
              ref={reciverVideo}
              autoPlay
              className="absolute top-0 left-0 w-full h-full object-contain rounded-lg shadow-2xl"
            />
          )}
          {/* Local PIP Video */}
          <div className="absolute bottom-[75px] md:bottom-0 right-1 bg-gray-900 rounded-lg overflow-hidden shadow-lg">
            <video
              ref={myVideo}
              autoPlay
              playsInline
              className="w-32 h-40 md:w-56 md:h-52 object-cover rounded-lg"
            />
          </div>

          {/* Username + Sidebar Button */}
          <div className="absolute top-4 left-4 text-white text-lg font-bold flex gap-2 items-center">
            <button
              type="button"
              className="md:hidden text-2xl text-white cursor-pointer"
              onClick={() => setIsSidebarOpen(true)}
            >
              <FaBars />
            </button>
            {callerName || "Caller"}
          </div>

          {/* Call Controls */}
          <div className="absolute bottom-4 w-full flex justify-center gap-4">
            <button
              type="button"
              className="bg-red-600 p-4 rounded-full text-white shadow-lg cursor-pointer"
              onClick={handelendCall}
            >
              <FaPhoneSlash size={24} />
            </button>
            {/* 🎤 Toggle Mic */}
            <button
              type="button"
              onClick={toggleMic}
              className={`p-4 rounded-full text-white shadow-lg cursor-pointer transition-colors ${
                isMicOn ? "bg-green-600" : "bg-red-600"
              }`}
            >
              {isMicOn ? (
                <FaMicrophone size={24} />
              ) : (
                <FaMicrophoneSlash size={24} />
              )}
            </button>

            {/* 📹 Toggle Video */}
            <button
              type="button"
              onClick={toggleCam}
              className={`p-4 rounded-full text-white shadow-lg cursor-pointer transition-colors ${
                isCamOn ? "bg-green-600" : "bg-red-600"
              }`}
            >
              {isCamOn ? <FaVideo size={24} /> : <FaVideoSlash size={24} />}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 p-6 md:ml-72 text-white">
          {/* Mobile Sidebar Toggle */}
          <button
            type="button"
            className="md:hidden text-2xl text-black mb-4"
            onClick={() => setIsSidebarOpen(true)}
          >
            <FaBars />
          </button>

       <div className="p-6">
      <UserProfileSummary user={user} />
      {/* other dashboard content */}
    </div>

          {/* Welcome */}
        
        </div>
      )}

      {/*call user pop up */}
      {showUserDetailModal && modalUser && (
        <div className="fixed inset-0 bg-transparent bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <div className="flex flex-col items-center">
              <p className="font-black text-xl mb-2">User Details</p>
              <img
                src={modalUser.profilepic || "/boy.png"}
                alt="User"
                className="w-20 h-20 rounded-full border-4 border-blue-500"
              />
              <h3 className="text-lg font-bold mt-3">{modalUser.username}</h3>
              <p className="text-sm text-gray-500">{modalUser.email}</p>

              <div className="flex gap-4 mt-5">
                <button
                  onClick={() => {
                    setSelectedUser(modalUser._id);
                    startCall(); // function that handles media and calling
                    setShowUserDetailModal(false);
                  }}
                  className="bg-green-600 text-white px-4 py-1 rounded-lg w-28 flex items-center gap-2 justify-center"
                >
                  Call <FaPhoneAlt />
                </button>
                <button
                  onClick={() => setShowUserDetailModal(false)}
                  className="bg-gray-400 text-white px-4 py-1 rounded-lg w-28"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Call rejection PopUp */}
      {callRejectedPopUp && (
        <div className="fixed inset-0 bg-transparent bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <div className="flex flex-col items-center">
              <p className="font-black text-xl mb-2">Call Rejected From...</p>
              <img
                src={rejectorData.profilepic || "/boy.png"}
                alt="Caller"
                className="w-20 h-20 rounded-full border-4 border-green-500"
              />
              <h3 className="text-lg font-bold mt-3">{rejectorData.name}</h3>
              <div className="flex gap-4 mt-5">
                <button
                  type="button"
                  onClick={() => {
                    startCall(); // function that handles media and calling
                  }}
                  className="bg-green-500 text-white px-4 py-1 rounded-lg w-28 flex gap-2 justify-center items-center"
                >
                  Call Again <FaPhoneAlt />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    endCallCleanup();
                    setCallRejectedPopUp(false);
                    setShowUserDetailModal(false);
                  }}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg w-28 flex gap-2 justify-center items-center"
                >
                  Back <FaPhoneSlash />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Incoming Call Modal */}
      {reciveCall && !callAccepted && (
        <div className="fixed inset-0 bg-transparent bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <div className="flex flex-col items-center">
              <p className="font-black text-xl mb-2">Call From...</p>
              <img
                src={caller?.profilepic || "/boy.png"}
                alt="Caller"
                className="w-20 h-20 rounded-full border-4 border-green-500"
              />
              <h3 className="text-lg font-bold mt-3">{callerName}</h3>
              <p className="text-sm text-gray-500">{caller?.email}</p>
              <div className="flex gap-4 mt-5">
                <button
                  type="button"
                  onClick={handelacceptCall}
                  className="bg-green-500 text-white px-4 py-1 rounded-lg w-28 flex gap-2 justify-center items-center"
                >
                  Accept <FaPhoneAlt />
                </button>
                <button
                  type="button"
                  onClick={handelrejectCall}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg w-28 flex gap-2 justify-center items-center"
                >
                  Reject <FaPhoneSlash />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
