module PostViewAuthorization
  extend ActiveSupport::Concern

  private

  # 投稿の表示権限を確認する
  def authorize_view!
    return if @post.visible_to?(current_user)

    redirect_to root_path, alert: 'この投稿を見る権限がありません。'
  end
end
