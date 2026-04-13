import { motion } from 'framer-motion';

type Tab = 'learn' | 'generator' | 'visualizer' | 'quiz' | 'help';

interface HeaderProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const tabs: { id: Tab; label: string }[] = [
  { id: 'learn', label: 'Learn' },
  { id: 'generator', label: 'Generator' },
  { id: 'visualizer', label: 'Visualizer' },
  { id: 'quiz', label: 'Quiz' },
  { id: 'help', label: 'Help' },
];

export default function Header({ activeTab, onTabChange }: HeaderProps) {
  return (
    <header
      className="sticky top-0 z-50 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(255,255,247,0.86))] backdrop-blur-md shadow-[0_16px_40px_-30px_rgba(84,134,135,0.95)]"
      style={{ borderBottom: '0.5px solid hsl(var(--border))' }}
    >
      <div className="container mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex-shrink-0">
          <h1 className="text-xl sm:text-[1.85rem] font-medium text-foreground leading-tight tracking-[-0.02em]">
            Context Free Grammar and Parse Trees
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            CFG Derivation and Parse Tree Generation
          </p>
        </div>

        <nav className="hidden sm:flex items-center gap-1.5 rounded-full border border-border/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(255,255,199,0.72))] p-1.5 shadow-[0_18px_42px_-28px_rgba(84,134,135,0.95)]">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`nav-pill relative ${
                activeTab === tab.id ? 'nav-pill-active' : 'nav-pill-inactive'
              }`}
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-primary rounded-full"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* Mobile nav */}
        <nav className="flex sm:hidden items-center gap-1 rounded-full border border-border/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(255,255,199,0.72))] p-1 shadow-[0_14px_32px_-26px_rgba(84,134,135,0.95)]">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-2.5 py-1.5 rounded-full text-xs font-medium transition-all duration-300 hover:scale-105 ${
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-secondary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
