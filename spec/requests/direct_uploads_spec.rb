require 'rails_helper'

RSpec.describe 'Active Storage direct uploads' do
  let(:user) { create(:user) }

  def direct_upload_params(content_type: 'audio/mpeg', byte_size: 1.megabyte)
    {
      blob: {
        filename: 'sample.mp3',
        byte_size:,
        checksum: Digest::MD5.base64digest('sample'),
        content_type:,
        metadata: {}
      }
    }
  end

  def create_direct_upload(params)
    post '/rails/active_storage/direct_uploads', params:, as: :json
  end

  describe '未ログインの場合' do
    it '401を返し、blobを作成しない' do
      expect { create_direct_upload(direct_upload_params) }.not_to change(ActiveStorage::Blob, :count)
      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe 'ログイン済みの場合' do
    before do
      post login_path, params: { email: user.email, password: 'a12345678' }
    end

    it '100MB以下の音声を受け付ける' do
      expect { create_direct_upload(direct_upload_params(byte_size: Post::MAX_AUDIO_SIZE)) }
        .to change(ActiveStorage::Blob, :count).by(1)
      expect(response).to have_http_status(:success)
    end

    it '画像を受け付けない' do
      expect { create_direct_upload(direct_upload_params(content_type: 'image/png')) }
        .not_to change(ActiveStorage::Blob, :count)
      expect(response).to have_http_status(:unprocessable_entity)
    end

    it '100MBを超える音声を受け付けない' do
      params = direct_upload_params(byte_size: Post::MAX_AUDIO_SIZE + 1)
      expect { create_direct_upload(params) }.not_to change(ActiveStorage::Blob, :count)
      expect(response).to have_http_status(:unprocessable_entity)
    end
  end
end
