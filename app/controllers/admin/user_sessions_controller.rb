class Admin::UserSessionsController < Admin::BaseController
  skip_before_action :require_login, only: %i[new create]
  skip_before_action :check_admin, only: [:new, :create]

  def new
    # ログインフォームを表示します
  end

  def create
    user = User.find_by(email: params[:email])
    if user&.authenticate(params[:password]) && user.admin?
      session[:user_id] = user.id
      redirect_to admin_dashboard_path, notice: 'ログインに成功しました'
    else
      flash.now[:alert] = 'ログインに失敗しました'
      render :new
    end
  end

  def destroy
    session.delete(:user_id)
    redirect_to admin_login_path, notice: 'ログアウトしました'
  end
end
