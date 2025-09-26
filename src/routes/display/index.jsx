import React, { useRef, useState, useEffect, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { io } from "socket.io-client";
import { Environment, ContactShadows, OrbitControls, useGLTF } from "@react-three/drei";
import socksModel from '../../assets/models/socks2.glb';
import duffleModel from '../../assets/models/duffle2.glb';

import "./index.scss";

// Simple loader component for your GLB
function ProductModel({ url, rotation }) {
  const group = useRef();
  const { scene } = useGLTF(url);

  return (
    <group
      ref={group}
      rotation={[0, rotation * (Math.PI / 180), 0]}
      position={[0, -.5, 0]}
    >
      <primitive object={scene} />
    </group>
  );
}

const Display = ({ products }) => {
  const socketRef = useRef();
  const [fullscreen, setFullscreen] = useState(false);
  const isLocalhost = window.location.hostname !== "daveseidman.github.io";
  const URL = isLocalhost
    ? `http://${location.hostname}:8000`
    : "https://cocktail-generator-server.onrender.com/";
  const [rotation, setRotation] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const models = {
    socks: socksModel,
    duffle: duffleModel,
  }

  const handleFullscreenChange = () => {
    setFullscreen(document.fullscreenElement !== null);
  };

  useEffect(() => {
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      socketRef.current?.disconnect();
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const setProduct = (product) => {
    setSelectedProduct(product);

    socketRef.current = io(URL, {
      transports: ["websocket"],
      query: { role: "display", product },
    });

    socketRef.current?.on("connect", () => {
      console.log("Connected to socket server:", socketRef.current.id);
    });

    socketRef.current?.on("rotation", (data) => {
      setRotation(data.zRotation || data.rotation || 0);
    });
  };

  return (
    <div className="display">
      <h1>Display</h1>

      <Canvas
        shadows
        camera={{ position: [0, 1, 2], fov: 35 }}
        style={{ position: 'absolute', inset: 0 }}
      >
        <Suspense fallback={null}>
          <Environment preset="sunset" background blur={2} />

          {/* Model */}
          {selectedProduct && (
            <ProductModel
              url={models[selectedProduct]}
              rotation={rotation}
            />
          )}

          {/* Contact shadows */}
          <ContactShadows
            position={[0, -.5, 0]}
            opacity={0.25}
            scale={5}
            blur={.25}
            far={1}
          />

          {/* Studio lighting */}
          <ambientLight intensity={0.5} />
          <spotLight
            position={[5, 10, 5]}
            angle={0.3}
            penumbra={1}
            intensity={2}
            castShadow
          />
          <directionalLight
            position={[-5, 5, -5]}
            intensity={1}
            castShadow
          />

          {/* Optional user control */}
          <OrbitControls />
        </Suspense>
      </Canvas>

      <p>{`rotation: ${rotation.toFixed(2)}`}</p>

      {!fullscreen ? (
        <div className="display-menu">
          {products.map((product) => (
            <button key={product} onClick={() => setProduct(product)}>
              {product}
            </button>
          ))}
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
          onClick={async () => {
            try {
              await document.documentElement.requestFullscreen();
              setFullscreen(true);
            } catch (err) {
              console.error("Failed to enter fullscreen:", err);
            }
          }}
        >
          Touch To Begin
        </button>
      )}
    </div>
  );
};

export default Display;
