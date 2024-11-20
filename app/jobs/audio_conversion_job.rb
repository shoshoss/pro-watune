class AudioConversionJob < ApplicationJob
  queue_as :default
  retry_on StandardError, wait: 5.seconds, attempts: 3

  def perform(post_id)
    post = Post.find_by(id: post_id)
    return unless post&.audio&.attached?
    return if post.audio.content_type == 'audio/mpeg' # すでにMP3の場合はスキップ

    temp_original = Tempfile.new(['original', ".#{file_extension(post.audio.content_type)}"])
    temp_converted = Tempfile.new(['converted', '.mp3'])

    begin
      temp_original.binmode
      temp_original.write(post.audio.download)
      temp_original.rewind

      # MP3への変換を試みる
      result = system('ffmpeg',
                      '-i', temp_original.path,
                      '-c:a', 'libmp3lame',
                      '-b:a', '128k',
                      temp_converted.path)

      if result && File.exist?(temp_converted.path) && File.size(temp_converted.path).positive?
        post.audio.attach(
          io: File.open(temp_converted.path),
          filename: "#{SecureRandom.uuid}.mp3",
          content_type: 'audio/mpeg'
        )
        Rails.logger.info "音声変換成功: Post ID #{post_id}"
      else
        Rails.logger.error "音声変換失敗: Post ID #{post_id} - 元の形式のまま保存します"
      end
    rescue StandardError => e
      Rails.logger.error "音声変換エラー: Post ID #{post_id} - #{e.message}"
    ensure
      temp_original.close!
      temp_converted.close!
    end
  end

  private

  def file_extension(content_type)
    case content_type
    when 'audio/webm'
      'webm'
    when 'audio/mp4'
      'm4a'
    else
      'tmp'
    end
  end
end
