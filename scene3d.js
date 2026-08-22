/* Escenas espaciales — planetas, anillos, estrellas, asteroides */

import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { SMAAPass } from "three/addons/postprocessing/SMAAPass.js";

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function markReady(el) {
  el?.classList.add("is-ready");
}

function makeRenderer(canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  return renderer;
}

function makeComposer(renderer, scene, camera) {
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(
    new SMAAPass(
      window.innerWidth * renderer.getPixelRatio(),
      window.innerHeight * renderer.getPixelRatio()
    )
  );
  composer.addPass(new OutputPass());
  return composer;
}

function fit(renderer, camera, el, composer) {
  const w = el.clientWidth;
  const h = el.clientHeight;
  if (!w || !h) return;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  composer?.setSize(w, h);
}

/** Procedural starfield sphere */
function createStarfield(count = 2500, radius = 60) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const color = new THREE.Color();

  for (let i = 0; i < count; i++) {
    const r = radius * (0.55 + Math.random() * 0.45);
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);

    const hot = Math.random();
    if (hot > 0.9) color.setHSL(0.08, 0.25, 0.72);
    else color.setHSL(0.08, 0.05, 0.65 + Math.random() * 0.25);

    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  return new THREE.Points(
    geo,
    new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      sizeAttenuation: true,
    })
  );
}

function createNebulaSprite(color, scale, position) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  const g = ctx.createRadialGradient(128, 128, 10, 128, 128, 128);
  g.addColorStop(0, color);
  g.addColorStop(0.4, color.replace(/[\d.]+\)$/, "0.25)"));
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);

  const tex = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    depthWrite: false,
    opacity: 0.45,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(scale, scale, 1);
  sprite.position.copy(position);
  return sprite;
}

function planetMat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.45,
    metalness: 0.15,
    ...opts,
  });
}

function makeEnv(renderer) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  return env;
}

function addSpaceLights(scene, { sunPos = [8, 4, 6] } = {}) {
  const ambient = new THREE.AmbientLight(0x2a2e36, 0.4);
  scene.add(ambient);

  const hemi = new THREE.HemisphereLight(0x8a909c, 0x1a1c22, 0.55);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xf2e6d4, 2.2);
  sun.position.set(...sunPos);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 50;
  sun.shadow.camera.left = -12;
  sun.shadow.camera.right = 12;
  sun.shadow.camera.top = 12;
  sun.shadow.camera.bottom = -12;
  sun.shadow.bias = -0.0002;
  sun.shadow.normalBias = 0.03;
  sun.shadow.radius = 4;
  scene.add(sun);

  const fill = new THREE.DirectionalLight(0x9aa3b0, 0.35);
  fill.position.set(-6, 2, -4);
  scene.add(fill);

  return { sun };
}

/** Asteroide irregular con vértices desplazados */
function createAsteroidGeometry(radius = 0.35, detail = 2) {
  const geo = new THREE.IcosahedronGeometry(radius, detail);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const n = 0.82 + Math.random() * 0.32 + Math.sin(v.x * 7 + v.y * 5) * 0.06;
    v.multiplyScalar(n);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return geo;
}

function createDust(count = 400, spread = 8) {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * spread;
    positions[i * 3 + 1] = (Math.random() - 0.5) * spread * 0.6;
    positions[i * 3 + 2] = (Math.random() - 0.5) * spread;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return new THREE.Points(
    geo,
    new THREE.PointsMaterial({
      color: 0xc4b49a,
      size: 0.035,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
      sizeAttenuation: true,
    })
  );
}

/* -------------------------------------------------------------------------- */
/* Hero — sistema planetario                                                  */
/* -------------------------------------------------------------------------- */

function initHeroScene() {
  const canvas = document.getElementById("hero-canvas");
  const host = canvas?.parentElement;
  if (!canvas || !host) return;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0c0e12);
  scene.fog = new THREE.FogExp2(0x0c0e12, 0.02);

  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 200);
  camera.position.set(0, 0.8, 7.2);

  const renderer = makeRenderer(canvas);
  scene.environment = makeEnv(renderer);
  const composer = makeComposer(renderer, scene, camera);
  addSpaceLights(scene);

  const stars = createStarfield(2200, 70);
  scene.add(stars);

  scene.add(createNebulaSprite("rgba(48,52,60,0.55)", 26, new THREE.Vector3(-18, 8, -30)));
  scene.add(createNebulaSprite("rgba(62,54,46,0.4)", 20, new THREE.Vector3(16, -6, -28)));

  const root = new THREE.Group();
  scene.add(root);

  let wireframe = false;
  let mode = "icosahedron";
  const meshes = [];

  const clearMeshes = () => {
    while (meshes.length) {
      const m = meshes.pop();
      root.remove(m);
      m.traverse?.((child) => {
        child.geometry?.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) child.material.forEach((x) => x.dispose());
          else child.material.dispose();
        }
      });
      m.geometry?.dispose();
      if (m.material) {
        if (Array.isArray(m.material)) m.material.forEach((x) => x.dispose());
        else m.material.dispose();
      }
    }
  };

  const build = () => {
    clearMeshes();

    if (mode === "icosahedron") {
      /* Planeta principal tipo gas/rocoso */
      const planet = new THREE.Mesh(
        new THREE.SphereGeometry(1.45, 96, 64),
        new THREE.MeshStandardMaterial({
          color: 0xc46a3d,
          roughness: wireframe ? 0.8 : 0.38,
          metalness: 0.25,
          wireframe,
          emissive: 0x3a1808,
          emissiveIntensity: 0.18,
        })
      );
      planet.castShadow = true;
      planet.receiveShadow = true;

      /* Atmósfera */
      const atmosphere = new THREE.Mesh(
        new THREE.SphereGeometry(1.58, 64, 48),
        new THREE.MeshBasicMaterial({
          color: 0xb8896a,
          transparent: true,
          opacity: wireframe ? 0.08 : 0.12,
          side: THREE.BackSide,
          depthWrite: false,
        })
      );

      /* Anillo fino */
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(2.05, 2.55, 128),
        new THREE.MeshStandardMaterial({
          color: 0xd4b896,
          roughness: 0.55,
          metalness: 0.35,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.85,
          wireframe,
        })
      );
      ring.rotation.x = Math.PI / 2.4;
      ring.castShadow = true;

      /* Luna */
      const moon = new THREE.Mesh(
        new THREE.SphereGeometry(0.38, 48, 32),
        planetMat(0xb8c4d4, {
          roughness: 0.7,
          metalness: 0.1,
          wireframe,
        })
      );
      moon.position.set(2.8, 0.55, 0.6);
      moon.castShadow = true;
      moon.userData.orbit = { a: 0.4, r: 2.9, speed: 0.35, yAmp: 0.35 };

      /* Sol lejano */
      const sunCore = new THREE.Mesh(
        new THREE.SphereGeometry(0.55, 32, 24),
        new THREE.MeshStandardMaterial({
          color: 0xd8c4a0,
          emissive: 0x6a5438,
          emissiveIntensity: 0.45,
          roughness: 0.55,
        })
      );
      sunCore.position.set(-4.2, 2.2, -3.5);
      const sunGlow = new THREE.Mesh(
        new THREE.SphereGeometry(0.78, 32, 24),
        new THREE.MeshBasicMaterial({
          color: 0xb8896a,
          transparent: true,
          opacity: 0.14,
          depthWrite: false,
        })
      );
      sunGlow.position.copy(sunCore.position);

      meshes.push(planet, atmosphere, ring, moon, sunCore, sunGlow);
      root.add(planet, atmosphere, ring, moon, sunCore, sunGlow);
    }

    if (mode === "torus") {
      const gas = new THREE.Mesh(
        new THREE.SphereGeometry(1.15, 80, 56),
        new THREE.MeshStandardMaterial({
          color: 0x6a7382,
          roughness: 0.5,
          metalness: 0.15,
          emissive: 0x1a1e26,
          emissiveIntensity: 0.12,
          wireframe,
        })
      );
      gas.castShadow = true;

      const rings = [];
      const ringColors = [0xe8d4b0, 0xc4a888, 0xd8c4a0];
      ringColors.forEach((c, i) => {
        const inner = 1.7 + i * 0.35;
        const r = new THREE.Mesh(
          new THREE.RingGeometry(inner, inner + 0.22, 140),
          new THREE.MeshStandardMaterial({
            color: c,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.75 - i * 0.1,
            roughness: 0.6,
            metalness: 0.25,
            wireframe,
          })
        );
        r.rotation.x = Math.PI / 2.15;
        r.rotation.z = 0.12;
        r.castShadow = true;
        rings.push(r);
      });

      const moon = new THREE.Mesh(
        new THREE.SphereGeometry(0.28, 40, 28),
        planetMat(0xb8896a, { wireframe })
      );
      moon.userData.orbit = { a: 1.2, r: 3.1, speed: 0.45, yAmp: 0.5 };
      moon.castShadow = true;

      meshes.push(gas, ...rings, moon);
      root.add(gas, ...rings, moon);
    }

    if (mode === "knots") {
      const sun = new THREE.Mesh(
        new THREE.SphereGeometry(0.7, 48, 32),
        new THREE.MeshStandardMaterial({
          color: 0xd2c0a0,
          emissive: 0x5a4a32,
          emissiveIntensity: 0.4,
          roughness: 0.5,
        })
      );
      const sunHalo = new THREE.Mesh(
        new THREE.SphereGeometry(0.95, 32, 24),
        new THREE.MeshBasicMaterial({
          color: 0xb8896a,
          transparent: true,
          opacity: 0.12,
          depthWrite: false,
        })
      );

      const planets = [
        { c: 0x5a6574, r: 0.28, orbit: 1.6, speed: 0.7 },
        { c: 0xb8896a, r: 0.38, orbit: 2.3, speed: 0.45 },
        { c: 0x8a8578, r: 0.32, orbit: 3.1, speed: 0.3 },
        { c: 0x6a7068, r: 0.22, orbit: 3.8, speed: 0.55 },
        { c: 0xc4b49a, r: 0.26, orbit: 4.5, speed: 0.22 },
      ];

      meshes.push(sun, sunHalo);
      root.add(sun, sunHalo);

      planets.forEach((p, i) => {
        const mesh = new THREE.Mesh(
          new THREE.SphereGeometry(p.r, 40, 28),
          planetMat(p.c, {
            wireframe,
            roughness: 0.4,
            metalness: 0.2,
          })
        );
        mesh.userData.orbit = {
          a: (i / planets.length) * Math.PI * 2,
          r: p.orbit,
          speed: p.speed,
          yAmp: 0.15 + i * 0.05,
        };
        mesh.castShadow = true;
        meshes.push(mesh);
        root.add(mesh);

        const path = new THREE.Mesh(
          new THREE.RingGeometry(p.orbit - 0.01, p.orbit + 0.01, 96),
          new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.08,
            side: THREE.DoubleSide,
          })
        );
        path.rotation.x = Math.PI / 2;
        root.add(path);
        meshes.push(path);
      });
    }
  };

  build();
  markReady(host);

  let dragging = false;
  let prevX = 0;
  let prevY = 0;
  let targetRotY = 0.4;
  let targetRotX = 0.18;
  let zoom = 7.2;

  host.addEventListener("pointerdown", (e) => {
    dragging = true;
    prevX = e.clientX;
    prevY = e.clientY;
    host.setPointerCapture?.(e.pointerId);
  });
  host.addEventListener("pointerup", () => {
    dragging = false;
  });
  host.addEventListener("pointerleave", () => {
    dragging = false;
  });
  host.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    targetRotY += (e.clientX - prevX) * 0.007;
    targetRotX += (e.clientY - prevY) * 0.005;
    targetRotX = Math.max(-0.9, Math.min(0.9, targetRotX));
    prevX = e.clientX;
    prevY = e.clientY;
  });
  host.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      zoom = Math.max(4.5, Math.min(12, zoom + e.deltaY * 0.003));
    },
    { passive: false }
  );

  document.querySelectorAll("[data-hero-shape]").forEach((btn) => {
    btn.addEventListener("click", () => {
      mode = btn.getAttribute("data-hero-shape") || "icosahedron";
      document.querySelectorAll("[data-hero-shape]").forEach((b) => {
        b.setAttribute("aria-pressed", b === btn ? "true" : "false");
      });
      build();
    });
  });

  document.getElementById("hero-wireframe")?.addEventListener("click", (e) => {
    wireframe = !wireframe;
    e.currentTarget.setAttribute("aria-pressed", wireframe ? "true" : "false");
    build();
  });

  const onResize = () => fit(renderer, camera, host, composer);
  window.addEventListener("resize", onResize);
  onResize();

  let t = 0;
  const tick = () => {
    requestAnimationFrame(tick);
    t += reduceMotion ? 0 : 0.008;

    root.rotation.y += (targetRotY - root.rotation.y) * 0.07;
    root.rotation.x += (targetRotX - root.rotation.x) * 0.07;
    camera.position.z += (zoom - camera.position.z) * 0.07;
    camera.lookAt(0, 0.15, 0);

    if (!reduceMotion) {
      stars.rotation.y += 0.00025;
      meshes.forEach((m) => {
        if (m.userData.orbit) {
          const o = m.userData.orbit;
          o.a += o.speed * 0.008;
          m.position.x = Math.cos(o.a) * o.r;
          m.position.z = Math.sin(o.a) * o.r;
          m.position.y = Math.sin(o.a * 1.2 + t) * (o.yAmp || 0.3);
          m.rotation.y += 0.01;
        } else if (m.geometry?.type === "SphereGeometry") {
          m.rotation.y += 0.002;
        }
      });
    }

    composer.render();
  };
  tick();
}

/* -------------------------------------------------------------------------- */
/* Lab — campo de asteroides (cinemático, sin neón)                           */
/* -------------------------------------------------------------------------- */

function initLabScene() {
  const canvas = document.getElementById("lab-canvas");
  const shell = canvas?.closest(".scene3d__shell");
  if (!canvas || !shell) return;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0c10);
  scene.fog = new THREE.FogExp2(0x0a0c10, 0.022);

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 200);
  camera.position.set(0.8, 2.2, 7.8);

  const renderer = makeRenderer(canvas);
  renderer.toneMappingExposure = 1.1;
  scene.environment = makeEnv(renderer);
  const composer = makeComposer(renderer, scene, camera);
  addSpaceLights(scene, { sunPos: [10, 5, 4] });

  const stars = createStarfield(2600, 70);
  scene.add(stars);

  /* Solo polvo mate — sin púrpura */
  scene.add(createNebulaSprite("rgba(42,46,54,0.5)", 32, new THREE.Vector3(-14, 5, -28)));
  scene.add(createNebulaSprite("rgba(58,50,42,0.32)", 24, new THREE.Vector3(12, -4, -26)));

  const dust = createDust(500, 10);
  scene.add(dust);

  /* Sol definido (no mancha borrosa) */
  const sunGroup = new THREE.Group();
  sunGroup.position.set(6.5, 2.2, -3);
  const sunCore = new THREE.Mesh(
    new THREE.SphereGeometry(0.85, 64, 48),
    new THREE.MeshStandardMaterial({
      color: 0xe8d4b0,
      emissive: 0xb8896a,
      emissiveIntensity: 0.85,
      roughness: 0.45,
      metalness: 0.05,
    })
  );
  const sunSoft = new THREE.Mesh(
    new THREE.SphereGeometry(1.15, 48, 32),
    new THREE.MeshBasicMaterial({
      color: 0xc4a484,
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
    })
  );
  sunGroup.add(sunCore, sunSoft);
  scene.add(sunGroup);

  /* Planeta lejano suave + atmósfera sutil */
  const farPlanet = new THREE.Mesh(
    new THREE.SphereGeometry(2.4, 96, 64),
    new THREE.MeshPhysicalMaterial({
      color: 0x4a5564,
      roughness: 0.62,
      metalness: 0.12,
      clearcoat: 0.15,
      clearcoatRoughness: 0.7,
      envMapIntensity: 0.7,
    })
  );
  farPlanet.position.set(-6.5, 1.2, -12);
  farPlanet.receiveShadow = true;
  scene.add(farPlanet);

  const farAtmo = new THREE.Mesh(
    new THREE.SphereGeometry(2.55, 64, 48),
    new THREE.MeshBasicMaterial({
      color: 0x8a909c,
      transparent: true,
      opacity: 0.1,
      side: THREE.BackSide,
      depthWrite: false,
    })
  );
  farAtmo.position.copy(farPlanet.position);
  scene.add(farAtmo);

  /* Luna cercana de referencia */
  const nearMoon = new THREE.Mesh(
    new THREE.SphereGeometry(0.55, 64, 48),
    new THREE.MeshPhysicalMaterial({
      color: 0xb8b0a4,
      roughness: 0.72,
      metalness: 0.08,
      clearcoat: 0.05,
    })
  );
  nearMoon.position.set(-2.2, -0.4, -1.5);
  nearMoon.castShadow = true;
  nearMoon.receiveShadow = true;
  scene.add(nearMoon);

  const group = new THREE.Group();
  scene.add(group);

  const pieces = [];
  let spinBoost = 0;

  const rockColors = [0x7a7f88, 0x9a958c, 0x6a645a, 0xb0a090, 0x5a6068, 0xc4b49a];

  const spawn = (x = (Math.random() - 0.5) * 4.2, z = (Math.random() - 0.5) * 4.2) => {
    const isMoon = Math.random() > 0.72;
    let mesh;

    if (isMoon) {
      const r = 0.22 + Math.random() * 0.28;
      mesh = new THREE.Mesh(
        new THREE.SphereGeometry(r, 48, 32),
        new THREE.MeshPhysicalMaterial({
          color: rockColors[Math.floor(Math.random() * rockColors.length)],
          roughness: 0.55 + Math.random() * 0.25,
          metalness: 0.08 + Math.random() * 0.12,
          clearcoat: 0.08,
          envMapIntensity: 0.85,
        })
      );
    } else {
      const r = 0.22 + Math.random() * 0.35;
      mesh = new THREE.Mesh(
        createAsteroidGeometry(r, Math.random() > 0.5 ? 2 : 1),
        new THREE.MeshStandardMaterial({
          color: rockColors[Math.floor(Math.random() * rockColors.length)],
          roughness: 0.7 + Math.random() * 0.22,
          metalness: 0.12 + Math.random() * 0.18,
          flatShading: false,
          envMapIntensity: 0.6,
        })
      );
    }

    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.position.set(x, 0.2 + Math.random() * 2.4, z);
    mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
    mesh.userData.vel = new THREE.Vector3(
      (Math.random() - 0.5) * 0.02,
      (Math.random() - 0.5) * 0.012,
      (Math.random() - 0.5) * 0.02
    );
    mesh.userData.spin = new THREE.Vector3(
      (Math.random() - 0.5) * 0.02,
      (Math.random() - 0.5) * 0.025,
      (Math.random() - 0.5) * 0.015
    );
    pieces.push(mesh);
    group.add(mesh);

    if (pieces.length > 36) {
      const old = pieces.shift();
      group.remove(old);
      old.geometry.dispose();
      old.material.dispose();
    }
  };

  for (let i = 0; i < 16; i++) spawn();
  markReady(shell);

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  shell.addEventListener("pointerdown", (e) => {
    if (e.target.closest("[data-lab-action]")) return;
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hit = new THREE.Vector3();
    const ok = raycaster.ray.intersectPlane(
      new THREE.Plane(new THREE.Vector3(0, 1, 0), 0.2),
      hit
    );
    if (ok) spawn(hit.x, hit.z);
    else spawn();
  });

  document.querySelectorAll("[data-lab-action]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const action = btn.getAttribute("data-lab-action");
      if (action === "burst") {
        pieces.forEach((p) => {
          p.userData.vel.add(
            new THREE.Vector3(
              (Math.random() - 0.5) * 0.16,
              Math.random() * 0.12,
              (Math.random() - 0.5) * 0.16
            )
          );
        });
        for (let i = 0; i < 8; i++) spawn();
      }
      if (action === "spin") spinBoost = 0.12;
      if (action === "reset") {
        while (pieces.length) {
          const p = pieces.pop();
          group.remove(p);
          p.geometry.dispose();
          p.material.dispose();
        }
        for (let i = 0; i < 16; i++) spawn();
        spinBoost = 0;
        group.rotation.set(0, 0, 0);
      }
    });
  });

  const onResize = () => fit(renderer, camera, shell, composer);
  window.addEventListener("resize", onResize);
  onResize();

  camera.lookAt(0, 0.4, 0);

  const tick = () => {
    requestAnimationFrame(tick);
    if (!reduceMotion) {
      stars.rotation.y += 0.00015;
      dust.rotation.y -= 0.00025;
      farPlanet.rotation.y += 0.0008;
      nearMoon.rotation.y += 0.003;
      sunGroup.rotation.y += 0.001;
      group.rotation.y += 0.0012 + spinBoost;
      spinBoost *= 0.96;

      pieces.forEach((p) => {
        p.userData.vel.multiplyScalar(0.996);
        p.position.add(p.userData.vel);
        p.rotation.x += p.userData.spin.x + spinBoost * 0.35;
        p.rotation.y += p.userData.spin.y;

        const lim = 4.8;
        ["x", "y", "z"].forEach((axis) => {
          if (Math.abs(p.position[axis]) > lim) {
            p.position[axis] = Math.sign(p.position[axis]) * lim;
            p.userData.vel[axis] *= -0.55;
          }
        });
        if (p.position.y < -1.8) {
          p.position.y = -1.8;
          p.userData.vel.y *= -0.45;
        }
      });
    }
    composer.render();
  };
  tick();
}

initHeroScene();
initLabScene();
