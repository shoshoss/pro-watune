class PopulateUuidForExistingPosts < ActiveRecord::Migration[7.1]
  def up
    Post.where(uuid: nil).find_each do |post|
      post.update(uuid: SecureRandom.uuid)
    end
  end

  # def down
  #   Post.where.not(uuid: nil).find_each do |post|
  #     post.update(uuid: nil)
  #   end
  # end
end
