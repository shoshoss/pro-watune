class DirectUploadsController < ActiveStorage::DirectUploadsController
  before_action :authenticate_direct_upload
  before_action :validate_audio_blob

  private

  def authenticate_direct_upload
    return if current_user.present?

    render json: { error: 'ログインが必要です。' }, status: :unauthorized
  end

  def validate_audio_blob
    blob = params.require(:blob)
    return render_unprocessable('音声ファイルを選んでください。') unless blob[:content_type].to_s.start_with?('audio/')

    byte_size = Integer(blob[:byte_size], exception: false)
    return if byte_size && byte_size <= Post::MAX_AUDIO_SIZE

    render_unprocessable('音声ファイルは100MB以下にしてください。')
  end

  def render_unprocessable(message)
    render json: { error: message }, status: :unprocessable_entity
  end
end
