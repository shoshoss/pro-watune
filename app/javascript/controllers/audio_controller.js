// app/javascript/controllers/audio_controller.js
import { Controller } from "@hotwired/stimulus";

export default class extends Controller {
  static targets = ["playButton"];

  connect() {
    this.updateAllIconsToPlay(); // 初期化時に全アイコンを再生ボタンに設定
    this.initializeControls();
  }

  // 新規追加: コントロールの初期化
  initializeControls() {
    document.querySelectorAll("audio").forEach((audio) => {
      const audioId = audio.id.split("-")[1];

      // 速度コントロールの初期化
      const speedControl = document.getElementById(`speed-${audioId}`);
      if (speedControl) {
        speedControl.value = "1.0";
        audio.playbackRate = 1.0;
      }

      // 音量コントロールの初期化
      const volumeControl = document.getElementById(`volume-${audioId}`);
      if (volumeControl) {
        const defaultVolume = 100;
        volumeControl.value = defaultVolume;
        audio.volume = defaultVolume / 100;
      }

      // 再生終了時のイベントリスナーを追加
      audio.addEventListener("ended", () => {
        this.handleAudioEnd(audioId);
      });
    });
  }

  // 再生速度変更
  changeSpeed(event) {
    const speedControl = event.currentTarget;
    const audioId = speedControl.dataset.audioId;
    const audio = document.getElementById(`audio-${audioId}`);
    if (audio) {
      audio.playbackRate = parseFloat(speedControl.value);
    }
  }

  // 音量変更
  changeVolume(event) {
    const audioElement = document.getElementById(`audio-${this.audioId}`);
    if (!audioElement) return;

    // 0-150のレンジを0-1.5に変換
    const volumeValue = parseFloat(event.target.value) / 100;
    audioElement.volume = volumeValue;
  }

  // 音声終了時の処理を追加
  handleAudioEnd(audioId) {
    const audio = document.getElementById(`audio-${audioId}`);
    const seekBar = document.querySelector(
      `input[data-seek-control][data-audio-id="${audioId}"]`
    );
    const volumeControl = document.querySelector(
      `input[data-volume-control][data-audio-id="${audioId}"]`
    );
    const volumeValue = document.getElementById(`volume-value-${audioId}`);

    // シークバーのリセット
    if (seekBar) {
      seekBar.value = 0;
    }

    // 音量は維持
    if (volumeControl && audio) {
      const currentVolume = parseInt(volumeControl.value);
      audio.volume = currentVolume / 100;
    }
  }

  // seek メソッドも修正
  seek(event) {
    const seekBar = event.currentTarget;
    if (!seekBar.dataset.seekControl) return; // シークバーの確認

    const audioId = seekBar.dataset.audioId;
    const audio = document.getElementById(`audio-${audioId}`);
    if (audio) {
      audio.currentTime = seekBar.value;
    }
  }

  // すべての音声アイコンを再生ボタンに設定
  updateAllIconsToPlay() {
    document.querySelectorAll(".audio-icon").forEach((icon) => {
      icon.classList.remove("fa-pause");
      icon.classList.add("fa-play");
    });
  }

  // 再生/一時停止ボタンがクリックされたときの処理
  playPause(event) {
    event.stopPropagation();
    const button = event.currentTarget;
    const audioId = button.dataset.audioId;
    const audio = document.getElementById(`audio-${audioId}`);
    const icon = document.getElementById(`audio-icon-${audioId}`);
    // シークバーの取得を修正
    const seekBar = document.querySelector(
      `input[data-seek-control][data-audio-id="${audioId}"]`
    );
    const postBody = document.querySelector(`div[data-audio-id="${audioId}"]`);

    this.stopAllOtherAudios(audioId);

    if (!audio) return;

    if (audio.paused) {
      // 音量の復元
      const volumeControl = document.querySelector(
        `input[data-volume-control][data-audio-id="${audioId}"]`
      );
      if (volumeControl) {
        const currentVolume = volumeControl.value;
        audio.volume = parseInt(currentVolume) / 100;
      }

      audio
        .play()
        .then(() => {
          this.updateIcon(icon, true);
          this.updateButtonColor(button, true);
          this.updateTextColor(audioId, true);
        })
        .catch((error) => {
          console.error("Playback failed:", error);
          alert(`音声の再生に失敗しました: ${error.message}`);
          this.updateIcon(icon, false);
          this.updateButtonColor(button, false);
          this.updateTextColor(audioId, false);
        });

      // timeupdate イベントリスナーを修正
      audio.addEventListener("timeupdate", () => {
        this.updateCurrentTimeDisplay(audioId, audio.currentTime);
        // シークバーのみを更新
        if (seekBar) {
          seekBar.value = audio.currentTime;
        }
      });

      // シークバーのイベントリスナーを修正
      if (seekBar) {
        seekBar.addEventListener("input", () => {
          audio.currentTime = seekBar.value;
        });
      }
    } else {
      audio.pause();
      this.updateIcon(icon, false);
      this.updateButtonColor(button, false);
      this.updateTextColor(audioId, false);
    }
  }

  // シークバーの位置を変更したときの処理
  seek(event) {
    const seekBar = event.currentTarget;
    const audioId = seekBar.dataset.audioId;
    const audio = document.getElementById(`audio-${audioId}`);
    if (audio) {
      audio.currentTime = seekBar.value;
    }
  }

  // アイコンの状態を更新
  updateIcon(icon, isPlaying) {
    icon.classList.toggle("fa-play", !isPlaying);
    icon.classList.toggle("fa-pause", isPlaying);
  }

  // 現在の再生時間を表示
  updateCurrentTimeDisplay(audioId, currentTime) {
    const currentElem = document.getElementById(`current-time-${audioId}`);
    if (currentElem) {
      currentElem.textContent = this.formatTime(currentTime);
    }
  }

  // 再生時間をフォーマット
  formatTime(time) {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }

  // ホバー時の色変更
  hoverEffect() {
    this.playButtonTarget.classList.remove("text-blue-500");
    this.playButtonTarget.classList.add("text-sky-400-accent");
  }

  // ホバー解除時の色変更
  unhoverEffect() {
    this.playButtonTarget.classList.remove("text-sky-400-accent");
    this.playButtonTarget.classList.add("text-blue-500");
  }

  // ボタンの色を更新
  updateButtonColor(element, isPlaying) {
    if (isPlaying) {
      element.classList.add("text-sky-400-accent");
      element.classList.remove("text-blue-500");
    } else {
      element.classList.remove("text-sky-400-accent");
      element.classList.add("text-blue-500");
    }
  }

  // テキストとアイコンの色を更新
  updateTextColor(audioId, isPlaying) {
    const postBody = document.querySelector(`div[data-audio-id="${audioId}"]`);
    if (postBody) {
      if (isPlaying) {
        postBody.classList.add("text-sky-400-accent");
        postBody.classList.remove("text-blue-500");
      } else {
        postBody.classList.remove("text-sky-400-accent");
        postBody.classList.add("text-blue-500");
      }
    }

    const xIcon = document.querySelector(`#x-icon-${audioId}`);
    if (xIcon) {
      if (isPlaying) {
        xIcon.classList.add("text-sky-400-accent");
        xIcon.classList.remove("text-black-500");
      } else {
        xIcon.classList.remove("text-sky-400-accent");
        xIcon.classList.add("text-black-500");
      }
    }
  }

  // 投稿をクリックしたときの処理
  navigateToPost(event) {
    const ignoredElements = [
      ".play-audio-button",
      ".audio-icon",
      'input[type="range"]',
      "a",
      "button",
      "audio",
      "select", // 速度調整用のセレクトボックスを追加
      ".speed-control", // クラスでも指定可能
      ".volume-control", // クラスでも指定可能
      'label[for^="speed-"]', // speed-で始まるfor属性を持つlabel
      'label[for^="volume-"]', // volume-で始まるfor属性を持つlabel
    ];
    if (ignoredElements.some((selector) => event.target.closest(selector))) {
      return; // クリック対象が無視リストのいずれかに一致する場合は何もしない
    }

    const postBody = event.currentTarget;
    const url = postBody.dataset.url;
    const audioId = postBody.dataset.postId;

    console.log("navigateToPost", { url, audioId }); // デバッグ用ログ

    if (!url) {
      this.toggleAudioPlayback(audioId, postBody);
    } else {
      Turbo.visit(url); // Turboを使用して遷移
    }
  }

  // 他のすべての音声を停止
  stopAllOtherAudios(currentAudioId) {
    document
      .querySelectorAll(`audio:not(#audio-${currentAudioId})`)
      .forEach((audio) => {
        if (!audio.paused) {
          audio.pause();
          const audioId = audio.id.replace("audio-", "");
          this.updateIcon(
            document.getElementById(`audio-icon-${audioId}`),
            false
          );
          this.updateButtonColor(
            document.querySelector(`button[data-audio-id="${audioId}"]`),
            false
          );
          this.updateTextColor(audioId, false);
        }
      });
  }

  // 音声の再生/一時停止を切り替える
  toggleAudioPlayback(audioId, postBody) {
    const audioElement = document.getElementById(`audio-${audioId}`);
    if (audioElement) {
      this.stopAllOtherAudios(audioId);

      if (audioElement.paused) {
        audioElement
          .play()
          .then(() => {
            this.updateIcon(
              document.getElementById(`audio-icon-${audioId}`),
              true
            );
            this.updateButtonColor(
              postBody.querySelector(`button[data-audio-id="${audioId}"]`),
              true
            );
            this.updateTextColor(audioId, true); // IDを使って更新
          })
          .catch((error) => {
            console.error("Playback failed:", error);
            alert(`音声の再生に失敗しました: ${error.message}`);
            this.updateIcon(
              document.getElementById(`audio-icon-${audioId}`),
              false
            );
            this.updateButtonColor(
              postBody.querySelector(`button[data-audio-id="${audioId}"]`),
              false
            );
            this.updateTextColor(audioId, false); // IDを使って更新
          });
      } else {
        audioElement.pause();
        this.updateIcon(
          document.getElementById(`audio-icon-${audioId}`),
          false
        );
        this.updateButtonColor(
          postBody.querySelector(`button[data-audio-id="${audioId}"]`),
          false
        );
        this.updateTextColor(audioId, false); // IDを使って更新
      }
    }
  }
}
