class Admin::UserSessionsController < Admin::BaseController
  skip_before_action :require_login, only: %i[new create]
  skip_before_action :check_admin, only: %i[new create]
  layout 'layouts/admin_login'

  def new; end

  def create
    if login(params[:email], params[:password])
      if current_user.admin?
        redirect_to admin_root_path, notice: 'ログインに成功しました'
      else
        logout
        flash.now[:danger] = '管理者アカウントではありません'
        render :new
      end
    else
      flash.now[:danger] = 'メールアドレスまたはパスワードが間違っています'
      render :new
    end
  end

  def destroy
    logout
    redirect_to admin_login_path, status: :see_other, danger: 'ログアウトしました'
  end
end
