import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { useCampaigns } from '../hooks/useCampaigns';
import { CampaignStatus } from '../types';
import { CAMPAIGN_STATUS_LABEL } from '../utils/format';
import CampaignCard from '../components/campaigns/CampaignCard';
import { CardSkeleton } from '../components/ui/LoadingSpinner';
import EmptyState, { ErrorState } from '../components/ui/EmptyState';

type Sort = 'newest' | 'progress';

export default function Campaigns() {
  const { campaigns, loading, error, refresh } = useCampaigns();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'all' | CampaignStatus>('all');
  const [sort, setSort] = useState<Sort>('newest');

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    const filtered = campaigns.filter((c) => {
      if (status !== 'all' && c.status !== status) return false;
      if (!term) return true;
      return (
        c.title.toLowerCase().includes(term) ||
        c.description.toLowerCase().includes(term) ||
        c.owner.toLowerCase().includes(term) ||
        String(c.id) === term
      );
    });
    return filtered.sort((a, b) => {
      if (sort === 'newest') return b.id - a.id;
      const pa = a.goal > 0n ? Number((a.raised * 10000n) / a.goal) : 0;
      const pb = b.goal > 0n ? Number((b.raised * 10000n) / b.goal) : 0;
      return pb - pa;
    });
  }, [campaigns, q, status, sort]);

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="section-title">Explore Campaigns</h1>
          <p className="mt-1 text-slate-500">Every campaign below is read live from the smart contract.</p>
        </div>
        <Link to="/create" className="btn-primary"><Plus className="h-4 w-4" /> Start a Campaign</Link>
      </div>

      <div className="glass mb-6 grid gap-3 p-4 md:grid-cols-[1fr_200px_200px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input className="input !pl-10" placeholder="Search by title, description, owner or ID…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="input" value={String(status)} onChange={(e) => setStatus(e.target.value === 'all' ? 'all' : (Number(e.target.value) as CampaignStatus))}>
          <option value="all">All statuses</option>
          {[CampaignStatus.Funding, CampaignStatus.Successful, CampaignStatus.Failed, CampaignStatus.Completed].map((s) => (
            <option key={s} value={s}>{CAMPAIGN_STATUS_LABEL[s]}</option>
          ))}
        </select>
        <select className="input" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
          <option value="newest">Sort: Newest</option>
          <option value="progress">Sort: Funding progress</option>
        </select>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={() => void refresh()} />
      ) : loading ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{[0, 1, 2, 3, 4, 5].map((i) => <CardSkeleton key={i} />)}</div>
      ) : list.length === 0 ? (
        <EmptyState
          title={campaigns.length === 0 ? 'No campaigns found' : 'No campaigns match your filters'}
          description={campaigns.length === 0 ? 'The contract has no campaigns yet (or it is not configured).' : 'Try a different search term or status.'}
          action={campaigns.length === 0 ? <Link to="/create" className="btn-primary">Create a campaign</Link> : undefined}
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{list.map((c) => <CampaignCard key={c.id} campaign={c} />)}</div>
      )}
    </div>
  );
}
