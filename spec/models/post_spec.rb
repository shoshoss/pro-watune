require 'rails_helper'

RSpec.describe Post do
  describe '.visible_to' do
    describe '通常の投稿' do
      let(:owner) { create(:user) }
      let(:approved_recipient) { create(:user) }
      let(:unapproved_recipient) { create(:user) }
      let(:third_party) { create(:user) }

      %w[only_me reply open selected_users community only_direct].each do |privacy|
        it "matches visible_to? for #{privacy} posts" do
          post = described_class.create!(user: owner, body: '本文', privacy:)
          post.post_users.create!(user: approved_recipient, role: 'direct_recipient', approved: true)
          post.post_users.create!(user: unapproved_recipient, role: 'direct_recipient', approved: false)

          [owner, approved_recipient, unapproved_recipient, third_party, nil].each do |viewer|
            expect(described_class.visible_to(viewer).exists?(id: post.id)).to eq(post.visible_to?(viewer))
          end
        end
      end
    end

    describe '返信の可視性' do
      let(:users) { create_list(:user, 4) }
      let(:root_post) { described_class.create!(user: users[0], body: '親本文', privacy: 'selected_users') }
      let(:reply) { described_class.create!(user: users[3], body: '返信本文', privacy: 'reply', post_reply_id: root_post.id) }
      let(:nested_reply) do
        described_class.create!(user: users[3], body: '返信の返信本文', privacy: 'reply', post_reply_id: reply.id)
      end
      let(:expectations) { { users[0] => true, users[1] => true, users[2] => false, users[3] => true, nil => false } }

      before do
        root_post.post_users.create!(user: users[1], role: 'direct_recipient', approved: true)
        nested_reply
      end

      it '返信と返信の返信で visible_to? とスコープの結果が一致する' do
        [reply, nested_reply].each { |post| expect_visibility_matches(post, expectations) }
      end
    end

    describe '元の投稿がない返信の可視性' do
      let(:users) { create_list(:user, 3) }
      let(:orphan_reply) do
        parent = described_class.create!(user: users[0], body: '削除される親', privacy: 'selected_users')
        orphan = described_class.create!(user: users[2], body: '孤立した返信', privacy: 'reply', post_reply_id: parent.id)
        parent.destroy!
        orphan
      end
      let(:expectations) { { users[0] => false, users[1] => false, users[2] => true, nil => false } }

      it '返信を書いた本人だけ visible_to? とスコープで見られる' do
        expect_visibility_matches(orphan_reply, expectations)
      end
    end

    def expect_visibility_matches(post, expectations)
      expectations.each do |viewer, visible|
        expect(described_class.visible_to(viewer).exists?(id: post.id)).to eq(visible)
        expect(post.visible_to?(viewer)).to eq(visible)
      end
    end
  end
end
