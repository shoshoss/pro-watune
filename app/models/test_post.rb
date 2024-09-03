# app/models/test_post.rb
class TestPost < ApplicationRecord
  mount_uploader :audio, AudioUploader

  # カスタムバリデーションを追加し、bodyまたはaudioのどちらかが必須であることを検証
  validate :body_or_audio_present

  private

  def body_or_audio_present
    return unless body.blank? && audio.blank?

    errors.add(:base, '本文または音声のどちらか一方を入力してください')
  end
end
