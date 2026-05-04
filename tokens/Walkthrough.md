# Token Conversion Walkthrough

## What was accomplished

I have successfully initialized the project and converted the JSON design tokens into usable CSS variables. 

Here are the specific changes made:
1. **Initialized Next.js Project**: Created a new Next.js app in the root directory configured for Vanilla CSS styling without TailwindCSS.
2. **Created Token Conversion Script**: Wrote a Node.js script (`scripts/convert-tokens.js`) to parse the JSON files in the `tokens/` directory.
3. **Generated `tokens.css`**: Executed the script, which successfully resolved all aliases and output a structured `src/app/tokens.css` file containing CSS variables for colors, typography, border radii, and spacing. It handles light and dark mode automatically via `[data-theme="dark"]`.
4. **Updated `globals.css`**: Imported the generated `tokens.css` into the main stylesheet and mapped base styling parameters (e.g. `--background`, `--foreground`, and font family) to their respective token variables.

## How to use the tokens
In your vanilla CSS files (e.g., component CSS modules), you can now use these variables directly:
```css
.myComponent {
  background-color: var(--color-primary);
  border-radius: var(--radius-md);
  padding: var(--spacing-l);
  font-family: var(--h1-typeface);
  font-size: var(--h1-font-size);
}
```

## How to update tokens
If you update the design files in the `tokens/` directory, simply run the conversion script again to regenerate the variables:
```bash
node scripts/convert-tokens.js
```
