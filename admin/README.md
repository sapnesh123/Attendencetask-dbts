# REAN HRMS Admin Dashboard

A modern, clean, and modular Human Resource Management System admin dashboard built with React and Bootstrap.

## Features
- **Modular Architecture**: Separate components for Sidebar, Header, and Content.
- **Dynamic Routing**: Easy route management via `routes.jsx`.
- **Dynamic Navigation**: Sidebar generated from `_nav.jsx`.
- **Clean UI**: Standard Bootstrap styling with custom premium aesthetics.
- **No Dependencies**: All third-party UI libraries (like CoreUI) have been removed for maximum performance and control.

## Project Structure
```
src/
├── assets/      # Branding and images
├── components/  # Core layout and shared components
├── context/     # Auth and Global state
├── features/    # Redux slices
├── layout/      # Main layout containers
├── scss/        # Custom styles
├── views/       # Page views
├── _nav.jsx     # Navigation config
├── App.jsx      # Main App component
├── routes.jsx   # Route configuration
└── store.jsx    # Redux store setup
```

## Getting Started

### Installation
```bash
npm install
```

### Development
```bash
npm start
```

### Build
```bash
npm run build
```

## License
MIT