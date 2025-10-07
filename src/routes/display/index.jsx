import React, { useRef, useState, useEffect, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { io } from "socket.io-client";
import predestalModel from '../../assets/models/pedestal.glb';
import products from "../../assets/data/products.json";
import { Environment, ContactShadows, OrbitControls, useGLTF, MeshTransmissionMaterial, Billboard, Image, Float } from "@react-three/drei";
import "./index.scss";

const ProductModel = ({ url }) => {
  const group = useRef();
  const { scene } = useGLTF(url);
  return (
    <group ref={group} position={[0, 0, 0]}>
      <Float
        speed={1} // Animation speed, defaults to 1
        rotationIntensity={1} // XYZ rotation intensity, defaults to 1
        floatIntensity={1} // Up/down float intensity, works like a multiplier with floatingRange,defaults to 1
        floatingRange={[0, .1]} // Range of y-axis values the object will float within, defaults to [-0.1,0.1]
      >
        <primitive object={scene} />
      </Float>
    </group>
  );
}

const Pedestal = () => {
  const { scene } = useGLTF(predestalModel)
  return (
    <primitive object={scene} />
  )
}

function FeatureBubbles({ features }) {
  return (
    <group position={[0, .33, 0]}>
      {features.map((feature, index) => {
        const angle = (index / features.length) * 360;
        const radians = angle * (Math.PI / 180);

        return (
          <group key={index} rotation={[0, radians, 0]}>
            {/* Bubble sphere */}
            <mesh position={[0, 0, 1]}>
              <sphereGeometry args={[0.1, 32, 32]} />
              <MeshTransmissionMaterial
                thickness={0.2}
                roughness={0.1}
                transmission={1}
                ior={1.3}
                chromaticAberration={0.02}
                anisotropy={0.1}
                distortion={0.1}
                distortionScale={0.2}
                temporalDistortion={0.1}
              />
            </mesh>

            {/* Billboarded image inside */}
            <Billboard follow={true} position={[0, -.05, 1]}>
              <Image
                url="images/four-way-stretch.png"
                scale={[0.25, 0.25, 1]}
                position={[0, 0, .1]}
                transparent
              />
            </Billboard>
          </group>
        );
      })}
    </group>
  );
}

const Display = () => {
  const socketRef = useRef();
  const videoRef = useRef();
  const [fullscreen, setFullscreen] = useState(false);
  const isLocalhost = location.hostname.indexOf('localhost') >= 0 || location.hostname.indexOf('ngrok') >= 0;
  const socketServer = isLocalhost
    ? 'https://caolatree-products-backend.ngrok.app/'
    : "https://coalatree-product-displays-backend.onrender.com/";

  const [rotation, setRotation] = useState(0);
  const [rotating, setRotating] = useState(true);
  const [showProduct, setShowProduct] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);

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
    if (socketRef.current && socketRef.current.connected) {
      console.log("Disconnecting existing socket:", socketRef.current.id);
      socketRef.current.disconnect();
    }
    setSelectedProduct(product);
    socketRef.current = io(socketServer, {
      transports: ["websocket"],
      query: { role: "display", product: product.name },
    });

    socketRef.current?.on("connect", () => {
      console.log("Connected to socket server:", socketRef.current.id);
    });

    socketRef.current?.on("rotation", (data) => {
      setRotation(data.rotation || 0);
    });
  };

  return (
    <div className="display">
      <div className="display-video">
        <video
          key={selectedProduct?.id}
          ref={videoRef}
          className="display-video-player"
          autoPlay
          loop
          muted
        >
          {selectedProduct && (<source src={`./videos/${selectedProduct.name}.mp4`} />)}
        </video>
      </div>
      <div className={`display-scene ${showProduct ? '' : 'hidden'}`}>
        <Canvas
          key={showProduct}
          className="display-scene-canvas"
          shadows
          gl={{ clearColor: '#eaeaea' }} // 👈 add this line

          dpr={1}
          camera={{ position: [0, .1, 3], fov: 35 }}
        >
          <Suspense fallback={null}>
            {/* <color attach="background" args={['#eaeaea']} />  👈 scene background color */}

            <Environment preset="sunset" blur={.3} />
            {selectedProduct && (
              <group rotation={[0, rotation * (Math.PI / 180), 0]}>
                <ProductModel url={selectedProduct.model} />
                <FeatureBubbles features={selectedProduct.features} />
                <Pedestal />
              </group>
            )}
            <ContactShadows
              position={[0, 0, 0]}
              opacity={0.25}
              scale={5}
              blur={0.25}
              far={1}
            />
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
            {/* <mesh position={[0, -.1, 0]}>
              <meshStandardMaterial />
              <cylinderGeometry args={[.6, .6, .01, 64]} />
            </mesh> */}
            <OrbitControls
              target={[0, 0.25, 0]}
              enablePan={false}
              enableZoom={false}
              minPolarAngle={80 * (Math.PI / 180)}
              maxPolarAngle={80 * (Math.PI / 180)}
            />
          </Suspense>
        </Canvas>
      </div>
      <div className="display-menu">
        {products.map((product) => (
          <button key={product.id} onClick={() => setProduct(product)}>
            {product.name}
          </button>

        ))}
      </div>
      {!fullscreen && !isLocalhost && (
        <button
          type="button"
          className="display-fullscreen"
          onClick={async () => {
            try {
              await document.documentElement.requestFullscreen();
              setFullscreen(true);
            } catch (err) {
              console.error("Failed to enter fullscreen:", err);
            }
          }}
        >
          Fullscreen
        </button>
      )}
      {isLocalhost && (
        <button
          type="button"
          style={{ position: 'absolute', top: 0, right: 0 }}
          onClick={() => setShowProduct(!showProduct)}>
          {showProduct ? 'hide' : 'show'} product
        </button>
      )}
    </div>
  );
};

export default Display;
