require 'rails_helper'

RSpec.describe 'PostUsers' do
  describe 'POST /post_users' do
    let(:user_a) { create(:user) }
    let(:user_b) { create(:user) }
    let(:target_post) { Post.create!(user: user_a, body: '投稿本文', privacy: 'selected_users') }

    before do
      post login_path, params: { email: user_b.email, password: 'a12345678' }
    end

    it '投稿の持ち主ではないユーザー自身をdirect_recipientに追加しない' do
      expect do
        post '/post_users', params: { post_id: target_post.id, post_user: { user_id: user_b.id, role: 'direct_recipient' } }
      rescue ActionController::RoutingError
        nil
      end.not_to change(PostUser, :count)

      expect(target_post.visible_to?(user_b)).to be(false)
    end
  end
end
