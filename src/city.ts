import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

// Main function to initialize and run the 3D city scene
function initCity() {
  // Scene setup
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb); // Sky blue background

  // Camera setup
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(50, 50, 50);
  camera.lookAt(0, 0, 0);

  // Renderer setup
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.appendChild(renderer.domElement);

  // Controls setup
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minDistance = 10;
  controls.maxDistance = 200;
  controls.maxPolarAngle = Math.PI / 2 - 0.1; // Prevent camera from going below the ground

  // Grid setup - represents city blocks
  const gridSize = 100;
  const gridDivisions = 10;
  const gridHelper = new THREE.GridHelper(gridSize, gridDivisions);
  scene.add(gridHelper);

  // Ground plane
  const groundGeometry = new THREE.PlaneGeometry(gridSize, gridSize);
  const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a, // Asphalt color
    roughness: 0.8,
    metalness: 0.2,
  });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Lighting
  // Ambient light for base illumination
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
  scene.add(ambientLight);

  // Directional light for sun effect
  const sunLight = new THREE.DirectionalLight(0xffffff, 1);
  sunLight.position.set(50, 100, 30);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.near = 0.5;
  sunLight.shadow.camera.far = 500;
  sunLight.shadow.camera.left = -100;
  sunLight.shadow.camera.right = 100;
  sunLight.shadow.camera.top = 100;
  sunLight.shadow.camera.bottom = -100;
  scene.add(sunLight);

  // City elements
  const buildings = createBuildings(scene, gridSize, gridDivisions);
  const { cars, trafficLights } = createRoads(scene, gridSize, gridDivisions);
  const pedestrians = createPedestrians(scene, gridSize, gridDivisions);
  const streetElements = createStreetElements(scene, gridSize, gridDivisions);

  // Day/Night cycle variables
  let time = 0;
  const dayDuration = 120; // seconds for a full day-night cycle

  // Animation loop
  function animate() {
    requestAnimationFrame(animate);

    // Update day/night cycle
    time += 0.01;
    const dayProgress = (time % dayDuration) / dayDuration;
    updateDayNightCycle(dayProgress, sunLight, ambientLight, scene);

    // Update moving elements
    updateCars(cars, gridSize);
    updatePedestrians(pedestrians, gridSize);
    updateTrafficLights(trafficLights, time);

    // Update controls
    controls.update();

    // Render
    renderer.render(scene, camera);
  }

  // Handle window resize
  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // Start animation loop
  animate();
}

// Function to create buildings of various types and sizes
function createBuildings(
  scene: THREE.Scene,
  gridSize: number,
  gridDivisions: number
) {
  const buildings = [];
  const blockSize = gridSize / gridDivisions;
  const centerOffset = gridSize / 2;

  for (let i = 0; i < gridDivisions; i++) {
    for (let j = 0; j < gridDivisions; j++) {
      // Skip some positions to create roads and spaces
      if (i % 3 === 1 || j % 3 === 1) continue;

      const x = i * blockSize - centerOffset + blockSize / 2;
      const z = j * blockSize - centerOffset + blockSize / 2;

      // Determine building type based on position
      let buildingType = "skyscraper";
      if ((i + j) % 5 === 0) buildingType = "apartment";
      if ((i + j) % 7 === 0) buildingType = "shop";

      // Create the building
      const building = createBuildingByType(buildingType, x, z);
      scene.add(building);
      buildings.push(building);
    }
  }

  return buildings;
}

// Function to create different types of buildings
function createBuildingByType(type: string, x: number, z: number) {
  let building;

  switch (type) {
    case "skyscraper":
      const height = Math.random() * 30 + 20; // 20-50 units tall
      const skyscraperGeometry = new THREE.BoxGeometry(8, height, 8);
      const skyscraperMaterial = new THREE.MeshStandardMaterial({
        color: Math.random() > 0.5 ? 0x4476ff : 0x44aaff,
        roughness: 0.2,
        metalness: 0.8,
      });
      building = new THREE.Mesh(skyscraperGeometry, skyscraperMaterial);
      building.position.set(x, height / 2, z);
      break;

    case "apartment":
      const apartmentHeight = Math.random() * 10 + 10; // 10-20 units tall
      const apartmentGeometry = new THREE.BoxGeometry(10, apartmentHeight, 10);
      const apartmentMaterial = new THREE.MeshStandardMaterial({
        color: 0xbbbbbb,
        roughness: 0.5,
        metalness: 0.2,
      });
      building = new THREE.Mesh(apartmentGeometry, apartmentMaterial);
      building.position.set(x, apartmentHeight / 2, z);
      break;

    case "shop":
      const shopHeight = Math.random() * 3 + 3; // 3-6 units tall
      const shopGeometry = new THREE.BoxGeometry(8, shopHeight, 8);
      const shopMaterial = new THREE.MeshStandardMaterial({
        color: 0xffaa44,
        roughness: 0.7,
        metalness: 0.1,
      });
      building = new THREE.Mesh(shopGeometry, shopMaterial);
      building.position.set(x, shopHeight / 2, z);
      break;

    default:
      building = new THREE.Group(); // Empty group as fallback
  }

  building.castShadow = true;
  building.receiveShadow = true;

  // Add windows to buildings
  addWindows(building, type);

  return building;
}

// Function to add windows to buildings
function addWindows(building: THREE.Mesh, type: string) {
  if (!(building instanceof THREE.Mesh)) return;

  const geometry = building.geometry as THREE.BoxGeometry;
  const height = geometry.parameters.height;
  const width = geometry.parameters.width;
  const depth = geometry.parameters.depth;

  // Window properties based on building type
  let windowSize, windowSpacing, windowColor;

  switch (type) {
    case "skyscraper":
      windowSize = 0.8;
      windowSpacing = 3;
      windowColor = 0xffffcc;
      break;
    case "apartment":
      windowSize = 1.2;
      windowSpacing = 2.5;
      windowColor = 0xffffaa;
      break;
    case "shop":
      windowSize = 2;
      windowSpacing = 3;
      windowColor = 0xffff88;
      break;
    default:
      return;
  }

  // Calculate number of windows per side
  const windowsPerFloor = Math.floor(width / windowSpacing);
  const floors = Math.floor(height / windowSpacing);

  // Create windows for each side of the building
  const sides = [
    { axis: "x", value: width / 2, rotation: [0, Math.PI / 2, 0] },
    { axis: "x", value: -width / 2, rotation: [0, -Math.PI / 2, 0] },
    { axis: "z", value: depth / 2, rotation: [0, 0, 0] },
    { axis: "z", value: -depth / 2, rotation: [0, Math.PI, 0] },
  ];

  sides.forEach((side) => {
    for (let floor = 0; floor < floors; floor++) {
      for (let w = 0; w < windowsPerFloor; w++) {
        const windowGeometry = new THREE.PlaneGeometry(windowSize, windowSize);
        const windowMaterial = new THREE.MeshStandardMaterial({
          color: windowColor,
          emissive: windowColor,
          emissiveIntensity: 0.5,
          transparent: true,
          opacity: 0.9,
        });

        const windowMesh = new THREE.Mesh(windowGeometry, windowMaterial);

        // Position window
        const xOffset = (w - windowsPerFloor / 2 + 0.5) * windowSpacing;
        const yOffset = (floor - floors / 2 + 0.5) * windowSpacing + height / 2;

        if (side.axis === "x") {
          windowMesh.position.set(
            side.value + 0.01, // Slight offset to avoid z-fighting
            yOffset,
            xOffset
          );
        } else {
          windowMesh.position.set(
            xOffset,
            yOffset,
            side.value + 0.01 // Slight offset to avoid z-fighting
          );
        }

        windowMesh.rotation.set(...(side.rotation as [number, number, number]));
        building.add(windowMesh);
      }
    }
  });
}

// Function to create roads, cars, and traffic lights
function createRoads(
  scene: THREE.Scene,
  gridSize: number,
  gridDivisions: number
) {
  const blockSize = gridSize / gridDivisions;
  const centerOffset = gridSize / 2;
  const roads = [];
  const cars = [];
  const trafficLights = [];

  // Create horizontal and vertical roads
  for (let i = 0; i < gridDivisions; i++) {
    // Only create roads at specific intervals
    if (i % 3 !== 1) continue;

    // Horizontal road
    const hRoadGeometry = new THREE.PlaneGeometry(gridSize, blockSize);
    const roadMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.9,
      metalness: 0.1,
    });
    const hRoad = new THREE.Mesh(hRoadGeometry, roadMaterial);
    hRoad.rotation.x = -Math.PI / 2;
    hRoad.position.set(0, 0.01, i * blockSize - centerOffset + blockSize / 2);
    scene.add(hRoad);
    roads.push(hRoad);

    // Add road markings to horizontal road
    addRoadMarkings(scene, hRoad, true, gridSize, blockSize);

    // Vertical road
    const vRoadGeometry = new THREE.PlaneGeometry(blockSize, gridSize);
    const vRoad = new THREE.Mesh(vRoadGeometry, roadMaterial);
    vRoad.rotation.x = -Math.PI / 2;
    vRoad.position.set(i * blockSize - centerOffset + blockSize / 2, 0.01, 0);
    scene.add(vRoad);
    roads.push(vRoad);

    // Add road markings to vertical road
    addRoadMarkings(scene, vRoad, false, gridSize, blockSize);

    // Add cars to horizontal road
    for (let c = 0; c < 3; c++) {
      const car = createCar();
      const lane = c % 2 === 0 ? -2 : 2; // Alternate lanes
      car.position.set(
        Math.random() * gridSize - centerOffset,
        0.6,
        i * blockSize - centerOffset + lane
      );
      car.rotation.y = lane > 0 ? Math.PI : 0; // Cars face different directions based on lane
      scene.add(car);

      // Store car info for animation
      cars.push({
        mesh: car,
        speed: Math.random() * 0.2 + 0.1,
        direction: lane > 0 ? -1 : 1,
        road: "horizontal",
        roadIndex: i,
      });
    }

    // Add cars to vertical road
    for (let c = 0; c < 3; c++) {
      const car = createCar();
      const lane = c % 2 === 0 ? -2 : 2; // Alternate lanes
      car.position.set(
        i * blockSize - centerOffset + lane,
        0.6,
        Math.random() * gridSize - centerOffset
      );
      car.rotation.y = lane > 0 ? -Math.PI / 2 : Math.PI / 2; // Cars face different directions based on lane
      scene.add(car);

      // Store car info for animation
      cars.push({
        mesh: car,
        speed: Math.random() * 0.2 + 0.1,
        direction: lane > 0 ? -1 : 1,
        road: "vertical",
        roadIndex: i,
      });
    }

    // Create traffic lights at intersections with other roads
    for (let j = 0; j < gridDivisions; j++) {
      if (j % 3 !== 1) continue; // Only at road intersections

      // Create traffic light at intersection
      const trafficLight = createTrafficLight();
      trafficLight.position.set(
        i * blockSize - centerOffset + blockSize / 2 + 3,
        0,
        j * blockSize - centerOffset + blockSize / 2 + 3
      );
      scene.add(trafficLight);

      // Store traffic light info
      trafficLights.push({
        mesh: trafficLight,
        state: Math.floor(Math.random() * 3), // 0: red, 1: yellow, 2: green
        timer: Math.random() * 10, // Random start time
      });
    }
  }

  return { roads, cars, trafficLights };
}

// Function to add road markings (center lines and crosswalks)
function addRoadMarkings(
  scene: THREE.Scene,
  road: THREE.Mesh,
  isHorizontal: boolean,
  gridSize: number,
  blockSize: number
) {
  const centerOffset = gridSize / 2;

  // Center line for the road
  const lineWidth = 0.5;
  const lineGeometry = isHorizontal
    ? new THREE.PlaneGeometry(gridSize, lineWidth)
    : new THREE.PlaneGeometry(lineWidth, gridSize);

  const lineMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.4,
    metalness: 0,
  });

  const centerLine = new THREE.Mesh(lineGeometry, lineMaterial);
  centerLine.rotation.x = -Math.PI / 2;
  centerLine.position.copy(road.position);
  centerLine.position.y += 0.02; // Slightly above the road
  scene.add(centerLine);

  // Add crosswalks at intersections
  for (let i = 0; i < gridSize / blockSize; i++) {
    if (i % 3 !== 1) continue; // Only at road intersections

    const position = i * blockSize - centerOffset + blockSize / 2;

    // Create crosswalks
    const crosswalkWidth = 3;
    const crosswalkGeometry = isHorizontal
      ? new THREE.PlaneGeometry(crosswalkWidth, blockSize)
      : new THREE.PlaneGeometry(blockSize, crosswalkWidth);

    const crosswalkMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.4,
      metalness: 0,
    });

    const crosswalk = new THREE.Mesh(crosswalkGeometry, crosswalkMaterial);
    crosswalk.rotation.x = -Math.PI / 2;

    if (isHorizontal) {
      crosswalk.position.set(position, 0.02, road.position.z);
    } else {
      crosswalk.position.set(road.position.x, 0.02, position);
    }

    scene.add(crosswalk);
  }
}

// Function to create a car
function createCar() {
  const car = new THREE.Group();

  // Car body
  const bodyGeometry = new THREE.BoxGeometry(4, 1, 2);
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color:
      Math.random() > 0.5
        ? 0xff4444
        : Math.random() > 0.5
        ? 0x4444ff
        : 0x44ff44,
    roughness: 0.2,
    metalness: 0.8,
  });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.y = 0.5;
  car.add(body);

  // Car cabin
  const cabinGeometry = new THREE.BoxGeometry(2, 0.8, 1.8);
  const cabinMaterial = new THREE.MeshStandardMaterial({
    color: 0x333333,
    roughness: 0.1,
    metalness: 0.9,
    transparent: true,
    opacity: 0.7,
  });
  const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
  cabin.position.set(0.5, 1.4, 0);
  car.add(cabin);

  // Car wheels
  const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.4, 16);
  const wheelMaterial = new THREE.MeshStandardMaterial({
    color: 0x111111,
    roughness: 0.9,
    metalness: 0.1,
  });

  const wheelPositions = [
    { x: -1.2, y: 0.4, z: -1.1 },
    { x: 1.2, y: 0.4, z: -1.1 },
    { x: -1.2, y: 0.4, z: 1.1 },
    { x: 1.2, y: 0.4, z: 1.1 },
  ];

  wheelPositions.forEach((pos) => {
    const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(pos.x, pos.y, pos.z);
    car.add(wheel);
  });

  // Headlights
  const headlightGeometry = new THREE.SphereGeometry(0.2, 8, 8);
  const headlightMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffdd,
    emissive: 0xffffdd,
    emissiveIntensity: 0.5,
  });

  const headlightPositions = [
    { x: 2, y: 0.7, z: -0.6 },
    { x: 2, y: 0.7, z: 0.6 },
  ];

  headlightPositions.forEach((pos) => {
    const headlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
    headlight.position.set(pos.x, pos.y, pos.z);
    car.add(headlight);
  });

  // Cast and receive shadows
  car.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });

  return car;
}

// Function to create a traffic light
function createTrafficLight() {
  const trafficLight = new THREE.Group();

  // Pole
  const poleGeometry = new THREE.CylinderGeometry(0.2, 0.2, 5, 8);
  const poleMaterial = new THREE.MeshStandardMaterial({
    color: 0x333333,
    roughness: 0.8,
    metalness: 0.2,
  });
  const pole = new THREE.Mesh(poleGeometry, poleMaterial);
  pole.position.y = 2.5;
  trafficLight.add(pole);

  // Light housing
  const housingGeometry = new THREE.BoxGeometry(1, 2.5, 1);
  const housingMaterial = new THREE.MeshStandardMaterial({
    color: 0x222222,
    roughness: 0.8,
    metalness: 0.2,
  });
  const housing = new THREE.Mesh(housingGeometry, housingMaterial);
  housing.position.set(0, 5, 0);
  trafficLight.add(housing);

  // Create the three lights (red, yellow, green)
  const lightGeometry = new THREE.SphereGeometry(0.3, 16, 16);

  // Red light
  const redLightMaterial = new THREE.MeshStandardMaterial({
    color: 0xff0000,
    emissive: 0xff0000,
    emissiveIntensity: 0,
  });
  const redLight = new THREE.Mesh(lightGeometry, redLightMaterial);
  redLight.position.set(0, 5.8, 0.55);
  trafficLight.add(redLight);

  // Yellow light
  const yellowLightMaterial = new THREE.MeshStandardMaterial({
    color: 0xffff00,
    emissive: 0xffff00,
    emissiveIntensity: 0,
  });
  const yellowLight = new THREE.Mesh(lightGeometry, yellowLightMaterial);
  yellowLight.position.set(0, 5, 0.55);
  trafficLight.add(yellowLight);

  // Green light
  const greenLightMaterial = new THREE.MeshStandardMaterial({
    color: 0x00ff00,
    emissive: 0x00ff00,
    emissiveIntensity: 0,
  });
  const greenLight = new THREE.Mesh(lightGeometry, greenLightMaterial);
  greenLight.position.set(0, 4.2, 0.55);
  trafficLight.add(greenLight);

  // Add custom properties to the traffic light for animation
  trafficLight.userData = {
    lights: {
      red: redLight,
      yellow: yellowLight,
      green: greenLight,
    },
  };

  // Cast and receive shadows
  trafficLight.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });

  return trafficLight;
}

// Function to create pedestrians
function createPedestrians(
  scene: THREE.Scene,
  gridSize: number,
  gridDivisions: number
) {
  const blockSize = gridSize / gridDivisions;
  const centerOffset = gridSize / 2;
  const pedestrians = [];

  // Create pedestrians along sidewalks
  for (let i = 0; i < gridDivisions; i++) {
    if (i % 3 !== 1) continue; // Only along roads

    // Create pedestrians along horizontal roads
    for (let p = 0; p < 6; p++) {
      const pedestrian = createPedestrian();
      const side = Math.random() > 0.5 ? 1 : -1; // Which side of the road
      const sidewalkOffset = (blockSize / 2 + 1) * side;

      pedestrian.position.set(
        Math.random() * gridSize - centerOffset,
        0,
        i * blockSize - centerOffset + sidewalkOffset
      );
      scene.add(pedestrian);

      // Store pedestrian info for animation
      pedestrians.push({
        mesh: pedestrian,
        speed: Math.random() * 0.05 + 0.02,
        direction: Math.random() > 0.5 ? 1 : -1,
        road: "horizontal",
        side: side,
        roadIndex: i,
      });
    }

    // Create pedestrians along vertical roads
    for (let p = 0; p < 6; p++) {
      const pedestrian = createPedestrian();
      const side = Math.random() > 0.5 ? 1 : -1; // Which side of the road
      const sidewalkOffset = (blockSize / 2 + 1) * side;

      pedestrian.position.set(
        i * blockSize - centerOffset + sidewalkOffset,
        0,
        Math.random() * gridSize - centerOffset
      );
      scene.add(pedestrian);

      // Store pedestrian info for animation
      pedestrians.push({
        mesh: pedestrian,
        speed: Math.random() * 0.05 + 0.02,
        direction: Math.random() > 0.5 ? 1 : -1,
        road: "vertical",
        side: side,
        roadIndex: i,
      });
    }
  }

  return pedestrians;
}

// Function to create a single pedestrian
function createPedestrian() {
  const pedestrian = new THREE.Group();

  // Body
  const bodyGeometry = new THREE.CapsuleGeometry(0.3, 1, 4, 8);
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color:
      Math.random() > 0.5
        ? 0x2244ff
        : Math.random() > 0.5
        ? 0xff4422
        : 0x22ff44,
    roughness: 0.8,
    metalness: 0.2,
  });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.y = 0.8;
  pedestrian.add(body);

  // Head
  const headGeometry = new THREE.SphereGeometry(0.25, 16, 16);
  const headMaterial = new THREE.MeshStandardMaterial({
    color: 0xffcc99,
    roughness: 0.6,
    metalness: 0.1,
  });
  const head = new THREE.Mesh(headGeometry, headMaterial);
  head.position.y = 1.7;
  pedestrian.add(head);

  // Cast and receive shadows
  pedestrian.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });

  return pedestrian;
}

// Function to create street elements (lampposts, benches, trees)
function createStreetElements(
  scene: THREE.Scene,
  gridSize: number,
  gridDivisions: number
) {
  const blockSize = gridSize / gridDivisions;
  const centerOffset = gridSize / 2;
  const streetElements = [];

  // Create elements along roads
  for (let i = 0; i < gridDivisions; i++) {
    if (i % 3 !== 1) continue; // Only along roads

    // Create elements along horizontal roads
    for (let j = 0; j < gridDivisions; j++) {
      if (j % 3 === 1) continue; // Skip intersections

      // Add lampposts along horizontal roads
      if (j % 4 === 0) {
        const lamppost = createLamppost();
        lamppost.position.set(
          j * blockSize - centerOffset + blockSize / 2,
          0,
          i * blockSize - centerOffset + blockSize / 2 + 5
        );
        scene.add(lamppost);
        streetElements.push(lamppost);
      }

      // Add benches along horizontal roads
      if (j % 4 === 2) {
        const bench = createBench();
        bench.position.set(
          j * blockSize - centerOffset + blockSize / 2,
          0,
          i * blockSize - centerOffset + blockSize / 2 + 4
        );
        scene.add(bench);
        streetElements.push(bench);
      }

      // Add trees along horizontal roads
      if (j % 2 === 0) {
        const tree = createTree();
        tree.position.set(
          j * blockSize - centerOffset + blockSize / 2,
          0,
          i * blockSize - centerOffset + blockSize / 2 + 6
        );
        scene.add(tree);
        streetElements.push(tree);
      }
    }

    // Create elements along vertical roads
    for (let j = 0; j < gridDivisions; j++) {
      if (j % 3 === 1) continue; // Skip intersections

      // Add lampposts along vertical roads
      if (j % 4 === 0) {
        const lamppost = createLamppost();
        lamppost.position.set(
          i * blockSize - centerOffset + blockSize / 2 + 5,
          0,
          j * blockSize - centerOffset + blockSize / 2
        );
        scene.add(lamppost);
        streetElements.push(lamppost);
      }

      // Add benches along vertical roads
      if (j % 4 === 2) {
        const bench = createBench();
        bench.position.set(
          i * blockSize - centerOffset + blockSize / 2 + 4,
          0,
          j * blockSize - centerOffset + blockSize / 2
        );
        bench.rotation.y = Math.PI / 2; // Rotate to face the road
        scene.add(bench);
        streetElements.push(bench);
      }

      // Add trees along vertical roads
      // Add trees along vertical roads
      if (j % 2 === 0) {
        const tree = createTree();
        tree.position.set(
          i * blockSize - centerOffset + blockSize / 2 + 6,
          0,
          j * blockSize - centerOffset + blockSize / 2
        );
        scene.add(tree);
        streetElements.push(tree);
      }
    }
  }

  return streetElements;
}

// Function to create a lamppost
function createLamppost() {
  const lamppost = new THREE.Group();

  // Pole
  const poleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 5, 8);
  const poleMaterial = new THREE.MeshStandardMaterial({
    color: 0x333333,
    roughness: 0.7,
    metalness: 0.5,
  });
  const pole = new THREE.Mesh(poleGeometry, poleMaterial);
  pole.position.y = 2.5;
  lamppost.add(pole);

  // Lamp head
  const headGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.2, 16);
  const headMaterial = new THREE.MeshStandardMaterial({
    color: 0x444444,
    roughness: 0.5,
    metalness: 0.7,
  });
  const head = new THREE.Mesh(headGeometry, headMaterial);
  head.position.y = 5;
  lamppost.add(head);

  // Light bulb
  const bulbGeometry = new THREE.SphereGeometry(0.3, 16, 16);
  const bulbMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffee,
    emissive: 0xffffee,
    emissiveIntensity: 0.5,
    transparent: true,
    opacity: 0.9,
  });
  const bulb = new THREE.Mesh(bulbGeometry, bulbMaterial);
  bulb.position.y = 4.8;
  lamppost.add(bulb);

  // Actual light
  const light = new THREE.PointLight(0xffffee, 0.8, 15);
  light.position.y = 5;
  lamppost.add(light);

  // Store light reference for day/night cycle
  lamppost.userData = { light: light, bulb: bulb };

  // Cast and receive shadows
  lamppost.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });

  return lamppost;
}

// Function to create a bench
function createBench() {
  const bench = new THREE.Group();

  // Bench seat
  const seatGeometry = new THREE.BoxGeometry(2, 0.1, 0.8);
  const seatMaterial = new THREE.MeshStandardMaterial({
    color: 0x885522,
    roughness: 0.9,
    metalness: 0.1,
  });
  const seat = new THREE.Mesh(seatGeometry, seatMaterial);
  seat.position.y = 0.5;
  bench.add(seat);

  // Bench backrest
  const backrestGeometry = new THREE.BoxGeometry(2, 0.8, 0.1);
  const backrest = new THREE.Mesh(backrestGeometry, seatMaterial);
  backrest.position.set(0, 0.9, -0.35);
  bench.add(backrest);

  // Bench legs
  const legGeometry = new THREE.BoxGeometry(0.1, 0.5, 0.8);
  const legMaterial = new THREE.MeshStandardMaterial({
    color: 0x444444,
    roughness: 0.8,
    metalness: 0.5,
  });

  // Left leg
  const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
  leftLeg.position.set(-0.9, 0.25, 0);
  bench.add(leftLeg);

  // Right leg
  const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
  rightLeg.position.set(0.9, 0.25, 0);
  bench.add(rightLeg);

  // Cast and receive shadows
  bench.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });

  return bench;
}

// Function to create a tree
function createTree() {
  const tree = new THREE.Group();

  // Tree trunk
  const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.5, 2, 8);
  const trunkMaterial = new THREE.MeshStandardMaterial({
    color: 0x8b4513,
    roughness: 0.9,
    metalness: 0,
  });
  const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
  trunk.position.y = 1;
  tree.add(trunk);

  // Tree leaves
  const leavesGeometry = new THREE.SphereGeometry(1.5, 16, 16);
  const leavesMaterial = new THREE.MeshStandardMaterial({
    color: 0x228b22,
    roughness: 1,
    metalness: 0,
  });
  const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
  leaves.position.y = 3;
  tree.add(leaves);

  // Cast and receive shadows
  tree.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });

  return tree;
}

// Function to update car positions
function updateCars(cars: any[], gridSize: number) {
  const centerOffset = gridSize / 2;

  cars.forEach((car) => {
    // Move the car based on direction and speed
    if (car.road === "horizontal") {
      car.mesh.position.x += car.speed * car.direction;

      // Reset position when car reaches the edge
      if (car.direction > 0 && car.mesh.position.x > centerOffset) {
        car.mesh.position.x = -centerOffset;
      } else if (car.direction < 0 && car.mesh.position.x < -centerOffset) {
        car.mesh.position.x = centerOffset;
      }
    } else {
      car.mesh.position.z += car.speed * car.direction;

      // Reset position when car reaches the edge
      if (car.direction > 0 && car.mesh.position.z > centerOffset) {
        car.mesh.position.z = -centerOffset;
      } else if (car.direction < 0 && car.mesh.position.z < -centerOffset) {
        car.mesh.position.z = centerOffset;
      }
    }
  });
}

// Function to update pedestrian positions
function updatePedestrians(pedestrians: any[], gridSize: number) {
  const centerOffset = gridSize / 2;

  pedestrians.forEach((pedestrian) => {
    // Move the pedestrian based on direction and speed
    if (pedestrian.road === "horizontal") {
      pedestrian.mesh.position.x += pedestrian.speed * pedestrian.direction;

      // Pedestrian rotation based on direction
      pedestrian.mesh.rotation.y =
        pedestrian.direction > 0 ? Math.PI / 2 : -Math.PI / 2;

      // Reset position when pedestrian reaches the edge
      if (
        pedestrian.direction > 0 &&
        pedestrian.mesh.position.x > centerOffset
      ) {
        pedestrian.mesh.position.x = -centerOffset;
      } else if (
        pedestrian.direction < 0 &&
        pedestrian.mesh.position.x < -centerOffset
      ) {
        pedestrian.mesh.position.x = centerOffset;
      }
    } else {
      pedestrian.mesh.position.z += pedestrian.speed * pedestrian.direction;

      // Pedestrian rotation based on direction
      pedestrian.mesh.rotation.y = pedestrian.direction > 0 ? 0 : Math.PI;

      // Reset position when pedestrian reaches the edge
      if (
        pedestrian.direction > 0 &&
        pedestrian.mesh.position.z > centerOffset
      ) {
        pedestrian.mesh.position.z = -centerOffset;
      } else if (
        pedestrian.direction < 0 &&
        pedestrian.mesh.position.z < -centerOffset
      ) {
        pedestrian.mesh.position.z = centerOffset;
      }
    }
  });
}

// Function to update traffic lights
function updateTrafficLights(trafficLights: any[], time: number) {
  trafficLights.forEach((trafficLight) => {
    // Update timer
    trafficLight.timer += 0.01;

    // Change light state based on timer
    if (trafficLight.timer > 5) {
      trafficLight.state = (trafficLight.state + 1) % 3;
      trafficLight.timer = 0;
    }

    // Update light colors based on state
    const lights = trafficLight.mesh.userData.lights;

    // Reset all lights
    lights.red.material.emissiveIntensity = 0;
    lights.yellow.material.emissiveIntensity = 0;
    lights.green.material.emissiveIntensity = 0;

    // Activate current light
    switch (trafficLight.state) {
      case 0: // Red
        lights.red.material.emissiveIntensity = 1;
        break;
      case 1: // Yellow
        lights.yellow.material.emissiveIntensity = 1;
        break;
      case 2: // Green
        lights.green.material.emissiveIntensity = 1;
        break;
    }
  });
}

// Function to update the day/night cycle
function updateDayNightCycle(
  dayProgress: number,
  sunLight: THREE.DirectionalLight,
  ambientLight: THREE.AmbientLight,
  scene: THREE.Scene
) {
  // Calculate sun position based on time (circle around the scene)
  const sunAngle = dayProgress * Math.PI * 2 - Math.PI / 2;
  const sunRadius = 100;
  const sunHeight = Math.sin(sunAngle) * 50 + 50;

  sunLight.position.set(
    Math.cos(sunAngle) * sunRadius,
    sunHeight,
    Math.sin(sunAngle) * sunRadius
  );

  // Adjust light intensity based on time of day
  const isDaytime = sunHeight > 50;
  const sunIntensity = isDaytime ? 1 : Math.max(0, sunHeight / 50);
  const ambientIntensity = isDaytime ? 0.3 : 0.1;

  sunLight.intensity = sunIntensity;
  ambientLight.intensity = ambientIntensity;

  // Update sky color based on time of day
  const skyColors = {
    day: new THREE.Color(0x87ceeb), // Sky blue
    sunset: new THREE.Color(0xff7f50), // Coral/orange
    night: new THREE.Color(0x000033), // Dark blue
  };

  let skyColor;
  if (sunHeight > 80) {
    // Day
    skyColor = skyColors.day;
  } else if (sunHeight > 25) {
    // Sunset/sunrise transition
    const t = (sunHeight - 25) / 55;
    skyColor = new THREE.Color().lerpColors(skyColors.sunset, skyColors.day, t);
  } else if (sunHeight > 0) {
    // Night/sunset transition
    const t = sunHeight / 25;
    skyColor = new THREE.Color().lerpColors(
      skyColors.night,
      skyColors.sunset,
      t
    );
  } else {
    // Night
    skyColor = skyColors.night;
  }

  scene.background = skyColor;

  // Update street lights based on time of day
  scene.traverse((object) => {
    if (object.userData && object.userData.light) {
      const light = object.userData.light as THREE.Light;
      const bulb = object.userData.bulb as THREE.Mesh;

      // Street lights turn on at night
      if (sunHeight < 30) {
        const intensity = Math.max(0, 1 - sunHeight / 30);
        light.intensity = intensity;

        if (bulb && bulb.material instanceof THREE.MeshStandardMaterial) {
          bulb.material.emissiveIntensity = intensity;
        }
      } else {
        light.intensity = 0;

        if (bulb && bulb.material instanceof THREE.MeshStandardMaterial) {
          bulb.material.emissiveIntensity = 0;
        }
      }
    }
  });

  // Update car headlights based on time of day
  scene.traverse((object) => {
    if (object instanceof THREE.Group) {
      object.traverse((child) => {
        if (
          child instanceof THREE.Mesh &&
          child.material instanceof THREE.MeshStandardMaterial &&
          child.material.emissive &&
          child.material.emissive.equals(new THREE.Color(0xffffdd))
        ) {
          // Headlights turn on at night
          if (sunHeight < 40) {
            child.material.emissiveIntensity = 1;
          } else {
            child.material.emissiveIntensity = 0;
          }
        }
      });
    }
  });
}

// Initialize everything and start the simulation
initCity();

export default {};
