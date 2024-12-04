let startTime = 0;
let elapsedTime = 0;
let timerInterval;
let isRunning = false;
let sessions = [];
let breastCount = 0;

const startStopButton = document.getElementById('startStopButton');
const timerDisplay = document.getElementById('timer');
const sessionHistoryDisplay = document.getElementById('sessionHistory');
const feedingChartCanvas = document.getElementById('feedingChart');
const feedingChartLineCanvas = document.getElementById('feedingChartLine');
const totalTimeDisplay = document.getElementById('total-time');
const avgTimeDisplay = document.getElementById('avg-time');
const numSessionsDisplay = document.getElementById('num-sessions');

function formatTime(time) {
  const seconds = Math.floor((time / 1000) % 60);
  const minutes = Math.floor((time / (1000 * 60)) % 60);
  const hours = Math.floor((time / (1000 * 60 * 60)) % 24);

  const formattedSeconds = seconds < 10 ? `0${seconds}` : seconds;
  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
  const formattedHours = hours < 10 ? `0${hours}` : hours;

  return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
}

function formatShortTime(time) {
  const seconds = Math.floor((time / 1000) % 60);
  const minutes = Math.floor((time / (1000 * 60)) % 60);
  const formattedSeconds = seconds < 10 ? `0${seconds}` : seconds;
  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;

  return `${formattedMinutes}m${formattedSeconds}s`;
}

function updateTimer() {
  elapsedTime = Date.now() - startTime;
  const formattedTime = formatTime(elapsedTime);
  const timeParts = formattedTime.split(':');
  timerDisplay.innerHTML = `
    <span>${timeParts[0]}</span>
    <span>${timeParts[1]}</span>
    <span>${timeParts[2]}</span>
  `;
}

function logSession() {
  const now = new Date();
  const dateString = now.toLocaleDateString();
  const timeString = now.toLocaleTimeString();
  const durationString = formatTime(elapsedTime);

  const sessionData = { date: dateString, time: timeString, duration: elapsedTime, breastCount: breastCount };
  sessions.push(sessionData);
  updateSessionStorage();
  saveDataToFile();

  displaySessionHistory();
  createFeedingChart();
  createFeedingDurationChart();
  console.log('Session logged:', sessionData);
  displayRecentSessionList();
  breastCount = 0;
}

function updateSessionStorage() {
  localStorage.setItem('sessions', JSON.stringify(sessions));
}

function displaySessionHistory() {
  sessions = JSON.parse(localStorage.getItem('sessions')) || [];
  sessionHistoryDisplay.innerHTML = '';

  if (sessions.length === 0) {
    sessionHistoryDisplay.textContent = 'Aucune session pour le moment.';
    return;
  }

  sessions.sort((a, b) => new Date(a.date + ' ' + a.time) - new Date(b.date + ' ' + b.time));

  sessions.forEach((session, index) => {
    const sessionElement = document.createElement('div');
    sessionElement.classList.add('session-item');
    const trashIcon = document.createElement('img');
    trashIcon.src = 'trash.png';
    trashIcon.alt = 'Supprimer la session';
    trashIcon.addEventListener('click', () => {
      sessions.splice(index, 1);
      updateSessionStorage();
      saveDataToFile();
      displaySessionHistory();
      createFeedingChart();
      createFeedingDurationChart();
    });

    const dateParts = session.date.split('/');
    const timeParts = session.time.split(':');
    const duration = formatShortTime(session.duration);

    sessionElement.innerHTML = `#${sessions.length - index} - ${dateParts[0]}/${dateParts[1]}/${dateParts[2]} a ${timeParts[0]}:${timeParts[1]} - dur: ${duration}`;
    sessionElement.appendChild(trashIcon);
    sessionHistoryDisplay.prepend(sessionElement);
  });

  calculateAndDisplayStats();
}


function calculateAndDisplayStats() {
  if (sessions.length === 0) return;

  const totalDuration = sessions.reduce((sum, session) => sum + session.duration, 0);
  const averageDuration = totalDuration / sessions.length;

  totalTimeDisplay.textContent = formatTime(totalDuration);
  avgTimeDisplay.textContent = formatTime(averageDuration);
  numSessionsDisplay.textContent = sessions.length;
}


function createFeedingChart() {
  sessions = JSON.parse(localStorage.getItem('sessions')) || [];
  const hourlyData = getHourlyFeedingData(sessions);

  const ctx = feedingChartCanvas.getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: hourlyData.labels,
      datasets: [{
        label: 'Séances d\'allaitement',
        data: hourlyData.data,
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }]
    },
    options: {
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Heure'
          },
          ticks: {
            stepSize: 1,
            min: 1,
            max: 23
          }
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Nombre de séances'
          }
        }
      }
    }
  });
}

function createFeedingDurationChart() {
  const durations = sessions.map(session => session.duration);
  const durationRanges = calculateDurationRanges(durations);

  const ctx = feedingChartLineCanvas.getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: durationRanges.labels,
      datasets: [{
        label: 'Durée des séances',
        data: durationRanges.counts,
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1
      }]
    },
    options: {
      scales: {
        x: {
          title: {
            display: true,
            text: 'Tranche de durée (minutes)'
          }
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Nombre de séances'
          }
        }
      }
    }
  });
}


function calculateDurationRanges(durations) {
  const minDuration = Math.min(...durations);
  const maxDuration = Math.max(...durations);
  const rangeSize = Math.ceil((maxDuration - minDuration) / 5); 

  const ranges = [];
  let currentMin = minDuration;
  for (let i = 0; i < 5; i++) {
    const currentMax = currentMin + rangeSize;
    ranges.push({ min: currentMin, max: currentMax });
    currentMin = currentMax;
  }

  const counts = ranges.map(range => {
    return durations.filter(duration => duration >= range.min && duration < range.max).length;
  });

  const labels = ranges.map(range => {
    const minMinutes = Math.floor(range.min / 1000 / 60);
    const maxMinutes = Math.floor(range.max / 1000 / 60);
    if (minMinutes === maxMinutes) {
      return `${minMinutes} min`;
    } else {
      return `${minMinutes}-${maxMinutes} min`;
    }
  });

  return { labels, counts };
}


function getHourlyFeedingData(sessions) {
  const hourlyCounts = {};
  sessions.forEach(session => {
    const timeParts = session.time.split(':');
    const hour = parseInt(timeParts[0]);
    hourlyCounts[hour] = (hourlyCounts[hour] || 0) + 1;
  });

  const labels = [];
  const data = [];
  for (let i = 1; i <= 23; i++) {
    labels.push(i);
    data.push(hourlyCounts[i] || 0);
  }
  return { labels, data };
}

function displayRecentSessionList() {
  if (sessions.length > 0) {
    const lastSession = sessions[sessions.length - 1];
    alert(`Date: ${lastSession.date}, Time: ${lastSession.time}, Duration: ${formatTime(lastSession.duration)}, Breast Count: ${lastSession.breastCount}`);
  }
}

function saveDataToFile() {
  fetch('data.json', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(sessions)
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  })
  .then(data => {
    console.log('Data saved successfully:', data);
  })
  .catch(error => {
    console.error('There has been a problem with your fetch operation:', error);
  });
}

window.addEventListener('load', () => {
  displaySessionHistory();
  createFeedingChart();
  createFeedingDurationChart();
});

startStopButton.addEventListener('click', () => {
  if (!isRunning) {
    elapsedTime = 0;
    startTime = Date.now();
    timerInterval = setInterval(updateTimer, 100);
    startStopButton.textContent = 'Stop';
    isRunning = true;
  } else {
    clearInterval(timerInterval);
    startStopButton.textContent = 'Start';
    isRunning = false;
    logSession();
  }
});
