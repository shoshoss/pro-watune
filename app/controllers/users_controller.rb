class UsersController < ApplicationController
  skip_before_action :require_login, only: %i[new_modal create_modal new create guest_login]

  def index
    @pagy, @users = pagy_countless(User.recently_registered(current_user), items: 15)
  end

  def new_modal
    @user = User.new
  end

  def create_modal
    if current_user&.guest?
      @user = current_user
      if @user.update(user_params.merge(guest: false))
        flash[:notice] = t('flash_messages.users.signup_success')
      else
        flash[:danger] = t('flash_messages.users.signup_failure')
      end
    else
      @user = User.new(user_params)
      if @user.save
        login(user_params[:email], user_params[:password])
        flash[:notice] = t('flash_messages.users.signup_success')
      else
        flash[:danger] = t('flash_messages.users.signup_failure')
      end
    end
  end

  def new
    @user = User.new(username_slug: session[:trial_username_slug])
  end

  def create
    if current_user&.guest?
      @user = current_user
      @user.update!(guest: false)
      if @user.update(user_params.merge(guest: false))
        flash[:notice] = 'データの引き継ぎに成功しました！'
        redirect_to profile_show_path(username_slug: @user.username_slug, category: "all_my_posts"), status: :see_other
      else
        flash[:danger] = 'データの引き継ぎに失敗しました。<br>再度お試しください。'
        render :new, status: :unprocessable_entity
      end
    else
      @user = User.new(user_params)
      if @user.save
        login(user_params[:email], user_params[:password])
        flash[:notice] = t('flash_messages.users.signup_success')
        redirect_to profile_show_path(username_slug: @user.username_slug, category: "all_my_posts"), status: :see_other
      else
        flash[:danger] = t('flash_messages.users.signup_failure')
        render :new, status: :unprocessable_entity
      end
    end
  end

  def guest_login
    email = generate_unique_guest_email
    @user = User.create!(email:, password: SecureRandom.hex(10), guest: true)
    auto_login(@user)
    flash[:notice] = 'お試しログインに成功しました！'
    redirect_to profile_show_path(username_slug: @user.username_slug, category: "all_my_posts")
  end

  def destroy
    @user = current_user
    if @user.destroy
      logout
      flash[:success] = 'アカウントを削除しました。'
      redirect_to root_path
    else
      flash[:error] = 'アカウントの削除に失敗しました。'
      redirect_to profile_show_path(current_user.username_slug)
    end
  end

  private

  def user_params
    params.require(:user).permit(:email, :password, :display_name, :username_slug, :self_introduction)
  end

  def generate_unique_guest_email
    loop do
      email = "guest_#{SecureRandom.hex(10)}@example.com"
      break email unless User.exists?(email:)
    end
  end
end
