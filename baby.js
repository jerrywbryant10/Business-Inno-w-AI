// 3D dancing baby for the footer, built from simple shapes with Three.js
import * as THREE from "./vendor/three.module.min.js";

const canvas = document.getElementById("baby");
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(32, canvas.clientWidth / canvas.clientHeight, 0.1, 50);
camera.position.set(0, 1.4, 7);
camera.lookAt(0, 1.1, 0);

scene.add(new THREE.HemisphereLight(0xffffff, 0x8899bb, 1.6));
const sun = new THREE.DirectionalLight(0xfff2e0, 2.2);
sun.position.set(2, 4, 5);
scene.add(sun);

const skin = new THREE.MeshStandardMaterial({ color: 0xc68d62, roughness: 0.5 });
const cloth = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 });
const dark = new THREE.MeshStandardMaterial({ color: 0x1a1410, roughness: 0.3 });
const blush = new THREE.MeshStandardMaterial({ color: 0xc96e5c, roughness: 0.7 });
const hair = new THREE.MeshStandardMaterial({ color: 0x3a2416, roughness: 0.8 });

const mesh = (geo, mat, x = 0, y = 0, z = 0) => {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  return m;
};

// Hierarchy: baby > hips > torso > head/arms, hips > legs
const baby = new THREE.Group();
scene.add(baby);

const hips = new THREE.Group();
hips.position.y = 0.75;
baby.add(hips);

const diaper = mesh(new THREE.SphereGeometry(0.5, 32, 24), cloth, 0, 0.05, 0);
diaper.scale.set(1, 0.7, 0.85);
hips.add(diaper);

const torso = new THREE.Group();
torso.position.y = 0.2;
hips.add(torso);
const belly = mesh(new THREE.SphereGeometry(0.48, 32, 24), skin, 0, 0.3, 0);
belly.scale.set(1, 1.1, 0.9);
torso.add(belly);

const head = new THREE.Group();
head.position.y = 0.95;
torso.add(head);
head.add(mesh(new THREE.SphereGeometry(0.55, 40, 32), skin));
head.add(mesh(new THREE.SphereGeometry(0.075, 16, 12), dark, -0.19, 0.05, 0.49));
head.add(mesh(new THREE.SphereGeometry(0.075, 16, 12), dark, 0.19, 0.05, 0.49));
head.add(mesh(new THREE.SphereGeometry(0.09, 16, 12), blush, -0.32, -0.12, 0.4));
head.add(mesh(new THREE.SphereGeometry(0.09, 16, 12), blush, 0.32, -0.12, 0.4));
const smile = mesh(new THREE.TorusGeometry(0.11, 0.022, 8, 24, Math.PI), dark, 0, -0.13, 0.5);
smile.rotation.z = Math.PI;
head.add(smile);
head.add(mesh(new THREE.SphereGeometry(0.1, 16, 12), skin, 0, -0.02, 0.56)); // nose
head.add(mesh(new THREE.SphereGeometry(0.12, 16, 12), skin, -0.55, 0, 0)); // ears
head.add(mesh(new THREE.SphereGeometry(0.12, 16, 12), skin, 0.55, 0, 0));
const curl = mesh(new THREE.TorusGeometry(0.08, 0.03, 8, 20, Math.PI * 1.5), hair, 0, 0.58, 0.05);
curl.rotation.y = Math.PI / 2;
head.add(curl);

// Limbs pivot at the shoulder/hip so they can swing
function limb(x, y, length, parent) {
  const pivot = new THREE.Group();
  pivot.position.set(x, y, 0);
  const arm = mesh(new THREE.CapsuleGeometry(0.13, length, 8, 16), skin, 0, -length / 2 - 0.05, 0);
  pivot.add(arm);
  pivot.add(mesh(new THREE.SphereGeometry(0.16, 16, 12), skin, 0, -length - 0.15, 0.02));
  parent.add(pivot);
  return pivot;
}
const armL = limb(-0.45, 0.5, 0.4, torso);
const armR = limb(0.45, 0.5, 0.4, torso);
const legL = limb(-0.22, -0.15, 0.3, hips);
const legR = limb(0.22, -0.15, 0.3, hips);

// Soft shadow under the feet
const shadow = mesh(new THREE.CircleGeometry(0.6, 32), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.18 }));
shadow.rotation.x = -Math.PI / 2;
shadow.position.y = -0.1;
scene.add(shadow);

const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const clock = new THREE.Clock();

function pose(t) {
  const beat = t * Math.PI * 2 * 1.1; // ~132 bpm

  baby.rotation.y = Math.sin(beat / 4) * 0.6;
  hips.position.y = 0.75 + Math.abs(Math.sin(beat)) * 0.12;
  hips.position.x = Math.sin(beat / 2) * 0.12;
  hips.rotation.z = Math.sin(beat / 2) * 0.18;
  torso.rotation.z = -Math.sin(beat / 2) * 0.28;
  head.rotation.z = Math.sin(beat / 2 + 0.6) * 0.22;
  head.rotation.x = Math.sin(beat) * 0.08;

  armL.rotation.z = -0.6 - Math.max(0, Math.sin(beat / 2)) * 2.0;
  armR.rotation.z = 0.6 + Math.max(0, -Math.sin(beat / 2)) * 2.0;
  armL.rotation.x = Math.sin(beat) * 0.4;
  armR.rotation.x = -Math.sin(beat) * 0.4;

  legL.rotation.x = Math.max(0, Math.sin(beat / 2)) * 0.6;
  legR.rotation.x = Math.max(0, -Math.sin(beat / 2)) * 0.6;
  legL.rotation.z = -0.1;
  legR.rotation.z = 0.1;
}

function frame() {
  pose(clock.getElapsedTime());
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

if (still) {
  pose(0.3);
  renderer.render(scene, camera);
} else {
  frame();
}
