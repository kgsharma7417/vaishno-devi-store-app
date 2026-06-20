/**
 * Pure JavaScript confetti — no external package needed!
 * Launches colorful confetti particles on order success.
 */

const COLORS = [
  "#2874f0", // fk-blue
  "#ff9f00", // fk-yellow
  "#388e3c", // fk-green
  "#ff6161", // fk-red
  "#e91e8c", // pink
  "#9c27b0", // purple
  "#ff5722", // orange
];

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function createParticle(canvas, x, y) {
  const ctx = canvas.getContext("2d");
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  const size = randomBetween(6, 12);
  const angle = randomBetween(0, Math.PI * 2);
  const velocity = randomBetween(3, 9);
  const gravity = 0.15;
  const friction = 0.98;
  const isRect = Math.random() > 0.5;

  let vx = Math.cos(angle) * velocity;
  let vy = Math.sin(angle) * velocity - randomBetween(2, 5);
  let alpha = 1;
  let posX = x;
  let posY = y;
  let rotation = randomBetween(0, Math.PI * 2);

  return {
    update() {
      vx *= friction;
      vy += gravity;
      posX += vx;
      posY += vy;
      alpha -= 0.012;
      rotation += 0.05;
    },
    draw() {
      ctx.save();
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.fillStyle = color;
      ctx.translate(posX, posY);
      ctx.rotate(rotation);
      if (isRect) {
        ctx.fillRect(-size / 2, -size / 4, size, size / 2);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    },
    isDone() {
      return alpha <= 0 || posY > canvas.height + 20;
    },
  };
}

export function launchConfetti() {
  // Create canvas overlay
  const canvas = document.createElement("canvas");
  canvas.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 9999;
  `;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);

  const particles = [];
  const bursts = 3;
  let burstCount = 0;
  let frame = 0;

  function addBurst() {
    const centerX = canvas.width / 2;
    const centerY = canvas.height * 0.3;
    for (let i = 0; i < 60; i++) {
      particles.push(createParticle(canvas, centerX + randomBetween(-50, 50), centerY));
    }
  }

  function animate() {
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Add bursts at intervals
    if (frame % 20 === 0 && burstCount < bursts) {
      addBurst();
      burstCount++;
    }

    // Update and draw particles
    for (let i = particles.length - 1; i >= 0; i--) {
      particles[i].update();
      particles[i].draw();
      if (particles[i].isDone()) {
        particles.splice(i, 1);
      }
    }

    frame++;

    if (particles.length > 0 || burstCount < bursts) {
      requestAnimationFrame(animate);
    } else {
      // Cleanup
      canvas.remove();
    }
  }

  animate();
}
