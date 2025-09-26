import React, { useRef, useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { io } from "socket.io-client";

import './index.scss';

const Display = ({ products }) => {
  const socketRef = useRef();
  const [fullscreen, setFullscreen] = useState(false);
  const isLocalhost = window.location.hostname !== 'daveseidman.github.io';
  const URL = isLocalhost
    ? `http://${location.hostname}:8000`
    : 'https://cocktail-generator-server.onrender.com/';
  const [rotation, setRotation] = useState(0);
  const handleFullscreenChange = (e) => {
    setFullscreen(document.fullscreenElement !== null)
  }

  useEffect(() => {
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      socketRef.current?.disconnect();
      // socketRef.current?.off
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const setProduct = (product) => {
    socketRef.current = io({
      transports: ["websocket"],
      query: { role: "pedestal", product },
    });


    socketRef.current?.on('connect', () => {
      console.log('Connected to socket server:', socketRef.current.id);
    });

    console.log(socketRef.current, 'listen for rotation')
    socketRef.current?.on('rotation', (data) => {
      // console.log(data)
      setRotation(data.rotation)
    })
  }

  return (
    <div className="display">
      <h1>Display</h1>
      <Canvas />
      <p>{`rotation: ${rotation}`}</p>
      <div
        className="display-product"
        style={{ transform: `rotate(${-rotation}deg)` }}
      ></div>
      {!fullscreen
        ? (
          <div className="display-menu">
            {products.map(product => (
              <button key={product} onClick={() => setProduct(product)}>{product}</button>
            ))}
          </div>
        )
        : (
          <button
            type="button"
            style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
            onClick={async () => {
              if (location.hostname === 'localhost') {
                setFullscreen(true);
              }
              else {
                try {
                  await document.documentElement.requestFullscreen();
                  setFullscreen(true)
                  // return true;
                } catch (err) {
                  console.error("Failed to enter fullscreen:", err);
                  return false;
                }
              }
            }}
          >
            Touch To Begin
          </button>)}
    </div>
  );
};

export default Display;
