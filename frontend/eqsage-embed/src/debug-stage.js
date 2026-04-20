const markerId = 'sage-debug-stage';
let debugEnabled = null;

export const isSageDebugEnabled = () => {
  if (debugEnabled !== null) {
    return debugEnabled;
  }

  if (typeof window === 'undefined') {
    debugEnabled = false;
    return debugEnabled;
  }

  const search = new URLSearchParams(window.location.search);
  debugEnabled =
    search.get('debugSage') === '1' ||
    window.localStorage?.getItem('debug-sage') === '1';
  return debugEnabled;
};

export const debugSageLog = (...args) => {
  if (isSageDebugEnabled()) {
    console.log(...args);
  }
};

const getMarker = () => {
  if (typeof document === 'undefined' || !isSageDebugEnabled()) {
    return null;
  }

  let marker = document.getElementById(markerId);
  if (marker) {
    return marker;
  }

  marker = document.createElement('div');
  marker.id = markerId;
  marker.style.position = 'fixed';
  marker.style.top = '12px';
  marker.style.left = '12px';
  marker.style.zIndex = '2147483647';
  marker.style.padding = '8px 10px';
  marker.style.background = 'rgba(0,0,0,0.8)';
  marker.style.color = '#7CFF6B';
  marker.style.font = '12px/1.4 monospace';
  marker.style.whiteSpace = 'pre-wrap';
  marker.style.maxWidth = '520px';
  marker.style.pointerEvents = 'none';
  marker.style.border = '1px solid rgba(124,255,107,0.45)';
  marker.textContent = '';
  document.body.appendChild(marker);
  return marker;
};

export const markStage = (label, data) => {
  const marker = getMarker();
  if (!marker) {
    return;
  }
  const timestamp = new Date().toISOString().slice(11, 19);
  const suffix = data ? ` ${JSON.stringify(data)}` : '';
  marker.textContent += `${timestamp} ${label}${suffix}\n`;
};
