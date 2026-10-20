#!/usr/bin/env bash
set -o errexit
set -o pipefail

bundle install
yarn install
yarn build:css
yarn build:react
bundle exec rails assets:precompile
bundle exec rails assets:clean

# マイグレーションと管理者作成を実行
bundle exec rails db:migrate
bundle exec rails runner "User.find_or_create_admin"
