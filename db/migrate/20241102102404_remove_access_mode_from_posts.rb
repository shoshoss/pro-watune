class RemoveAccessModeFromPosts < ActiveRecord::Migration[7.1]
  def change
    remove_column :posts, :access_mode, :integer
  end
end
