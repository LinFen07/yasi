# Branch-specific frontend ports

This repository has three frontend app lines: admin (`admin`), scoring (`main` and `new`), and student (`student`). Keep their development servers on separate ports so the apps can run side by side.

Before starting or changing a development server, identify the app branch and read its current configuration. Check `vue.config.js` for Vue CLI, `webpack.config.js` or `config-overrides.js` for custom webpack, and `PORT` in the environment or package scripts for Create React App. Treat the configured development-server port as authoritative. Treat an API proxy `target` port as a backend port.

When checking ports across branches, inspect each branch's current files with `git show <branch>:<config-file>`; do not infer a port from the branch name or an older version. If two app lines resolve to the same port, report the conflicting branch configurations before choosing a replacement.

## Worktree placement

Do not check out the `student` (or any non-admin) branch in a worktree nested inside this repository's working tree (e.g. `.worktrees/`). Tooling that searches parent directories — notably `postcss-loader`/`cosmiconfig` — will pick up this branch's `postcss.config.js`/`babel.config.js` and fail with dozens of `Module build failed` errors. Keep the student worktree outside the repo (e.g. a sibling directory like `../yasi-student`).
