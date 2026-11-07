import React, { useEffect, useRef } from 'react';
import type { BackgroundEffect, CursorTrailEffect } from '../types/profile';

export const BackgroundShaderCanvas: React.FC<{
  effect: BackgroundEffect;
  contained?: boolean;
}> = ({ effect, contained = false }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (effect === 'none' || effect === 'blurred') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let width = 0;
    let height = 0;
    let pointerOffsetX = 0;
    let pointerOffsetY = 0;

    const resize = () => {
      const parent = canvas.parentElement;
      width = contained && parent ? parent.clientWidth : window.innerWidth;
      height = contained && parent ? parent.clientHeight : window.innerHeight;
      canvas.width = Math.max(1, width);
      canvas.height = Math.max(1, height);
    };
    resize();
    window.addEventListener('resize', resize);

    const onPointerMove = (e: MouseEvent) => {
      pointerOffsetX = (e.clientX / Math.max(1, window.innerWidth) - 0.5) * 2;
      pointerOffsetY = (e.clientY / Math.max(1, window.innerHeight) - 0.5) * 2;
    };
    window.addEventListener('mousemove', onPointerMove);

    const drops = Array.from(
      { length: effect === 'rain' ? 120 : effect === 'snow' ? 88 : 115 },
      () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        depth: 0.4 + Math.random() * 0.6,
        speed: effect === 'rain' ? 9 + Math.random() * 8 : 0.6 + Math.random() * 1.4,
        len: 12 + Math.random() * 18,
        radius: 1 + Math.random() * 2.4,
        phase: Math.random() * Math.PI * 2,
      })
    );

    let frame = 0;
    const render = () => {
      frame += 1;
      ctx.clearRect(0, 0, width, height);

      if (effect === 'rain') {
        ctx.strokeStyle = 'rgba(242, 236, 225, 0.25)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        const windX = -1.6 + pointerOffsetX * 3.4;
        for (const d of drops) {
          const dx = windX * d.depth;
          ctx.moveTo(d.x, d.y);
          ctx.lineTo(d.x + dx * 1.5, d.y + d.len * d.depth);
          d.y += d.speed * d.depth;
          d.x += dx;
          if (d.y > height) {
            d.y = -22;
            d.x = Math.random() * (width + 120) - 60;
          }
        }
        ctx.stroke();
      } else if (effect === 'snow') {
        ctx.fillStyle = 'rgba(242, 236, 225, 0.58)';
        for (const s of drops) {
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
          ctx.fill();
          s.y += s.speed;
          s.x += Math.sin(frame * 0.015 + s.phase) * 0.45 + pointerOffsetX * 0.6 * s.depth;
          if (s.y > height) {
            s.y = -8;
            s.x = Math.random() * width;
          }
        }
      } else if (effect === 'stars') {
        for (const st of drops) {
          const alpha = 0.22 + 0.58 * Math.abs(Math.sin(frame * 0.018 + st.phase));
          ctx.fillStyle = `rgba(242, 236, 225, ${alpha.toFixed(2)})`;
          const px = st.x + pointerOffsetX * 14 * st.depth;
          const py = st.y + pointerOffsetY * 10 * st.depth;
          ctx.beginPath();
          ctx.arc(px, py, st.radius * 0.68, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (effect === 'vhs-grain') {
        ctx.fillStyle = 'rgba(12, 10, 8, 0.18)';
        for (let y = 0; y < height; y += 4) {
          ctx.fillRect(0, y, width, 1);
        }
        const scanY = ((frame * 1.8) % (height + 80)) - 40;
        const grad = ctx.createLinearGradient(0, scanY - 25, 0, scanY + 25);
        grad.addColorStop(0, 'rgba(224, 79, 51, 0)');
        grad.addColorStop(0.5, 'rgba(224, 79, 51, 0.045)');
        grad.addColorStop(1, 'rgba(224, 79, 51, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, scanY - 25, width, 50);

        ctx.fillStyle = 'rgba(242, 236, 225, 0.14)';
        for (let i = 0; i < 36; i++) {
          ctx.fillRect(Math.random() * width, Math.random() * height, 1.5, 1.5);
        }
      }

      animId = window.requestAnimationFrame(render);
    };

    animId = window.requestAnimationFrame(render);
    return () => {
      window.cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onPointerMove);
    };
  }, [effect, contained]);

  if (effect === 'none' || effect === 'blurred') return null;

  return (
    <canvas
      ref={canvasRef}
      className="dossier-shader-canvas"
      style={contained ? { position: 'absolute' } : undefined}
    />
  );
};

interface TrailParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
}

export const CursorTrailCanvas: React.FC<{
  trail: CursorTrailEffect;
  accentColor: string;
  contained?: boolean;
}> = ({ trail, accentColor, contained = false }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (trail === 'none') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    const particles: TrailParticle[] = [];

    const resize = () => {
      const parent = canvas.parentElement;
      canvas.width = contained && parent ? parent.clientWidth : window.innerWidth;
      canvas.height = contained && parent ? parent.clientHeight : window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (x < 0 || y < 0 || x > canvas.width || y > canvas.height) return;

      const count = trail === 'fairy-dust' ? 2 : 1;
      for (let i = 0; i < count; i++) {
        particles.push({
          x,
          y,
          vx: (Math.random() - 0.5) * (trail === 'ghost-cursor' ? 0.2 : 1.4),
          vy:
            trail === 'snowflakes'
              ? 0.8 + Math.random() * 1.1
              : trail === 'bubbles'
              ? -0.9 - Math.random() * 1.1
              : (Math.random() - 0.5) * 1.2,
          life: 0,
          maxLife: trail === 'ghost-cursor' ? 20 : 34,
          size:
            trail === 'bubbles'
              ? 4 + Math.random() * 5
              : trail === 'ghost-cursor'
              ? 7
              : 2 + Math.random() * 2.5,
        });
      }
      if (particles.length > 90) particles.splice(0, particles.length - 90);
    };

    window.addEventListener('mousemove', onMove);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life += 1;
        p.x += p.vx;
        p.y += p.vy;
        if (p.life >= p.maxLife) {
          particles.splice(i, 1);
          continue;
        }
        const alpha = 1 - p.life / p.maxLife;
        ctx.save();
        ctx.globalAlpha = alpha * 0.82;
        if (trail === 'fairy-dust') {
          ctx.fillStyle = p.life % 2 === 0 ? accentColor : '#f2ece1';
          ctx.translate(p.x, p.y);
          ctx.rotate(p.life * 0.15);
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        } else if (trail === 'snowflakes') {
          ctx.fillStyle = '#f2ece1';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else if (trail === 'bubbles') {
          ctx.strokeStyle = accentColor;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.stroke();
        } else if (trail === 'ghost-cursor') {
          ctx.strokeStyle = '#f2ece1';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          ctx.fillStyle = accentColor;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 0.85, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
      animId = window.requestAnimationFrame(render);
    };

    animId = window.requestAnimationFrame(render);
    return () => {
      window.cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
    };
  }, [trail, accentColor, contained]);

  if (trail === 'none') return null;

  return (
    <canvas
      ref={canvasRef}
      className="dossier-cursor-canvas"
      style={contained ? { position: 'absolute' } : undefined}
    />
  );
};
