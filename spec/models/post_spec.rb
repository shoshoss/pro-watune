require 'rails_helper'

RSpec.describe Post do
  describe '.visible_to' do
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
end
