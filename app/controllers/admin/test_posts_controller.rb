# app/controllers/admin/test_posts_controller.rb
module Admin
  class TestPostsController < Admin::BaseController
    before_action :set_test_post, only: %i[show edit update destroy]

    def index
      @test_posts = TestPost.all
    end

    def show
      # 今後の実装で使う 音声の返信
    end

    def new
      @test_post = TestPost.new
    end

    def edit
      # 今後の実装で使う カテゴリや送信先の変更など
    end

    def create
      @test_post = TestPost.new(test_post_params)
      if @test_post.save
        redirect_to admin_test_posts_path, notice: '音声投稿が作成されました。'
      else
        render :new
      end
    end

    def update
      if @test_post.update(test_post_params)
        redirect_to admin_test_posts_path, notice: '音声投稿が更新されました。'
      else
        render :edit
      end
    end

    def destroy
      @test_post.destroy
      redirect_to admin_test_posts_path, notice: '音声投稿が削除されました。'
    end
    

    private

    def set_test_post
      @test_post = TestPost.find(params[:id])
    end

    def test_post_params
      params.require(:test_post).permit(:body, :audio)
    end
  end
end
