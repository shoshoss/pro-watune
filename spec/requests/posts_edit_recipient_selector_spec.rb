require 'rails_helper'

RSpec.describe 'Posts edit recipient selector' do
  let(:owner) { create(:user) }
  let(:user_a) { create(:user) }
  let(:user_b) { create(:user) }

  before do
    owner.follow(user_a)
    owner.follow(user_b)
    post login_path, params: { email: owner.email, password: 'a12345678' }
  end

  it '選択投稿の編集画面にセレクタとpropsを表示する' do
    post = selected_post(user_a)
    get edit_post_path(post)
    props = selector_props
    expect(props['initialPrivacy']).to eq('selected_users')
    expect(props['initialRecipientIds']).to eq([user_a.id])
    expect(props['candidates'].pluck('id')).to include(user_a.id, user_b.id)
  end

  it 'フォロー解除済みの送信先を候補に残す' do
    post = selected_post(user_a)
    owner.unfollow(user_a)
    get edit_post_path(post)
    candidate = selector_props['candidates'].find { |item| item['id'] == user_a.id }
    expect(candidate['following']).to be(false)
  end

  it '返信の編集画面ではセレクタを表示しない' do
    parent = Post.create!(user: owner, body: '親投稿', privacy: 'open')
    post = Post.create!(user: owner, body: '返信本文', privacy: 'reply', post_reply_id: parent.id)
    get edit_post_path(post)
    expect(response.body).not_to include('name="RecipientSelector"')
    expect(response.body).to include('返信先の変更はできません')
  end

  private

  def selected_post(recipient)
    post = Post.create!(user: owner, body: '投稿本文', privacy: 'selected_users')
    post.post_users.create!(user: recipient, role: 'direct_recipient', approved: true)
    post
  end

  def selector_props
    element = Nokogiri::HTML(response.body).at_css('react-component[name="RecipientSelector"]')
    JSON.parse(element['props'])
  end
end
