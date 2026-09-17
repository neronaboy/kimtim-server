window.__kimtim_OFFSCREEN_LOADED = true;

let customPreviewAudio = null;
let backgroundMusicAudio = null;

function playSuccessSound() {
  try {
    const audio = document.getElementById('hitSound');
    if (audio) {
      audio.currentTime = 0;
      audio.volume = 0.5;
      audio.play().catch(err => {
        playFallbackSound();
      });
    } else {
      playFallbackSound();
    }
  } catch (error) {
    playFallbackSound();
  }
}

function playBackgroundMusic(audioData, volume) {
  if (!audioData) {
    return;
  }
  try {
    stopBackgroundMusic();
    backgroundMusicAudio = new Audio(audioData);
    backgroundMusicAudio.loop = true;
    backgroundMusicAudio.volume = volume || 0.5;
    backgroundMusicAudio.play().catch(err => {});
  } catch (error) {}
}

function stopBackgroundMusic() {
  try {
    if (backgroundMusicAudio) {
      backgroundMusicAudio.pause();
      backgroundMusicAudio.currentTime = 0;
      backgroundMusicAudio = null;
    }
  } catch (e) {}
}

function playCustomPreview(audioData) {
  if (!audioData) {
    return;
  }
  try {
    if (customPreviewAudio) {
      customPreviewAudio.pause();
      customPreviewAudio = null;
    }
    customPreviewAudio = new Audio(audioData);
    customPreviewAudio.volume = 0.5;
    customPreviewAudio.play().catch(err => {});
  } catch (error) {}
}

function stopCustomPreview() {
  try {
    if (customPreviewAudio) {
      customPreviewAudio.pause();
      customPreviewAudio.currentTime = 0;
      customPreviewAudio = null;
    }
  } catch (e) {}
}

function playFallbackSound() {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();

    const playNote = (frequency, startTime, duration) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };

    const now = audioContext.currentTime;
    playNote(523.25, now, 0.15);
    playNote(659.25, now + 0.12, 0.15);
    playNote(783.99, now + 0.24, 0.15);
    playNote(1046.50, now + 0.36, 0.3);
  } catch (error) {
  }
}

async function copyToClipboard(dataUrl) {
  try {
    const canvas = document.getElementById('imageCanvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = async () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      canvas.toBlob(async (blob) => {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
        } catch (err) {
        }
      }, 'image/png');
    };

    img.src = dataUrl;
  } catch (error) {
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'PLAY_SUCCESS_SOUND') {
    playSuccessSound();
    sendResponse({ success: true });
  } else if (message.type === 'PLAY_BACKGROUND_MUSIC') {
    playBackgroundMusic(message.audioData, message.volume);
    sendResponse({ success: true });
  } else if (message.type === 'STOP_BACKGROUND_MUSIC') {
    stopBackgroundMusic();
    sendResponse({ success: true });
  } else if (message.type === 'PLAY_CUSTOM_PREVIEW') {
    playCustomPreview(message.audioData);
    sendResponse({ success: true });
  } else if (message.type === 'STOP_CUSTOM_PREVIEW') {
    stopCustomPreview();
    sendResponse({ success: true });
  } else if (message.type === 'COPY_TO_CLIPBOARD') {
    copyToClipboard(message.dataUrl);
    sendResponse({ success: true });
  }
  return true;
});

document.addEventListener('DOMContentLoaded', () => {
  const audio = document.getElementById('hitSound');
  if (audio) {
    audio.load();
  }
});






