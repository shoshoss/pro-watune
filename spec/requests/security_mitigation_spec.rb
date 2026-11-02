require 'rails_helper'

RSpec.describe 'Security mitigation' do
  describe 'GET /guest_login' do
    it 'does not create a user or log in' do
      expect { get '/guest_login' }.not_to change(User, :count)

      expect(response).to have_http_status(:redirect)
      expect(session[:user_id]).to be_nil
    end
  end

  describe 'Active Storage analyzers' do
    it 'does not include image analyzers and includes the audio analyzer' do
      expect(ActiveStorage.analyzers).not_to include(ActiveStorage::Analyzer::ImageAnalyzer::Vips)
      expect(ActiveStorage.analyzers).not_to include(ActiveStorage::Analyzer::ImageAnalyzer::ImageMagick)
      expect(ActiveStorage.analyzers).to include(ActiveStorage::Analyzer::AudioAnalyzer)
    end
  end
end
