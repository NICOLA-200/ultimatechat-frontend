import React, { useState, useRef, useEffect } from "react";
import { IoCloseSharp } from "react-icons/io5";
import { io } from "socket.io-client";
import { IoCall } from "react-icons/io5";
import Peer from "simple-peer";

const socket = io("http://localhost:8800");

function VideoPlayer({ info, id, showVideo }) {
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [stream, setStream] = useState();
  const [name, setName] = useState("");
  const [call, setCall] = useState({});
  const [me, setMe] = useState("");

  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();

  useEffect(() => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((currentStream) => {
          setStream(currentStream);
          if (myVideo.current) {
            myVideo.current.srcObject = currentStream;
          }
          console.log("media query happened");
        })
        .catch((error) => {
          console.error("Error accessing media devices:", error);
        });

      socket.on("me", (id) => {
        console.log("me me me ");
        setMe(id);
      });

      socket.on("callUser", ({ from, name: callerName, signal }) => {
        setCall({ isReceivingCall: true, from, name: callerName, signal });
      });
    } else {
      console.error("getUserMedia is not supported in this browser.");
    }
  }, []);

  const answerCall = () => {
    setCallAccepted(true);

    const peer = new Peer({ initiator: false, trickle: false, stream });

    peer.on("signal", (data) => {
      socket.emit("answerCall", { signal: data, to: call.from });
    });

    peer.on("stream", (currentStream) => {
      userVideo.current.srcObject = currentStream;
    });

    peer.signal(call.signal);

    connectionRef.current = peer;
  };

  const callUser = (id) => {
    const peer = new Peer({ initiator: true, trickle: false, stream });

    peer.on("signal", (data) => {
      socket.emit("callUser", {
        userToCall: id,
        signalData: data,
        from: me,
        name,
      });
    });

    useEffect(() => {
      callUser(id);
    }, []);

    peer.on("stream", (currentStream) => {
      userVideo.current.srcObject = currentStream;
    });

    socket.on("callAccepted", (signal) => {
      setCallAccepted(true);

      peer.signal(signal);
    });

    connectionRef.current = peer;
  };

  const cancelVideo = () => {
    showVideo();
  };

  return (
    <div className="flex-1 flex shadow-xl flex-col pt-5 rounded-xl space-y-3 items-center overflow-hidden pb-10  mb-2 relative">
      {stream && (
        <video
          // className="w-auto h-auto"
          ref={myVideo}
          autoPlay
          playsInline
          muted
        ></video>
      )}
      <button
        className="rounded-full z-50 w-8 h-8 bg-red-600 flex justify-center items-center absolute xl:right-20 right-4 bottom-1"
        onClick={cancelVideo}
      >
        <IoCloseSharp title="cancel video" />
      </button>

      <button
        className="rounded-full z-50 w-8 h-8 bg-green-600 flex justify-center items-center absolute xl:right-20 right-[45%] bottom-12"
        onClick={callUser(id)}
      >
        <IoCall title="cancel video" />
      </button>
    </div>
  );
}

export default VideoPlayer;
