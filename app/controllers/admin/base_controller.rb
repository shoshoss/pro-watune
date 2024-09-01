module Admin
  class BaseController < ApplicationController
    before_action :check_admin
    layout 'admin/layouts/application'

    private

    def check_admin
      redirect_to admin_login_path, alert: 'アクセスが許可されていません' unless current_user&.admin?
    end
  end
end
