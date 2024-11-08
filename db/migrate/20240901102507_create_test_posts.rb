class CreateTestPosts < ActiveRecord::Migration[7.1]
  def change
    create_table :test_posts do |t|
      t.text :body, null: true
      t.string :audio, null: true

      t.timestamps
    end
  end
end
