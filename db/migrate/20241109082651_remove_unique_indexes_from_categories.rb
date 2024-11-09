class RemoveUniqueIndexesFromCategories < ActiveRecord::Migration[7.1]
  def change
    # category_nameとadd_category_nameのユニークインデックスを削除
    remove_index :categories, :category_name if index_exists?(:categories, :category_name, unique: true)
    remove_index :categories, :add_category_name if index_exists?(:categories, :add_category_name, unique: true)

    # 非ユニークインデックスを追加（必要であれば）
    add_index :categories, :category_name unless index_exists?(:categories, :category_name)
    add_index :categories, :add_category_name unless index_exists?(:categories, :add_category_name)
  end
end
