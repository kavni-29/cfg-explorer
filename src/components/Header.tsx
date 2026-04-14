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
      className="sticky top-0 z-50 bg-[linear-gradient(180deg,rgba(84,134,135,0.98),rgba(72,117,118,0.98))] backdrop-blur-md shadow-[0_26px_56px_-26px_rgba(44,44,42,0.5)]"
      style={{ borderBottom: '0.5px solid hsl(var(--border))' }}
    >
      <div className="container mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex-shrink-0">
          <h1 className="text-[1.55rem] sm:text-[2rem] font-medium text-primary-foreground leading-tight tracking-[-0.025em] drop-shadow-[0_8px_20px_rgba(44,44,42,0.22)]">
            Context Free Grammar and Parse Trees
          </h1>
          <p className="text-sm text-primary-foreground/82 mt-1">
            CFG Derivation and Parse Tree Generation
          </p>
        </div>

        <nav className="hidden sm:flex items-center gap-2 rounded-full border border-[#fefae0]/95 bg-[#fefae0] p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_24px_44px_-24px_rgba(44,44,42,0.4)]">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative rounded-full px-6 py-3 text-[15px] font-medium transition-all duration-300 hover:scale-[1.04] ${
                activeTab === tab.id
                  ? 'text-white shadow-[0_18px_34px_-18px_rgba(44,44,42,0.36)]'
                  : 'bg-[#fffdf0] text-[#55554f] shadow-[0_16px_28px_-20px_rgba(44,44,42,0.2),inset_0_1px_0_rgba(255,255,255,0.92)] hover:bg-white hover:text-[#2c2c2a]'
              }`}
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 rounded-full border border-[rgba(76,121,122,0.95)] bg-[linear-gradient(180deg,rgba(96,150,151,1),rgba(74,123,124,1))] shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_14px_24px_-16px_rgba(44,44,42,0.34)]"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* Mobile nav */}
        <nav className="flex sm:hidden items-center gap-1.5 rounded-full border border-[#fefae0]/95 bg-[#fefae0] p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_20px_34px_-22px_rgba(44,44,42,0.34)]">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 hover:scale-[1.04] ${
                activeTab === tab.id
                  ? 'border border-[rgba(76,121,122,0.95)] bg-[linear-gradient(180deg,rgba(96,150,151,1),rgba(74,123,124,1))] text-white shadow-[0_12px_22px_-14px_rgba(44,44,42,0.32)]'
                  : 'bg-[#fffdf0] text-[#55554f] shadow-[0_12px_20px_-14px_rgba(44,44,42,0.2),inset_0_1px_0_rgba(255,255,255,0.92)] hover:bg-white hover:text-[#2c2c2a]'
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
