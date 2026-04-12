import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Header from '@/components/Header';
import LearnPage from './LearnPage';
import GeneratorPage from './GeneratorPage';
import VisualizerPage from './VisualizerPage';
import HelpPage from './HelpPage';

type Tab = 'learn' | 'generator' | 'visualizer' | 'help';

export default function Index() {
  const [activeTab, setActiveTab] = useState<Tab>('learn');

  return (
    <div className="min-h-screen bg-background">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="container mx-auto px-4 sm:px-6 py-8 max-w-6xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35 }}
          >
            {activeTab === 'learn' && <LearnPage />}
            {activeTab === 'generator' && <GeneratorPage />}
            {activeTab === 'visualizer' && <VisualizerPage />}
            {activeTab === 'help' && <HelpPage />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
