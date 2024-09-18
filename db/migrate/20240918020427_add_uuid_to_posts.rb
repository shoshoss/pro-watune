class AddUuidToPosts < ActiveRecord::Migration[7.1]
  def change
    add_column :posts, :uuid, :uuid, default: 'gen_random_uuid()', null: false
    add_index :posts, :uuid, unique: true
  end
end
