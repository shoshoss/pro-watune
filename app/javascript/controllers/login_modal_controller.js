import { Controller } from "@hotwired/stimulus";

export default class extends Controller {
  connect() {
    // ボタンクリック時にモーダルを開く処理
    this.element.setAttribute("open", true);
  }

  closeModal() {
    // モーダルを閉じる
    this.element.close();
  }

  afterCloseModal(event) {
    if (!event.detail.success) {
      // フォームのバリデーションエラーの場合はここで何もしない
      return;
    }

    Turbo.visit(window.location.href, { action: "replace" });
  }
}
