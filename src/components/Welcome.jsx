import React, { useRef, useState, useCallback } from 'react';
import {
  motion, AnimatePresence, MotionConfig,
  useMotionValue, useSpring, useScroll, useTransform,
} from 'framer-motion';
import {
  Scissors, Upload, Video, Play, Pause, ChevronRight, ShieldCheck,
  ArrowRight, RotateCcw, Check,
} from 'lucide-react';
import { useEditor } from '../context/EditorContext';
import { isVideoFile } from '../lib/utils';

void motion; // referenced as <motion.*> throughout (JSX member use)

/* ==========================================================================
   Brand motion identity — per the motion-design skill (LottieFiles, MIT)
   Personality: Corporate UI (decisive, no overshoot) + Playful illustrations
   Signature easing: MD3 Emphasized. Palette: quick / standard / slow.
   Entrance pattern: y+opacity, micro-cascade staggers, total budget < 500ms.
   ========================================================================== */
const EASE = [0.05, 0.7, 0.1, 1];
const DUR = { quick: 0.14, standard: 0.28, slow: 0.55 };
const SPRING_SOFT = { type: 'spring', stiffness: 170, damping: 20 };
const SPRING_PLAY = { type: 'spring', stiffness: 320, damping: 17 };

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: DUR.standard, ease: EASE, delay: Math.min(i * 0.06, 0.42) },
  }),
};

/* ---------------------------------- data ---------------------------------- */

const TICKER = [
  'edit text, not timelines', 'whisper transcripts', 'ffmpeg in-browser',
  'zero uploads', 'click a word to seek', 'snip filler words', 'srt + vtt included',
  'space to play', 'private by design',
];

const PLAY_WORDS = [
  'Welcome', 'back', 'to', 'the', 'show,', 'today', 'we', 'edit', 'video',
  'like', 'a', 'doc.', 'Uhm,', 'uhm…', 'delete', 'me.',
];
const PLAY_CUT_DEFAULT = new Set([12, 13, 14, 15]);

// Deterministic waveform heights (no randomness — stable across renders)
const BARS = Array.from({ length: 34 }, (_, i) => 26 + Math.round(Math.abs(Math.sin(i * 1.7)) * 74));

const STATS = [
  { n: '100%', label: 'runs on-device' },
  { n: '0', label: 'files uploaded' },
  { n: '0', label: 'installs needed' },
  { n: '≈40 min', label: 'saved per cut' },
];

/* ------------------------------- custom SVGs ------------------------------ */
/* Hand-drawn line icons in ink + ember. No stock, no emoji. */

function Spark({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="currentColor" aria-hidden="true">
      <path d="M50 0 C54 34 66 46 100 50 C66 54 54 66 50 100 C46 66 34 54 0 50 C34 46 46 34 50 0 Z" />
    </svg>
  );
}

function Scribble({ className = '' }) {
  return (
    <svg viewBox="0 0 220 26" fill="none" className={className} aria-hidden="true" preserveAspectRatio="none">
      <path d="M5 18 C 60 8, 150 8, 215 14" stroke="#FF5A00" strokeWidth="8" strokeLinecap="round" />
    </svg>
  );
}

function DoodleArrow({ className = '' }) {
  return (
    <svg viewBox="0 0 120 64" fill="none" className={className} aria-hidden="true">
      <path d="M8 8 C 52 6, 92 16, 102 48" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="1 7" />
      <path d="M94 42 L103 50 L95 56" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconTranscript({ className = 'h-6 w-6' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className={className} aria-hidden="true">
      <path d="M4 6 H13 M4 10 H18 M4 14 H12 M4 18 H16" />
      <rect x="16.5" y="15.5" width="4" height="4" rx="1" fill="#FF5A00" stroke="none" />
    </svg>
  );
}

function IconSnip({ className = 'h-6 w-6' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className={className} aria-hidden="true">
      <path d="M12 3 V21" strokeDasharray="3 3" />
      <circle cx="7.5" cy="8" r="2.2" />
      <circle cx="7.5" cy="16" r="2.2" />
      <path d="M9 9.5 L15 15 M9 14.5 L15 9" stroke="#FF5A00" />
    </svg>
  );
}

function IconSeek({ className = 'h-6 w-6' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M6 3.5 L18 11 L11.5 12.5 L9.5 19 Z" />
      <path d="M13.5 15.5 L17 19" stroke="#FF5A00" strokeLinecap="round" />
    </svg>
  );
}

function IconExport({ className = 'h-6 w-6' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className={className} aria-hidden="true">
      <rect x="3.5" y="7" width="17" height="13" rx="2.5" />
      <path d="M3.5 10.5 H20.5 M7.5 7 V10.5 M16.5 7 V10.5" />
      <path d="M12 11.5 V16 M10 14 L12 16 L14 14" stroke="#FF5A00" />
    </svg>
  );
}

function IconShield({ className = 'h-6 w-6' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M12 3 L19 6 V11 C19 16 16 19.5 12 21 C8 19.5 5 16 5 11 V6 Z" />
      <path d="M9 11.5 L11.5 14 L15.5 9.5" stroke="#FF5A00" />
    </svg>
  );
}

function ReelMark({ className = '' }) {
  return (
    <svg viewBox="0 0 96 96" fill="none" className={className} aria-hidden="true">
      <circle cx="48" cy="48" r="44" stroke="currentColor" strokeWidth="3" strokeDasharray="8 7" />
      <circle cx="48" cy="48" r="30" stroke="currentColor" strokeWidth="2.5" />
      {[0, 60, 120, 180, 240, 300].map((a) => (
        <circle key={a} cx={48 + 30 * Math.cos((a * Math.PI) / 180)} cy={48 + 30 * Math.sin((a * Math.PI) / 180)} r="4.5" fill="#FF5A00" />
      ))}
      <circle cx="48" cy="48" r="7" fill="currentColor" />
    </svg>
  );
}

const FEATURES = [
  {
    Icon: IconTranscript, title: 'Word-level transcripts',
    desc: 'Whisper stamps every single word with a timestamp. Click any word and the playhead teleports there.',
    meta: 'whisper · on-device',
  },
  {
    Icon: IconSnip, title: 'Delete text, cut video',
    desc: 'Strike a sentence and that footage is gone. Scattered cuts merge into clean ranges automatically.',
    meta: 'strike to snip',
  },
  {
    Icon: IconSeek, title: 'Click-to-seek everything',
    desc: 'Transcript, timeline, minimap — every pixel is a time machine. Scrub by reading, not by dragging.',
    meta: 'space = play · ←/→ = 5s',
  },
  {
    Icon: IconExport, title: 'One-click export',
    desc: 'MP4 or WebM, quality presets, 1080p or 720p, live progress — with SRT and VTT subtitles baked in.',
    meta: 'ffmpeg.wasm',
  },
  {
    Icon: IconShield, title: 'Private by design',
    desc: 'Files never leave this tab. Transcription and rendering run locally — offline, after the first load.',
    meta: '0 uploads, ever',
  },
];

const STEPS = [
  { n: '01', chip: '30 seconds', title: 'Drop your footage', desc: 'MP4, MOV, WebM or AVI. Instant preview — no upload bar to stare at.' },
  { n: '02', chip: 'the fun part', title: 'Edit the words', desc: 'Auto-transcribe, nuke the filler, keep the gold. Cuts become ranges by themselves.' },
  { n: '03', chip: 'one click', title: 'Export + flex', desc: 'Pick format, quality, resolution. Walk away with video plus subtitles.' },
];

/* -------------------------------- helpers --------------------------------- */

/** Magnetic hover — spring physics follow the cursor, snap back on leave. */
function Magnetic({ children, strength = 16 }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 200, damping: 15 });
  const sy = useSpring(y, { stiffness: 200, damping: 15 });
  return (
    <motion.span
      style={{ x: sx, y: sy, display: 'inline-block' }}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        x.set(((e.clientX - r.left) / r.width - 0.5) * strength);
        y.set(((e.clientY - r.top) / r.height - 0.5) * strength);
      }}
      onMouseLeave={() => { x.set(0); y.set(0); }}
    >
      {children}
    </motion.span>
  );
}

/**
 * Draggable physics sticker — inertia + elastic snap-back.
 * Outer layer: entrance + drag physics. Inner layer: ambient float loop.
 */
function DragSticker({ constraints, className = '', delay = 0.55, children }) {
  return (
    <motion.div
      initial={{ scale: 0, rotate: -16 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ ...SPRING_PLAY, delay }}
      drag
      dragConstraints={constraints}
      dragElastic={0.45}
      dragMomentum
      whileDrag={{ scale: 1.12, rotate: 5, cursor: 'grabbing' }}
      whileHover={{ scale: 1.05 }}
      className={`absolute z-20 cursor-grab touch-none ${className}`}
    >
      <div className="animate-floaty">{children}</div>
    </motion.div>
  );
}

function SectionHead({ index, tag, title, blurb }) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <motion.p
          variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-60px' }}
          className="flex items-center gap-3 font-body text-xs font-bold uppercase tracking-[0.22em] text-emberdeep"
        >
          <span className="tabular-nums">{index}</span>
          <span className="h-px w-10 bg-ember" />
          <span>{tag}</span>
        </motion.p>
        <motion.h2
          variants={fadeUp} custom={1} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-60px' }}
          className="mt-3 max-w-xl font-display text-4xl font-extrabold leading-[1.02] tracking-[-0.02em] md:text-5xl"
        >
          {title}
        </motion.h2>
      </div>
      {blurb && (
        <motion.p
          variants={fadeUp} custom={2} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-60px' }}
          className="max-w-sm text-[15px] font-medium leading-relaxed text-ink/65"
        >
          {blurb}
        </motion.p>
      )}
    </div>
  );
}

/* --------------------------------- page ----------------------------------- */

export default function Welcome() {
  const { setVideoFile } = useEditor();
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const [shakeKey, setShakeKey] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [cutWords, setCutWords] = useState(PLAY_CUT_DEFAULT);
  const fileRef = useRef(null);
  const heroRef = useRef(null);

  // Scroll-linked parallax: artwork drifts down, glow counter-moves (choreography)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const artY = useTransform(scrollYProgress, [0, 1], [0, 56]);
  const glowY = useTransform(scrollYProgress, [0, 1], [0, -48]);

  const acceptFile = useCallback((file) => {
    if (!file) return;
    if (isVideoFile(file)) {
      setError('');
      setVideoFile(file);
    } else {
      setError('That file is not video — try MP4, MOV, WebM or AVI.');
      setShakeKey((k) => k + 1);
    }
  }, [setVideoFile]);

  const scrollToUpload = () => {
    document.getElementById('welcome-upload')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const togglePlayWord = (i) => {
    setCutWords((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  };

  const keptPct = Math.round(((PLAY_WORDS.length - cutWords.size) / PLAY_WORDS.length) * 100);

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative min-h-screen overflow-x-clip bg-paperlight font-body text-ink antialiased">
        {/* ambient layer: dot grid + ember glow + hairline ring */}
        <div className="landing-dots pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />
        <motion.div style={{ y: glowY }} className="pointer-events-none absolute -top-48 right-[-160px] h-[480px] w-[480px] rounded-full bg-ember/15 blur-[120px]" aria-hidden="true" />
        <motion.div
          animate={{ rotate: 360 }} transition={{ duration: 46, repeat: Infinity, ease: 'linear' }}
          className="pointer-events-none absolute -left-40 top-[420px] hidden h-[380px] w-[380px] rounded-full border border-ink/10 lg:block"
          aria-hidden="true"
        >
          <span className="absolute left-1/2 top-1/2 h-[280px] w-[280px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-ink/10" />
        </motion.div>

        {/* --------------------------------- nav --------------------------------- */}
        <div className="sticky top-4 z-40 mx-auto max-w-6xl px-4">
          <motion.nav
            initial={{ y: -24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: DUR.standard, ease: EASE }}
            className="flex items-center justify-between gap-3 rounded-full border border-ink/10 bg-white/85 py-2 pl-3 pr-2 shadow-[0_12px_40px_-16px_rgba(33,20,7,0.25)] backdrop-blur-xl"
          >
            <a href="#top" className="group flex items-center gap-2.5">
              <motion.span
                whileHover={{ rotate: -10, scale: 1.06 }} whileTap={{ scale: 0.94 }}
                transition={{ duration: DUR.quick }}
                className="grid h-9 w-9 place-items-center rounded-full bg-ember text-white"
              >
                <Scissors className="h-[18px] w-[18px]" />
              </motion.span>
              <span className="font-display text-lg font-extrabold tracking-tight">
                TextEdit Video<span className="text-ember">.</span>
              </span>
              <span className="hidden rounded-full bg-peach px-2.5 py-0.5 font-body text-[10px] font-bold uppercase tracking-[0.14em] text-emberdeep sm:inline-block">
                beta
              </span>
            </a>
            <div className="hidden items-center gap-1 text-sm font-semibold text-ink/70 md:flex">
              {[
                ['Playground', '#welcome-play'],
                ['Features', '#welcome-features'],
                ['Process', '#welcome-how'],

              ].map(([label, href]) => (
                <a key={href} href={href} className="rounded-full px-4 py-2 transition-colors duration-150 hover:bg-peach hover:text-ink">
                  {label}
                </a>
              ))}
            </div>
            <Magnetic strength={14}>
              <motion.button
                onClick={scrollToUpload}
                whileTap={{ scale: 0.96 }}
                transition={{ duration: DUR.quick }}
                className="rounded-full bg-ink px-5 py-2.5 font-display text-sm font-bold text-white transition-colors duration-150 hover:bg-ember"
              >
                Start cutting
              </motion.button>
            </Magnetic>
          </motion.nav>
        </div>

        {/* --------------------------------- hero -------------------------------- */}
        <header id="top" ref={heroRef} className="relative mx-auto max-w-6xl scroll-mt-28 px-4 pb-10 pt-12 md:pt-20">
          <div className="grid items-center gap-12 lg:grid-cols-12">
            {/* left: message */}
            <div className="lg:col-span-7">
              <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0}
                className="inline-flex items-center gap-2.5 rounded-full border border-ink/10 bg-white py-1.5 pl-2 pr-4 text-xs font-bold shadow-sm"
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ember opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-ember" />
                </span>
                <span className="text-ink/70">100% in-browser · nothing ever uploads</span>
              </motion.div>

              <motion.h1
                initial="hidden" animate="show"
                variants={{ show: { transition: { staggerChildren: 0.09 } } }}
                className="mt-6 font-display font-extrabold tracking-[-0.03em]"
              >
                <motion.span variants={fadeUp} className="block text-[13vw] leading-[0.95] sm:text-6xl md:text-7xl">
                  Edit video
                </motion.span>
                <motion.span variants={fadeUp} className="mt-1 block text-[13vw] leading-[0.95] sm:text-6xl md:text-7xl">
                  <span className="font-accent font-normal italic tracking-normal text-emberdeep">by editing</span>{' '}
                  <span className="relative inline-block">
                    text.
                    <Scribble className="absolute -bottom-2 left-0 h-4 w-full md:-bottom-3 md:h-5" />
                  </span>
                </motion.span>
              </motion.h1>

              <motion.p variants={fadeUp} initial="hidden" animate="show" custom={2}
                className="mt-7 max-w-[52ch] text-base font-medium leading-relaxed text-ink/65 md:text-lg"
              >
                Upload a clip, get a word-perfect transcript. Delete a sentence —
                that chunk of video is gone. Click any word to jump straight to that moment.
              </motion.p>

              <motion.div variants={fadeUp} initial="hidden" animate="show" custom={3}
                className="mt-8 flex flex-wrap items-center gap-3"
              >
                <Magnetic>
                  <motion.button
                    onClick={scrollToUpload}
                    whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }}
                    transition={{ duration: DUR.quick }}
                    className="group flex items-center gap-2 rounded-full bg-ember px-7 py-4 font-display text-base font-bold text-white shadow-[0_18px_40px_-14px_rgba(255,90,0,0.6)] transition-colors duration-150 hover:bg-emberdeep"
                  >
                    <Video className="h-5 w-5 transition-transform duration-150 group-hover:-rotate-6 group-hover:scale-110" />
                    Start editing — it&apos;s free
                  </motion.button>
                </Magnetic>
                <Magnetic>
                  <motion.a
                    href="#welcome-play"
                    whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }}
                    transition={{ duration: DUR.quick }}
                    className="group flex items-center gap-2 rounded-full border border-ink/15 bg-white px-7 py-4 font-display text-base font-bold transition-colors duration-150 hover:border-ember/50 hover:bg-peach/60"
                  >
                    <Play className="h-5 w-5 fill-ember text-ember" />
                    Poke the demo
                  </motion.a>
                </Magnetic>
              </motion.div>

              <motion.div variants={fadeUp} initial="hidden" animate="show" custom={4}
                className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3"
              >
                <span className="flex -space-x-2.5">
                  {['JM', 'AK', 'RS'].map((n, i) => (
                    <span key={n} className={`grid h-9 w-9 place-items-center rounded-full border-2 border-paperlight font-display text-[11px] font-extrabold text-white ${i === 0 ? 'bg-ink' : i === 1 ? 'bg-ember' : 'bg-emberdeep'}`}>
                      {n}
                    </span>
                  ))}
                </span>
                <span>
                  <span className="flex items-center gap-1 text-ember" aria-label="5 out of 5 stars">
                    {Array.from({ length: 5 }).map((_, i) => <Spark key={i} className="h-3.5 w-3.5" />)}
                  </span>
                  <span className="mt-1 block text-[13px] font-semibold text-ink/60">Loved by editors · saves ≈40 min per video</span>
                </span>
              </motion.div>
            </div>

            {/* right: product artwork with parallax + physics stickers */}
            <motion.div style={{ y: artY }} className="relative lg:col-span-5">
              <motion.div
                initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: DUR.slow, ease: EASE, delay: 0.2 }}
                className="relative overflow-hidden rounded-[1.75rem] border border-ink/10 bg-white text-left shadow-[0_36px_90px_-32px_rgba(33,20,7,0.35)]"
              >
                <div className="flex items-center gap-2 border-b border-ink/10 bg-sand/60 px-5 py-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-ember" />
                  <span className="h-2.5 w-2.5 rounded-full bg-ink/20" />
                  <span className="h-2.5 w-2.5 rounded-full bg-ink/20" />
                  <span className="ml-2 hidden rounded-full bg-white px-3 py-0.5 font-body text-[11px] font-bold text-ink/60 sm:block">
                    my-masterpiece.mp4
                  </span>
                  <span className="ml-auto flex items-center gap-1.5 text-[11px] font-bold text-ink/50">
                    <Check className="h-3.5 w-3.5 text-ember" /> saved locally
                  </span>
                </div>

                <div className="p-5">
                  <p className="font-body text-[10px] font-bold uppercase tracking-[0.2em] text-ink/45">
                    transcript — live preview
                  </p>
                  <p className="mt-3 font-display text-[1.02rem] font-semibold leading-[2.05]">
                    {PLAY_WORDS.slice(0, 12).map((w, i) => (
                      <motion.button
                        key={i} onClick={() => togglePlayWord(i)}
                        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                        transition={{ duration: DUR.quick }}
                        className={`mr-1 rounded-md px-1 transition-colors duration-150 ${cutWords.has(i) ? 'bg-ink text-white/40 line-through decoration-ember decoration-2' : 'bg-sand hover:bg-peach'}`}
                      >
                        {w}
                      </motion.button>
                    ))}{' '}
                    {PLAY_WORDS.slice(12).map((w, k) => {
                      const i = k + 12;
                      return (
                        <motion.button
                          key={i} onClick={() => togglePlayWord(i)}
                          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                          transition={{ duration: DUR.quick }}
                          className={`mr-1 rounded-md px-1 transition-colors duration-150 ${cutWords.has(i) ? 'bg-ember text-white line-through decoration-white decoration-2' : 'bg-peach hover:bg-ember hover:text-white'}`}
                        >
                          {w}
                        </motion.button>
                      );
                    })}
                  </p>

                  <div className="mt-4 rounded-2xl bg-peach/70 p-4">
                    <div className="flex items-center gap-3">
                      <motion.button
                        onClick={() => setPlaying((p) => !p)}
                        whileTap={{ scale: 0.9 }}
                        transition={{ duration: DUR.quick }}
                        className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-ember text-white shadow-[0_10px_24px_-8px_rgba(255,90,0,0.7)] transition-colors duration-150 hover:bg-emberdeep"
                        aria-label="toggle preview"
                      >
                        {playing ? <Pause className="h-5 w-5 fill-current" /> : <Play className="ml-0.5 h-5 w-5 fill-current" />}
                      </motion.button>
                      <div className="flex flex-1 items-end gap-[3px]" aria-hidden="true">
                        {BARS.map((h, i) => (
                          <span
                            key={i}
                            style={{ height: `${Math.round(h * 0.42)}px` }}
                            className={`w-full rounded-full ${i >= 21 && i <= 25 ? 'bg-ember/70' : 'bg-ink/75'}`}
                          />
                        ))}
                      </div>
                      <span className="shrink-0 font-body text-[11px] font-bold tabular-nums text-ink/55">00:12 / 01:48</span>
                    </div>
                    <div className="relative mt-3 flex h-5 overflow-hidden rounded-full bg-white">
                      <div className="h-full bg-ink" style={{ width: `${keptPct}%` }} />
                      <div className="h-full flex-1 bg-[repeating-linear-gradient(-45deg,#FF5A00_0_8px,#C74E00_8px_10px)]" />
                      <motion.div
                        animate={playing ? { left: ['6%', '90%'] } : { left: '30%' }}
                        transition={playing ? { duration: 6, repeat: Infinity, repeatType: 'mirror', ease: 'linear' } : { duration: DUR.quick }}
                        className="absolute bottom-0 top-0 w-[3px] rounded bg-white shadow-[0_0_0_1.5px_rgba(33,20,7,0.85)]"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* physics stickers — grab and throw them */}
              <DragSticker constraints={heroRef} delay={0.6} className="-left-4 -top-6 -rotate-6 md:-left-8">
                <span className="flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 font-display text-[13px] font-bold text-white shadow-lg">
                  <Spark className="h-3.5 w-3.5 text-ember" /> 0 uploads
                </span>
              </DragSticker>
              <DragSticker constraints={heroRef} delay={0.72} className="-bottom-5 right-6 rotate-3">
                <span className="flex items-center gap-1.5 rounded-full border border-ink/10 bg-white px-4 py-2 font-display text-[13px] font-bold shadow-lg">
                  <Scissors className="h-4 w-4 text-ember" /> snip snip
                </span>
              </DragSticker>
              <p className="pointer-events-none absolute -bottom-12 left-0 hidden items-center gap-1 font-hand text-xl text-ink/45 md:flex">
                grab a sticker, throw it <DoodleArrow className="h-8 w-16 -scale-x-100 text-ink/40" />
              </p>
            </motion.div>
          </div>

          {/* stats band */}
          <motion.dl
            variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-40px' }}
            className="mt-16 grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-ink/10 bg-ink/10 md:grid-cols-4"
          >
            {STATS.map((s) => (
              <div key={s.label} className="bg-white px-6 py-5">
                <dt className="order-2 mt-1 block text-[13px] font-semibold text-ink/55">{s.label}</dt>
                <dd className="font-display text-3xl font-extrabold tabular-nums tracking-tight">
                  {s.n}
                </dd>
              </div>
            ))}
          </motion.dl>
        </header>

        {/* -------------------------------- ticker -------------------------------- */}
        <section className="overflow-hidden border-y border-ink/10 bg-ember py-3" aria-hidden="true">
          <div className="flex w-max animate-marquee gap-0 whitespace-nowrap font-display text-sm font-bold uppercase tracking-[0.16em] text-white">
            {[0, 1].map((copy) => (
              <span key={copy} className="flex shrink-0 items-center">
                {TICKER.map((t) => (
                  <span key={`${copy}-${t}`} className="flex items-center">
                    <span className="px-6">{t}</span>
                    <Spark className="h-3.5 w-3.5 opacity-80" />
                  </span>
                ))}
              </span>
            ))}
          </div>
        </section>

        {/* ------------------------------- playground ------------------------------ */}
        <section id="welcome-play" className="mx-auto max-w-6xl scroll-mt-28 px-4 py-16 md:py-24">
          <SectionHead
            index="01" tag="Playground"
            title={<>Delete a word. <span className="font-accent font-normal italic text-emberdeep">Edit the footage.</span></>}
            blurb="This is the entire app in miniature. Click words to cut them and watch the timeline react."
          />
          <motion.div
            variants={fadeUp} custom={1} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }}
            className="mt-8 rounded-[1.75rem] border border-ink/10 bg-white p-6 shadow-[0_30px_70px_-30px_rgba(33,20,7,0.25)] md:p-10"
          >
            <p className="font-display text-2xl font-bold leading-[2.2] md:text-[1.7rem]">
              {PLAY_WORDS.map((w, i) => {
                const cut = cutWords.has(i);
                return (
                  <motion.button
                    key={i} onClick={() => togglePlayWord(i)}
                    whileHover={{ scale: 1.08, y: -2 }} whileTap={{ scale: 0.92 }}
                    transition={{ duration: DUR.quick }}
                    className={`mb-1.5 mr-1.5 rounded-full border px-3 py-1 transition-colors duration-150 ${cut
                      ? 'border-ink bg-ink text-white/50 line-through decoration-ember decoration-[2.5px]'
                      : 'border-ink/15 bg-paperlight hover:border-ember/60 hover:bg-peach'
                      }`}
                  >
                    {w}
                  </motion.button>
                );
              })}
            </p>

            {/* cut-here divider */}
            <div className="relative my-7 flex items-center gap-3" aria-hidden="true">
              <span className="h-px flex-1 bg-ink/10" />
              <span className="flex items-center gap-1.5 rounded-full bg-peach px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-emberdeep">
                <Scissors className="h-3.5 w-3.5" /> cut line
              </span>
              <span className="h-px flex-1 bg-ink/10" />
            </div>

            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="flex-1">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.14em] text-ink/50">
                  <span>timeline</span>
                  <span className="tabular-nums">{100 - keptPct}% cut · {keptPct}% kept</span>
                </div>
                <div className="mt-2 flex h-8 overflow-hidden rounded-full bg-sand">
                  <motion.div className="h-full bg-ink" animate={{ width: `${keptPct}%` }} transition={SPRING_SOFT} />
                  <motion.div className="h-full flex-1 bg-[repeating-linear-gradient(-45deg,#FF5A00_0_10px,#C74E00_10px_12px)]" animate={{ width: `${100 - keptPct}%` }} transition={SPRING_SOFT} />
                </div>
              </div>
              <motion.button
                onClick={() => setCutWords(new Set())}
                whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }}
                transition={{ duration: DUR.quick }}
                className="flex items-center justify-center gap-2 rounded-full border border-ink/15 bg-white px-5 py-3 font-display text-sm font-bold transition-colors duration-150 hover:border-ember/60 hover:bg-peach"
              >
                <RotateCcw className="h-4 w-4" /> Undo everything
              </motion.button>
            </div>
          </motion.div>
        </section>

        {/* -------------------------------- features ------------------------------- */}
        <section id="welcome-features" className="mx-auto max-w-6xl scroll-mt-28 px-4 py-4 md:py-8">
          <SectionHead
            index="02" tag="Features"
            title={<>A doc that <span className="font-accent font-normal italic text-emberdeep">edits video.</span></>}
            blurb="React, Vite and Tailwind under the hood. Heavy cutting runs in a Web Worker, so the page never freezes mid-snip."
          />
          <div className="mt-8 overflow-hidden rounded-[1.75rem] border border-ink/10 bg-white">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                variants={fadeUp} custom={i} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-40px' }}
                className={`group grid cursor-default grid-cols-[auto_1fr] items-center gap-5 px-6 py-6 transition-colors duration-150 hover:bg-peach/50 md:grid-cols-12 md:gap-6 md:px-10 md:py-7 ${i !== FEATURES.length - 1 ? 'border-b border-ink/10' : ''}`}
              >
                <span className="font-display text-sm font-extrabold tabular-nums text-ink/30 md:col-span-1">
                  0{i + 1}
                </span>
                <span className="hidden h-14 w-14 place-items-center rounded-2xl bg-peach text-ink transition-all duration-150 group-hover:rotate-[-8deg] group-hover:bg-ember group-hover:text-white md:grid md:col-span-1">
                  <f.Icon className="h-7 w-7" />
                </span>
                <span className="md:col-span-6">
                  <span className="block font-display text-xl font-extrabold tracking-tight md:text-2xl">{f.title}</span>
                  <span className="mt-1 block max-w-[52ch] text-sm font-medium leading-relaxed text-ink/60">{f.desc}</span>
                </span>
                <span className="col-span-2 flex items-center gap-2 md:col-span-4 md:justify-end">
                  <span className="hidden rounded-full bg-sand px-3 py-1.5 font-body text-[11px] font-bold text-ink/60 lg:inline-block">
                    {f.meta}
                  </span>
                  <ArrowRight className="h-5 w-5 text-ink/25 transition-all duration-150 group-hover:translate-x-1.5 group-hover:text-ember" />
                </span>
              </motion.div>
            ))}
          </div>
        </section>

        {/* --------------------------------- process ------------------------------- */}
        <section id="welcome-how" className="mx-auto max-w-6xl scroll-mt-28 px-4 py-16 md:py-24">
          <SectionHead
            index="03" tag="Process"
            title={<>Raw footage to <span className="font-accent font-normal italic text-emberdeep">finished edit.</span></>}
          />
          <div className="relative mt-10 grid gap-10 md:grid-cols-3 md:gap-6">
            <span className="absolute left-0 right-0 top-[26px] hidden h-px bg-ink/15 md:block" aria-hidden="true" />
            {STEPS.map((s, i) => (
              <motion.div
                key={s.n}
                variants={fadeUp} custom={i} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-40px' }}
                className="group relative"
              >
                <div className="flex items-center gap-4">
                  <motion.span
                    whileHover={{ scale: 1.12, rotate: -8 }} whileTap={{ scale: 0.92 }}
                    transition={SPRING_PLAY}
                    className="relative z-10 grid h-[52px] w-[52px] shrink-0 place-items-center rounded-full bg-ink font-display text-sm font-extrabold tabular-nums text-white transition-colors duration-150 group-hover:bg-ember"
                  >
                    {s.n}
                  </motion.span>
                  <span className="rounded-full bg-peach px-3 py-1 font-body text-[11px] font-bold uppercase tracking-[0.16em] text-emberdeep">
                    {s.chip}
                  </span>
                  {i < 2 && <ChevronRight className="ml-auto hidden h-5 w-5 text-ink/25 md:block" />}
                </div>
                <h3 className="mt-5 font-display text-2xl font-extrabold tracking-tight">{s.title}</h3>
                <p className="mt-2 max-w-[46ch] text-[15px] font-medium leading-relaxed text-ink/60">{s.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* privacy strip */}
          

        </section>

        {/* --------------------------------- upload -------------------------------- */}
        <section id="welcome-upload" className="mx-auto max-w-4xl scroll-mt-28 px-4 pb-20 pt-2">
          <div className="text-center">
            <motion.p
              variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
              className="flex items-center justify-center gap-3 font-body text-xs font-bold uppercase tracking-[0.22em] text-emberdeep"
            >
              <span className="h-px w-10 bg-ember" /> 04 · Start <span className="h-px w-10 bg-ember" />
            </motion.p>
            <motion.h2
              variants={fadeUp} custom={1} initial="hidden" whileInView="show" viewport={{ once: true }}
              className="mx-auto mt-3 font-display text-4xl font-extrabold tracking-[-0.02em] md:text-6xl"
            >
              Drop it like it&apos;s <span className="font-accent font-normal italic text-emberdeep">unedited.</span>
            </motion.h2>
          </div>

          <motion.div
            key={shakeKey}
            animate={shakeKey ? { x: [0, -12, 12, -7, 7, 0] } : {}}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className={`mt-8 rounded-[2rem] border border-ink/10 p-3 shadow-[0_30px_70px_-30px_rgba(33,20,7,0.25)] ${isDragging ? 'bg-peach' : 'bg-white'}`}
          >
            <div
              role="button" tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileRef.current?.click(); }}
              onDrop={(e) => { e.preventDefault(); setIsDragging(false); acceptFile(e.dataTransfer.files?.[0]); }}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
              onClick={() => fileRef.current?.click()}
              className={`relative cursor-pointer overflow-hidden rounded-3xl border-[2.5px] border-dashed p-8 text-center transition-colors duration-150 md:p-12 ${isDragging ? 'border-ember bg-ember/5' : 'border-ink/20 hover:border-ember/70 hover:bg-paperlight'
                }`}
            >
              <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={(e) => acceptFile(e.target.files?.[0])} />
              <motion.div
                animate={isDragging ? { scale: 1.12, rotate: -8 } : { scale: 1, rotate: 0 }}
                transition={SPRING_PLAY}
                className="relative mx-auto w-fit"
              >
                <ReelMark className={`h-24 w-24 ${isDragging ? 'text-ember' : 'text-ink'} transition-colors duration-150`} />
                <span className="absolute inset-0 grid place-items-center">
                  {isDragging
                    ? <Upload className="h-8 w-8 text-ember" />
                    : <Video className="h-8 w-8 text-ink" />}
                </span>
              </motion.div>

              <h3 className="mx-auto mt-5 max-w-md font-display text-3xl font-extrabold tracking-tight">
                {isDragging ? 'Yes — let go!' : 'Drop your video to start'}
              </h3>
              <p className="mt-2 text-[15px] font-medium text-ink/60">Drag &amp; drop here, or click to browse your files</p>

              <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                {['MP4', 'MOV', 'WebM', 'AVI'].map((f) => (
                  <span key={f} className="rounded-full bg-sand px-3.5 py-1.5 font-body text-[11px] font-bold tabular-nums text-ink/65">{f}</span>
                ))}
                <span className="rounded-full bg-peach px-3.5 py-1.5 font-body text-[11px] font-bold text-emberdeep">≈500MB sweet spot</span>
              </div>

              <div className="mt-7">
                <Magnetic strength={20}>
                  <motion.span
                    whileTap={{ scale: 0.96 }}
                    transition={{ duration: DUR.quick }}
                    className="inline-flex items-center gap-2 rounded-full bg-ember px-8 py-4 font-display text-base font-bold text-white shadow-[0_18px_40px_-14px_rgba(255,90,0,0.6)] transition-colors duration-150 hover:bg-emberdeep"
                  >
                    <Upload className="h-5 w-5" /> Select video file
                  </motion.span>
                </Magnetic>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    transition={{ duration: DUR.quick }}
                    className="mx-auto mt-5 inline-block rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-white"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-[13px] font-semibold text-ink/50">
            <ShieldCheck className="h-4 w-4 text-ember" /> Stays on this device — nothing is uploaded, pinky promise.
          </p>
        </section>

        {/* --------------------------------- footer -------------------------------- */}
        <footer className="overflow-hidden border-t border-ink/10 bg-white">
          <div className="mx-auto max-w-6xl px-4 pb-6 pt-12">
            <motion.p
              variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
              className="font-display text-[13vw] font-extrabold leading-[0.95] tracking-[-0.03em] sm:text-7xl md:text-8xl"
            >
              TextEdit Video<span className="text-ember">.</span>
            </motion.p>
            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-ink/10 pt-5 text-xs font-semibold text-ink/50">
              <span className="flex items-center gap-2">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-ember text-white">
                  <Scissors className="h-3.5 w-3.5" />
                </span>
                TextEdit Video — text-based editing · React 19 · FFmpeg.wasm · Whisper
              </span>
              <span className="tabular-nums">Space = play · ←/→ = seek · click a word = teleport</span>
            </div>
          </div>
        </footer>
      </div>
    </MotionConfig>
  );
}
