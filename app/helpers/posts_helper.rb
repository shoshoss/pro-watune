module PostsHelper
  CATEGORY_ICONS = {
    'praise_gratitude' => 'fa fa-star text-yellow-400-accent',
    'music' => 'fa fa-music text-blue-500',
    'respect' => 'fa fa-sun text-orange-400',
    'favorite' => 'fa fa-heart text-red-500',
    'happy' => 'fa-solid fa-crown text-pink-400',
    'goal' => 'fa fa-fire text-orange-500',
    'learn' => 'fas fa-graduation-cap text-green-500',
    'fast_talking' => 'fa-solid fa-bolt text-yellow-400-accent',
    'child' => 'fa fa-smile-o text-pink-400',
    'other' => 'fa fa-ellipsis-h text-gray-500'
  }.freeze

  CATEGORY_NAMES = {
    'respect' => '尊敬する人',
    'praise_gratitude' => '褒め・感謝',
    'music' => '音楽',
    'favorite' => 'その他の好きなこと・もの',
    'happy' => '最幸（最高）な出来事',
    'goal' => '攻略したいこと（目標）',
    'learn' => '学び・気づき',
    'fast_talking' => '早口言葉',
    'child' => '子供の声',
    'other' => 'その他'
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
