import React, {useCallback, useEffect, useRef, useState} from "react";
import * as THREE from 'three';
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";
import Mug from "../assets/model1.glb";
import Duck from "../assets/duck.glb";
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader";

export default function ModelMug() {

    // Refs for DOM elements
    const containerRef = useRef<HTMLDivElement>(null);
    const imageSelectorRef = useRef<HTMLInputElement>(null);
    const colorSelectorRef = useRef<HTMLInputElement>(null);

    // Refs for Three.js objects that need to persist between renders
    const sceneRef = useRef<THREE.Scene>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera>(null);
    const rendererRef = useRef<THREE.WebGLRenderer>(null);
    const orbitControlsRef = useRef<OrbitControls>(null);
    const meshRef = useRef<THREE.Mesh>(null);
    const decalGeometryRef = useRef<THREE.BufferGeometry>(null);
    const materialRef = useRef<THREE.MeshStandardMaterial>(null);

    const [currentModel, setCurrentModel] = useState(Mug);

    // Initialize Three.js scene
    const initScene = useCallback(()=>{

        // Create scene
        const scene = new THREE.Scene()
        sceneRef.current = scene

        // Create camera
        const camera = new THREE.PerspectiveCamera(
            20,
            1000 / 1000,
            1e-5,
            1e10
        )
        cameraRef.current = camera
        scene.add(camera)

        // Add lighting
        const hemispheric = new THREE.HemisphereLight(0xffffff, 0x222222, 3)
        scene.add(hemispheric)

        // Setup renderer
        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            logarithmicDepthBuffer: true,
            alpha: true,
        })
        renderer.setClearColor(0x131316, 0)
        renderer.setPixelRatio(window.devicePixelRatio)
        renderer.setSize(600, 600)
        //renderer.outputEncoding = THREE.sRGBEncoding
        rendererRef.current = renderer

        // Add canvas to DOM
        if (containerRef.current) {
            containerRef.current.innerHTML = '';
            containerRef.current.appendChild(renderer.domElement);
        }

        // Setup orbit controls
        const orbitControls = new OrbitControls(camera, renderer.domElement)
        orbitControlsRef.current = orbitControls

        return {scene, camera, renderer, orbitControls}
    }, [])

    // Load the 3D model
    const loadModel = useCallback((urlModel: string) => {
        if (!sceneRef.current || !cameraRef.current || !orbitControlsRef.current) return

        const scene = sceneRef.current
        const camera = cameraRef.current
        const orbitControls = orbitControlsRef.current

        const loader = new GLTFLoader()
        const cameraPos = new THREE.Vector3(-0.2, 0.4, 1.4)

        loader.load(
            urlModel,
            (gltf) => {
                const object = gltf.scene

                // Setup environment
                if (rendererRef.current) {
                    const pmremGenerator = new THREE.PMREMGenerator(rendererRef.current)
                    pmremGenerator.compileEquirectangularShader()
                }

                // Center model based on bounding box
                object.updateMatrixWorld()
                const boundingBox = new THREE.Box3().setFromObject(object)
                const modelSizeVec3 = new THREE.Vector3()
                boundingBox.getSize(modelSizeVec3)
                const modelSize = modelSizeVec3.length()
                const modelCenter = new THREE.Vector3()
                boundingBox.getCenter(modelCenter)

                // Configure orbit controls
                orbitControls.reset()
                orbitControls.maxDistance = modelSize * 50
                orbitControls.enableDamping = true
                orbitControls.dampingFactor = 0.07
                orbitControls.rotateSpeed = 1.25
                orbitControls.panSpeed = 1.25
                orbitControls.screenSpacePanning = true
                orbitControls.autoRotate = false
                orbitControls.autoRotateSpeed = 0.75

                // Position camera and model
                object.position.x = -modelCenter.x
                object.position.y = -modelCenter.y
                object.position.z = -modelCenter.z
                camera.position.copy(modelCenter)
                camera.position.x += modelSize * cameraPos.x
                camera.position.y += modelSize * cameraPos.y
                camera.position.z += modelSize * cameraPos.z
                camera.near = modelSize / 100
                camera.far = modelSize * 100
                camera.updateProjectionMatrix()
                camera.lookAt(modelCenter)

                // Process the model meshes
                object.traverse((obj) => {
                    if (obj instanceof THREE.Mesh && obj.name) {

                        const mat = obj.material as THREE.MeshStandardMaterial;
                        console.log("Matériau du mug :", mat);

                        materialRef.current = obj.material
                        console.log( materialRef.current )
                        meshRef.current = obj

                        mat.map = null; ///cache image
                        mat.needsUpdate = true;

                        setupTextureSelector()
                        setupColorSelector(mat)
                    }
                })
                scene.add(object)
            },
            (error) => {
                console.error(error)
            }
        )
    }, [])


    // Handle texture selection
    const setupTextureSelector = useCallback(() => {
        if (!imageSelectorRef.current || !materialRef.current) return

        const handleTextureChange = (event) => {
            const file = event.target.files[0]
            if (file && materialRef.current) {
                const texture = convertImageToTexture(URL.createObjectURL(file))
                materialRef.current.map = texture
                materialRef.current.needsUpdate = true
            }
        }
        imageSelectorRef.current.addEventListener("input", handleTextureChange)

        // Store cleanup function for later
        return () => {
            if (imageSelectorRef.current) {
                imageSelectorRef.current.removeEventListener("input", handleTextureChange)
            }
        }
    }, [])

    // Handle color selection
    const setupColorSelector = useCallback((material) => {

        console.log("ehee")

        if (!colorSelectorRef.current) return

        const handleColorChange = (event) => {
            console.log("colorselectorref", colorSelectorRef.current)
            console.log("material", material)
            material.color.set(event.target.value)
        }

        colorSelectorRef.current.addEventListener("input", handleColorChange)

        // Store cleanup function for later
        return () => {
            if (colorSelectorRef.current) {
                colorSelectorRef.current.removeEventListener("input", handleColorChange)
            }
        }
    }, [])

    // Convert image URL to Three.js texture
    const convertImageToTexture = useCallback((imageUrl: string) => {
        const textureLoader = new THREE.TextureLoader()
        const texture = textureLoader.load(imageUrl)
        //texture.encoding = THREE.sRGBEncoding
        texture.flipY = true
        return texture
    }, [])

    // Animation loop
    const animate = useCallback(() => {
        if (!sceneRef.current || !cameraRef.current || !rendererRef.current || !orbitControlsRef.current) return

        const scene = sceneRef.current
        const camera = cameraRef.current
        const renderer = rendererRef.current
        const orbitControls = orbitControlsRef.current

        const animationId = requestAnimationFrame(animate)

        orbitControls.update()
        renderer.render(scene, camera)

        // Return the animation ID for cleanup
        return animationId
    }, [])


    // Initialize everything
    useEffect(() => {
        initScene()
        loadModel(currentModel)

        const animationId = animate()

        // Cleanup function
        return () => {
            // Cancel animation frame
            if (animationId) {
                cancelAnimationFrame(animationId)
            }
            // Remove the renderer from DOM
            if (rendererRef.current && containerRef.current) {
                containerRef.current.removeChild(rendererRef.current.domElement)
            }
            // Dispose Three.js resources
            if (rendererRef.current) {
                rendererRef.current.dispose()
            }
            if (decalGeometryRef.current) {
                decalGeometryRef.current.dispose()
            }
        }
    }, [initScene, loadModel, animate, currentModel])

    const handleModelUpload = useCallback(()=> {

        return console.log("alakz,dnnfv")
    }, [])
    const removeImage = useCallback(() => {
        if (materialRef.current) {
            materialRef.current.map = null;
            materialRef.current.needsUpdate = true;
        }

        if (imageSelectorRef.current) {
            imageSelectorRef.current.value = ''; // reset file input
        }
    }, []);

    const removeColor = useCallback(() => {
        if (!meshRef.current) return;

        const parent = meshRef.current.parent;
        if (!parent) return;

        parent.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                const material = child.material as THREE.MeshStandardMaterial;
                if (material) {
                    material.color.set('#ffffff'); // couleur de reset
                    material.needsUpdate = true;
                }
            }
        });

        if (colorSelectorRef.current) {
            colorSelectorRef.current.value = '#ffffff';
        }

    }, []);

    return (
        <div className="container">
            <div className="preview">
                <div className="controls">
                    <div className="control-option">
                    <p>Choose model</p>
                    <button onClick={() => setCurrentModel(currentModel === Mug ? Duck : Mug)}>
                        Switch to {currentModel === Mug ? "Duck" : "Mug"}
                    </button>
                </div>
                    <div className="control-option">
                        <p>1.</p>
                        <input type="file" accept="image/*" id="imageSelector" name="imageSelector"
                               ref={imageSelectorRef}/>
                        <button onClick={removeImage}>Remove image</button>
                    </div>
                    <div className="control-option">
                        <p>2. Pick a filter</p>
                        <input type="color" id="colorPicker" name="colorPicker" defaultValue="#ffffff"
                               ref={colorSelectorRef}/>
                        <button onClick={removeColor}>Remove color</button>
                    </div>
                    <div className="control-option">
                        {/*<p>Change model</p>*/}
                        {/*<input type="file" accept=".glb" onChange={handleModelUpload}/>*/}
                    </div>
                </div>
                <div className="model-3d" ref={containerRef}/>
            </div>
        </div>
    );
}