const scene = document.getElementById('scene');
const frog = document.getElementById('frog');
const frogZone = document.getElementById('frogZone');
const fly = document.getElementById('fly');
const tongue = document.getElementById('tongue');
const rain = document.getElementById('rain');
const snow = document.getElementById('snow');
const lightning = document.getElementById('lightning');

let flyX = -140;
let flyY = window.innerHeight * 0.22;
let phase = Math.random() * Math.PI * 2;
let eating = false;

function random(min, max){
  return Math.random() * (max - min) + min;
}

function buildRain(count){
  rain.innerHTML = '';
  for(let i = 0; i < count; i++){
    const d = document.createElement('span');
    d.className = 'drop';
    d.style.left = `${Math.random() * 100}%`;
    d.style.animationDuration = `${random(0.8, 1.5)}s`;
    d.style.animationDelay = `${-Math.random() * 2}s`;
    d.style.opacity = `${random(0.45, 0.95)}`;
    rain.appendChild(d);
  }
}

function buildSnow(count){
  snow.innerHTML = '';
  for(let i = 0; i < count; i++){
    const f = document.createElement('span');
    f.className = 'flake';
    f.style.left = `${Math.random() * 100}%`;
    f.style.animationDuration = `${random(5, 11)}s`;
    f.style.animationDelay = `${-Math.random() * 8}s`;
    f.style.opacity = `${random(0.5, 1)}`;
    f.style.transform = `scale(${random(0.6, 1.4)})`;
    snow.appendChild(f);
  }
}

buildRain(90);
buildSnow(42);

function weatherClassFromCode(code){
  if (code === 0) return 'weather-clear';
  if ([1,2].includes(code)) return 'weather-partly';
  if (code === 3) return 'weather-overcast';
  if ([45,48].includes(code)) return 'weather-fog';
  if ([51,53,55,56,57,61,63,65,66,67,80,81,82].includes(code)) return 'weather-rain';
  if ([71,73,75,77,85,86].includes(code)) return 'weather-snow';
  if ([95,96,99].includes(code)) return 'weather-thunder';
  return 'weather-partly';
}

async function applyLiveWeather(){
  try{
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=38.0151&longitude=-7.8632&current=weather_code,is_day&timezone=Europe%2FLisbon';
    const res = await fetch(url, { cache: 'no-store' });
    const data = await res.json();

    const current = data && data.current ? data.current : null;
    if (!current) return;

    const weatherClass = weatherClassFromCode(Number(current.weather_code));
    const isDay = Number(current.is_day) === 1;

    scene.classList.remove(
      'weather-clear','weather-partly','weather-overcast',
      'weather-fog','weather-rain','weather-snow','weather-thunder',
      'day','night'
    );

    scene.classList.add(weatherClass);
    scene.classList.add(isDay ? 'day' : 'night');

    if (weatherClass === 'weather-thunder'){
      setInterval(() => {
        if (Math.random() < 0.35){
          lightning.classList.remove('flash');
          void lightning.offsetWidth;
          lightning.classList.add('flash');
        }
      }, 3500);
    }
  }catch(e){
    scene.classList.add('weather-partly','day');
  }
}

function blink(){
  frog.style.filter = 'drop-shadow(0 14px 18px rgba(0,0,0,0.24)) brightness(0.985)';
  setTimeout(() => {
    frog.style.filter = 'drop-shadow(0 14px 18px rgba(0,0,0,0.24)) brightness(0.92)';
  }, 70);
  setTimeout(() => {
    frog.style.filter = 'drop-shadow(0 14px 18px rgba(0,0,0,0.24)) brightness(0.985)';
  }, 150);
}

function scheduleBlink(){
  const next = 1800 + Math.random() * 3200;
  setTimeout(() => {
    blink();
    scheduleBlink();
  }, next);
}

function mouthPoint(){
  const rect = frog.getBoundingClientRect();
  return {
    x: rect.left + rect.width * 0.73,
    y: rect.top + rect.height * 0.52
  };
}

function extendTongue(targetX, targetY){
  const sceneRect = scene.getBoundingClientRect();
  const mouth = mouthPoint();
  const x1 = mouth.x - sceneRect.left;
  const y1 = mouth.y - sceneRect.top;
  const x2 = targetX - sceneRect.left;
  const y2 = targetY - sceneRect.top;

  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx*dx + dy*dy);
  const ang = Math.atan2(dy, dx) * 180 / Math.PI;

  tongue.style.left = `${x1}px`;
  tongue.style.top = `${y1}px`;
  tongue.style.width = `${len}px`;
  tongue.style.transform = `rotate(${ang}deg)`;
  tongue.style.opacity = '1';
}

function hideTongue(){
  tongue.style.opacity = '0';
  tongue.style.width = '10px';
}

function eatFly(){
  if (eating) return;
  eating = true;

  const fr = fly.getBoundingClientRect();
  const tx = fr.left + fr.width * 0.48;
  const ty = fr.top + fr.height * 0.55;

  extendTongue(tx, ty);

  setTimeout(() => {
    fly.style.opacity = '0';
    fly.style.transform = 'scale(0.15) rotate(8deg)';
  }, 80);

  setTimeout(() => {
    hideTongue();
    flyX = -140;
    flyY = window.innerHeight * random(0.14, 0.34);
    phase = Math.random() * Math.PI * 2;
    fly.style.opacity = '1';
    fly.style.transform = 'rotate(0deg)';
    eating = false;
  }, 520);
}

function animateFly(){
  if (!eating){
    const speed = Math.max(1.35, window.innerWidth / 720);
    flyX += speed;
    phase += 0.05;

    const arc = Math.sin(phase) * 26 + Math.sin(phase * 0.37) * 18;
    flyY += arc * 0.05;

    const minY = window.innerHeight * 0.12;
    const maxY = window.innerHeight * 0.43;
    flyY = Math.max(minY, Math.min(maxY, flyY));

    if (flyX > window.innerWidth + 120){
      flyX = -140;
      flyY = window.innerHeight * random(0.14, 0.34);
      phase = Math.random() * Math.PI * 2;
    }

    const tilt = Math.sin(phase * 4.5) * 9;
    const flutter = 1 + Math.sin(phase * 8) * 0.04;

    fly.style.left = `${flyX}px`;
    fly.style.top = `${flyY}px`;
    fly.style.transform = `rotate(${tilt}deg) scale(${flutter})`;

    const mouth = mouthPoint();
    const dx = (flyX + fly.offsetWidth * 0.48) - mouth.x;
    const dy = (flyY + fly.offsetHeight * 0.55) - mouth.y;
    const dist = Math.sqrt(dx*dx + dy*dy);

    if (dist < 170 && Math.random() < 0.06){
      eatFly();
    }
  }

  requestAnimationFrame(animateFly);
}

window.addEventListener('resize', () => {
  flyY = Math.min(flyY, window.innerHeight * 0.43);
});

applyLiveWeather();
scheduleBlink();
animateFly();
