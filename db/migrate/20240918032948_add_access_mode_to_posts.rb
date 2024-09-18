class AddAccessModeToPosts < ActiveRecord::Migration[7.1]
  def change
    add_column :posts, :access_mode, :integer, default: 0, null: false
  end
end
