import React, { useRef, useState } from "react";
import products from '../../assets/data/products.json'
import { io } from "socket.io-client";

import "./index.scss";

const Pedestal = () => {
  const socketRef = useRef();
  const [started, setStarted] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const isLocalhost = location.hostname.indexOf('localhost') >= 0 || location.hostname.indexOf('ngrok') >= 0;
  const socketServer = isLocalhost
    ? 'https://caolatree-products-backend.ngrok.app/'
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

        }
      }
    }
    catch (err) {
      alert('err')
      console.error("Error requesting motion permission:", err);
      return;
    }

    window.addEventListener("deviceorientation", handleOrientation);
    setStarted(true);
  };

  const setProduct = (product) => {
    setSelectedProduct(product)
    socketRef.current = io(socketServer, {
      transports: ["websocket"],
      query: { role: "pedestal", product: product.name },
    });
  }

  return (
    <div className="pedestal">
      <div className="pedestal-info">
        {!started && (
          <button
            type="button"
            onClick={startExperience}
          >
            Touch to begin
          </button>
        )}
        <p>connected: {selectedProduct?.name}</p>
        <p>permissions: {started ? 'granted' : 'denied'}</p>
        <p>rotation: {Math.round(rotation)}</p>
      </div>
      <div className="pedestal-menu">
        {products.map((product) => (
          <button key={product.id} onClick={() => setProduct(product)}>
            {product.name}
          </button>
        ))}
      </div>

    </div>
  );
};

export default Pedestal;
