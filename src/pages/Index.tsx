import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Header from '@/components/Header';
import LearnPage from './LearnPage';
import GeneratorPageFixed from './GeneratorPageFixed';
import VisualizerPageFixed from './VisualizerPageFixed';
import HelpPage from './HelpPage';
import {
  EXAMPLES,
  type DerivationStep,
  type Grammar,
  type TreeNode,
} from '@/lib/cfg-engine-fixed';

type Tab = 'learn' | 'generator' | 'visualizer' | 'help';

export type DerivationType = 'leftmost' | 'rightmost' | 'both';

export interface GeneratorState {
  activeExample: string;
  grammarText: string;
  inputString: string;
  derivationType: DerivationType;
  parsedGrammar: Grammar | null;
  leftSteps: DerivationStep[] | null;
  rightSteps: DerivationStep[] | null;
  parseTree: TreeNode | null;
  error: string;
}

export default function Index() {
  const [activeTab, setActiveTab] = useState<Tab>('learn');
  const [generatorState, setGeneratorState] = useState<GeneratorState>({
    activeExample: 'Arithmetic expressions',
    grammarText: EXAMPLES['Arithmetic expressions'].grammar,
    inputString: EXAMPLES['Arithmetic expressions'].input,
    derivationType: 'leftmost',
    parsedGrammar: null,
    leftSteps: null,
    rightSteps: null,
    parseTree: null,
    error: '',
  });

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
            {activeTab === 'generator' && (
              <GeneratorPageFixed state={generatorState} onStateChange={setGeneratorState} />
            )}
            {activeTab === 'visualizer' && <VisualizerPageFixed state={generatorState} />}
            {activeTab === 'help' && <HelpPage />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
