require 'rails_helper'

RSpec.describe 'Security mitigation' do
  describe 'Active Storage analyzers' do
    it 'does not include image analyzers and includes the audio analyzer' do
      expect(ActiveStorage.analyzers).not_to include(ActiveStorage::Analyzer::ImageAnalyzer::Vips)
      expect(ActiveStorage.analyzers).not_to include(ActiveStorage::Analyzer::ImageAnalyzer::ImageMagick)
      expect(ActiveStorage.analyzers).to include(ActiveStorage::Analyzer::AudioAnalyzer)
    end
  end
end
