require 'rails_helper'

RSpec.describe 'Reply visibility authorization' do
  let(:owner) { create(:user) }

  def sign_in(user)
    post login_path, params: { email: user.email, password: 'a12345678' }
  end

  describe '非公開投稿への返信' do
    let(:recipient) { create(:user) }
    let(:outsider) { create(:user) }
    let(:root_post) do
      post = Post.create!(user: owner, body: '非公開の親本文', privacy: 'selected_users')
      post.post_users.create!(user: recipient, role: 'direct_recipient', approved: true)
      post
    end
    let(:reply) do
      reply = Post.create!(user: owner, body: '非公開の返信本文', privacy: 'reply', post_reply_id: root_post.id)
      owner.like(reply)
      owner.bookmark(reply)
      reply
    end

    before { reply }

    it '未ログインユーザーのプロフィール一覧に返信を表示しない' do
      get profile_show_path(username_slug: owner.username_slug, category: 'all_my_posts')
      expect(response.body).not_to include('非公開の返信本文')
    end

    it '第三者のプロフィール一覧に返信を表示しない' do
      sign_in outsider
      %w[all_my_posts posts_to_you my_posts_following liked bookmarked].each do |category|
        get profile_show_path(username_slug: owner.username_slug, category:)
        expect(response.body).not_to include('非公開の返信本文')
      end
    end

    it '元の投稿の受信者には返信を表示する' do
      sign_in recipient
      get profile_show_path(username_slug: owner.username_slug, category: 'all_my_posts')
      expect(response.body).to include('非公開の返信本文')
    end

    it '第三者は非公開投稿への返信の詳細ページを開けない' do
      sign_in outsider
      get user_post_path(username_slug: owner.username_slug, id: reply.id)
      expect(response).to redirect_to(root_path)
    end
  end

  describe '全体公開投稿への返信' do
    let(:root_post) { Post.create!(user: owner, body: '公開の親本文', privacy: 'open') }
    let(:reply) { Post.create!(user: owner, body: '公開の返信本文', privacy: 'reply', post_reply_id: root_post.id) }

    before { reply }

    it '未ログインユーザーにも返信を表示する' do
      get user_post_path(username_slug: owner.username_slug, id: reply.id)
      expect(response.body).to include('公開の返信本文')
    end
  end
end
