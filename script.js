/* ═══════════════════════════════════════════════════════
   HINGE DATE PLAN — script.js
   - Silent email via Vercel serverless function + Resend
   - Zero credentials in this file — all in Vercel env vars
   - Progress bar, mood picker, Surprise Me, confetti
═══════════════════════════════════════════════════════ */

// ─────────────────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────────────────
const ITINERARY = {
  "Full Day": [
    { icon: "🎳", label: "Bowling",              value: "Bowling" },
    { icon: "☕", label: "Coffee Walk",           value: "Coffee Walk" },
    { icon: "🎬", label: "Movie Screening",       value: "Movie Screening" },
    { icon: "🍽️", label: "Dinner Date",           value: "Dinner Date" },
    { icon: "🛍️", label: "Shopping Trip",         value: "Shopping Trip" },
    { icon: "🚗", label: "Long Drive (Lonavala)", value: "Long Drive to Lonavala" },
  ],
  "Meetup": [
    { icon: "🏺", label: "Pottery Workshop",  value: "Pottery Workshop" },
    { icon: "☕", label: "Coffee Catch-up",   value: "Coffee Catch-up" },
    { icon: "🥐", label: "Brunch Date",       value: "Brunch Date" },
    { icon: "🌅", label: "Evening Stroll",    value: "Evening Stroll" },
    { icon: "🍰", label: "Dessert Run",       value: "Dessert Run" },
  ]
};

const LOCALITY = {
  "Full Day":  ["Koregaon Park","Viman Nagar","Kalyani Nagar","Baner","Hinjewadi","Camp / FC Road"],
  "Meetup":    ["Koregaon Park","Baner","Aundh","Camp / FC Road","Kothrud","Wakad"]
};

const FLIRTY = {
  2: "Tell me when — and I'll make it worth your while. 😏",
  3: "Ooh, good choice! This is going to be something special.",
  4: "I love how you think. Pick as many as you like ✨",
  5: "Last one! Just tell me where — I'll handle everything else. 💌",
};

const STEP_LABELS = ["", "1 of 5 — Let's begin", "2 of 5 — Pick a day", "3 of 5 — The vibe", "4 of 5 — Activities", "5 of 5 — Location"];

// ─────────────────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────────────────
let currentStep = 1;
let selectedPlanType = null;
let selectedLocality = null;
let selectedMood = null;

// ─────────────────────────────────────────────────────────
// PROGRESS BAR
// ─────────────────────────────────────────────────────────
function updateProgress(step) {
  const bar = document.getElementById('progress-bar');
  const lbl = document.getElementById('progress-label');
  if (bar) bar.style.width = `${(step / 5) * 100}%`;
  if (lbl) lbl.textContent = STEP_LABELS[step] || '';
}

// ─────────────────────────────────────────────────────────
// NAVIGATION
// ─────────────────────────────────────────────────────────
function goTo(step) {
  if (step > currentStep && !validate(currentStep)) return;

  const from = document.getElementById(`step-${currentStep}`);
  from.classList.remove('active');

  const to = document.getElementById(`step-${step}`);
  to.classList.remove('active');
  void to.offsetWidth; // force animation replay
  to.classList.add('active');

  // Update flirty line
  const fl = document.getElementById(`flirty-${step}`);
  if (fl && FLIRTY[step]) fl.textContent = FLIRTY[step];

  currentStep = step;
  updateProgress(step);
}

// ─────────────────────────────────────────────────────────
// VALIDATION
// ─────────────────────────────────────────────────────────
function validate(step) {
  if (step === 2) {
    if (!document.querySelector('input[name="day"]:checked')) {
      toast("Pick a day — I've been looking forward to this! 🗓️"); return false;
    }
  }
  if (step === 3) {
    if (!selectedPlanType) {
      toast("Tell me how much time we have! ✨"); return false;
    }
  }
  if (step === 4) {
    if (!document.querySelectorAll('input[name="itinerary"]:checked').length) {
      toast("Pick at least one — I know you have great taste 😉"); return false;
    }
  }
  if (step === 5) {
    if (!getLocality()) {
      toast("Tell me where to take you! 📍"); return false;
    }
  }
  return true;
}

// ─────────────────────────────────────────────────────────
// TOAST (replaces alert — no ugly browser popup)
// ─────────────────────────────────────────────────────────
function toast(msg) {
  let t = document.getElementById('__toast');
  if (!t) {
    t = document.createElement('div');
    t.id = '__toast';
    Object.assign(t.style, {
      position:'fixed', bottom:'1.5rem', left:'50%',
      transform:'translateX(-50%)',
      background:'rgba(255,255,255,0.22)',
      backdropFilter:'blur(10px)',
      WebkitBackdropFilter:'blur(10px)',
      border:'1px solid rgba(255,255,255,0.4)',
      color:'#fff', padding:'.65rem 1.4rem',
      borderRadius:'40px', fontSize:'.88rem',
      fontFamily:'Poppins,sans-serif',
      zIndex:'999', pointerEvents:'none',
      textAlign:'center', maxWidth:'88vw',
      boxShadow:'0 4px 20px rgba(0,0,0,0.15)',
      transition:'opacity 0.3s',
    });
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = '1';
  clearTimeout(t._timer);
  t._timer = setTimeout(() => { t.style.opacity = '0'; }, 3200);
}

// ─────────────────────────────────────────────────────────
// MOOD PICKER
// ─────────────────────────────────────────────────────────
function pickMood(el) {
  document.querySelectorAll('.mood-chip').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  selectedMood = el.dataset.mood;
}

// ─────────────────────────────────────────────────────────
// PLAN TYPE — triggers itinerary + locality build
// ─────────────────────────────────────────────────────────
function onPlanType(type) {
  selectedPlanType = type;
  selectedLocality = null;
  buildItinerary(type);
  buildLocality(type);
}

// ─────────────────────────────────────────────────────────
// BUILD ITINERARY
// ─────────────────────────────────────────────────────────
function buildItinerary(type) {
  const grid = document.getElementById('itinerary-options');
  const title = document.getElementById('itinerary-title');
  grid.innerHTML = '';
  title.textContent = type === "Full Day"
    ? "What sounds fun to you?"
    : "What kind of meetup do you have in mind?";

  ITINERARY[type].forEach(item => {
    const lbl = document.createElement('label');
    lbl.className = 'option-card';
    lbl.innerHTML = `
      <input type="checkbox" name="itinerary" value="${item.value}">
      <div class="card-inner">
        <span class="card-icon">${item.icon}</span>
        <span class="card-label">${item.label}</span>
        <span class="card-tick">✓</span>
      </div>`;
    grid.appendChild(lbl);
  });
}

// ─────────────────────────────────────────────────────────
// SURPRISE ME — randomly checks 2 itinerary items
// ─────────────────────────────────────────────────────────
function surpriseMe() {
  const boxes = Array.from(document.querySelectorAll('input[name="itinerary"]'));
  if (!boxes.length) {
    toast("First pick a plan type! 😊"); return;
  }
  // Uncheck all
  boxes.forEach(b => { b.checked = false; });
  // Pick 2 random
  const shuffled = boxes.sort(() => 0.5 - Math.random());
  shuffled.slice(0, 2).forEach(b => { b.checked = true; });
  toast("Ooh, interesting combo! 👀");
}

// ─────────────────────────────────────────────────────────
// BUILD LOCALITY
// ─────────────────────────────────────────────────────────
function buildLocality(type) {
  const grid = document.getElementById('locality-options');
  grid.innerHTML = '';
  selectedLocality = null;

  LOCALITY[type].forEach(place => {
    const chip = document.createElement('div');
    chip.className = 'locality-chip';
    chip.textContent = place;
    chip.addEventListener('click', () => {
      document.querySelectorAll('.locality-chip').forEach(c => c.classList.remove('selected'));
      chip.classList.add('selected');
      selectedLocality = place;
      document.getElementById('locality-input').value = '';
    });
    grid.appendChild(chip);
  });
}

function getLocality() {
  return document.getElementById('locality-input').value.trim() || selectedLocality;
}

// Clear chip selection when user types
document.addEventListener('input', e => {
  if (e.target.id === 'locality-input' && e.target.value) {
    document.querySelectorAll('.locality-chip').forEach(c => c.classList.remove('selected'));
    selectedLocality = null;
  }
});

// ─────────────────────────────────────────────────────────
// SUBMIT — silent POST to Vercel serverless function
// Credentials live in Vercel env vars, never in this file
// ─────────────────────────────────────────────────────────
async function submitPlan() {
  if (!validate(5)) return;

  const day        = document.querySelector('input[name="day"]:checked')?.value || '';
  const type       = selectedPlanType || '';
  const mood       = selectedMood || 'Not selected';
  const activities = Array.from(document.querySelectorAll('input[name="itinerary"]:checked'))
                          .map(c => c.value).join(', ');
  const locality   = getLocality();

  // Show success immediately — she doesn't wait for network
  document.getElementById('success-screen').classList.remove('hidden');
  launchConfetti();

  // Silent background POST to our own Vercel API route
  // /api/send-email — serverless function in /api/send-email.js
  try {
    await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ day, plan_type: type, mood, activities, locality }),
    });
  } catch (err) {
    // Fail silently — she still sees the success screen
    console.error('[DatePlan] Email send failed:', err);
  }
}


// ─────────────────────────────────────────────────────────
// CONFETTI (canvas-based, no external library)
// ─────────────────────────────────────────────────────────
function launchConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  canvas.style.display = 'block';
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const COLORS = ['#ff758c','#ffc3a0','#c77dff','#fff','#ffd6e7','#f9c74f'];
  const pieces = Array.from({ length: 90 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height - canvas.height,
    r: Math.random() * 6 + 3,
    d: Math.random() * 80 + 10,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    tilt: Math.random() * 10 - 10,
    tiltAngle: 0,
    tiltSpeed: Math.random() * 0.1 + 0.05,
  }));

  let angle = 0;
  let frame = 0;
  const MAX_FRAMES = 200;

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    angle += 0.01;
    frame++;
    pieces.forEach(p => {
      p.tiltAngle += p.tiltSpeed;
      p.y += (Math.cos(angle + p.d) + 1.5);
      p.x += Math.sin(angle);
      p.tilt = Math.sin(p.tiltAngle) * 12;
      ctx.beginPath();
      ctx.lineWidth = p.r / 2;
      ctx.strokeStyle = p.color;
      ctx.moveTo(p.x + p.tilt + p.r / 4, p.y);
      ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 4);
      ctx.stroke();
    });
    if (frame < MAX_FRAMES) requestAnimationFrame(draw);
    else { ctx.clearRect(0, 0, canvas.width, canvas.height); canvas.style.display = 'none'; }
  }
  draw();
}

// ─────────────────────────────────────────────────────────
// MUSIC — "Perfect" by One Direction (perfect.mp3)
// ─────────────────────────────────────────────────────────
const audio     = document.getElementById('bg-audio');
const musicBtn  = document.getElementById('music-toggle');
const musicLabel = musicBtn.querySelector('.music-label');
let musicPlaying = false;

musicBtn.addEventListener('click', () => {
  if (!musicPlaying) {
    audio.play()
      .then(() => {
        musicLabel.textContent = 'Playing Perfect... 🎵';
        musicBtn.classList.add('playing');
        musicPlaying = true;
      })
      .catch(() => {
        // Browser blocked autoplay — button still pressed, try again on next click
        musicLabel.textContent = 'Tap again to play 🎵';
      });
  } else {
    audio.pause();
    musicLabel.textContent = 'Play Out Mood';
    musicBtn.classList.remove('playing');
    musicPlaying = false;
  }
});


// ─────────────────────────────────────────────────────────
// FLOATING HEARTS
// ─────────────────────────────────────────────────────────
const HEARTS = ['❤️','💖','🌸','✨','💕','🌷','💗','🫶'];
const heartContainer = document.getElementById('hearts-container');

function spawnHeart() {
  const h = document.createElement('span');
  h.className = 'floating-heart';
  h.textContent = HEARTS[Math.floor(Math.random() * HEARTS.length)];
  h.style.left = `${Math.random() * 92}vw`;
  const dur = 7 + Math.random() * 5;
  h.style.animationDuration = `${dur}s`;
  heartContainer.appendChild(h);
  setTimeout(() => h.remove(), dur * 1000);
}

setInterval(spawnHeart, 2400);
spawnHeart(); // one on load

// ─────────────────────────────────────────────────────────
// INIT — set progress bar to step 1
// ─────────────────────────────────────────────────────────
updateProgress(1);
