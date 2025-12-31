import { FileText, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

export const Rules = () => {
  const rules = [
    {
      category: "GAMEPLAY RULES",
      icon: FileText,
      items: [
        { rule: "No cheating, hacking, or exploiting bugs", severity: "critical" },
        { rule: "No aimbot, wallhack, speedhack, or any third-party software", severity: "critical" },
        { rule: "No teaming with players on the opposing team", severity: "high" },
        { rule: "No camping in unreachable spots for extended periods", severity: "medium" },
        { rule: "No blocking teammates intentionally", severity: "medium" },
      ]
    },
    {
      category: "COMMUNICATION",
      icon: AlertTriangle,
      items: [
        { rule: "No racism, sexism, or discrimination of any kind", severity: "critical" },
        { rule: "No excessive spam in voice or text chat", severity: "high" },
        { rule: "No harassment or personal attacks against players", severity: "high" },
        { rule: "English and server's native language only in public chat", severity: "low" },
        { rule: "No advertising other servers or websites", severity: "medium" },
      ]
    },
    {
      category: "ADMIN RESPECT",
      icon: CheckCircle,
      items: [
        { rule: "Follow admin instructions at all times", severity: "high" },
        { rule: "Do not argue with admin decisions publicly - use appeals", severity: "medium" },
        { rule: "Report rule violations to admins, don't handle them yourself", severity: "low" },
        { rule: "Admin decisions are final during gameplay", severity: "high" },
      ]
    },
    {
      category: "FAIR PLAY",
      icon: XCircle,
      items: [
        { rule: "No ghosting (sharing enemy positions when dead)", severity: "high" },
        { rule: "No scripting or macros that provide unfair advantage", severity: "critical" },
        { rule: "No intentional team killing or team damage", severity: "high" },
        { rule: "Play the objective, don't troll your team", severity: "medium" },
      ]
    }
  ];

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'text-red-500 border-red-500/50 bg-red-500/10';
      case 'high': return 'text-yellow-500 border-yellow-500/50 bg-yellow-500/10';
      case 'medium': return 'text-blue-500 border-blue-500/50 bg-blue-500/10';
      case 'low': return 'text-green-500 border-green-500/50 bg-green-500/10';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-background pt-20 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="font-heading text-4xl md:text-5xl font-bold uppercase tracking-tight text-white mb-4" data-testid="page-title">
            SERVER RULES
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            These rules are designed to ensure fair play and an enjoyable experience for all players on ShadowZM : Zombie Reverse. 
            Violating these rules may result in temporary or permanent bans.
          </p>
        </div>

        {/* Severity Legend */}
        <div className="bg-card/50 border border-white/10 p-6 mb-8">
          <h3 className="font-heading text-sm uppercase tracking-widest text-muted-foreground mb-4">Violation Severity</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 bg-red-500 rounded-full"></span>
              <span className="text-sm text-muted-foreground">Critical - Permanent Ban</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
              <span className="text-sm text-muted-foreground">High - 7-30 Day Ban</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
              <span className="text-sm text-muted-foreground">Medium - 1-7 Day Ban</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              <span className="text-sm text-muted-foreground">Low - Warning/Kick</span>
            </div>
          </div>
        </div>

        {/* Rules Categories */}
        <div className="space-y-8">
          {rules.map((category, categoryIndex) => (
            <div 
              key={categoryIndex} 
              className="bg-card/50 border border-white/10 overflow-hidden"
              data-testid={`rules-category-${categoryIndex}`}
            >
              <div className="p-6 border-b border-white/10 flex items-center space-x-3">
                <category.icon className="w-6 h-6 text-primary" />
                <h2 className="font-heading text-xl font-bold uppercase tracking-widest text-white">
                  {category.category}
                </h2>
              </div>
              <div className="divide-y divide-white/5">
                {category.items.map((item, itemIndex) => (
                  <div 
                    key={itemIndex} 
                    className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                    data-testid={`rule-${categoryIndex}-${itemIndex}`}
                  >
                    <div className="flex items-center space-x-4">
                      <span className={`w-2 h-2 rounded-full ${
                        item.severity === 'critical' ? 'bg-red-500' :
                        item.severity === 'high' ? 'bg-yellow-500' :
                        item.severity === 'medium' ? 'bg-blue-500' :
                        'bg-green-500'
                      }`}></span>
                      <span className="text-foreground">{item.rule}</span>
                    </div>
                    <span className={`px-2 py-1 text-xs font-heading uppercase border ${getSeverityColor(item.severity)}`}>
                      {item.severity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Note */}
        <div className="mt-12 p-6 bg-primary/10 border border-primary/30">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-heading text-lg font-bold text-white uppercase mb-2">Important Notice</h3>
              <p className="text-muted-foreground text-sm">
                Admins reserve the right to ban players for any behavior deemed harmful to the server community, 
                even if not explicitly listed above. If you believe you were banned unfairly, you may appeal 
                through our admin panel or contact an admin directly.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
