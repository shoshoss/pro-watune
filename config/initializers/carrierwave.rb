CarrierWave.configure do |config|
  config.storage    = :aws
  config.aws_bucket = Rails.application.credentials.dig(:cloudflare, :r2_bucket)
  config.aws_acl    = 'public-read'

  config.aws_credentials = {
    endpoint: "https://#{Rails.application.credentials.dig(:cloudflare, :r2_account_id)}.r2.cloudflarestorage.com",
    access_key_id: Rails.application.credentials.dig(:cloudflare, :r2_access_key_id),
    secret_access_key: Rails.application.credentials.dig(:cloudflare, :r2_secret_access_key),
    region: 'auto',
    force_path_style: true
  }
end
