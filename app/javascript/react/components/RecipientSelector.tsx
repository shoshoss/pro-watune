import { useState, type ReactNode } from 'react';

type Privacy = 'only_me' | 'selected_users' | 'open';
type Candidate = {
  id: number;
  displayName: string;
  usernameSlug: string;
  following: boolean;
};
type Props = {
  initialPrivacy: Privacy;
  initialRecipientIds: number[];
  originalRecipientIds: number[];
  candidates: Candidate[];
};

const privacyOptions: { value: Privacy; label: string; description: ReactNode }[] = [
  { value: 'only_me', label: '自分', description: <>自分のみが<br className="sm:hidden" />閲覧可能</> },
  {
    value: 'selected_users',
    label: '選択',
    description: <>フォローした<br className="sm:hidden" />ユーザーで選択した<br className="sm:hidden" />ユーザーのみ閲覧可能</>
  },
  {
    value: 'open',
    label: '全体',
    description: <>ホームに<br className="sm:hidden" />公開され<br className="md:hidden" />全ての<br className="sm:hidden" />ユーザーが<br className="sm:hidden" />閲覧可能</>
  }
];

export default function RecipientSelector({
  initialPrivacy,
  initialRecipientIds,
  originalRecipientIds,
  candidates
}: Props) {
  const [privacy, setPrivacy] = useState<Privacy>(initialPrivacy);
  const [selectedIds, setSelectedIds] = useState<number[]>(initialRecipientIds);
  const removedCount = originalRecipientIds.filter((id) => !selectedIds.includes(id)).length;

  const toggleRecipient = (id: number) => {
    setSelectedIds((currentIds) => (
      currentIds.includes(id) ? currentIds.filter((currentId) => currentId !== id) : [...currentIds, id]
    ));
  };

  return (
    <div className="form-control pt-2">
      <label className="block text-lg font-semibold">送信先</label>
      <div className="flex flex-col space-y-2 pt-2">
        <div className="flex space-x-4">
          {privacyOptions.map((option) => (
            <div className="flex-1 text-center" key={option.value}>
              <button
                type="button"
                className={`btn-choice w-full btn-choice-${option.value}${privacy === option.value ? '-active' : ''}`}
                aria-pressed={privacy === option.value}
                onClick={() => setPrivacy(option.value)}
              >
                {option.label}
              </button>
              <p className="text-sm text-gray-600 mt-1">{option.description}</p>
            </div>
          ))}
        </div>
      </div>
      <input type="hidden" name="post[privacy]" value={privacy} />
      {privacy === 'selected_users' && (
        <>
          {selectedIds.map((id) => <input key={id} type="hidden" name="post[recipient_ids][]" value={id} />)}
          <div className="form-control pt-2">
            <label className="block text-lg font-semibold">仲間を選択</label>
            <div className="flex flex-col max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-2">
              {candidates.length > 0 ? candidates.map((candidate) => (
                <label className="inline-flex items-center m-2" key={candidate.id}>
                  <input
                    type="checkbox"
                    value={candidate.id}
                    checked={selectedIds.includes(candidate.id)}
                    onChange={() => toggleRecipient(candidate.id)}
                    className="form-checkbox h-5 w-5 text-blue-600"
                  />
                  <span className="ml-2 text-gray-700">
                    {candidate.displayName} (@{candidate.usernameSlug})
                    {!candidate.following && '（フォロー解除済み）'}
                  </span>
                </label>
              )) : <p>フォロー中のユーザーがいません</p>}
            </div>
          </div>
          {selectedIds.length === 0 && <p className="text-sm text-orange-600">送信先を1人以上選んでください</p>}
          {removedCount > 0 && <p className="text-sm text-orange-600">{removedCount}人を送信先から外します</p>}
        </>
      )}
      {privacy === 'only_me' && originalRecipientIds.length > 0 && (
        <p className="text-sm text-orange-600">選択していた{originalRecipientIds.length}人は閲覧できなくなります</p>
      )}
      {privacy === 'open' && initialPrivacy !== 'open' && (
        <p className="text-sm text-orange-600">ホームに公開され、すべてのユーザーが閲覧できます</p>
      )}
    </div>
  );
}
