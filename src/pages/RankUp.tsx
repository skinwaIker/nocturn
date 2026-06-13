import { useEffect, useState } from 'react';
import { supabase, type Rank } from '@/lib/db';
import { Award } from 'lucide-react';

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
      <div className="flex items-center gap-2 mb-2">
        <Award className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-xl font-bold">Rank Up</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-8">Purchase ranks to stand out in the community.</p>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Available Ranks</h3>
        {purchasable.length === 0 ? (
          <div className="glass-card rounded-xl p-8 text-center text-muted-foreground">
            <p className="text-sm">No purchasable ranks available</p>
          </div>
        ) : (
          purchasable.map((rank) => (
            <div
              key={rank.id}
              className="glass-card-hover rounded-xl p-5 flex items-center justify-between"
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
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors"
                  style={{ backgroundColor: rank.color + '22', color: rank.color, border: `1px solid ${rank.color}33` }}
                  onClick={() => alert('Payment integration coming soon!')}
                >
                  Purchase
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
