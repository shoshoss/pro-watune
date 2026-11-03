require 'rails_helper'

RSpec.describe 'Security mitigation' do
  describe 'GET /guest_login' do
    it 'does not create a user or log in' do
      expect { get '/guest_login' }.not_to change(User, :count)

      expect(response).to have_http_status(:redirect)
      expect(session[:user_id]).to be_nil
    end
  end

  describe 'POST /guest_login' do
    around do |example|
      original_cache = Rails.cache
      Rails.cache = ActiveSupport::Cache::MemoryStore.new
      example.run
      Rails.cache = original_cache
    end

    it 'creates and logs in a guest user' do
      expect { post guest_login_path }.to change(User, :count).by(1)

      expect(User.last).to be_guest
      expect(session[:user_id]).to eq(User.last.id.to_s)
    end

    it 'does not create a user on the sixth request from the same IP' do
      5.times { post guest_login_path }

      expect { post guest_login_path }.not_to change(User, :count)
      expect(response).to redirect_to(login_path)
      expect(flash[:alert]).to eq('しばらくしてからお試しください。')
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
