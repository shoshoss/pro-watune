class Category < ApplicationRecord
  has_many :posts

  validates :category_name, presence: true
  validates :add_category_name, length: { maximum: 50 }, allow_blank: true
end
