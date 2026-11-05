// Two 3D dancing babies (a boy and a girl) for the footer, built from simple shapes with Three.js.
// Their outfits follow the current weather, which app.js announces with a "weather" event.
import * as THREE from "./vendor/three.module.min.js";

const canvas = document.getElementById("baby");
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(32, canvas.clientWidth / canvas.clientHeight, 0.1, 50);
camera.position.set(0, 1.5, 7.2);
camera.lookAt(0, 1.2, 0);

scene.add(new THREE.HemisphereLight(0xffffff, 0x8899bb, 1.6));
const sun = new THREE.DirectionalLight(0xfff2e0, 2.2);
sun.position.set(2, 4, 5);
scene.add(sun);

const SKIN = 0xc68d62;
const std = (color, roughness = 0.6, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness, ...extra });
const dark = std(0x1a1410, 0.3);
const blush = std(0xc96e5c, 0.7);
const hair = std(0x3a2416, 0.8);
const rimMat = std(0x111111, 0.25, { metalness: 0.6 });
const lens = std(0x0b0b14, 0.05, { metalness: 0.9 });

const mesh = (geo, mat, x = 0, y = 0, z = 0) => {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  return m;
};

function makeSunglasses() {
  const shades = new THREE.Group();
  shades.position.set(0, 0.07, 0);
  for (const side of [-1, 1]) {
    const rim = mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.05, 32), rimMat, side * 0.2, 0, 0.53);
    rim.rotation.order = "YXZ";
    rim.rotation.set(Math.PI / 2, side * 0.35, 0);
    shades.add(rim);
    const glass = mesh(new THREE.CylinderGeometry(0.135, 0.135, 0.06, 32), lens, side * 0.2, 0, 0.535);
    glass.rotation.copy(rim.rotation);
    shades.add(glass);
    const temple = mesh(new THREE.BoxGeometry(0.03, 0.03, 0.42), rimMat, side * 0.5, 0.02, 0.27);
    temple.rotation.y = side * -0.25;
    shades.add(temple);
  }
  shades.add(mesh(new THREE.BoxGeometry(0.12, 0.03, 0.03), rimMat, 0, 0.04, 0.58)); // bridge
  return shades;
}

// Hierarchy: root > hips > torso > head/arms, hips > legs.
// Every body part gets its own material so outfits can recolor it.
function makeBaby(female) {
  const root = new THREE.Group();
  const hips = new THREE.Group();
  hips.position.y = 0.75;
  root.add(hips);

  const diaper = mesh(new THREE.SphereGeometry(0.5, 32, 24), std(0xffffff, 0.8), 0, 0.05, 0);
  diaper.scale.set(1, 0.7, 0.85);
  hips.add(diaper);

  const torso = new THREE.Group();
  torso.position.y = 0.2;
  hips.add(torso);
  const belly = mesh(new THREE.SphereGeometry(0.48, 32, 24), std(SKIN, 0.5), 0, 0.3, 0);
  belly.scale.set(1, 1.1, 0.9);
  torso.add(belly);

  const head = new THREE.Group();
  head.position.y = 0.95;
  torso.add(head);
  const skin = std(SKIN, 0.5);
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

  // Hair: a curl on top for him, two puffs with pink ties for her
  const topHair = new THREE.Group();
  head.add(topHair);
  if (female) {
    for (const side of [-1, 1]) {
      head.add(mesh(new THREE.SphereGeometry(0.17, 20, 16), hair, side * 0.5, 0.32, -0.08));
      const tie = mesh(new THREE.TorusGeometry(0.1, 0.035, 8, 20), std(0xff4f9a), side * 0.42, 0.27, -0.06);
      tie.rotation.y = Math.PI / 2;
      head.add(tie);
    }
    const bow = new THREE.Group();
    bow.position.set(0.18, 0.5, 0.2);
    bow.rotation.z = -0.4;
    const bowMat = std(0xff4f9a, 0.5);
    for (const side of [-1, 1]) {
      const loop = mesh(new THREE.ConeGeometry(0.1, 0.18, 16), bowMat, side * 0.09, 0, 0);
      loop.rotation.z = side * Math.PI / 2;
      bow.add(loop);
    }
    bow.add(mesh(new THREE.SphereGeometry(0.05, 12, 10), bowMat));
    topHair.add(bow);
  } else {
    const curl = mesh(new THREE.TorusGeometry(0.08, 0.03, 8, 20, Math.PI * 1.5), hair, 0, 0.58, 0.05);
    curl.rotation.y = Math.PI / 2;
    topHair.add(curl);
  }

  const shades = makeSunglasses();
  head.add(shades);

  const arms = [], hands = [], legs = [], feet = [];
  // Limbs pivot at the shoulder/hip so they can swing
  function limb(x, y, length, parent, segs, ends) {
    const pivot = new THREE.Group();
    pivot.position.set(x, y, 0);
    const seg = mesh(new THREE.CapsuleGeometry(0.13, length, 8, 16), std(SKIN, 0.5), 0, -length / 2 - 0.05, 0);
    const end = mesh(new THREE.SphereGeometry(0.16, 16, 12), std(SKIN, 0.5), 0, -length - 0.15, 0.02);
    pivot.add(seg, end);
    parent.add(pivot);
    segs.push(seg);
    ends.push(end);
    return pivot;
  }
  const armL = limb(-0.45, 0.5, 0.4, torso, arms, hands);
  const armR = limb(0.45, 0.5, 0.4, torso, arms, hands);
  const legL = limb(-0.22, -0.15, 0.3, hips, legs, feet);
  const legR = limb(0.22, -0.15, 0.3, hips, legs, feet);

  // Slots that outfits fill with hats, scarves and skirts
  const hat = new THREE.Group();
  head.add(hat);
  const neck = new THREE.Group();
  torso.add(neck);
  const skirt = new THREE.Group();
  hips.add(skirt);

  return { female, root, hips, torso, head, armL, armR, legL, legR, belly, diaper, arms, hands, legs, feet, topHair, shades, hat, neck, skirt };
}

// ---- Outfits ----

const capGeo = new THREE.SphereGeometry(0.58, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2.2);

function beanie(color, pom) {
  const g = new THREE.Group();
  g.add(mesh(capGeo, std(color, 0.9), 0, 0.06, 0));
  const cuff = mesh(new THREE.TorusGeometry(0.56, 0.06, 10, 40), std(color, 0.9), 0, 0.2, 0);
  cuff.rotation.x = Math.PI / 2;
  g.add(cuff);
  g.add(mesh(new THREE.SphereGeometry(0.14, 16, 12), std(pom, 1), 0, 0.68, 0));
  return g;
}

function brimHat(color, brim, band) {
  const g = new THREE.Group();
  const m = std(color, 0.7);
  g.add(mesh(capGeo, m, 0, 0.08, 0));
  const disc = mesh(new THREE.CylinderGeometry(brim, brim, 0.03, 40), m, 0, 0.22, 0.04);
  disc.rotation.x = -0.12;
  g.add(disc);
  if (band) {
    const ring = mesh(new THREE.TorusGeometry(0.55, 0.04, 8, 40), std(band, 0.5), 0, 0.26, 0);
    ring.rotation.x = Math.PI / 2;
    g.add(ring);
  }
  return g;
}

function nightcap(color) {
  const g = new THREE.Group();
  const cone = mesh(new THREE.ConeGeometry(0.5, 0.95, 32), std(color, 0.9), 0.12, 0.62, 0);
  cone.rotation.z = -0.45;
  g.add(cone);
  g.add(mesh(new THREE.SphereGeometry(0.12, 16, 12), std(0xffffff, 1), 0.45, 1.0, 0));
  return g;
}

function scarf(color) {
  const g = new THREE.Group();
  const m = std(color, 0.9);
  const ring = mesh(new THREE.TorusGeometry(0.36, 0.1, 12, 32), m, 0, 0.8, 0);
  ring.rotation.x = Math.PI / 2;
  g.add(ring);
  const tail = mesh(new THREE.BoxGeometry(0.16, 0.42, 0.08), m, 0.18, 0.55, 0.42);
  tail.rotation.z = 0.15;
  g.add(tail);
  return g;
}

function dress(color) {
  const m = std(color, 0.6, { side: THREE.DoubleSide });
  return mesh(new THREE.CylinderGeometry(0.38, 0.66, 0.5, 32, 1, true), m, 0, -0.05, 0);
}

// Colors per outfit: top (torso), sleeves (arms), bottom (diaper area), legs, hands, feet
const OUTFITS = {
  beach: {
    boy:  { bottom: 0xff7a1a },
    girl: { top: 0xff4f9a, bottom: 0xff4f9a, hat: () => brimHat(0xe8c77a, 0.95, 0xff4f9a) },
  },
  casual: {
    boy:  { top: 0x2bb3a3, bottom: 0x2d4a7a },
    girl: { top: 0xff8fab, bottom: 0xff8fab, dress: 0xff8fab },
  },
  rain: {
    boy:  { top: 0xffc800, sleeves: 0xffc800, bottom: 0x2d4a7a, legs: 0x2d4a7a, feet: 0x2a8a3a, hat: () => brimHat(0xffc800, 0.82) },
    girl: { top: 0xe63946, sleeves: 0xe63946, bottom: 0xe63946, legs: 0xf1f1f1, feet: 0xffc800, hat: () => brimHat(0xe63946, 0.82) },
  },
  cold: {
    boy:  { top: 0x1f6fd1, sleeves: 0x1f6fd1, bottom: 0x34495e, legs: 0x34495e, hands: 0xe63946, feet: 0x5a3a22, hat: () => beanie(0xe63946, 0xffffff), scarf: 0xe63946 },
    girl: { top: 0x9b5de5, sleeves: 0x9b5de5, bottom: 0xf1f1f1, legs: 0xf1f1f1, hands: 0xff4f9a, feet: 0xffffff, hat: () => beanie(0xff4f9a, 0xffffff), scarf: 0xff4f9a },
  },
  pajamas: {
    boy:  { top: 0x5aa9e6, sleeves: 0x5aa9e6, bottom: 0x5aa9e6, legs: 0x5aa9e6, hat: () => nightcap(0x5aa9e6) },
    girl: { top: 0xc8a2ff, sleeves: 0xc8a2ff, bottom: 0xc8a2ff, legs: 0xc8a2ff },
  },
};

function pickOutfit({ code, isDay, temp }) {
  const snow = (code >= 71 && code <= 77) || code === 85 || code === 86;
  const rain = !snow && code >= 51;
  if (snow || (!rain && temp <= 55)) return "cold";
  if (rain) return "rain";
  if (!isDay) return "pajamas";
  if (temp >= 82) return "beach";
  return "casual";
}

function dressBaby(b, outfitName, sunny) {
  const o = OUTFITS[outfitName][b.female ? "girl" : "boy"];
  const set = (meshes, color, rough = 0.7) => meshes.forEach((m) => {
    m.material.color.setHex(color ?? SKIN);
    m.material.roughness = color == null ? 0.5 : rough;
  });
  set([b.belly], o.top);
  set(b.arms, o.sleeves);
  set(b.hands, o.hands, 0.95);
  set(b.legs, o.legs);
  set(b.feet, o.feet, 0.4);
  b.diaper.material.color.setHex(o.bottom ?? 0xffffff);

  for (const slot of [b.hat, b.neck, b.skirt]) slot.clear();
  if (o.hat) b.hat.add(o.hat());
  if (o.scarf) b.neck.add(scarf(o.scarf));
  if (o.dress) b.skirt.add(dress(o.dress));
  b.topHair.visible = !o.hat;
  b.shades.visible = sunny;
}

// ---- Scene ----

const boy = makeBaby(false);
const girl = makeBaby(true);
boy.root.position.x = -0.85;
girl.root.position.x = 0.85;
boy.baseYaw = 0.35;
girl.baseYaw = -0.35;
scene.add(boy.root, girl.root);

// Soft shadows under their feet
const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.18 });
for (const x of [-0.85, 0.85]) {
  const shadow = mesh(new THREE.CircleGeometry(0.6, 32), shadowMat, x, -0.1, 0);
  shadow.rotation.x = -Math.PI / 2;
  scene.add(shadow);
}

function applyWeather(w) {
  const outfit = pickOutfit(w);
  const sunny = w.isDay && w.code <= 2 && (outfit === "beach" || outfit === "casual");
  dressBaby(boy, outfit, sunny);
  dressBaby(girl, outfit, sunny);
  if (still) render(0.3);
}

// ---- Dance ----

const ease = (x) => x * x * (3 - 2 * x);

// m mirrors the moves so the partners dance as reflections of each other
function pose(b, beat, m) {
  const count = (beat / (Math.PI * 2)) % 16; // position within a 16-beat phrase
  const showtime = count >= 12 && count < 14;

  let spin = 0;
  if (b.female && showtime) spin = ease((count - 12) / 2) * Math.PI * 2; // her twirl
  b.root.rotation.y = b.baseYaw + m * Math.sin(beat / 4) * 0.3 + spin;

  b.hips.position.y = 0.75 + Math.abs(Math.sin(beat)) * 0.12;
  b.hips.position.x = m * Math.sin(beat / 2) * 0.1;
  b.hips.rotation.z = m * Math.sin(beat / 2) * 0.18;
  b.torso.rotation.z = -m * Math.sin(beat / 2) * 0.28;
  b.head.rotation.z = m * Math.sin(beat / 2 + 0.6) * 0.22;
  b.head.rotation.x = Math.sin(beat) * 0.08;

  if (!b.female && showtime) {
    // His "raise the roof"
    const pump = Math.abs(Math.sin(beat)) * 0.35;
    b.armL.rotation.z = -2.5 - pump;
    b.armR.rotation.z = 2.5 + pump;
    b.armL.rotation.x = b.armR.rotation.x = 0;
  } else {
    const s = m * Math.sin(beat / 2);
    b.armL.rotation.z = -0.6 - Math.max(0, s) * 2.0;
    b.armR.rotation.z = 0.6 + Math.max(0, -s) * 2.0;
    b.armL.rotation.x = Math.sin(beat) * 0.4;
    b.armR.rotation.x = -Math.sin(beat) * 0.4;
  }

  b.legL.rotation.x = Math.max(0, m * Math.sin(beat / 2)) * 0.6;
  b.legR.rotation.x = Math.max(0, -m * Math.sin(beat / 2)) * 0.6;
  b.legL.rotation.z = -0.1;
  b.legR.rotation.z = 0.1;
}

function render(t) {
  const beat = t * Math.PI * 2 * 1.1; // ~132 bpm
  pose(boy, beat, 1);
  pose(girl, beat, -1);
  renderer.render(scene, camera);
}

const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const clock = new THREE.Clock();

applyWeather(window.currentWeather || { code: 1, isDay: true, temp: 78 });
window.addEventListener("weather", (e) => applyWeather(e.detail));

if (still) {
  render(0.3);
} else {
  (function frame() {
    render(clock.getElapsedTime());
    requestAnimationFrame(frame);
  })();
}
