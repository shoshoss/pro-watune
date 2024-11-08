// app/javascript/admin/test/audio_recorder.js

// Set up basic variables for app
const record = document.querySelector(".record");
const stop = document.querySelector(".stop");
const soundClips = document.querySelector(".sound-clips");
const canvas = document.querySelector(".visualizer");
const mainSection = document.querySelector(".main-controls");

// Disable stop button while not recording
stop.disabled = true;

// Visualiser setup - create web audio api context and canvas
let audioCtx;
const canvasCtx = canvas.getContext("2d");

// Main block for doing the audio recording
if (navigator.mediaDevices.getUserMedia) {
  console.log("The mediaDevices.getUserMedia() method is supported.");

  const constraints = { audio: true };
  let chunks = [];

  let onSuccess = function (stream) {
    const mediaRecorder = new MediaRecorder(stream);

    visualize(stream);

    record.onclick = function () {
      mediaRecorder.start();
      console.log(mediaRecorder.state);
      console.log("Recorder started.");
      record.style.background = "red";

      stop.disabled = false;
      record.disabled = true;
    };

    stop.onclick = function () {
      mediaRecorder.stop();
      console.log(mediaRecorder.state);
      console.log("Recorder stopped.");
      record.style.background = "";
      record.style.color = "";

      stop.disabled = true;
      record.disabled = false;
    };

    mediaRecorder.onstop = function (e) {
      console.log("Last data to read (after MediaRecorder.stop() called).");

      const clipName = prompt(
        "Enter a name for your sound clip?",
        "My unnamed clip"
      );

      const clipContainer = document.createElement("article");
      const clipLabel = document.createElement("p");
      const audio = document.createElement("audio");
      const deleteButton = document.createElement("button");

      clipContainer.classList.add("clip");
      audio.setAttribute("controls", "");
      deleteButton.textContent = "Delete";
      deleteButton.className = "delete";

      if (clipName === null) {
        clipLabel.textContent = "My unnamed clip";
      } else {
        clipLabel.textContent = clipName;
      }

      clipContainer.appendChild(audio);
      clipContainer.appendChild(clipLabel);
      clipContainer.appendChild(deleteButton);
      soundClips.appendChild(clipContainer);

      audio.controls = true;
      const blob = new Blob(chunks, { type: mediaRecorder.mimeType });
      chunks = [];
      const audioURL = window.URL.createObjectURL(blob);
      audio.src = audioURL;
      console.log("recorder stopped");

      deleteButton.onclick = function (e) {
        e.target.closest(".clip").remove();
      };

      clipLabel.onclick = function () {
        const existingName = clipLabel.textContent;
        const newClipName = prompt("Enter a new name for your sound clip?");
        if (newClipName === null) {
          clipLabel.textContent = existingName;
        } else {
          clipLabel.textContent = newClipName;
        }
      };
    };

    mediaRecorder.ondataavailable = function (e) {
      chunks.push(e.data);
    };
  };

  let onError = function (err) {
    console.log("The following error occured: " + err);
  };

  navigator.mediaDevices.getUserMedia(constraints).then(onSuccess, onError);
} else {
  console.log("MediaDevices.getUserMedia() not supported on your browser!");
}

function visualize(stream) {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }

  const source = audioCtx.createMediaStreamSource(stream);
  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 2048;
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  source.connect(analyser);
  analyser.smoothingTimeConstant = 0.9; // スムージングを適用

  const WIDTH = canvas.width;
  const HEIGHT = canvas.height;
  const centerX = WIDTH / 2;
  const centerY = HEIGHT / 2;

  function draw() {
    if (!canvasCtx) return;

    const maxRadius = Math.max(WIDTH, HEIGHT) / 2;
    const step = (maxRadius / bufferLength) * 2;

    requestAnimationFrame(draw);
    analyser.getByteFrequencyData(dataArray); // 周波数データを取得

    canvasCtx.clearRect(0, 0, WIDTH, HEIGHT); // 画面をクリア

    for (let i = 0; i < bufferLength; i++) {
      const radius = step * i;
      const amplitude = dataArray[i] / 256.0; // 振幅を0-1に正規化

      // 振幅に応じて青色の明るさを調整 (大きいほど明るく)
      const hue = 200; // 固定の青色
      const lightness = 50 + amplitude * 50; // 振幅に応じて明るさを調整 (50% - 100%)
      const color = `hsl(${hue}, 100%, ${lightness}%)`; // 青色の明るさを調整

      canvasCtx.beginPath();
      canvasCtx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      canvasCtx.strokeStyle = color;
      canvasCtx.lineWidth = 2;
      canvasCtx.stroke();
    }
  }

  draw();
}

window.onresize = function () {
  canvas.width = mainSection.offsetWidth;
};

window.onresize();
