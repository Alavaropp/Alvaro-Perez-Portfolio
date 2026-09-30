const canvas = document.getElementById('waves-canvas');
const ctx = canvas.getContext('2d');

let width, height;

function resize() {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// --- PARTICLES ---
let particles = [];
const particleCount = 80;
const particleColors = [
  'rgba(255, 255, 255, 0.4)',
  'rgba(255, 255, 255, 0.15)',
  'rgba(96, 165, 250, 0.3)', // blue-400
  'rgba(129, 140, 248, 0.3)' // indigo-400
];

function initParticles() {
  particles = [];
  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.5 + 0.5,
      sx: (Math.random() - 0.5) * 0.4,
      sy: (Math.random() - 0.5) * 0.4 - 0.2, // tend to float upwards slightly
      color: particleColors[Math.floor(Math.random() * particleColors.length)]
    });
  }
}
initParticles();

// --- WAVES ---
const waves = [
  { y: 0.85, length: 0.002, amplitude: 60, speed: 0.005, color: 'rgba(255, 255, 255, 0.15)' },
  { y: 0.88, length: 0.003, amplitude: 80, speed: 0.006, color: 'rgba(96, 165, 250, 0.15)' }, // blue-400
  { y: 0.92, length: 0.0015, amplitude: 90, speed: 0.004, color: 'rgba(255, 255, 255, 0.1)' },
  { y: 0.95, length: 0.0025, amplitude: 70, speed: 0.0075, color: 'rgba(129, 140, 248, 0.15)' } // indigo-400
];

let time = 0;

function animate() {
  ctx.clearRect(0, 0, width, height);
  
  // 1. Draw and update particles
  ctx.shadowBlur = 3;
  particles.forEach(p => {
    ctx.shadowColor = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.fill();
    
    p.x += p.sx;
    p.y += p.sy;
    
    // wrap around
    if (p.x < 0) p.x = width;
    if (p.x > width) p.x = 0;
    if (p.y < 0) p.y = height;
    if (p.y > height) p.y = 0;
  });
  
  // 2. Draw WAVES
  waves.forEach((wave, index) => {
    ctx.beginPath();
    ctx.moveTo(0, height * wave.y);
    
    for (let x = 0; x < width; x += 10) {
      // Calculate sine wave with some complex movement
      const dx = x * wave.length;
      // Add a secondary sine wave for more natural movement
      const dy = Math.sin(dx + time * wave.speed + index) * wave.amplitude + 
                 Math.sin(dx * 0.5 - time * (wave.speed * 0.5)) * (wave.amplitude * 0.3);
      
      ctx.lineTo(x, height * wave.y + dy);
    }
    
    ctx.strokeStyle = wave.color;
    ctx.lineWidth = 2;
    // Add glowing effect
    ctx.shadowBlur = 10;
    ctx.shadowColor = wave.color;
    ctx.stroke();
  });
  
  time++;
  requestAnimationFrame(animate);
}

animate();
