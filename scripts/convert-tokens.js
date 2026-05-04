const fs = require('fs');
const path = require('path');

const tokensDir = path.join(__dirname, '../tokens');
const outputCssPath = path.join(__dirname, '../src/app/tokens.css');

const readJson = (filename) => JSON.parse(fs.readFileSync(path.join(tokensDir, filename), 'utf8'));

const colorRoles = readJson('color_roles.json');
const colorTokens = readJson('color_tokens.json');
const cornerRadius = readJson('cornerradius.json');
const responsive = readJson('responsive.json');

let cssOutput = `/* Auto-generated tokens from JSON */\n\n:root {\n`;

// Process Corner Radius
cssOutput += `  /* Corner Radius */\n`;
for (const [key, obj] of Object.entries(cornerRadius)) {
  cssOutput += `  --radius-${key}: ${obj.value}px;\n`;
}

// Process Responsive Spacing & Typography for Desktop (Default/Root)
cssOutput += `\n  /* Spacing (Desktop/Default) */\n`;
if (responsive.desktop && responsive.desktop.spacing) {
  for (const [key, obj] of Object.entries(responsive.desktop.spacing)) {
    cssOutput += `  --spacing-${key}: ${obj.value}px;\n`;
  }
}

cssOutput += `\n  /* Typography (Desktop/Default) */\n`;
const processTypography = (platformData) => {
  let typographyVars = '';
  for (const [key, value] of Object.entries(platformData)) {
    if (key === 'font-weight' || key === 'spacing' || key === 'jumpers' || key === 'Device width') continue;
    // It's a text style (e.g., h1, p, caption-md)
    for (const [prop, propData] of Object.entries(value)) {
      let cssValue = propData.value;
      if (prop === 'font-size' || prop === 'line-height' || prop === 'paragraph-spacing') {
        cssValue = `${cssValue}px`;
      } else if (prop === 'typeface') {
        cssValue = `"${cssValue}", sans-serif`;
      }
      typographyVars += `  --${key}-${prop}: ${cssValue};\n`;
    }
  }
  return typographyVars;
};

cssOutput += processTypography(responsive.desktop);

// Resolve Aliases for Colors
const resolveColorAlias = (val) => {
  if (typeof val === 'string' && val.startsWith('{') && val.endsWith('}')) {
    const parts = val.slice(1, -1).split('.');
    if (parts.length === 2 && colorRoles[parts[0]] && colorRoles[parts[0]][parts[1]]) {
      return colorRoles[parts[0]][parts[1]].value;
    }
  }
  return val;
};

const sanitizeName = (name) => name.toLowerCase().replace(/[\s_%]+/g, '-');

// Base Roles (optional, but good for completeness)
cssOutput += `\n  /* Color Roles */\n`;
for (const [category, roles] of Object.entries(colorRoles)) {
  for (const [name, obj] of Object.entries(roles)) {
    cssOutput += `  --role-${sanitizeName(category)}-${sanitizeName(name)}: ${obj.value};\n`;
  }
}

// Light Mode Tokens (Default)
cssOutput += `\n  /* Light Mode Semantic Colors */\n`;
if (colorTokens.light_mode) {
  for (const [category, tokens] of Object.entries(colorTokens.light_mode)) {
    for (const [name, obj] of Object.entries(tokens)) {
      const resolvedValue = resolveColorAlias(obj.value);
      cssOutput += `  --color-${sanitizeName(name)}: ${resolvedValue};\n`;
    }
  }
}

cssOutput += `}\n\n`;

// Dark Mode Semantic Colors
cssOutput += `[data-theme="dark"] {\n  /* Dark Mode Semantic Colors */\n`;
if (colorTokens.dark_mode) {
  for (const [category, tokens] of Object.entries(colorTokens.dark_mode)) {
    for (const [name, obj] of Object.entries(tokens)) {
      const resolvedValue = resolveColorAlias(obj.value);
      cssOutput += `  --color-${sanitizeName(name)}: ${resolvedValue};\n`;
    }
  }
}
cssOutput += `}\n\n`;

// Mobile Overrides
cssOutput += `@media (max-width: 768px) {\n  :root {\n`;
cssOutput += `    /* Spacing (Mobile) */\n`;
if (responsive.mobile && responsive.mobile.spacing) {
  for (const [key, obj] of Object.entries(responsive.mobile.spacing)) {
    cssOutput += `    --spacing-${key}: ${obj.value}px;\n`;
  }
}
cssOutput += `\n    /* Typography (Mobile) */\n`;
const mobileTypo = processTypography(responsive.mobile);
cssOutput += mobileTypo.split('\n').map(line => line ? `  ${line}` : '').join('\n');
cssOutput += `\n  }\n}\n`;

fs.writeFileSync(outputCssPath, cssOutput);
console.log(`Tokens successfully converted and written to ${outputCssPath}`);
