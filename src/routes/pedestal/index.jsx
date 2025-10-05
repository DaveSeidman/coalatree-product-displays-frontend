import React, { useRef, useState, useEffect } from "react";
import products from '../../assets/data/products.json'
import { io } from "socket.io-client";

import "./index.scss";

const Pedestal = () => {
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

  const startExperience = async (force) => {
    try {
      if (DeviceMotionEvent.requestPermission) {
        const response = await DeviceMotionEvent.requestPermission();
        if (response === "granted") {
          // window.addEventListener('devicemotion', handleOrientation);

          // alert("Motion permission denied");
          // return;
        }
      }
    }
    catch (err) {
      alert('err')
      console.error("Error requesting motion permission:", err);
      // alert(err)
      return;
    }

    window.addEventListener("deviceorientation", handleOrientation);
    setStarted(true);
    // }
  };

  const setProduct = (product) => {
    socketRef.current = io(URL, {
      transports: ["websocket"],
      query: { role: "pedestal", product: product.name },
    });
  }

  return (
    <div className="pedestal">
      <h1>Pedestal</h1>
      <p>{socketRef.current?.id || 'not connected'}</p>
      <p>permissions: {started ? 'granted' : 'denied'}</p>
      <p>rotation: {rotation}</p>
      <div className="pedestal-menu">
        {products.map((product) => (
          <button key={product.id} onClick={() => setProduct(product)}>
            {product.name}
          </button>
        ))}
      </div>
      {!started && (
        <>
          <button
            type="button"
            onClick={startExperience}
          >
            Touch to begin
          </button>
          <button
            type="button"
            onClick={() => startExperience(true)}
          >
            Test in Browser
          </button>
        </>
      )}
    </div>
  );
};

export default Pedestal;
