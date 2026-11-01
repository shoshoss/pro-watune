# CVE-2026-66066 の暫定対策。Rails 8.1.4 へ更新したら見直すこと（Issue #718）。

# Active Storage の設定を読み込む初期化処理より前に変更し、設定を確実に反映させる。
Rails.application.config.active_storage.analyzers.delete(ActiveStorage::Analyzer::ImageAnalyzer::Vips)
Rails.application.config.active_storage.analyzers.delete(ActiveStorage::Analyzer::ImageAnalyzer::ImageMagick)
