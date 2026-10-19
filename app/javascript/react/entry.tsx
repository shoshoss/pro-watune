import { createRoot, type Root } from 'react-dom/client';
import type { ComponentType } from 'react';
import HelloReact from './components/HelloReact';

// <react-component name="名前"> で呼び出せるコンポーネントの一覧
const components: Record<string, ComponentType<any>> = { HelloReact };

// <react-component name="HelloReact" props='{"name":"..."}'></react-component>
// 画面に追加されたら React を組み立て、画面から取り除かれたら片付ける。
// ページ移動・Turbo Frame の差し替え・Turbo Stream・戻る/進む のどれでも同じように動く。
class ReactComponentElement extends HTMLElement {
  private root: Root | null = null;

  // 要素が画面に追加されたときにブラウザが呼ぶ
  connectedCallback(): void {
    if (this.root) return;

    const name = this.getAttribute('name') ?? '';
    const Component = components[name];
    if (!Component) {
      console.error(`[react] 未登録のコンポーネントです: ${name}`);
      return;
    }

    let props = {};
    try {
      props = JSON.parse(this.getAttribute('props') ?? '{}');
    } catch (error) {
      console.error('[react] props のJSONが不正です', error);
      return;
    }

    // Turbo のキャッシュから復元された場合、前回の表示が残っているので消してから組み立てる
    this.replaceChildren();
    this.root = createRoot(this);
    this.root.render(<Component {...props} />);
  }

  // 要素が画面から取り除かれたときにブラウザが呼ぶ
  disconnectedCallback(): void {
    this.root?.unmount();
    this.root = null;
  }
}

// 同じ名前を二重に登録するとエラーになるため、未登録のときだけ登録する
if (!customElements.get('react-component')) {
  customElements.define('react-component', ReactComponentElement);
}
