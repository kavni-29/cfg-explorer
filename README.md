# Context Free Grammar and Parse Trees

## Abstract

Context Free Grammar and Parse Trees is an interactive educational web application developed to support the teaching and learning of context-free grammars, derivations, and parse-tree construction. The platform is intended for undergraduate students, instructors, and independent learners who need a clearer visual and procedural understanding of how grammars generate strings and how parse trees represent syntactic structure.

The application brings together conceptual explanations, live grammar input, derivation generation, parse-tree visualization, guided theory sections, and repeatable quizzes within a single interface. Its goal is to make foundational ideas from formal languages and compiler design easier to study, demonstrate, and revise.

## Objectives

This project is designed to help users:

- learn key CFG terminology and formal ideas
- generate leftmost and rightmost derivations from custom grammar input
- visualize parse trees for generated strings
- inspect parse tree nodes interactively
- replay derivation and tree-construction steps automatically
- practice the topic through repeatable quiz sets

The site is implemented as a frontend-only React application and does not require a backend for its normal use.

## Feature Overview

### 1. Learn

The Learn section introduces the theoretical foundations of context-free grammars through structured content and visual explanation:

- key concepts such as terminals, non-terminals, derivations, ambiguity, sentential forms, and yield
- a grammar-components section explaining `G = (V, T, P, S)`
- a leftmost vs rightmost derivation comparison
- a parse-tree walkthrough with step progression
- extra study notes to support revision

### 2. Generator

The Generator section accepts user-defined grammar input instead of relying only on fixed examples.

Users can:

- enter custom grammar rules using `->` and `|`
- choose an input string
- generate leftmost derivations, rightmost derivations, or both
- view step-by-step derivation history
- read side-by-side explanations for the active derivation step
- autoplay derivation steps with speed control
- export derivation steps as an image
- generate and inspect a parse tree for the derived string
- export the generated parse tree as an image

### 3. Visualizer

The Visualizer section focuses on the structural interpretation of parse trees.

It includes:

- a tree-construction mode with step playback and speed control
- an ambiguity demonstration showing two parse trees for the same string
- a yield view that highlights terminal leaves
- a focused tree view for full-screen inspection
- a local grammar input area so users can generate a parse tree directly inside the visualizer
- interactive tree dragging and zoom support
- node hover and selection explanations

### 4. Quiz

The Quiz section is designed for repeated practice and self-assessment.

Instead of presenting a fixed question list, it generates fresh question sets so that students can revisit the topic multiple times without repeating the same sequence. The quiz interface includes:

- randomized theory and concept checks
- answer feedback
- explanations after each response
- score tracking
- reset and replay flow

### 5. Help

The Help section provides a concise plain-language summary of:

- what a context-free grammar is
- how to format grammar input
- how to use the generator
- how to read a parse tree
- what ambiguity means in this context

## Grammar Input Format

The application expects grammar rules in a simple and classroom-friendly notation:

```text
S -> a S b | ε
```

Additional examples:

```text
E -> E + T | T
T -> T * F | F
F -> ( E ) | id
```

Input guidelines:

- write one non-terminal rule per line
- use `->` between the left-hand side and right-hand side
- use `|` to separate alternatives
- use `ε` for the empty string
- spaces are allowed, but many common single-character inputs also work without spaces

## Technology Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Framer Motion
- Vitest

## Project Structure

The main application logic is organized across the following files:

- [D:\cfg-explorer\src\pages\Index.tsx](D:/cfg-explorer/src/pages/Index.tsx:1)  
  App shell and top-level tab routing.

- [D:\cfg-explorer\src\components\Header.tsx](D:/cfg-explorer/src/components/Header.tsx:1)  
  Main header and navigation bar.

- [D:\cfg-explorer\src\pages\LearnPageFixed.tsx](D:/cfg-explorer/src/pages/LearnPageFixed.tsx:1)  
  Learn tab content and theory sections.

- [D:\cfg-explorer\src\pages\GeneratorPageEnhanced.tsx](D:/cfg-explorer/src/pages/GeneratorPageEnhanced.tsx:1)  
  Grammar input, derivations, explanations, parse tree generation, and exports.

- [D:\cfg-explorer\src\pages\VisualizerPageEnhanced.tsx](D:/cfg-explorer/src/pages/VisualizerPageEnhanced.tsx:1)  
  Parse tree construction, ambiguity view, yield view, and visualizer-side grammar input.

- [D:\cfg-explorer\src\pages\QuizPage.tsx](D:/cfg-explorer/src/pages/QuizPage.tsx:1)  
  Randomized quiz generation and feedback flow.

- [D:\cfg-explorer\src\pages\HelpPageEnhanced.tsx](D:/cfg-explorer/src/pages/HelpPageEnhanced.tsx:1)  
  Help and usage guidance.

- [D:\cfg-explorer\src\lib\cfg-engine-fixed.ts](D:/cfg-explorer/src/lib/cfg-engine-fixed.ts:1)  
  Grammar parsing, derivation generation, parse-tree construction, and supporting CFG logic.

- [D:\cfg-explorer\src\components\ParseTreeSVGFixed.tsx](D:/cfg-explorer/src/components/ParseTreeSVGFixed.tsx:1)  
  Interactive parse tree renderer with dragging, zooming, and node explanations.

- [D:\cfg-explorer\src\lib\export-utils.ts](D:/cfg-explorer/src/lib/export-utils.ts:1)  
  Image export utilities used by derivation and parse tree views.

## Local Development

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Create a production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

Run tests:

```bash
npm test
```

## Deployment

This project can be deployed as a static frontend application on services such as Vercel or Netlify.

### Vercel

1. Import the repository into Vercel.
2. Keep the default Vite build settings if auto-detected.
3. Ensure the build command is `npm run build`.
4. Ensure the output directory is `dist`.
5. Deploy.

### Netlify

1. Import the repository into Netlify.
2. Set the build command to `npm run build`.
3. Set the publish directory to `dist`.
4. Deploy.

Because the application does not depend on a backend for its core functionality, deployment is straightforward.

## Educational Use Cases

This project is suitable for:

- classroom demonstrations
- lab exercises on formal languages
- self-study and revision
- showing the difference between leftmost and rightmost derivations
- introducing ambiguity through side-by-side parse trees
- student practice through repeated quiz attempts

## Scope and Limitations

This project is intended as a teaching and visualization tool. It supports practical CFG exploration for the included examples and for many user-entered grammars. However, it should not be treated as a full compiler-construction environment or a complete ambiguity prover for arbitrary grammars.

In particular:

- ambiguity is demonstrated through curated examples
- the generator produces one valid derivation pathway when it can
- image export is available from derivation and parse tree views

## Implementation Notes

- The interface is tab-based and built as a single-page application.
- The generator state is shared with the visualizer so users can continue inspecting the latest generated tree.
- The parse tree renderer is interactive and supports node dragging and zooming for clearer inspection.

## Suggested Submission Use

This README is suitable for:

- academic project submission
- GitHub repository documentation
- portfolio presentation of the project
- instructor-facing demonstration notes

## License

This project does not currently define a separate license file. If you plan to distribute or open-source it publicly, add an explicit license.
