// Set up basic variables for app
const record = document.querySelector(".record");
const stop = document.querySelector(".stop");
const soundClips = document.querySelector(".sound-clips");
const canvas = document.querySelector(".visualizer");
const mainSection = document.querySelector(".main-controls");
const timerDisplay = document.querySelector(".timer"); // 録音のタイマー表示要素

// Disable stop button while not recording
stop.disabled = true;

// Visualiser setup - create web audio api context and canvas
let audioCtx;
const canvasCtx = canvas.getContext("2d");
let recordingInterval; // 録音時間のカウント用
let startTime; // 録音開始時間

// Main block for doing the audio recording
if (navigator.mediaDevices.getUserMedia) {
  console.log("The mediaDevices.getUserMedia() method is supported.");

  const constraints = { audio: true };
  let chunks = [];

  let onSuccess = function (stream) {
    const mediaRecorder = new MediaRecorder(stream);

    visualize(stream);

    record.addEventListener("click", function () {
      mediaRecorder.start();
      console.log(mediaRecorder.state);
      console.log("Recorder started.");
      record.style.background = "red";

      stop.disabled = false;
      record.disabled = true;

      // 録音開始時にカウントをリセットし、開始時間を記録
      startTime = Date.now();
      recordingInterval = setInterval(updateTimer, 1000);
    });

    stop.addEventListener("click", function () {
      mediaRecorder.stop();
      console.log(mediaRecorder.state);
      console.log("Recorder stopped.");
      record.style.background = "";
      record.style.color = "";

      stop.disabled = true;
      record.disabled = false;

      clearInterval(recordingInterval); // カウント停止
    });

    mediaRecorder.onstop = function (e) {
      console.log("Last data to read (after MediaRecorder.stop() called).");

      const clipContainer = document.createElement("div");
      clipContainer.className =
        "clip flex flex-col items-center w-full max-w-screen-lg mx-auto my-2 p-2 border border-gray-200 rounded overflow-hidden";

      const audio = document.createElement("audio");
      audio.controls = true;
      audio.style.width = "100%"; // プレビューの幅を100%に設定
      const deleteButton = document.createElement("button");

      deleteButton.textContent = "削除";
      deleteButton.className =
        "bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded mb-2 flex justify-center"; // 削除ボタンのデザイン

      clipContainer.appendChild(deleteButton);
      clipContainer.appendChild(audio);
      soundClips.innerHTML = ""; // 既存のクリップをクリアして新しいものを表示
      soundClips.appendChild(clipContainer);

      const blob = new Blob(chunks, { type: mediaRecorder.mimeType });
      chunks = [];
      const audioURL = window.URL.createObjectURL(blob);
      audio.src = audioURL;
      console.log("recorder stopped");

      // 録音が完了したら録音ボタンを無効化
      record.disabled = true;

      deleteButton.onclick = function (e) {
        e.target.closest(".clip").remove();
        // 削除ボタンを押した後に録音ボタンを再び有効化
        record.disabled = false;
        record.style.background = ""; // ボタンのスタイルをリセット
        resetTimer(); // タイマーのリセット
      };
    };

    mediaRecorder.ondataavailable = function (e) {
      chunks.push(e.data);
    };
  };

  let onError = function (err) {
    console.log("The following error occurred: " + err);
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

  draw();

  function draw() {
    const WIDTH = canvas.width;
    const HEIGHT = canvas.height;
    const centerX = WIDTH / 2;
    const centerY = HEIGHT / 2;

    requestAnimationFrame(draw);

    analyser.getByteFrequencyData(dataArray);

    canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

    const maxRadius = Math.max(WIDTH, HEIGHT) / 2;
    const step = (maxRadius / bufferLength) * 2;

    for (let i = 0; i < bufferLength; i++) {
      const radius = step * i;
      const amplitude = dataArray[i] / 256.0;

      const hue = 200;
      const lightness = 50 + amplitude * 50;
      const color = `hsl(${hue}, 100%, ${lightness}%)`;

      canvasCtx.beginPath();
      canvasCtx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      canvasCtx.strokeStyle = color;
      canvasCtx.lineWidth = 2;
      canvasCtx.stroke();
    }
  }
}

window.onresize = function () {
  canvas.width = mainSection.offsetWidth;
};

window.onresize();

// タイマーの更新処理
function updateTimer() {
  const elapsedTime = Date.now() - startTime;
  const seconds = Math.floor((elapsedTime / 1000) % 60);
  const minutes = Math.floor(elapsedTime / 1000 / 60);
  timerDisplay.textContent = `${pad(minutes)}:${pad(seconds)}`;
}

// タイマーのリセット処理
function resetTimer() {
  clearInterval(recordingInterval);
  timerDisplay.textContent = "00:00";
}

// 数字を2桁に整形するメソッド
function pad(number) {
  return number < 10 ? "0" + number : number;
}
