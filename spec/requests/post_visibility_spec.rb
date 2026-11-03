require 'rails_helper'

RSpec.describe 'Post visibility authorization' do
  let(:owner) { create(:user) }

  def sign_in(user)
    post login_path, params: { email: user.email, password: 'a12345678' }
  end

  describe '非公開の投稿' do
    let(:outsider) { create(:user) }
    let(:private_post) { Post.create!(user: owner, body: '非公開本文', privacy: 'only_me') }

    before { private_post }

    it '非公開投稿を未ログインユーザーに表示しない' do
      get profile_show_path(username_slug: owner.username_slug, category: 'all_my_posts')
      expect(response.body).not_to include('非公開本文')
    end

    it '非公開投稿を第三者に表示しない' do
      sign_in outsider
      get profile_show_path(username_slug: owner.username_slug, category: 'all_my_posts')
      expect(response.body).not_to include('非公開本文')
    end

    it '投稿者本人には非公開投稿を表示する' do
      sign_in owner
      get profile_show_path(username_slug: owner.username_slug, category: 'all_my_posts')
      expect(response.body).to include('非公開本文')
    end
  end

  describe '送信先を指定した投稿' do
    let(:recipient) { create(:user) }
    let(:outsider) { create(:user) }
    let(:selected_post) do
      post = Post.create!(user: owner, body: '送信先限定本文', privacy: 'selected_users')
      post.post_users.create!(user: recipient, role: 'direct_recipient', approved: true)
      owner.like(post)
      owner.bookmark(post)
      post
    end

    it '各タブで送信先限定投稿を第三者に表示しない' do
      selected_post
      sign_in outsider
      %w[all_my_posts posts_to_you my_posts_following liked bookmarked].each do |category|
        get profile_show_path(username_slug: owner.username_slug, category:)
        expect(response.body).not_to include('送信先限定本文')
      end
    end

    it '送信先には送信先限定投稿を表示する' do
      selected_post
      sign_in recipient
      get profile_show_path(username_slug: owner.username_slug, category: 'all_my_posts')
      expect(response.body).to include('送信先限定本文')
    end
  end

  describe '送信先から外したユーザー' do
    let(:removed_recipient) { create(:user) }
    let(:removed_post) do
      post = Post.create!(user: owner, body: '送信先から外された本文', privacy: 'selected_users')
      post_user = post.post_users.create!(user: removed_recipient, role: 'direct_recipient', approved: true)
      removed_recipient.like(post)
      removed_recipient.bookmark(post)
      post_user.update!(approved: false)
      post
    end

    it '送信先から外されたユーザーの liked タブに表示しない' do
      removed_post
      sign_in removed_recipient
      get profile_show_path(username_slug: removed_recipient.username_slug, category: 'liked')
      expect(response.body).not_to include('送信先から外された本文')
    end

    it '送信先から外されたユーザーの bookmarked タブに表示しない' do
      removed_post
      sign_in removed_recipient
      get profile_show_path(username_slug: removed_recipient.username_slug, category: 'bookmarked')
      expect(response.body).not_to include('送信先から外された本文')
    end

    it '送信先から外された投稿を投稿者の all_my_posts に表示しない' do
      removed_post
      sign_in removed_recipient
      get profile_show_path(username_slug: owner.username_slug, category: 'all_my_posts')
      expect(response.body).not_to include('送信先から外された本文')
    end
  end

  describe '投稿への操作' do
    let(:outsider) { create(:user) }
    let(:private_post) { Post.create!(user: owner, body: '非公開本文', privacy: 'only_me') }

    before do
      private_post
      sign_in outsider
    end

    it '非公開投稿にいいねを作成できない' do
      expect do
        post post_likes_path(private_post)
      end.not_to change(Like, :count)
    end

    it '非公開投稿にブックマークを作成できない' do
      expect do
        post post_bookmarks_path(private_post)
      end.not_to change(Bookmark, :count)
    end

    it '非公開投稿をリポストできない' do
      expect do
        post post_reposts_path(private_post)
      end.not_to change(Repost, :count)
    end

    it '非公開投稿に返信を作成できない' do
      expect do
        post user_post_replies_path(owner.username_slug, private_post), params: { post: { body: '返信' } }
      end.not_to change(Post, :count)
    end
  end
end
