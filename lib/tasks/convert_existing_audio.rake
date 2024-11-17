namespace :audio do
  desc 'Convert existing audio files to MP3 and save them to converted_audio'
  task convert_existing: :environment do
    require 'ffmpeg'

    Post.find_each do |post|
      # すでに変換されている場合はスキップ
      next if post.converted_audio.attached? || !post.audio.attached?

      puts "Converting Post ID: #{post.id}"

      begin
        # オリジナルの音声ファイルのパスを取得
        original_path = ActiveStorage::Blob.service.path_for(post.audio.key)

        # FFmpeg で MP3 に変換
        mp3_filename = "#{SecureRandom.uuid}.mp3"
        converted_path = Rails.root.join("tmp/#{mp3_filename}")

        movie = FFMPEG::Movie.new(original_path)
        movie.transcode(converted_path.to_s)

        # Active Storage へ変換後のファイルをアップロード
        post.converted_audio.attach(io: File.open(converted_path), filename: mp3_filename, content_type: 'audio/mp3')

        # 再生時間を保存
        post.update(duration: movie.duration)

        # 一時ファイルを削除
        FileUtils.rm_f(converted_path)

        puts "Post ID #{post.id} converted successfully."
      rescue StandardError => e
        puts "Failed to convert Post ID #{post.id}: #{e.message}"
      end
    end
  end
end
