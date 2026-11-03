module Posts
  module Visibility
    extend ActiveSupport::Concern

    VISIBILITY_SQL = <<~SQL.squish.freeze
      posts.id IN (
        WITH RECURSIVE post_roots(post_id, root_id) AS (
          SELECT id, id FROM posts WHERE post_reply_id IS NULL
          UNION ALL
          SELECT child.id, roots.root_id
          FROM posts child
          INNER JOIN post_roots roots ON child.post_reply_id = roots.post_id
        )
        SELECT posts.id
        FROM posts
        LEFT JOIN post_roots ON post_roots.post_id = posts.id
        WHERE (
          (
            posts.post_reply_id IS NULL
            AND (
              posts.user_id = :viewer_id
              OR posts.privacy IN (:open_privacy, :reply_privacy)
              OR EXISTS (
                SELECT 1 FROM post_users
                WHERE post_users.post_id = posts.id
                  AND post_users.user_id = :viewer_id
                  AND post_users.approved = TRUE
              )
            )
          )
          OR (
            posts.post_reply_id IS NOT NULL
            AND (
              posts.user_id = :viewer_id
              OR (
                post_roots.root_id IS NOT NULL
                AND EXISTS (
                  SELECT 1 FROM posts root_posts
                  WHERE root_posts.id = post_roots.root_id
                    AND (
                      root_posts.user_id = :viewer_id
                      OR root_posts.privacy = :open_privacy
                      OR EXISTS (
                        SELECT 1 FROM post_users
                        WHERE post_users.post_id = root_posts.id
                          AND post_users.user_id = :viewer_id
                          AND post_users.approved = TRUE
                      )
                    )
                )
              )
            )
          )
        )
      )
    SQL

    included do
      scope :visible_to, lambda { |viewer|
        viewer_id = viewer&.id
        where(Post.sanitize_sql_array([
                                        VISIBILITY_SQL,
                                        {
                                          viewer_id:,
                                          open_privacy: Post.privacies[:open],
                                          reply_privacy: Post.privacies[:reply]
                                        }
                                      ]))
      }
    end

    def visible_to?(viewer)
      return true if user == viewer # 投稿者本人
      return root_post_visible_to?(viewer) if reply?
      return true if privacy == 'open' # 全体公開
      return true if privacy == 'reply' # リプライ

      # 未ログインユーザーはこれ以上のプライバシーレベルの投稿は見れない
      return false if viewer.nil?

      post_users.exists?(user: viewer, approved: true)
    end

    def root_post
      current_post = self
      while current_post.post_reply_id.present?
        current_post = current_post.parent_post
        return nil unless current_post
      end
      current_post
    end

    private

    def root_post_visible_to?(viewer)
      root = root_post
      return false unless root

      root.user == viewer || root.privacy == 'open' || root.post_users.exists?(user: viewer, approved: true)
    end
  end
end
