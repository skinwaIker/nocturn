import { MessageSquare, FileText, Shield, HelpCircle } from 'lucide-react';

export function HelpPage() {
  const topics = [
    {
      icon: FileText,
      title: 'Creating Pastes',
      content: 'Click "Add Paste" in the top navigation. Enter a title and your content, then click Publish. Your paste will be publicly viewable at p/@your-paste-slug.',
    },
    {
      icon: MessageSquare,
      title: 'Comments',
      content: 'Any authenticated user can leave comments on pastes. Use the comment panel on the right side of any paste page.',
    },
    {
      icon: Shield,
      title: 'Ranks',
      content: 'Ranks are displayed next to your username across the forum. Visit the Rank Up page to purchase premium ranks, or earn staff ranks through community contribution.',
    },
    {
      icon: HelpCircle,
      title: 'Account Settings',
      content: 'Update your avatar, banner, bio, email, and password from the Settings page in the left sidebar.',
    },
  ];

  return (
    <div className="max-w-xl mx-auto">
      <h2 className="text-xl font-bold mb-2">Help</h2>
      <p className="text-sm text-muted-foreground mb-8">Quick guide to using Nocturn.</p>

      <div className="space-y-3">
        {topics.map((topic) => (
          <div
            key={topic.title}
            className="bg-white/[0.03] border border-white/10 rounded-xl p-5 backdrop-blur-sm hover:border-white/15 transition-all"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-white/[0.04] flex items-center justify-center">
                <topic.icon className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <h3 className="text-sm font-semibold">{topic.title}</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed ml-9">{topic.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
