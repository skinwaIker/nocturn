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

      <div className="space-y-4">
        {topics.map((topic) => (
          <div
            key={topic.title}
            className="bg-[hsl(0,0%,5.9%)] border border-[hsl(0,0%,14.9%)] rounded-lg p-5"
          >
            <div className="flex items-center gap-2 mb-2">
              <topic.icon className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">{topic.title}</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{topic.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
