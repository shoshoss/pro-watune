import { Controller } from "@hotwired/stimulus";

export default class extends Controller {
  playPause(event) {
    console.log("playPause triggered");
    const button = event.currentTarget;
    const audioId = button.dataset.audioId;
    const audio = document.querySelector(`audio[id="audio-${audioId}"]`);

    if (!audio) {
      console.error("Audio element not found!");
      return;
    }

    if (audio.paused) {
      audio
        .play()
        .then(() => {
          button.classList.remove("fa-play");
          button.classList.add("fa-pause");
          button.innerHTML =
            '<i class="fas fa-pause text-3xl text-blue-500 hover:text-blue-700"></i>';
        })
        .catch((error) => {
          console.error("Playback failed:", error);
        });
    } else {
      audio.pause();
      button.classList.remove("fa-pause");
      button.classList.add("fa-play");
      button.innerHTML =
        '<i class="fas fa-play text-3xl text-blue-500 hover:text-blue-700"></i>';
    }
  }
}
