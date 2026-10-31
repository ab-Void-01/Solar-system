'use strict';

/* Radii are in layout units (see --u in style.css).
   `speed` is relative angular speed (Earth = 1), compressed so the outer planets still visibly move. */
const PLANETS = [
  { id: 'mercury', radius: 8.5,  speed: 1.607, name: 'Mercury', diameter: '4,879 km',   distance: '57.9 million km', year: '88 days',    fact: 'The smallest planet. One day, sunrise to sunrise, lasts about 176 Earth days.' },
  { id: 'venus',   radius: 11.5, speed: 1.174, name: 'Venus',   diameter: '12,104 km',  distance: '108.2 million km', year: '225 days',   fact: 'The hottest planet, around 465 °C at the surface. It spins backwards.' },
  { id: 'earth',   radius: 15,   speed: 1,     name: 'Earth',   diameter: '12,742 km',  distance: '149.6 million km', year: '365.25 days', fact: 'The only world known to have life. The Moon is about a quarter of its width.' },
  { id: 'mars',    radius: 18.5, speed: 0.802, name: 'Mars',    diameter: '6,779 km',   distance: '227.9 million km', year: '687 days',   fact: 'Home to Olympus Mons, a volcano roughly 22 km tall.' },
  { id: 'jupiter', radius: 30,   speed: 0.434, name: 'Jupiter', diameter: '139,820 km', distance: '778.5 million km', year: '11.9 years', fact: 'The Great Red Spot is a storm larger than Earth that has lasted for centuries.' },
  { id: 'saturn',  radius: 37,   speed: 0.323, name: 'Saturn',  diameter: '116,460 km', distance: '1.43 billion km',  year: '29.4 years', fact: 'Its average density is lower than water, so it would float in a big enough bath.' },
  { id: 'uranus',  radius: 43,   speed: 0.228, name: 'Uranus',  diameter: '50,724 km',  distance: '2.87 billion km',  year: '84 years',   fact: 'It rotates on its side, tilted about 98 degrees.' },
  { id: 'neptune', radius: 48,   speed: 0.182, name: 'Neptune', diameter: '49,244 km',  distance: '4.50 billion km',  year: '165 years',  fact: 'Winds here reach about 2,000 km/h, the fastest measured in the solar system.' }
];

const SUN_INFO = { name: 'Sun', diameter: '1,392,700 km', fact: 'Holds about 99.86% of the mass of the entire solar system.' };

const BASE_SPEED  = 0.5;   // radians per second for a body with speed 1
const MOON_RADIUS = 2.2;   // layout units, around Earth
const MOON_SPEED  = 3.5;   // radians per second
const BELT_SPEED  = 4;     // degrees per second
const BELT_INNER  = 21.5;
const BELT_OUTER  = 25;

const root       = document.documentElement;
const system     = document.getElementById('system');
const moon       = document.getElementById('moon');
const belt       = document.getElementById('belt');
const info       = document.getElementById('info');
const playBtn    = document.getElementById('toggle-play');
const speedInput = document.getElementById('speed');
const speedOut   = document.getElementById('speed-out');
const labelsBox  = document.getElementById('toggle-labels');
const orbitsBox  = document.getElementById('toggle-orbits');

const earth = PLANETS.find(p => p.id === 'earth');

/* ---------- Setup ---------- */
PLANETS.forEach(p => {
  p.el = document.getElementById(p.id);
  p.angle = Math.random() * Math.PI * 2;
  p.el.addEventListener('click', () => select(p));
  addOrbit(p.radius, p.id + '-orbit');
});

const moonOrbit = addOrbit(MOON_RADIUS, 'moon-orbit');
let moonAngle = 0;
let beltAngle = 0;

document.getElementById('sun').addEventListener('click', () => select(SUN_INFO, document.getElementById('sun')));

function addOrbit(radius, id) {
  const orbit = document.createElement('div');
  orbit.className = 'orbit';
  orbit.id = id;
  orbit.style.setProperty('--r', radius);
  system.prepend(orbit);
  return orbit;
}

function buildBelt() {
  const half = BELT_OUTER;               // belt container is 2 * BELT_OUTER units wide
  const frag = document.createDocumentFragment();
  for (let i = 0; i < 420; i++) {
    const r = BELT_INNER + Math.random() * (BELT_OUTER - BELT_INNER);
    const a = Math.random() * Math.PI * 2;
    const size = 1 + Math.random() * 1.6;
    const dot = document.createElement('i');
    dot.style.left = `${50 + (Math.cos(a) * r / half) * 50}%`;
    dot.style.top  = `${50 + (Math.sin(a) * r / half) * 50}%`;
    dot.style.width = dot.style.height = `${size}px`;
    dot.style.opacity = (0.35 + Math.random() * 0.55).toFixed(2);
    frag.appendChild(dot);
  }
  belt.appendChild(frag);
}

function buildStars() {
  const frag = document.createDocumentFragment();
  for (let i = 0; i < 160; i++) {
    const s = document.createElement('span');
    const size = Math.random() < 0.85 ? 1 : 2;
    s.style.left = `${Math.random() * 100}%`;
    s.style.top = `${Math.random() * 100}%`;
    s.style.width = s.style.height = `${size}px`;
    s.style.setProperty('--o', (0.3 + Math.random() * 0.6).toFixed(2));
    s.style.animationDelay = `${(Math.random() * 4).toFixed(2)}s`;
    s.style.animationDuration = `${(3 + Math.random() * 4).toFixed(2)}s`;
    frag.appendChild(s);
  }
  document.getElementById('stars').appendChild(frag);
}

/* ---------- Rendering ---------- */
function place(el, x, y) {
  el.style.transform = `translate(calc(${x.toFixed(3)} * var(--u)), calc(${y.toFixed(3)} * var(--u)))`;
}

function render() {
  for (const p of PLANETS) {
    place(p.el, Math.cos(p.angle) * p.radius, Math.sin(p.angle) * p.radius);
  }

  const ex = Math.cos(earth.angle) * earth.radius;
  const ey = Math.sin(earth.angle) * earth.radius;
  place(moon, ex + Math.cos(moonAngle) * MOON_RADIUS, ey + Math.sin(moonAngle) * MOON_RADIUS);
  place(moonOrbit, ex, ey);

  belt.style.transform = `rotate(${beltAngle.toFixed(2)}deg)`;
}

/* ---------- Animation loop ---------- */
let paused = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let speed = Number(speedInput.value);
let last = performance.now();

function frame(now) {
  const dt = Math.min((now - last) / 1000, 0.05);   // clamp so tab switches don't cause jumps
  last = now;

  if (!paused) {
    const k = dt * speed;
    for (const p of PLANETS) p.angle += p.speed * BASE_SPEED * k;
    moonAngle += MOON_SPEED * k;
    beltAngle = (beltAngle + BELT_SPEED * k) % 360;
    render();
  }
  requestAnimationFrame(frame);
}

/* ---------- Info panel ---------- */
function select(data, el) {
  document.querySelectorAll('.body.selected').forEach(n => n.classList.remove('selected'));
  (el || data.el).classList.add('selected');

  const rows = [['Diameter', data.diameter]];
  if (data.distance) rows.push(['From Sun', data.distance]);
  if (data.year)     rows.push(['Year', data.year]);

  info.replaceChildren();
  const h = document.createElement('h2');
  h.textContent = data.name;
  const dl = document.createElement('dl');
  rows.forEach(([k, v]) => {
    const dt = document.createElement('dt'); dt.textContent = k;
    const dd = document.createElement('dd'); dd.textContent = v;
    dl.append(dt, dd);
  });
  const fact = document.createElement('p');
  fact.className = 'fact';
  fact.textContent = data.fact;
  info.append(h, dl, fact);
}

/* ---------- Controls ---------- */
function syncPlayButton() {
  playBtn.textContent = paused ? 'Play' : 'Pause';
  playBtn.setAttribute('aria-pressed', String(paused));
}

playBtn.addEventListener('click', () => { paused = !paused; syncPlayButton(); });

speedInput.addEventListener('input', () => {
  speed = Number(speedInput.value);
  speedOut.textContent = `${speed}×`;
});

labelsBox.addEventListener('change', () => root.classList.toggle('show-labels', labelsBox.checked));
orbitsBox.addEventListener('change', () => root.classList.toggle('hide-orbits', !orbitsBox.checked));

/* ---------- Start ---------- */
root.classList.toggle('show-labels', labelsBox.checked);
root.classList.toggle('hide-orbits', !orbitsBox.checked);
buildStars();
buildBelt();
syncPlayButton();
render();
requestAnimationFrame(frame);
