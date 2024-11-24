// app/javascript/controllers/post_create_controller.js
import { Controller } from "@hotwired/stimulus";

export default class extends Controller {
  static values = {
    maxRecordingTime: { type: Number, default: 3600.9999 }, // 1時間
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
    try {
      // 利用可能な形式を確認
      const options = this.getSupportedAudioFormat();
      this.mediaRecorder = new MediaRecorder(stream, options);
      console.log(`録音形式: ${this.mediaRecorder.mimeType}`);
    } catch (error) {
      console.warn(
        "推奨形式が使用できません。デフォルト設定を使用します:",
        error
      );
      this.mediaRecorder = new MediaRecorder(stream);
    }
  }

  getSupportedAudioFormat() {
    // 優先順位順にフォーマットをチェック
    const formats = [
      { mimeType: "audio/mpeg", bitRate: 128000 },
      { mimeType: "audio/webm;codecs=opus", bitRate: 128000 },
    ];

    for (const format of formats) {
      if (MediaRecorder.isTypeSupported(format.mimeType)) {
        return {
          mimeType: format.mimeType,
          bitsPerSecond: format.bitRate,
        };
      }
    }

    return {}; // デフォルト設定を使用
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
            alert("録音時間が制限時間（1時間）に達しました。");
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
    if (!this.mediaRecorder || this.mediaRecorder.state === "inactive") return;

    this.mediaRecorder.stop();
    clearInterval(this.recordingInterval);

    // 録音停止時は開始ボタンを無効化したままにする
    const recordButton = this.element.querySelector(".record");
    if (recordButton) {
      recordButton.disabled = true;
    }

    const stopButton = this.element.querySelector(".stop");
    if (stopButton) {
      stopButton.disabled = true;
    }

    this.shouldStop = true;
    cancelAnimationFrame(this.animationFrameRequest);
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
      recordButton.classList.add("bg-green-500", "hover:bg-green-700");
    }

    const stopButton = this.element.querySelector(".stop");
    if (stopButton) {
      stopButton.disabled = true;
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
  async handleRecordingStop(chunks) {
    if (!chunks || chunks.length === 0) {
      this.showError("録音データが取得できませんでした");
      return;
    }

    try {
      this.showLoading("音声を処理中...");

      // 音声データの形式を確認
      const mimeType = this.mediaRecorder.mimeType;
      let audioFile;

      if (mimeType.includes("mpeg")) {
        // すでにMP3形式の場合
        audioFile = new File(chunks, `recording-${Date.now()}.mp3`, {
          type: "audio/mpeg",
        });
      } else {
        // WebMまたは他の形式の場合、MP3に変換を試みる
        try {
          const blob = new Blob(chunks, { type: mimeType });
          audioFile = await this.convertToMp3(blob);
          console.log("MP3変換成功");
        } catch (conversionError) {
          console.warn("MP3変換失敗:", conversionError);
          // 変換失敗時は元の形式のまま
          audioFile = new File(chunks, `recording-${Date.now()}.webm`, {
            type: mimeType,
          });
        }
      }

      // 録音時間の設定
      const actualDuration = await this.getAudioDuration(audioFile);
      console.log("Actual duration:", actualDuration);

      // フィールドの設定
      const durationField = document.getElementById("post_duration");
      if (durationField) {
        durationField.value = Math.floor(actualDuration); // 秒単位で四捨五入
      }

      // プレビューの設定
      const audioURL = URL.createObjectURL(audioFile);
      this.previewAudioURL = audioURL;
      this.createSoundClip(audioURL, audioFile.type);

      // フォームへのファイル設定
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) {
        const dt = new DataTransfer();
        dt.items.add(audioFile);
        fileInput.files = dt.files;
      }

      this.hideLoading();
      this.checkForm();
    } catch (error) {
      console.error("音声処理エラー:", error);
      this.hideLoading();
      this.showError("音声の処理に失敗しました。もう一度お試しください。");
      this.clearData();
    }
  }

  // WebMからMP3への変換処理
  async convertToMp3(webmBlob) {
    try {
      // WebMをAudioBufferに変換
      const arrayBuffer = await webmBlob.arrayBuffer();
      const audioContext = new AudioContext();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      // AudioBufferからPCMデータを取得
      const samples = new Int16Array(audioBuffer.length);
      const channel = audioBuffer.getChannelData(0);

      // Float32をInt16に変換
      for (let i = 0; i < audioBuffer.length; i++) {
        samples[i] = Math.min(1, Math.max(-1, channel[i])) * 0x7fff;
      }

      // MP3エンコード
      const mp3encoder = new lamejs.Mp3Encoder(1, audioBuffer.sampleRate, 128);
      const mp3Data = [];

      const blockSize = 1152; // MP3フレームサイズ
      for (let i = 0; i < samples.length; i += blockSize) {
        const mono = samples.subarray(i, i + blockSize);
        const mp3buf = mp3encoder.encodeBuffer(mono);
        if (mp3buf.length > 0) {
          mp3Data.push(new Int8Array(mp3buf));
        }
      }

      // 最後のフレームを処理
      const mp3buf = mp3encoder.flush();
      if (mp3buf.length > 0) {
        mp3Data.push(new Int8Array(mp3buf));
      }

      // MP3ファイルの作成
      const blob = new Blob(mp3Data, { type: "audio/mpeg" });
      return new File([blob], `recording-${Date.now()}.mp3`, {
        type: "audio/mpeg",
      });
    } catch (error) {
      console.error("MP3変換エラー:", error);
      throw new Error("音声の変換に失敗しました");
    }
  }

  // ローディング表示の改善
  showLoading(message = "処理中...") {
    const loadingHtml = `
    <div id="loading-overlay" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded-lg shadow-lg text-center max-w-sm mx-4">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p class="text-gray-700 text-lg">${message}</p>
      </div>
    </div>
  `;
    document.body.insertAdjacentHTML("beforeend", loadingHtml);
  }

  // ローディング非表示のメソッド
  hideLoading() {
    const overlay = document.getElementById("loading-overlay");
    if (overlay) {
      overlay.remove();
    }
  }

  // エラー表示のメソッド
  showError(message) {
    const errorHtml = `
    <div id="error-message" 
         class="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-lg" 
         role="alert">
      <strong class="font-bold">エラー: </strong>
      <span class="block sm:inline">${message}</span>
    </div>
  `;
    document.body.insertAdjacentHTML("beforeend", errorHtml);

    // 5秒後に自動で消える
    setTimeout(() => {
      const errorMessage = document.getElementById("error-message");
      if (errorMessage) {
        errorMessage.remove();
      }
    }, 5000);
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
  // 音声ファイルの実際の長さを取得するメソッド
  async getAudioDuration(audioFile) {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      const objectUrl = URL.createObjectURL(audioFile);

      audio.addEventListener("loadedmetadata", () => {
        URL.revokeObjectURL(objectUrl);
        resolve(audio.duration);
      });

      audio.addEventListener("error", (error) => {
        URL.revokeObjectURL(objectUrl);
        reject(error);
      });

      audio.src = objectUrl;
    });
  }

  // 音声ファイルの実際の長さを取得するメソッド
  async getAudioDuration(audioFile) {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      const objectUrl = URL.createObjectURL(audioFile);

      audio.addEventListener("loadedmetadata", () => {
        URL.revokeObjectURL(objectUrl);
        resolve(audio.duration);
      });

      audio.addEventListener("error", (error) => {
        URL.revokeObjectURL(objectUrl);
        reject(error);
      });

      audio.src = objectUrl;
    });
  }
}
