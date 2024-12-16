class Post < ApplicationRecord
  include Posts::UserPostScopes
  include Posts::SharedScopes
  include Posts::Notification

  # ユーザーとの関係
  belongs_to :user
  belongs_to :category, optional: true

  # リプライ関係
  has_many :replies, class_name: 'Post', foreign_key: :post_reply_id, inverse_of: :parent_post
  belongs_to :parent_post, class_name: 'Post', foreign_key: :post_reply_id, optional: true, inverse_of: :replies

  # いいね関係
  has_many :likes, dependent: :destroy
  has_many :liked_users, through: :likes, source: :user

  # ブックマーク関係
  has_many :bookmarks, dependent: :destroy
  has_many :bookmarked_users, through: :bookmarks, source: :user

  # 投稿とユーザーの関係
  has_many :post_users, dependent: :destroy
  has_many :direct_recipients, -> { where(post_users: { role: 'direct_recipient' }) }, through: :post_users, source: :user
  has_many :community_recipients, -> { where(post_users: { role: 'community_recipient' }) }, through: :post_users, source: :user

  # リポスト関係
  has_many :reposts, class_name: 'Repost', dependent: :destroy, inverse_of: :original_post
  has_many :reposted_by_users, through: :reposts, source: :user

  # ポリモーフィックな関連付けを追加（通知）
  has_many :notifications, as: :notifiable

  # 音声添付ファイル
  has_one_attached :audio # ActiveStorageを利用してこれらのファイルを管理する場合
  validate :validate_audio, if: :audio_attached?

  # mount_uploader :audio, AudioUploader

  # バリデーション
  validates :body, length: { maximum: 500_000 }
  validates :duration, numericality: { greater_than_or_equal_to: 0, less_than_or_equal_to: 3599 }, allow_nil: true

  # プライバシー設定
  enum privacy: { only_me: 0, reply: 1, open: 2, selected_users: 10, community: 20, only_direct: 30 }

  # アクセス設定
  # enum access_mode: { legacy_id: 0, uuid: 10, custom_token: 20 }

  DISPLAY_ORDER = %w[
    praise_gratitude
    music
    fast_talking
    favorite
    output
  ].freeze

  # カテゴリー設定
  enum fixed_category: {
    praise_gratitude: 0,
    music: 10,
    # learn: 20,
    fast_talking: 30,
    # child: 40,
    favorite: 50,
    # monologue: 60,
    output: 100
  }

  # 定義した順序でカテゴリーを返すクラスメソッド
  def self.ordered_categories
    DISPLAY_ORDER
  end

  validates :fixed_category, presence: true

  # 投稿の可視性を判定するメソッド
  def visible_to?(user)
    return true if self.user == user # 投稿者本人
    return true if privacy == 'open' # 全体公開
    return true if privacy == 'reply' # リプライ

    # 未ログインユーザーはこれ以上のプライバシーレベルの投稿は見れない
    return false if user.nil?

    # ログインユーザーかつ承認された受信者であれば投稿を見ることができる
    post_users.exists?(user:, approved: true)
  end

  # 親の投稿のユーザー名が重複しないように祖先を取得するメソッド
  def ancestors
    parents = []
    current_post = self
    while current_post.parent_post
      parents << current_post.parent_post
      current_post = current_post.parent_post
    end
    parents.reverse
  end

  # direct_recipient_idsを設定するメソッド
  def direct_recipient_ids=(ids)
    self.direct_recipients = User.find(ids)
  end

  # direct_recipient_idsを取得するメソッド
  def direct_recipient_ids
    direct_recipients.pluck(:id)
  end

  # リポストかどうかを判定するメソッド
  def repost?
    reposts.exists?
  end

  # リポストされた元の投稿を取得するメソッド
  def reposted_post
    repost? ? Repost.find(id).original_post : nil
  end

  # カスタムカテゴリーを設定するメソッド
  def assign_custom_category(custom_category_name)
    if custom_category_name.blank?
      # カスタムカテゴリーを削除する場合
      self.category = nil
    else
      # カスタムカテゴリーを設定または更新
      custom_category = Category.find_or_create_by(
        category_name: fixed_category,
        add_category_name: custom_category_name
      )
      self.category = custom_category
    end
    save
  end

  # カスタムカテゴリー名を取得するメソッド
  def custom_category_name
    category&.add_category_name
  end

  scope :reposted, -> { joins(:reposts).distinct }

  # ポストする前のアクション
  # before_create :set_default_access_mode

  # リポストが作成されたときに最新活動日時を更新
  after_create :update_latest_activity
  after_update :update_latest_activity, if: :saved_change_to_created_at?

  # カスタムカテゴリーを含むカテゴリー名を生成するメソッド
  def combined_category
    if category&.add_category_name.present?
      "#{fixed_category_i18n} / #{category.add_category_name}"
    else
      "#{fixed_category_i18n} / 感謝してます"
    end
  end

  def reply?
    post_reply_id.present?
  end

  def parent_post?
    replies.exists?
  end

  # 返信関連の投稿かどうかをチェックするメソッドを追加
  def reply_related?
    reply? || parent_post?
  end

  private

  def update_latest_activity
    latest_time = [created_at, reposts.maximum(:created_at)].compact.max
    update(latest_activity: latest_time)
  end

  def audio_attached?
    audio.attached?
  end

  def validate_audio
    return unless audio.attached?

    # サイズチェック
    errors.add(:audio, 'は200MB以下にしてください') if audio.blob.byte_size > 200.megabytes

    # 長さチェック
    return unless respond_to?(:duration) && duration && duration > 3601

    errors.add(:audio, 'は1時間以内にしてください')
  end

  # def set_default_access_mode
  #   self.access_mode ||= :uuid  # 新規投稿はuuidに設定
  # end
end
