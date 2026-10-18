require 'rails_helper'

RSpec.describe 'PostUsers', type: :request do
  describe 'POST /post_users' do
    it '投稿の持ち主ではないユーザー自身をdirect_recipientに追加しない' do
      user_a = create(:user)
      user_b = create(:user)
      post_record = Post.create!(user: user_a, body: '投稿本文', privacy: 'selected_users')

      post login_path, params: { email: user_b.email, password: 'a12345678' }

      expect do
        begin
          post '/post_users', params: {
            post_id: post_record.id,
            post_user: {
              user_id: user_b.id,
              role: 'direct_recipient'
            }
          }
        rescue ActionController::RoutingError
          # ルートが削除されている場合も、件数不変であることを確認する。
        end
      end.not_to change(PostUser, :count)

      expect(post_record.visible_to?(user_b)).to be(false)
    end
  end
end
