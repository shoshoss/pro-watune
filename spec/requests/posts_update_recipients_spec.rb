require 'rails_helper'

RSpec.describe 'Posts update recipients' do
  let(:owner) { create(:user) }
  let(:user_a) { create(:user) }
  let(:user_b) { create(:user) }
  let(:user_c) { create(:user) }
  let(:outsider) { create(:user) }

  before do
    ActiveJob::Base.queue_adapter = :test
    owner.follow(user_a)
    owner.follow(user_b)
    owner.follow(user_c)
    post login_path, params: { email: owner.email, password: 'a12345678' }
  end

  it '全体から選択に変更すると送信先が追加され通知される' do
    post = Post.create!(user: owner, body: '投稿本文', privacy: 'open')
    update_post(post, privacy: 'selected_users', recipient_ids: [user_a.id.to_s, user_b.id.to_s])
    expect(post.reload.direct_recipients).to contain_exactly(user_a, user_b)
    expect(post.visible_to?(user_a)).to be(true)
    expect(post.visible_to?(user_b)).to be(true)
    expect(NotificationJob).to have_been_enqueued.with('direct', post.id, [user_a.id, user_b.id])
  end

  it '選択中の送信先を差し替えると追加した人だけ通知される' do
    post = selected_post(user_a, user_b)
    update_post(post, privacy: 'selected_users', recipient_ids: [user_b.id, user_c.id])
    expect(post.reload.direct_recipients).to contain_exactly(user_b, user_c)
    expect(post.visible_to?(user_a)).to be(false)
    expect(post.visible_to?(user_c)).to be(true)
    expect(NotificationJob).to have_been_enqueued.with('direct', post.id, [user_c.id])
  end

  it '選択から自分のみに変更すると送信先を削除する' do
    post = selected_post(user_a)
    update_post(post, privacy: 'only_me', recipient_ids: [])
    expect(post.reload.post_users.where(role: 'direct_recipient')).to be_empty
    expect(post.visible_to?(user_a)).to be(false)
    expect(NotificationJob).not_to have_been_enqueued
  end

  it '選択から全体に変更すると送信先を削除する' do
    post = selected_post(user_a)
    update_post(post, privacy: 'open', recipient_ids: [])
    expect(post.reload.post_users.where(role: 'direct_recipient')).to be_empty
    expect(post.visible_to?(outsider)).to be(true)
    expect(NotificationJob).not_to have_been_enqueued
  end

  it '選択で送信先を空にすると更新に失敗する' do
    post = selected_post(user_a)
    patch post_path(post), params: { post: { privacy: 'selected_users', recipient_ids: [] } }
    expect(response).to have_http_status(:unprocessable_entity)
    expect(post.reload.privacy).to eq('selected_users')
    expect(post.direct_recipients).to contain_exactly(user_a)
  end

  it 'フォローしていないユーザーは送信先に追加できない' do
    post = Post.create!(user: owner, body: '投稿本文', privacy: 'open')
    update_post(post, privacy: 'selected_users', recipient_ids: [outsider.id])
    expect(response).to have_http_status(:unprocessable_entity)
    expect(post.reload.post_users).to be_empty
  end

  it '他人の投稿は更新できない' do
    post = Post.create!(user: user_a, body: '投稿本文', privacy: 'open')
    post login_path, params: { email: user_b.email, password: 'a12345678' }
    patch post_path(post), params: { post: { privacy: 'only_me' } }
    expect(response).to redirect_to(root_path)
  end

  it '返信の公開範囲は更新できない' do
    parent = Post.create!(user: owner, body: '親投稿', privacy: 'open')
    post = Post.create!(user: owner, body: '返信本文', privacy: 'reply', post_reply_id: parent.id)
    update_post(post, privacy: 'open', recipient_ids: [user_a.id])
    expect(post.reload.privacy).to eq('reply')
    expect(post.post_users).to be_empty
  end

  it 'privacyを送らない更新では送信先を変更しない' do
    post = selected_post(user_a)
    patch post_path(post), params: { post: { body: '更新後の本文' } }
    expect(response).to redirect_to(profile_show_path(username_slug: owner.username_slug))
    expect(post.reload.body).to eq('更新後の本文')
    expect(post.direct_recipients).to contain_exactly(user_a)
    expect(NotificationJob).not_to have_been_enqueued
  end

  private

  def selected_post(*recipients)
    post = Post.create!(user: owner, body: '投稿本文', privacy: 'selected_users')
    recipients.each { |recipient| post.post_users.create!(user: recipient, role: 'direct_recipient', approved: true) }
    post
  end

  def update_post(post, privacy:, recipient_ids:)
    patch post_path(post), params: { post: { privacy:, recipient_ids: } }
  end
end
