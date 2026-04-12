import { motion } from 'framer-motion';

type Tab = 'learn' | 'generator' | 'visualizer' | 'help';

interface HeaderProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const tabs: { id: Tab; label: string }[] = [
  { id: 'learn', label: 'Learn' },
  { id: 'generator', label: 'Generator' },
  { id: 'visualizer', label: 'Visualizer' },
  { id: 'help', label: 'Help' },
];

export default function Header({ activeTab, onTabChange }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-card/90 backdrop-blur-md" style={{ borderBottom: '0.5px solid hsl(var(--border))' }}>
      <div className="container mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex-shrink-0">
          <h1 className="text-lg sm:text-xl font-medium text-foreground leading-tight">
            CFG Derivation & Parse Tree Generator
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Explore context-free grammars interactively
          </p>
        </div>

        <nav className="hidden sm:flex items-center gap-1">
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
        <nav className="flex sm:hidden items-center gap-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-2.5 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground'
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
