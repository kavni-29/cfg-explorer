import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Header from '@/components/Header';
import LearnPageFixed from './LearnPageFixed';
import GeneratorPageEnhanced from './GeneratorPageEnhanced';
import VisualizerPageEnhanced from './VisualizerPageEnhanced';
import QuizPage from './QuizPage';
import HelpPageEnhanced from './HelpPageEnhanced';
import {
  EXAMPLES,
  type DerivationStep,
  type Grammar,
  type TreeNode,
} from '@/lib/cfg-engine-fixed';

type Tab = 'learn' | 'generator' | 'visualizer' | 'quiz' | 'help';

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
            {activeTab === 'learn' && <LearnPageFixed />}
            {activeTab === 'generator' && (
              <GeneratorPageEnhanced state={generatorState} onStateChange={setGeneratorState} />
            )}
            {activeTab === 'visualizer' && <VisualizerPageEnhanced state={generatorState} />}
            {activeTab === 'quiz' && <QuizPage />}
            {activeTab === 'help' && <HelpPageEnhanced />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
