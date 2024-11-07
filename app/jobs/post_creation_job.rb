class PostCreationJob < ApplicationJob
  queue_as :default

  # 投稿を非同期で作成するジョブ
  def perform(post_id, recipient_ids, privacy)
    post = Post.find(post_id)

    if privacy == 'selected_users'
      if recipient_ids.present?
        recipient_ids.each do |recipient_id|
          post.post_users.create(user_id: recipient_id, role: 'direct_recipient', approved: true)
        end
        NotificationJob.perform_later('direct', post.id)
      else
        Rails.logger.warn "No recipients provided for 'selected_users' privacy setting. Post ID: #{post.id}"
      end
    end

    # R2へ音声ファイルを保存する処理を非同期で行う
    cache_headers(post.audio) if post.audio.attached?
  rescue ActiveRecord::RecordNotFound => e
    Rails.logger.error "Failed to find post: #{e.message}"
  end
end
