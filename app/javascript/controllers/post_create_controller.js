import { Controller } from "@hotwired/stimulus";

export default class extends Controller {
  static values = {
    maxRecordingTime: { type: Number, default: 195.999 }, // 3分15秒
  };

  audioCtx;
  canvasCtx;
  mediaRecorder;
  shouldStop = false;
  animationFrameRequest;
  startTime;
  recordingInterval;
  totalRecordingTime = 0;
  previewAudioURL;

  // 初期設定 コントローラが接続されたときに呼ばれる
  connect() {
    this.checkForm(); // フォームの初期状態をチェック

    // 録音データのクリア処理を追加
    window.addEventListener("beforeunload", this.clearData.bind(this));

    // ページが読み込まれた時に音声録音の許可を取得
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        console.log("Audio recording permission granted.");
        this.initializeMediaRecorder(stream); // MediaRecorderの初期化
      })
      .catch((error) => {
        console.error("Error: Unable to access microphone.", error);
        alert("マイクのアクセスが許可されていません。設定を確認してください。");
      });
  }

  // MediaRecorderの初期化処理を行うメソッド
  initializeMediaRecorder(stream) {
    this.mediaRecorder = new MediaRecorder(stream);
    console.log("MediaRecorder initialized.");
  }

  disconnect() {
    // コントローラが切断されるときにイベントリスナーを削除
    window.removeEventListener("beforeunload", this.clearData.bind(this));
  }

  // フォームの状態をチェックし、投稿ボタンの有効/無効を切り替えるメソッド
  checkForm() {
    const textArea = this.element.querySelector("#body");
    const hasText = textArea && textArea.value.trim().length > 0;
    const soundClips = this.element.querySelector(".sound-clips");
    const hasAudio = soundClips.querySelector("audio") !== null;

    const durationField = document.getElementById("post_duration");
    const hasDuration = durationField && durationField.value !== "";

    const submitButton = this.element.querySelector('input[type="submit"]');
    if (hasText || (hasAudio && hasDuration)) {
      submitButton.disabled = false;
      submitButton.classList.remove("opacity-50");
      submitButton.classList.remove("cursor-not-allowed");
    } else {
      submitButton.disabled = true;
      submitButton.classList.add("opacity-50");
      submitButton.classList.add("cursor-not-allowed");
    }
  }

  // 録音開始
  startRecording() {
    this.clearData();

    const canvas = this.element.querySelector(".visualizer");
    if (!canvas) {
      console.error("Canvas要素が見つかりませんでした！");
      return;
    }

    this.canvasCtx = canvas.getContext("2d");
    if (!this.audioCtx) {
      this.audioCtx = new AudioContext();
    }

    if (this.mediaRecorder) {
      let chunks = [];

      // 録音開始時刻を設定
      this.startTime = Date.now();
      this.totalRecordingTime = 0;

      // 録音ボタンの制御
      this.element.querySelector(".record").disabled = true;
      this.element.querySelector(".stop").disabled = false;
      this.element.querySelector('input[type="submit"]').disabled = true;
      this.shouldStop = false;

      // タイマーの更新と制限時間のチェック
      this.recordingInterval = setInterval(() => {
        if (!this.startTime) return; // startTimeがnullの場合は処理を中止

        const currentTime = Date.now();
        const elapsedTime = (currentTime - this.startTime) / 1000;

        // 制限時間のチェック
        if (elapsedTime >= this.maxRecordingTimeValue) {
          const stopButton = document.getElementById("stopRecordingButton");
          if (stopButton) {
            stopButton.click();
            alert("録音時間が制限時間（3分15秒）に達しました。");
            clearInterval(this.recordingInterval); // インターバルをクリア
          }
          return;
        }

        this.updateTimer(elapsedTime);
      }, 1000);

      this.mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      this.mediaRecorder.onstop = (e) => this.handleRecordingStop(chunks);
      this.mediaRecorder.start();

      this.visualize(this.mediaRecorder.stream);
    } else {
      console.error("MediaRecorder is not initialized.");
    }
  }

  // 録音を停止するメソッド
  stopRecording() {
    this.mediaRecorder.stop();
    clearInterval(this.recordingInterval);

    // 録音ボタンのスタイルを元に戻す
    const recordButton = this.element.querySelector(".record");
    clearInterval(this.recordingInterval);
    this.element.querySelector(".record").disabled = false;
    this.element.querySelector(".stop").disabled = true;
    recordButton.classList.add("bg-blue-500", "hover:bg-blue-700");

    const stopButton = this.element.querySelector(".stop");
    stopButton.disabled = true;

    this.shouldStop = true;
    cancelAnimationFrame(this.animationFrameRequest);

    // タイマー表示のリセット
    // this.element.querySelector(".timer").textContent = "00:00";

    this.checkForm();
  }

  // 録音データのクリア
  clearData() {
    // サウンドクリップのクリア
    this.element.querySelector(".sound-clips").innerHTML = "";

    // ファイル入力のクリア
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) {
      // DataTransferオブジェクトをリセット
      const dt = new DataTransfer();
      fileInput.files = dt.files; // 空のファイルリストを設定
      fileInput.value = ""; // 値もクリア
    }

    // durationフィールドのクリア
    const durationField = document.getElementById("post_duration");
    if (durationField) {
      durationField.value = "";
    }

    // タイマーのリセット
    const timerElement = this.element.querySelector(".timer");
    if (timerElement) {
      timerElement.textContent = "00:00";
    }

    // 録音関連の状態をリセット
    this.startTime = null;
    if (this.recordingInterval) {
      clearInterval(this.recordingInterval);
      this.recordingInterval = null;
    }
    this.shouldStop = false;

    // オーディオリソースの解放
    if (this.previewAudioURL) {
      URL.revokeObjectURL(this.previewAudioURL);
      this.previewAudioURL = null;
    }

    // ボタンの状態をリセット
    const recordButton = this.element.querySelector(".record");
    if (recordButton) {
      recordButton.disabled = false;
    }

    // Submitボタンの状態を更新
    const submitButton = this.element.querySelector('input[type="submit"]');
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.classList.add("opacity-50");
      submitButton.classList.add("cursor-not-allowed");
    }
  }

  // タイマー更新
  updateTimer(elapsedSeconds) {
    const timerElement = this.element.querySelector(".timer");
    if (!timerElement) return;

    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = Math.floor(elapsedSeconds % 60);

    timerElement.textContent = `${this.pad(minutes)}:${this.pad(seconds)}`;
  }

  // 数字を2桁に整形するメソッド
  pad(number) {
    return number < 10 ? "0" + number : number;
  }

  // 録音停止後の処理
  handleRecordingStop(chunks) {
    // 録音データをBlobに変換
    const blob = new Blob(chunks, { type: this.mediaRecorder.mimeType });

    // Blobから生成されたURLを取得
    const audioURL = window.URL.createObjectURL(blob);
    this.previewAudioURL = audioURL; // プレビュー用のオーディオURLを設定
    this.previewAudioType = this.mediaRecorder.mimeType; // プレビュー用のMIMEタイプを設定

    // 録音時間を計算
    const duration = Math.floor((Date.now() - this.startTime) / 1000); // 秒単位で録音時間を計算

    // 隠しフィールドに録音時間をセット
    const durationField = document.getElementById("post_duration");
    if (durationField) {
      durationField.value = duration;
    }

    // プレビュー用のサウンドクリップを作成
    this.createSoundClip(audioURL, this.mediaRecorder.mimeType);

    // MIMEタイプからファイル拡張子を決定
    const mimeType = this.mediaRecorder.mimeType;
    const fileExtension = mimeType.split("/")[1].split(";")[0];

    // 録音データをファイルに変換
    const file = new File([blob], `recording.${fileExtension}`, {
      type: mimeType,
    });

    // DataTransferオブジェクトを使用してファイル入力にファイルを設定
    const dt = new DataTransfer();
    dt.items.add(file);
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) {
      fileInput.files = dt.files; // 入力フィールドに音声ファイルをセット
    }

    // Submitボタンを有効化
    const submitButton = fileInput.form.querySelector('input[type="submit"]');
    if (submitButton) {
      submitButton.disabled = false;
    }

    // フォームの状態を再チェック
    this.checkForm();
  }

  // 音声クリップを生成して表示するメソッド
  createSoundClip(audioURL, mimeType) {
    const clipContainer = document.createElement("div");
    clipContainer.className =
      "clip flex flex-col items-center w-full max-w-screen-lg mx-auto my-2 p-2 border border-gray-200 rounded overflow-hidden";

    const audio = document.createElement("audio");
    audio.controls = true;
    audio.src = audioURL;
    audio.type = mimeType;
    audio.className = "w-full";

    const deleteButton = this.createDeleteButton();

    clipContainer.appendChild(deleteButton);
    clipContainer.appendChild(audio);

    const soundClips = this.element.querySelector(".sound-clips");
    if (soundClips) {
      soundClips.innerHTML = "";
      soundClips.appendChild(clipContainer);
    }
  }

  // 削除ボタンを生成するメソッド
  createDeleteButton() {
    const deleteButton = document.createElement("button");
    deleteButton.textContent = "削除";
    deleteButton.className =
      "bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded mb-2 flex justify-center";

    deleteButton.onclick = () => {
      this.clearData();
      this.checkForm();
    };

    return deleteButton;
  }

  // 可視化処理
  visualize(stream) {
    const source = this.audioCtx.createMediaStreamSource(stream);
    const analyser = this.audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    source.connect(analyser);
    analyser.smoothingTimeConstant = 0.9; // スムージングを適用

    const visualizerElement = this.element.querySelector(".visualizer");
    const WIDTH = visualizerElement.width;
    const HEIGHT = visualizerElement.height;
    const centerX = WIDTH / 2;
    const centerY = HEIGHT / 2;

    const draw = () => {
      if (this.shouldStop) return;
      this.animationFrameRequest = requestAnimationFrame(draw);

      analyser.getByteFrequencyData(dataArray); // 周波数データを取得

      this.canvasCtx.clearRect(0, 0, WIDTH, HEIGHT); // 画面をクリア

      let maxRadius = Math.max(WIDTH, HEIGHT) / 2;
      let step = (maxRadius / bufferLength) * 2;

      for (let i = 0; i < bufferLength; i++) {
        let radius = step * i;
        let amplitude = dataArray[i] / 256.0; // 振幅を0-1に正規化

        // 振幅に応じて青色の明るさを調整 (大きいほど明るく)
        let hue = 200; // 固定の青色
        let lightness = 50 + amplitude * 50; // 振幅に応じて明るさを調整 (50% - 100%)
        let color = `hsl(${hue}, 100%, ${lightness}%)`; // 青色の明るさを調整

        this.canvasCtx.beginPath();
        this.canvasCtx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this.canvasCtx.strokeStyle = color;
        this.canvasCtx.lineWidth = 2;
        this.canvasCtx.stroke();
      }
    };

    draw();
  }
}
