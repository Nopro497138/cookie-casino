
"use client";
import { useEffect, useRef } from "react";

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let raf: number;

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);

    // Stars
    const stars = Array.from({length:150}, () => ({
      x: Math.random()*canvas.width, y: Math.random()*canvas.height,
      r: Math.random()*1.5+0.2, a: Math.random(), da: (Math.random()-0.5)*0.005,
    }));

    // Moving orbs
    const orbs = [
      {x:0.25,y:0.3,r:300,c:"rgba(139,92,246,",speed:0.00008},
      {x:0.75,y:0.7,r:250,c:"rgba(245,158,11,",speed:0.00006},
      {x:0.5,y:0.5,r:200,c:"rgba(99,102,241,",speed:0.0001},
    ];
    let t = 0;

    const draw = () => {
      t++;
      ctx.clearRect(0,0,canvas.width,canvas.height);
      ctx.fillStyle="#08080f";
      ctx.fillRect(0,0,canvas.width,canvas.height);

      // Orbs
      orbs.forEach((o,i) => {
        const ox = (o.x + Math.sin(t*o.speed*(i+1))*0.1)*canvas.width;
        const oy = (o.y + Math.cos(t*o.speed*(i+1))*0.08)*canvas.height;
        const grad = ctx.createRadialGradient(ox,oy,0,ox,oy,o.r);
        grad.addColorStop(0,o.c+"0.12)");
        grad.addColorStop(1,o.c+"0)");
        ctx.fillStyle=grad;
        ctx.beginPath(); ctx.arc(ox,oy,o.r,0,Math.PI*2); ctx.fill();
      });

      // Grid
      ctx.strokeStyle="rgba(139,92,246,0.04)";
      ctx.lineWidth=1;
      const gs=80;
      for(let x=0;x<canvas.width;x+=gs){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,canvas.height);ctx.stroke();}
      for(let y=0;y<canvas.height;y+=gs){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(canvas.width,y);ctx.stroke();}

      // Stars
      stars.forEach(s => {
        s.a += s.da;
        if(s.a<0||s.a>1) s.da*=-1;
        ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
        ctx.fillStyle=`rgba(255,255,255,${s.a*0.7})`; ctx.fill();
      });

      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" style={{zIndex:0}} />;
}
