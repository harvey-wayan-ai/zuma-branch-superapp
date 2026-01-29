# AGENTS.md - Zuma RO PWA

Guidelines for AI agents working on this Next.js + TypeScript + Tailwind CSS project.

## Build Commands

```bash
# Development
npm run dev              # Start dev server on localhost:3000

# Production
npm run build           # Build for production (runs type check + lint)
npm run start           # Start production server

# Code Quality
npm run lint            # Run ESLint
```

## Code Style Guidelines

### TypeScript
- Use strict TypeScript with explicit types
- Prefer `interface` over `type` for object shapes
- Use `type` for unions, tuples, and mapped types
- Always export types that are used across files
- Use PascalCase for types/interfaces, camelCase for variables/functions

### Imports
- Use `@/` alias for project imports (configured in tsconfig.json)
- Group imports: React/Next → External libs → Internal (@/*) → Relative
- Example: `import { Button } from '@/components/ui/button'`

### Components
- Use functional components with explicit return types
- Props interface named `{ComponentName}Props`
- Use `React.FC` sparingly, prefer explicit props typing
- Keep components under 200 lines; extract logic to hooks

### Naming Conventions
- Components: PascalCase (e.g., `ROProcess.tsx`)
- Hooks: camelCase starting with `use` (e.g., `useROData`)
- Utils: camelCase (e.g., `formatDate.ts`)
- Types/Interfaces: PascalCase (e.g., `ROItem`, `ROStatus`)
- Constants: UPPER_SNAKE_CASE for true constants

### Styling (Tailwind CSS)
- Use `cn()` utility from `@/lib/utils` for conditional classes
- Follow mobile-first responsive design
- Use Zuma brand colors: `#0D3B2E` (dark green), `#00D084` (accent)
- Prefer `className` composition over inline styles

### State Management
- Use React hooks (useState, useEffect, useCallback, useMemo)
- Lift state up when shared between components
- Use URL state for shareable/filterable views

### Error Handling
- Use try/catch for async operations
- Show user-friendly error messages (alerts or toast)
- Log errors to console for debugging
- Type error as `any` in catch blocks when needed

### API Integration
- Use Next.js API routes in `app/api/`
- Validate inputs before processing
- Return consistent JSON structure: `{ success: boolean, data?, error? }`

### File Structure
```
app/                    # Next.js App Router
├── api/               # API routes
├── globals.css        # Global styles
├── layout.tsx         # Root layout
└── page.tsx           # Home page

components/            # React components
├── ui/               # shadcn/ui components
└── *.tsx             # Feature components

lib/                   # Utilities
└── utils.ts          # Helper functions

public/               # Static assets
```

### Git Workflow
- Commit message format: `type: description`
- Types: `feat`, `fix`, `refactor`, `docs`, `style`, `test`
- Example: `feat: Add Save Changes button to RO Process`

### Testing (When Added)
```bash
# Run all tests
npm test

# Run single test file
npm test -- Button.test.tsx

# Run with watch mode
npm test -- --watch
```

### Performance
- Use `React.memo` for expensive renders
- Lazy load heavy components with `dynamic()`
- Optimize images with Next.js Image component
- Minimize useEffect dependencies

### Accessibility
- Use semantic HTML elements
- Add aria-labels to interactive elements
- Ensure keyboard navigation works
- Test with screen readers
