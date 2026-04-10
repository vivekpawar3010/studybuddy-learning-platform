import React, { memo, useMemo } from 'react';
import { useTheme } from '../contexts/ThemeContext';

/* ─────────────────────────────────────────────────────────────────────────────
   BASIC — Drifting grey micro-particles on white. Ultra-subtle, clean.
───────────────────────────────────────────────────────────────────────────── */
const ParticlesBg = memo(() => {
  const pts = useMemo(() =>
    Array.from({ length: 60 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      r: Math.random() * 3 + 1,
      dur: Math.random() * 20 + 15,
      delay: -(Math.random() * 20),
      dx: (Math.random() - 0.5) * 30,
      dy: (Math.random() - 0.5) * 30,
    })), []);

  return (
    <div aria-hidden className="fixed inset-0 -z-10 overflow-hidden pointer-events-none"
      style={{ background: '#f8fafc' }}>
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="ptGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* Subtle background tint */}
        <ellipse cx="80%" cy="20%" rx="25%" ry="25%" fill="url(#ptGrad)" />
        <ellipse cx="15%" cy="75%" rx="20%" ry="20%" fill="url(#ptGrad)" />

        {pts.map(p => (
          <circle key={p.id} r={p.r} fill="#94a3b8" opacity="0">
            <animateMotion
              dur={`${p.dur}s`} begin={`${p.delay}s`} repeatCount="indefinite"
              path={`M${p.x}vw,${p.y}vh c${p.dx}px,${p.dy}px ${-p.dx}px,${p.dy}px 0,0`}
            />
            <animate attributeName="opacity" values="0;0.35;0.35;0"
              dur={`${p.dur}s`} begin={`${p.delay}s`} repeatCount="indefinite" />
          </circle>
        ))}
      </svg>
      <style>{`
        @keyframes ptDrift {}
      `}</style>
    </div>
  );
});

/* ─────────────────────────────────────────────────────────────────────────────
   LIGHT — Soft drifting colour orbs on blue-white gradient.
───────────────────────────────────────────────────────────────────────────── */
const OrbsBg = memo(() => (
  <div aria-hidden className="fixed inset-0 -z-10 overflow-hidden pointer-events-none"
    style={{ background: 'linear-gradient(135deg,#f0f4ff 0%,#e8f0fe 40%,#f5f0ff 100%)' }}>

    {/* Orb 1 — indigo */}
    <div style={{
      position:'absolute', top:'-10%', left:'-10%',
      width:'50vw', height:'50vw', borderRadius:'50%',
      background:'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)',
      filter:'blur(60px)', animation:'orbFloat1 18s ease-in-out infinite',
    }} />
    {/* Orb 2 — sky blue */}
    <div style={{
      position:'absolute', top:'20%', right:'-15%',
      width:'55vw', height:'55vw', borderRadius:'50%',
      background:'radial-gradient(circle, rgba(56,189,248,0.15) 0%, transparent 70%)',
      filter:'blur(70px)', animation:'orbFloat2 24s ease-in-out infinite',
    }} />
    {/* Orb 3 — violet */}
    <div style={{
      position:'absolute', bottom:'-5%', left:'25%',
      width:'45vw', height:'45vw', borderRadius:'50%',
      background:'radial-gradient(circle, rgba(167,139,250,0.14) 0%, transparent 70%)',
      filter:'blur(55px)', animation:'orbFloat3 20s ease-in-out infinite',
    }} />
    {/* Orb 4 — emerald tiny accent */}
    <div style={{
      position:'absolute', top:'50%', left:'60%',
      width:'30vw', height:'30vw', borderRadius:'50%',
      background:'radial-gradient(circle, rgba(52,211,153,0.1) 0%, transparent 70%)',
      filter:'blur(40px)', animation:'orbFloat4 28s ease-in-out infinite',
    }} />

    <style>{`
      @keyframes orbFloat1 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(6vw,4vh)} }
      @keyframes orbFloat2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-8vw,6vh) scale(1.05)} }
      @keyframes orbFloat3 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-5vw,-5vh) scale(1.08)} }
      @keyframes orbFloat4 { 0%,100%{transform:translate(0,0) rotate(0deg)} 50%{transform:translate(4vw,-4vh) rotate(20deg)} }
    `}</style>
  </div>
));

/* ─────────────────────────────────────────────────────────────────────────────
   DARK — Glowing dot-grid on deep slate background with slow pulse.
───────────────────────────────────────────────────────────────────────────── */
const DarkGridBg = memo(() => {
  const glows = useMemo(() => [
    { cx:'20%', cy:'30%', r:'25%', color:'rgba(99,102,241,0.12)', dur:'16s' },
    { cx:'75%', cy:'15%', r:'22%', color:'rgba(139,92,246,0.10)', dur:'20s' },
    { cx:'60%', cy:'70%', r:'28%', color:'rgba(59,130,246,0.10)', dur:'24s' },
    { cx:'10%', cy:'80%', r:'20%', color:'rgba(99,102,241,0.08)', dur:'18s' },
  ], []);

  return (
    <div aria-hidden className="fixed inset-0 -z-10 overflow-hidden pointer-events-none"
      style={{ background: 'linear-gradient(160deg,#0f172a 0%,#1e293b 60%,#0f172a 100%)' }}>

      {/* Dot grid */}
      <div style={{
        position:'absolute', inset:0,
        backgroundImage:'radial-gradient(circle, rgba(148,163,184,0.15) 1px, transparent 1px)',
        backgroundSize:'40px 40px',
      }} />

      {/* Slow glow blobs */}
      {glows.map((g, i) => (
        <div key={i} style={{
          position:'absolute',
          left: g.cx, top: g.cy,
          width: g.r, height: g.r,
          transform: 'translate(-50%,-50%)',
          borderRadius:'50%',
          background:`radial-gradient(circle, ${g.color} 0%, transparent 70%)`,
          filter:'blur(40px)',
          animation:`darkPulse${i+1} ${g.dur} ease-in-out infinite`,
        }} />
      ))}

      <style>{`
        @keyframes darkPulse1 { 0%,100%{opacity:0.6;transform:translate(-50%,-50%) scale(1)} 50%{opacity:1;transform:translate(-50%,-50%) scale(1.3)} }
        @keyframes darkPulse2 { 0%,100%{opacity:0.5;transform:translate(-50%,-50%) scale(1)} 50%{opacity:0.9;transform:translate(-50%,-50%) scale(1.2)} }
        @keyframes darkPulse3 { 0%,100%{opacity:0.6;transform:translate(-50%,-50%) scale(1)} 50%{opacity:1;transform:translate(-50%,-50%) scale(1.25)} }
        @keyframes darkPulse4 { 0%,100%{opacity:0.4;transform:translate(-50%,-50%) scale(1)} 50%{opacity:0.8;transform:translate(-50%,-50%) scale(1.15)} }
      `}</style>
    </div>
  );
});

/* ─────────────────────────────────────────────────────────────────────────────
   AURORA — Emerald & violet northern lights on deep violet-black
───────────────────────────────────────────────────────────────────────────── */
const AuroraBg = memo(() => (
  <div aria-hidden className="fixed inset-0 -z-10 overflow-hidden pointer-events-none"
    style={{ background: 'linear-gradient(160deg,#08061c 0%,#0c0a24 45%,#040a10 100%)' }}>
    {/* Emerald blob — primary aurora wave */}
    <div style={{ position:'absolute',top:'-15%',left:'-10%',width:'70vw',height:'70vw',borderRadius:'50%',background:'radial-gradient(circle, rgba(52,211,153,0.30) 0%, rgba(16,185,129,0.12) 45%, transparent 70%)',animation:'auroraMove1 16s ease-in-out infinite',filter:'blur(75px)' }} />
    {/* Violet blob */}
    <div style={{ position:'absolute',top:'5%',right:'-15%',width:'65vw',height:'65vw',borderRadius:'50%',background:'radial-gradient(circle, rgba(139,92,246,0.28) 0%, rgba(109,40,217,0.10) 45%, transparent 70%)',animation:'auroraMove2 20s ease-in-out infinite',filter:'blur(85px)' }} />
    {/* Teal accent stripe */}
    <div style={{ position:'absolute',bottom:'-8%',left:'15%',width:'65vw',height:'65vw',borderRadius:'50%',background:'radial-gradient(circle, rgba(45,212,191,0.20) 0%, transparent 70%)',animation:'auroraMove3 24s ease-in-out infinite',filter:'blur(65px)' }} />
    {/* Lime green highlight */}
    <div style={{ position:'absolute',top:'35%',left:'25%',width:'45vw',height:'45vw',borderRadius:'50%',background:'radial-gradient(circle, rgba(134,239,172,0.15) 0%, transparent 70%)',animation:'auroraMove4 28s ease-in-out infinite',filter:'blur(55px)' }} />
    <style>{`
      @keyframes auroraMove1 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(7vw,4vh) scale(1.08)} 66%{transform:translate(-4vw,10vh) scale(0.96)} }
      @keyframes auroraMove2 { 0%,100%{transform:translate(0,0) scale(1)} 40%{transform:translate(-9vw,-7vh) scale(1.06)} 70%{transform:translate(5vw,9vh) scale(0.92)} }
      @keyframes auroraMove3 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-7vw,-5vh) scale(1.12)} }
      @keyframes auroraMove4 { 0%,100%{transform:translate(0,0) scale(1) rotate(0deg)} 50%{transform:translate(9vw,4vh) scale(1.08) rotate(12deg)} }
    `}</style>
  </div>
));

/* ─────────────────────────────────────────────────────────────────────────────
   NEBULA — Deep-space star field with nebula clouds.
───────────────────────────────────────────────────────────────────────────── */
const NebulaBg = memo(() => {
  const stars = useMemo(() =>
    Array.from({ length: 120 }, (_, i) => ({
      id: i, x: Math.random()*100, y: Math.random()*100,
      size: Math.random()*2.5+0.5, delay: Math.random()*5, dur: Math.random()*3+2,
    })), []);

  return (
    <div aria-hidden className="fixed inset-0 -z-10 overflow-hidden pointer-events-none"
      style={{ background: 'linear-gradient(160deg,#020617 0%,#0a0a1a 40%,#0f0028 100%)' }}>
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        {stars.map(s => (
          <circle key={s.id} cx={`${s.x}%`} cy={`${s.y}%`} r={s.size} fill="white" opacity="0">
            <animate attributeName="opacity" values="0;0.8;0" dur={`${s.dur}s`} begin={`${s.delay}s`} repeatCount="indefinite" />
          </circle>
        ))}
      </svg>
      <div style={{ position:'absolute',top:'-10%',right:'-5%',width:'55vw',height:'55vw',borderRadius:'50%',background:'radial-gradient(circle, rgba(99,102,241,0.4) 0%, rgba(139,92,246,0.15) 40%, transparent 70%)',filter:'blur(60px)',animation:'nebulaFloat1 20s ease-in-out infinite' }} />
      <div style={{ position:'absolute',bottom:'-5%',left:'-10%',width:'60vw',height:'60vw',borderRadius:'50%',background:'radial-gradient(circle, rgba(14,165,233,0.3) 0%, rgba(6,182,212,0.1) 40%, transparent 70%)',filter:'blur(80px)',animation:'nebulaFloat2 25s ease-in-out infinite' }} />
      <div style={{ position:'absolute',top:'30%',left:'20%',width:'40vw',height:'40vw',borderRadius:'50%',background:'radial-gradient(circle, rgba(217,70,239,0.2) 0%, transparent 70%)',filter:'blur(50px)',animation:'nebulaFloat3 30s ease-in-out infinite' }} />
      <style>{`
        @keyframes nebulaFloat1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-6vw,4vh) scale(1.1)} }
        @keyframes nebulaFloat2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(8vw,-5vh) scale(1.05)} }
        @keyframes nebulaFloat3 { 0%,100%{transform:translate(0,0) rotate(0deg)} 50%{transform:translate(-5vw,6vh) rotate(20deg)} }
      `}</style>
    </div>
  );
});

/* ─────────────────────────────────────────────────────────────────────────────
   GEOMETRIC — Floating 3D wireframe shapes with perspective on light bg.
───────────────────────────────────────────────────────────────────────────── */
const GeometricBg = memo(() => {
  const shapes = [
    { size:120, top:'5%',  left:'5%',  dur:20, delay:0, color:'rgba(99,102,241,0.2)'  },
    { size:80,  top:'60%', left:'8%',  dur:28, delay:3, color:'rgba(59,130,246,0.18)' },
    { size:160, top:'10%', right:'5%', dur:24, delay:1, color:'rgba(139,92,246,0.18)' },
    { size:60,  top:'70%', right:'10%',dur:18, delay:5, color:'rgba(6,182,212,0.20)'  },
    { size:100, top:'40%', left:'50%', dur:32, delay:2, color:'rgba(236,72,153,0.12)' },
    { size:50,  top:'20%', left:'35%', dur:15, delay:4, color:'rgba(99,102,241,0.15)' },
  ];
  return (
    <div aria-hidden className="fixed inset-0 -z-10 overflow-hidden pointer-events-none"
      style={{ background:'linear-gradient(135deg,#f8faff 0%,#eef2ff 50%,#f0f9ff 100%)' }}>
      <div style={{ position:'absolute',inset:0,backgroundImage:'linear-gradient(rgba(99,102,241,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,0.05) 1px,transparent 1px)',backgroundSize:'60px 60px' }} />
      {shapes.map((s,i) => (
        <div key={i} style={{
          position:'absolute', top:s.top, left:(s as any).left, right:(s as any).right,
          width:s.size, height:s.size, border:`2px solid ${s.color}`,
          borderRadius: i%3===0?'30%':i%3===1?'50%':'8px',
          animation:`geoFloat${(i%3)+1} ${s.dur}s ease-in-out ${s.delay}s infinite`,
          transform:'perspective(600px) rotateX(30deg) rotateY(20deg)',
        }} />
      ))}
      <style>{`
        @keyframes geoFloat1 { 0%,100%{transform:perspective(600px) rotateX(30deg) rotateY(20deg) translateY(0)} 50%{transform:perspective(600px) rotateX(50deg) rotateY(45deg) translateY(-20px)} }
        @keyframes geoFloat2 { 0%,100%{transform:perspective(600px) rotateX(-20deg) rotateY(30deg) translateY(0)} 50%{transform:perspective(600px) rotateX(10deg) rotateY(-30deg) translateY(-15px) scale(1.05)} }
        @keyframes geoFloat3 { 0%,100%{transform:perspective(600px) rotateX(40deg) rotateY(-10deg) translateY(0)} 50%{transform:perspective(600px) rotateX(-10deg) rotateY(50deg) translateY(-25px) scale(0.95)} }
      `}</style>
    </div>
  );
});

/* ─────────────────────────────────────────────────────────────────────────────
   Router — picks the right background for the active theme
───────────────────────────────────────────────────────────────────────────── */
const AppBackground: React.FC = () => {
  const { meta } = useTheme();
  switch (meta.bg) {
    case 'particles': return <ParticlesBg />;
    case 'orbs':      return <OrbsBg />;
    case 'darkgrid':  return <DarkGridBg />;
    case 'aurora':    return <AuroraBg />;
    case 'nebula':    return <NebulaBg />;
    case 'geometric': return <GeometricBg />;
    default:          return null;
  }
};

export default AppBackground;
