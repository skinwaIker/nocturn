import { useEffect, useState } from 'react';
import { supabase, type Rank } from '@/lib/db';

export function RankUpPage() {
  const [ranks, setRanks] = useState<Rank[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRanks();
  }, []);

  const fetchRanks = async () => {
    const { data } = await supabase
      .from('ranks')
      .select('*')
      .order('priority', { ascending: true });
    if (data) setRanks(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-6 w-6 border-2 border-white/20 border-t-white rounded-full" />
      </div>
    );
  }

  const purchasable = ranks.filter((r) => r.price);

  return (
    <div className="max-w-xl mx-auto">
      <h2 className="text-xl font-bold mb-2">Rank Up</h2>
      <p className="text-sm text-muted-foreground mb-8">Purchase ranks to stand out in the community.</p>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Available Ranks</h3>
        {purchasable.map((rank) => (
          <div
            key={rank.id}
            className="bg-[hsl(0,0%,5.9%)] border border-[hsl(0,0%,14.9%)] rounded-lg p-5 flex items-center justify-between hover:border-[hsl(0,0%,25%)] transition-all"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: rank.color }}
              />
              <div>
                <span className="text-sm font-semibold" style={{ color: rank.color }}>
                  {rank.name}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-bold text-white">{rank.price}</span>
              <button
                className="px-3 py-1.5 text-xs font-semibold rounded-md transition-colors"
                style={{ backgroundColor: rank.color + '22', color: rank.color }}
                onClick={() => alert('Payment integration coming soon!')}
              >
                Purchase
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
