#!/usr/bin/env bash
set -o errexit
set -o pipefail

bundle install
yarn install
yarn build:css
bundle exec rails assets:precompile
bundle exec rails assets:clean

# 本番環境の場合のみマイグレーションと管理者作成を実行
if [ "$RAILS_ENV" = "production" ]; then
  bundle exec rails db:migrate
  bundle exec rails runner "User.find_or_create_admin"
fi
