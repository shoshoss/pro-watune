#!/usr/bin/env bash
set -o errexit
set -o pipefail

bundle install

# CVE-2026-66066 の暫定対策の確認用。Rails 8.1.4 へ更新したら見直す（Issue #718）。
if ! bundle exec ruby -e 'begin; require "vips"; puts "libvips: #{Vips::LIBRARY_VERSION}"; rescue LoadError; puts "libvips: not available"; end'; then
  echo "libvips: not available"
fi
if [[ -n "${VIPS_BLOCK_UNTRUSTED+x}" ]]; then
  echo "VIPS_BLOCK_UNTRUSTED: set"
else
  echo "VIPS_BLOCK_UNTRUSTED: not set"
fi

yarn install
yarn build:css
yarn build:react
bundle exec rails assets:precompile
bundle exec rails assets:clean

# マイグレーションと管理者作成を実行
bundle exec rails db:migrate
bundle exec rails runner "User.find_or_create_admin"
