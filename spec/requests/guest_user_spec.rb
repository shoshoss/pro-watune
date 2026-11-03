require 'rails_helper'

RSpec.describe 'Guest user restrictions' do
  let(:owner) { create(:user) }
  let(:guest) { create(:user, guest: true) }

  before do
    post login_path, params: { email: guest.email, password: 'a12345678' }
  end

  it 'does not create a like notification for a guest' do
    original_post = create_post(owner)

    expect { post post_likes_path(original_post) }.not_to change(Notification, :count)
  end

  it 'does not enqueue a reply notification for a guest' do
    original_post = create_post(owner)
    ActiveJob::Base.queue_adapter = :test

    expect do
      post user_post_replies_path(owner.username_slug, original_post), params: { post: { body: '返信' } }
    end.not_to have_enqueued_job(NotificationJob)
  end

  it 'does not create a follow notification for a guest' do
    expect { post user_friendships_path(owner) }.not_to change(Notification, :count)
  end

  def create_post(user)
    Post.create!(user:, body: '本文', privacy: 'open', fixed_category: 'praise_gratitude')
  end
end
