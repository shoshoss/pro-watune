class LikesController < ApplicationController
  before_action :set_post
  before_action :authorize_view!, only: :create

  def create
    @like = current_user.like(@post)

    respond_to do |format|
      format.turbo_stream
    end
  end

  def destroy
    @like = current_user.unlike(@post)

    respond_to do |format|
      format.turbo_stream
    end
  end

  private

  def set_post
    @post = Post.find(params[:post_id])
  end
end
