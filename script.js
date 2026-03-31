const scene = document.getElementById('scene');
const skyImage = document.getElementById('skyImage');
const rainLayer = document.getElementById('rainLayer');
const fly = document.getElementById('fly');

const WEATHER_URL =
  'https://api.open-meteo.com/v1/forecast?latitude=38.0151&longitude=-7.8632&current=weather_code,is_day&timezone=Europe%2FLisbon';

const REFRESH_INTERVAL = 5 * 60 * 1000;

let currentSkySrc = '';

let flyState = 'waiting';
let flyX = -100;
let flyY = window.innerHeight * 0.32;
let flyTargetX = 0;
let flyTargetY = 0;
let flyAnglePhase = 0;

let flyWaitingSince = performance.now();
let flyNextStartDelay = 3000;
let hoverStartedAt = 0;
let sideSwitchAt = 0;

function random(min, max) {
  return Math.random() * (max - min) + min;
}

function getRandomLoopDelay() {
  return random(2.5 * 60 * 1000, 5.5 * 60 * 1000);
}

function buildRain(count) {
  rainLayer.innerHTML = '';

  for (let i = 0; i < count; i++) {
    const drop = document.createElement('span');
    drop.className = 'drop';
    drop.style.left = `${Math.random() * 100}%`;
    drop.style.animationDuration = `${random(0.8, 1.5)}s`;
    drop.style.animationDelay = `${-Math.random() * 2}s`;
    drop.style.opacity = `${random(0.35, 0.95)}`;
    rainLayer.appendChild(drop);
  }
}

buildRain(90);

function getCloudGroupFromWeatherCode(code) {
  if (code === 0) return 'cavok';
  if (code === 1) return 'few';
  if (code === 2) return 'sct';
  if (code === 3) return 'ovc';

  if ([45, 48].includes(code)) return 'ovc';
  if ([51, 53, 55, 56, 57].includes(code)) return 'bkn';
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'bkn';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'bkn';
  if ([95, 96, 99].includes(code)) return 'ovc';

  return 'few';
}

function shouldShowFog(code) {
  return [45, 48].includes(code);
}

function shouldShowRain(code) {
  return [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(code);
}

function getSkyImageName(isDay, cloudGroup) {
  const prefix = isDay ? 'day' : 'night';
  return `${prefix}_${cloudGroup}.png?v=11`;
}

function applyVisualState(weatherCode, isDay) {
  const cloudGroup = getCloudGroupFromWeatherCode(weatherCode);
  const imageName = getSkyImageName(isDay, cloudGroup);

  if (currentSkySrc !== imageName) {
    currentSkySrc = imageName;
    skyImage.src = imageName;
  }

  scene.classList.remove('show-fog', 'show-rain');

  if (shouldShowFog(weatherCode)) {
    scene.classList.add('show-fog');
  }

  if (shouldShowRain(weatherCode)) {
    scene.classList.add('show-rain');
  }
}

async function applyLiveWeather() {
  try {
    const res = await fetch(WEATHER_URL, { cache: 'no-store' });
    const data = await res.json();

    const current = data && data.current ? data.current : null;
    if (!current) return;

    const weatherCode = Number(current.weather_code);
    const isDay = Number(current.is_day) === 1;

    applyVisualState(weatherCode, isDay);
  } catch (error) {
    if (!currentSkySrc) {
      currentSkySrc = 'day_few.png?v=11';
      skyImage.src = currentSkySrc;
    }

    scene.classList.remove('show-fog', 'show-rain');
  }
}

function getMouthPoint() {
  return {
    x: window.innerWidth * 0.505,
    y: window.innerHeight * 0.67
  };
}

function getLeftHoverArea() {
  return {
    minX: window.innerWidth * 0.18,
    maxX: window.innerWidth * 0.36,
    minY: window.innerHeight * 0.28,
    maxY: window.innerHeight * 0.46
  };
}

function getRightHoverArea() {
  return {
    minX: window.innerWidth * 0.57,
    maxX: window.innerWidth * 0.72,
    minY: window.innerHeight * 0.34,
    maxY: window.innerHeight * 0.50
  };
}

function setTargetInArea(area) {
  flyTargetX = random(area.minX, area.maxX);
  flyTargetY = random(area.minY, area.maxY);
}

function startFlyLoop(now) {
  flyState = 'entering-left';
  fly.style.opacity = '1';
  flyX = -30;
  flyY = window.innerHeight * random(0.30, 0.40);
  setTargetInArea(getLeftHoverArea());
  hoverStartedAt = 0;
  sideSwitchAt = 0;
  flyWaitingSince = now;
}

function resetFlyWaiting(now) {
  flyState = 'waiting';
  fly.style.opacity = '0';
  flyX = -100;
  flyY = window.innerHeight * 0.32;
  flyWaitingSince = now;
  flyNextStartDelay = getRandomLoopDelay();
  hoverStartedAt = 0;
  sideSwitchAt = 0;
}

function moveTowardsTarget(speedXFactor, speedYFactor, extraX = 0) {
  const dx = flyTargetX - flyX;
  const dy = flyTargetY - flyY;

  flyX += dx * speedXFactor + extraX;
  flyY += dy * speedYFactor;

  return { dx, dy };
}

function applyNaturalWobble() {
  flyAnglePhase += 0.1;
  flyX += Math.sin(flyAnglePhase * 1.7) * 0.7;
  flyY += Math.cos(flyAnglePhase * 2.1) * 0.5;
}

function animateFly(now) {
  if (!fly) return;

  if (flyState === 'waiting') {
    if (now - flyWaitingSince >= flyNextStartDelay) {
      startFlyLoop(now);
    }
  }

  if (flyState === 'entering-left') {
    const { dx, dy } = moveTowardsTarget(0.03, 0.05, 0.8);

    if (Math.abs(dx) < 12 && Math.abs(dy) < 12) {
      flyState = 'hovering-left';
      hoverStartedAt = now;
      setTargetInArea(getLeftHoverArea());
    }
  }

  if (flyState === 'hovering-left') {
    const { dx, dy } = moveTowardsTarget(0.025, 0.025);
    applyNaturalWobble();

    if (Math.abs(dx) < 8 && Math.abs(dy) < 8) {
      setTargetInArea(getLeftHoverArea());
    }

    if (hoverStartedAt && now - hoverStartedAt > random(2500, 4500)) {
      flyState = 'crossing-right';
      sideSwitchAt = now;
      setTargetInArea(getRightHoverArea());
    }
  }

  if (flyState === 'crossing-right') {
    const { dx, dy } = moveTowardsTarget(0.022, 0.03, 0.9);
    applyNaturalWobble();

    if (Math.abs(dx) < 14 && Math.abs(dy) < 14) {
      flyState = 'hovering-right';
      hoverStartedAt = now;
      setTargetInArea(getRightHoverArea());
    }
  }

  if (flyState === 'hovering-right') {
    const { dx, dy } = moveTowardsTarget(0.025, 0.025);
    applyNaturalWobble();

    if (Math.abs(dx) < 8 && Math.abs(dy) < 8) {
      setTargetInArea(getRightHoverArea());
    }

    if (hoverStartedAt && now - hoverStartedAt > random(5000, 9000)) {
      flyState = 'caught';
    }
  }

  if (flyState === 'caught') {
    const mouth = getMouthPoint();
    const dx = mouth.x - flyX;
    const dy = mouth.y - flyY;

    flyX += dx * 0.14;
    flyY += dy * 0.14;

    if (Math.abs(dx) < 2 && Math.abs(dy) < 2) {
      resetFlyWaiting(now);
    }
  }

  const wobble = Math.sin(now * 0.03) * 10;
  const scale = flyState === 'caught' ? 0.85 : 1;

  fly.style.left = `${flyX}px`;
  fly.style.top = `${flyY}px`;
  fly.style.transform = `rotate(${wobble}deg) scale(${scale})`;
}

function tick(now) {
  animateFly(now);
  requestAnimationFrame(tick);
}

window.addEventListener('resize', () => {
  if (flyState === 'waiting') {
    flyY = window.innerHeight * 0.32;
  }
});

applyLiveWeather();
setInterval(applyLiveWeather, REFRESH_INTERVAL);
requestAnimationFrame(tick);
