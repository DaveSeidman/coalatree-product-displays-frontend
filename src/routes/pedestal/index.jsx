import React, { useRef, useState, useEffect } from "react";
import { io } from "socket.io-client";

import "./index.scss";

const Pedestal = ({ products }) => {
  const socketRef = useRef();
  const [started, setStarted] = useState(false);
  const [rotation, setRotation] = useState(0);
  const isLocalhost = window.location.hostname !== "daveseidman.github.io";
  const URL = isLocalhost
    ? `http://${location.hostname}:8000`
    : "https://coalatree-product-displays-backend.onrender.com/";


  const handleOrientation = (event) => {
    const rotation = event.alpha;

    if (socketRef.current && rotation !== null) {
      setRotation(rotation)
      socketRef.current.emit('rotation', { rotation });
    }
  };

  const startExperience = async () => {
    if (location.hostname === 'localhost') {
      setStarted(true);
    }
    else {
      // if (document.documentElement.requestFullscreen) {
      //   await document.documentElement.requestFullscreen();
      // } else if (document.documentElement.webkitRequestFullScreen) {
      //   document.documentElement.webkitRequestFullScreen();
      // }

      // alert('here')

      // try {
      //   const response = await DeviceMotionEvent.requestPermission();
      //   alert(response)
      //   if (response !== "granted") {
      //     alert("Motion permission denied");
      //     return;
      //   }
      // } catch (err) {
      //   console.error("Error requesting motion permission:", err);
      //   alert(err)
      //   return;
      // }

      addEventListener("deviceorientation", handleOrientation);
      alert('granted')
      setStarted(true);
    }
  };

  const setProduct = (product) => {
    socketRef.current = io({
      transports: ["websocket"],
      query: { role: "pedestal", product },
    });
  }

  return (
    <div className="pedestal">
      <h1>Pedestal</h1>
      <p>{socketRef.current?.id || 'not connected'}</p>
      <p>{rotation}</p>
      {started ? (
        <div className="pedestal-products">
          {products.map(product =>
            <button onClick={() => setProduct(product)}>{product}</button>)
          }
        </div>
      ) : (
        <button
          type="button"
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
          onClick={startExperience}
        >
          Touch to begin
        </button>

      )}
    </div>
  );
};

export default Pedestal;
