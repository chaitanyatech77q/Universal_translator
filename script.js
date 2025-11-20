const sourceText = document.getElementById('sourceText');
const translateBtn = document.getElementById('translateBtn');
const statusLabel = document.getElementById('statusLabel');
const translatedTextEl = document.getElementById('translatedText');
const playAudioBtn = document.getElementById('playAudioBtn');
const speakBtn = document.getElementById('speakBtn');
const languageSelect = document.getElementById('languageSelect');
const imageInput = document.getElementById('imageInput');

const voiceFallback = {
  'te':'te-IN','hi':'hi-IN','ta':'ta-IN','kn':'kn-IN','ml':'ml-IN','fr':'fr-FR','es':'es-ES','de':'de-DE','zh-CN':'zh-CN','ar':'ar-SA'
};

function setStatus(text){
  statusLabel.textContent = text;
}

async function translateText() {
  const text = sourceText.value.trim();
  if(!text){
    setStatus('Please enter or capture some text first.');
    return;
  }
  const target = languageSelect.value;
  try {
    setStatus('Translating…');
    translateBtn.disabled = true;
    const url = `https://api.mymemory.translated.net/get`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `q=${encodeURIComponent(text)}&langpair=en|${target}`
    });

    if(!response.ok) throw new Error('Network error');
    
    const data = await response.json();
    const translated = data?.responseData?.translatedText ?? 'Translation unavailable';
    translatedTextEl.textContent = translated;
    setStatus('Done.');
  } catch (error) {
    console.error(error);
    setStatus('Unable to translate right now. Please try again.');
  } finally {
    translateBtn.disabled = false;
  }
}

translateBtn.addEventListener('click', translateText);

playAudioBtn.addEventListener('click', () => {
  const textToSpeak = translatedTextEl.textContent.trim();
  if (!textToSpeak || textToSpeak === '—') {
    setStatus('Translate something to hear it.');
    return;
  }

  const langCode = languageSelect.value;
  // Using Google Translate's unofficial TTS API for broader language support
  const audio = new Audio(`https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&q=${encodeURIComponent(textToSpeak)}&tl=${langCode}`);
  
  playAudioBtn.disabled = true;
  setStatus('Playing audio…');

  audio.addEventListener('ended', () => {
    setStatus('Audio playback complete.');
    playAudioBtn.disabled = false;
  });
  audio.addEventListener('error', () => {
    setStatus('Could not play audio. Please try again.');
    playAudioBtn.disabled = false;
  });
  audio.play();
});

if('webkitSpeechRecognition' in window || 'SpeechRecognition' in window){
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.addEventListener('result', event => {
    const transcript = event.results[0][0].transcript;
    sourceText.value = transcript;
    setStatus('Voice captured.');
  });
  recognition.addEventListener('end', () => {
    speakBtn.textContent = '🎙️ Speak';
    speakBtn.disabled = false;
  });
  recognition.addEventListener('error', () => {
    setStatus('Could not capture speech.');
  });

  speakBtn.addEventListener('click', () => {
    if(speakBtn.disabled) return;
    speakBtn.textContent = 'Listening…';
    speakBtn.disabled = true;
    setStatus('Listening…');
    recognition.start();
  });
} else {
  speakBtn.disabled = true;
  speakBtn.textContent = 'Speech unavailable';
  setStatus('Speech capture not supported in this browser.');
}

imageInput.addEventListener('change', async (event) => {
  const file = event.target.files?.[0];
  if(!file) return;
  setStatus('Scanning image…');
  try {
    const { data } = await Tesseract.recognize(file, 'eng', {
      logger: (m) => setStatus(`Scanning image… ${Math.round((m.progress||0)*100)}%`)
    });
    sourceText.value = data.text.trim();
    setStatus('Image text captured.');
  } catch (error) {
    console.error(error);
    setStatus('Could not read text from image.');
  } finally {
    event.target.value = '';
  }
});

