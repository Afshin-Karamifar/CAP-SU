# Jira Sprint Manager

A modern React application for managing Jira sprints and viewing team members working on tickets in current sprints.

## Features

- 🔐 **API Token Management**: Securely store your Atlassian API token locally
- 📊 **Project Selection**: Browse and select from your available Jira projects
- 🏃‍♂️ **Sprint Overview**: View active and future sprints for selected projects
- 👥 **Team Visibility**: See all team members working on tickets in the current sprint
- 🎨 **Modern UI**: Beautiful interface built with shadcn/ui components
- ✨ **Smooth Animations**: Enhanced user experience with Motion animations
- 🌙 **Dark Mode Ready**: Supports both light and dark themes

## Tech Stack

- **React 19** with TypeScript
- **React Router 7** for navigation
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Motion** for animations
- **shadcn/ui** for UI components
- **Lucide React** for icons
- **pnpm** for package management

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- pnpm
- Atlassian API token

### Installation

1. Install dependencies:

```bash
pnpm install
```

2. Start the development server:

```bash
pnpm run dev
```

3. Open [http://localhost:5173](http://localhost:5173) in your browser

### Configuration

#### Setting up your Jira Domain

1. Navigate to the Settings page in the application
2. Enter your Project Name
3. **Enter your Domain Name** (e.g., `https://yourcompany.atlassian.net`)
4. Enter your Email and API Token
5. Click "Save Project"

#### Updating Development Server Domain

For the development server to proxy requests to your Jira instance:

**Option 1: Using the update script**

```bash
node update-domain.js https://yourcompany.atlassian.net
```

**Option 2: Manual update**
Edit `vite.config.ts` and update the target:

```typescript
target: process.env.JIRA_DOMAIN || 'https://yourcompany.atlassian.net',
```

**Option 3: Environment variable**
Set the `JIRA_DOMAIN` environment variable:

```bash
JIRA_DOMAIN=https://yourcompany.atlassian.net pnpm run dev
```

> **Note**: After changing the domain, restart your development server for changes to take effect.

1. **Get your Atlassian API token**:

   - Go to your Atlassian account settings
   - Navigate to Security → API tokens
   - Click "Create API token"
   - Give it a label and copy the generated token

2. **Configure the application**:

   - Navigate to the Settings page
   - Enter your API token
   - Click "Save API Token"

3. **Update the Jira domain**:
   - Open `src/contexts/AppContext.tsx`
   - Replace `your-domain.atlassian.net` with your actual Jira domain

## Usage

1. **Settings Page**: Configure your Atlassian API token
2. **Home Page**:
   - Select a project from the dropdown
   - Choose a sprint from the available sprints
   - View team members working on tickets in the selected sprint

## Project Structure

```
src/
├── components/
│   ├── ui/          # shadcn/ui components
│   └── Layout.tsx   # Main layout component
├── contexts/
│   └── AppContext.tsx # Global state management
├── pages/
│   ├── Home.tsx     # Main dashboard page
│   └── Settings.tsx # API token configuration
├── lib/
│   └── utils.ts     # Utility functions
└── main.tsx         # Application entry point
```

    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },

},
])

````

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
````
