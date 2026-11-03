# frozen_string_literal: true

require_relative 'boot'

require 'rails'
require 'ipaddr'
# Pick the frameworks you want:
require 'active_model/railtie'
require 'active_job/railtie'
require 'active_record/railtie'
require 'active_storage/engine'
require 'action_controller/railtie'
require 'action_mailer/railtie'
require 'action_mailbox/engine'
require 'action_text/engine'
require 'action_view/railtie'
require 'action_cable/engine'
# require "rails/test_unit/railtie"

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(*Rails.groups)

module App
  # アプリケーション設定クラス
  class Application < Rails::Application
    # Cloudflare の IP 範囲（https://www.cloudflare.com/ips/、2023-09-28 更新）
    CLOUDFLARE_TRUSTED_PROXIES = %w[
      103.21.244.0/22
      103.22.200.0/22
      103.31.4.0/22
      104.16.0.0/13
      104.24.0.0/14
      108.162.192.0/18
      131.0.72.0/22
      141.101.64.0/18
      162.158.0.0/15
      172.64.0.0/13
      173.245.48.0/20
      188.114.96.0/20
      190.93.240.0/20
      197.234.240.0/22
      198.41.128.0/17
      2400:cb00::/32
      2606:4700::/32
      2803:f800::/32
      2405:b500::/32
      2405:8100::/32
      2a06:98c0::/29
      2c0f:f248::/32
    ].map { |network| IPAddr.new(network) }.freeze

    # Initialize configuration defaults for originally generated Rails version.
    config.load_defaults 7.1

    config.action_dispatch.trusted_proxies = ActionDispatch::RemoteIp::TRUSTED_PROXIES + CLOUDFLARE_TRUSTED_PROXIES

    config.i18n.default_locale = :ja

    # アプリケーションのタイムゾーンを東京に設定
    config.time_zone = 'Tokyo'

    # Please, add to the `ignore` list any other `lib` subdirectories that do
    # not contain `.rb` files, or that should not be reloaded or eager loaded.
    # Common ones are `templates`, `generators`, or `middleware`, for example.
    config.autoload_lib(ignore: %w[assets tasks])

    # Configuration for the application, engines, and railties goes here.
    #
    # These settings can be overridden in specific environments using the files
    # in config/environments, which are processed later.
    #
    # config.time_zone = "Central Time (US & Canada)"
    # config.eager_load_paths << Rails.root.join("extras")

    # Don't generate system test files.
    config.generators.system_tests = nil

    config.generators do |g|
      g.skip_routes true
      g.helper false
      g.test_framework :rspec,
                       controller_specs: true,
                       fixtures: false,
                       helper_specs: false,
                       model_specs: true,
                       request_spec: false,
                       routing_specs: false,
                       view_specs: false
    end
  end
end
