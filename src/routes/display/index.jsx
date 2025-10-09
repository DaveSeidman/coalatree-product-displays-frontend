import React, { useRef, useState, useEffect, Suspense } from "react";
import { Canvas, useLoader } from "@react-three/fiber";
import { BackSide, Color, DoubleSide, TextureLoader, RepeatWrapping } from 'three'
import { io } from "socket.io-client";
import predestalModel from '../../assets/models/pedestal.glb';
import products from "../../assets/data/products.json";
import { Environment, ContactShadows, OrbitControls, useGLTF, MeshTransmissionMaterial, Billboard, Image, Float, Text } from "@react-three/drei";
import "./index.scss";

const ProductModel = ({ url }) => {
  const group = useRef();
  const { scene } = useGLTF(url);
  return (
    <group ref={group} position={[0, 0, 0]}>
      <Float
        speed={1.5}
        rotationIntensity={.75}
        floatIntensity={.75}
        floatingRange={[0, .1]}
      >
        <primitive object={scene} scale={.4} position={[0, .33, 0]} />
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

const Background = () => {
  const texture = useLoader(TextureLoader, 'images/pattern.png')
  useEffect(() => {
    // Enable repeating
    texture.wrapS = RepeatWrapping
    texture.wrapT = RepeatWrapping
    // texture.offset = [1, 1]
    // Repeat more times horizontally and vertically
    texture.repeat.set(4, 3)  // increase these values to tile more tightly
  }, [texture])
  return (
    <mesh>
      <sphereGeometry args={[4, 32, 32]} />
      <meshStandardMaterial
        side={BackSide}
        map={texture}

        toneMapped={false}
      />
    </mesh>
  )
}

// TODO: take in rotation data + orbit controls data to fade or shrink bubbles further from camera
const FeatureBubbles = ({ features }) => {
  // const rotationInRadians = rotation * (Math.PI / 180);
  // console.log(rotation)
  return (
    <group position={[0, .33, 0]}>
      {features.map((feature, index) => {
        const angle = (index / features.length) * 360;
        const radians = angle * (Math.PI / 180);
        // const scale = ((rotationInRadians - radians) / 2) - 21;
        // const scale = radians 
        return (
          <group key={index} rotation={[0, radians, 0]}>
            <mesh position={[0, 0, .8]}>
              <sphereGeometry args={[0.1, 8, 16]} />
              <MeshTransmissionMaterial
                thickness={0.1}
                roughness={0.2}
                transmission={.9}
                ior={1.1}
                color={new Color('rgba(220, 220, 220)')}
                chromaticAberration={0.015}
                anisotropy={0.1}
                distortion={0.9}
                distortionScale={0.9}
              />
            </mesh>
            <Billboard follow={true} rotation={[0, 0, 0]} position={[0, -.07, .8]}>
              <Image
                url={feature}
                scale={[0.4, 0.4, 1]}
                position={[0, 0, 0]}
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
  const prevRotation = useRef(0);
  const ROTATION_THRESHOLD = 1;
  const ROTATION_RESET_DELAY = 3;
  const [rotating, setRotating] = useState(false);
  const rotatedTimeout = useRef();
  const [autoRotate, setAutoRotate] = useState(false);
  const autoRotateAnimation = useRef();
  const [showProduct, setShowProduct] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [lightRotation, setLightRotation] = useState(0);
  const lightRotationAnimation = useRef();

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
      if (Math.abs(data.rotation - prevRotation.current) > ROTATION_THRESHOLD) {
        if (rotatedTimeout.current) clearTimeout(rotatedTimeout.current)
        rotatedTimeout.current = setTimeout(() => {
          setRotating(false);
        }, ROTATION_RESET_DELAY * 1000)
        setRotating(true);
      }
      prevRotation.current = data.rotation;
      setRotation(data.rotation || 0);
    });
  };

  const rotateLights = () => {
    setLightRotation(prev => prev += .0025);
    lightRotationAnimation.current = requestAnimationFrame(rotateLights);
  }

  const rotate = () => {

    setRotation(prev => prev += .05);
    if (autoRotate) autoRotateAnimation.current = requestAnimationFrame(rotate);
  }

  useEffect(() => {
    if (autoRotate) {
      autoRotateAnimation.current = requestAnimationFrame(rotate);
    }

    return (() => {
      cancelAnimationFrame(autoRotateAnimation.current);
      autoRotateAnimation.current = null;
    })
  }, [autoRotate])

  useEffect(() => {
    lightRotationAnimation.current = requestAnimationFrame(rotateLights);

    return (() => {
      cancelAnimationFrame(lightRotationAnimation.current);
    })
  })

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
          playsInline
        >
          {selectedProduct && (<source src={`./videos/${selectedProduct.name}.mp4`} />)}
        </video>
      </div>
      <div className={`display-scene ${rotating || showProduct ? '' : 'hidden'}`}>
        <Canvas
          key={showProduct}
          className="display-scene-canvas"
          dpr={1}
          camera={{ position: [0, .1, 3], fov: 35 }}
        >
          <Background />
          <Suspense fallback={null}>
            {/* <color attach="background" args={['#eaeaea']} />  👈 scene background color */}

            <Environment preset="sunset" blur={.3} background environmentIntensity={1} />
            {selectedProduct && (
              <group rotation={[0, rotation * (Math.PI / 180), 0]}>
                <ProductModel url={selectedProduct.model} />
                <FeatureBubbles rotation={rotation} features={selectedProduct.features} />
                <Pedestal />
              </group>
            )}
            <ContactShadows
              resolution={256}
              position={[0, 0, 0]}
              opacity={0.25}
              scale={4}
              blur={0.5}
              far={1}
            />

            {/* light rig */}
            <group rotation={[0, lightRotation, 0]}>
              <spotLight
                position={[-2, 1, 0]}   // back one, up one
                angle={Math.PI / 8}     // 30° cone
                penumbra={0.9}
                intensity={10}
                color="#f8d2a3ff"
                castShadow
                target-position={[2, -1, 0]} // make sure it points at origin
              />
              <spotLight
                position={[2, 1, 0]}   // back one, up one
                angle={Math.PI / 24}     // 30° cone
                penumbra={0.9}
                intensity={1}
                color="#a3dff8ff"
                castShadow
                target-position={[-2, -1, 0]} // make sure it points at origin
              />
            </group>
            {/* <ambientLight intensity={.5} /> */}

            {/* <directionalLight
              position={[-5, 5, -5]}
              intensity={1}
              castShadow
            /> */}
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
      <div
        style={{ position: 'absolute', top: 0, right: 0 }}
      >
        <button
          type="button"
          onClick={() => setShowProduct(!showProduct)}>
          {showProduct ? 'hide' : 'show'} product
        </button>
        <button
          type="button"
          onClick={() => setAutoRotate(!autoRotate)}>
          {autoRotate ? 'stop' : 'autoRotate'}
        </button>
      </div>
    </div>
  );
};

export default Display;
