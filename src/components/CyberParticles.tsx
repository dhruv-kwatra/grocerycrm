"use client";

import { useEffect, useRef } from "react";

// Ambient particle field behind the hero and the login panel, ported from the
// newui prototype. Plain 2D canvas — no three.js, no WebGL, nothing added to
// package.json. It sizes itself to its offset parent, so it needs a positioned
// ancestor to fill.
//
// It runs an rAF loop for as long as it's mounted, so it honours
// prefers-reduced-motion by painting one static frame and stopping: the effect
// is decorative, and a permanent drifting animation is exactly what that
// setting is asking us not to do.
export function CyberParticles({
  count = 35,
  color = "rgba(16, 185, 129, 0.35)",
  lineDistance = 120,
}: {
  count?: number;
  color?: string;
  lineDistance?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let animationFrameId = 0;

    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener("resize", handleResize);

    const particles = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25 - 0.05, // gentle upward drift
      radius: Math.random() * 2 + 1,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: Math.random() * 0.015 + 0.008,
    }));

    let mouseX = width / 2;
    let mouseY = height / 2;
    let targetMouseX = mouseX;
    let targetMouseY = mouseY;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      targetMouseX = e.clientX - rect.left;
      targetMouseY = e.clientY - rect.top;
    };
    window.addEventListener("mousemove", handleMouseMove);

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const draw = () => {
      mouseX += (targetMouseX - mouseX) * 0.03;
      mouseY += (targetMouseY - mouseY) * 0.03;

      ctx.clearRect(0, 0, width, height);

      const glow = ctx.createRadialGradient(mouseX, mouseY, 10, mouseX, mouseY, 450);
      glow.addColorStop(0, "rgba(16, 185, 129, 0.04)");
      glow.addColorStop(0.6, "rgba(15, 23, 42, 0.02)");
      glow.addColorStop(1, "transparent");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.hypot(dx, dy);
          if (dist < lineDistance) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(16, 185, 129, ${(1 - dist / lineDistance) * 0.12})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      for (const p of particles) {
        const mdx = mouseX - p.x;
        const mdy = mouseY - p.y;
        const mdist = Math.hypot(mdx, mdy);
        // Guard the divide: a particle sitting exactly under the cursor gives
        // mdist 0, and x/0 pushes NaN into the position it never recovers from.
        if (mdist < 180 && mdist > 0) {
          const force = (180 - mdist) / 180;
          p.vx += (mdx / mdist) * force * 0.005;
          p.vy += (mdy / mdist) * force * 0.005;
        }

        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.99;
        p.vy *= 0.99;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        p.pulse += p.pulseSpeed;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.5, p.radius + Math.sin(p.pulse) * 0.4), 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = "#10B981";
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      if (!still) animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [count, color, lineDistance]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0 }}
    />
  );
}
