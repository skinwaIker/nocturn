import { useEffect, useState } from 'react';
import { supabase, type Rank } from '@/lib/db';
import { Award, Sparkles } from 'lucide-react';

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
        <Sparkles className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-xl font-bold">Rank Up</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-8">Purchase ranks to stand out in the community.</p>

      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Available Ranks</h3>
        {purchasable.map((rank) => (
          <div
            key={rank.id}
            className="bg-white/[0.03] border border-white/10 rounded-xl p-5 flex items-center justify-between hover:border-white/20 transition-all backdrop-blur-sm group"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full shadow-lg"
                style={{ backgroundColor: rank.color, boxShadow: `0 0 8px ${rank.color}44` }}
              />
              <span className="text-sm font-semibold" style={{ color: rank.color }}>
                {rank.name}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-bold text-white">{rank.price}</span>
              <button
                className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-all backdrop-blur-sm border"
                style={{
                  backgroundColor: rank.color + '15',
                  color: rank.color,
                  borderColor: rank.color + '33',
                }}
                onClick={() => alert('Payment integration coming soon!')}
              >
                Purchase
              </button>
            </div>
          </div>
        ))}
        {purchasable.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Award className="h-8 w-8 mx-auto mb-3 opacity-20" />
            <p className="text-sm">No purchasable ranks available</p>
          </div>
        )}
      </div>
    </div>
  );
}
