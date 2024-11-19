module PostsHelper
  CATEGORY_ICONS = {
    'recommended' => 'fa-solid fa-retweet text-green-500',
    'discuss' => 'fa-solid fa-comments text-blue-500',
    'respect' => 'fa fa-star text-yellow-400-accent',
    'praise_gratitude' => 'fa fa-sun text-orange-400',
    'music' => 'fa fa-music text-blue-500',
    'food' => 'fa-solid fa-utensils text-orange-400',
    'favorite' => 'fa fa-heart text-red-500',
    'learn' => 'fas fa-graduation-cap text-green-500',
    'child' => 'fa fa-smile-o text-pink-400',
    'fast_talking' => 'fa-solid fa-bolt text-yellow-400-accent',
  }.freeze

  CATEGORY_NAMES = {
    'recommended' => 'おすすめ',
    'discuss' => '相談したいこと',
    'respect' => '尊敬する人',
    'praise_gratitude' => '褒め・感謝',
    'music' => '音楽',
    'food' => '食事・スイーツ',
    'favorite' => 'その他の好きなこと・もの',
    'learn' => '学び・気づき',
    'child' => '子供の声',
    'fast_talking' => '早口言葉',
  }.freeze

  # カテゴリに対応するアイコンのクラスを返すメソッド
  def category_icon(category)
    CATEGORY_ICONS[category] || 'fa fa-circle text-gray-500'
  end

  # カテゴリ名を適切な形式に変換するメソッド
  def category_name(category)
    CATEGORY_NAMES[category] || '不明なカテゴリー'
  end
end
