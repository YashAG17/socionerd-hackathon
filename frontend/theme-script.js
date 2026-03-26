import fs from 'fs';
let css = fs.readFileSync('src/styles.css', 'utf-8');

const themeCss = `
:root {
  --bg-color: transparent;
  --text-color: #f1f5f9;
  --text-muted: #94a3b8;
  --panel-bg: rgba(15, 23, 42, 0.4);
  --panel-border: rgba(255, 255, 255, 0.05);
  --input-bg: rgba(15, 23, 42, 0.6);
  --card-hover: rgba(15, 23, 42, 0.6);
  --sidebar-blur: rgba(15, 23, 42, 0.4);
  --brand-text: linear-gradient(to right, #fff, #cbd5e1);
  --btn-secondary: rgba(30, 41, 59, 0.8);
  --btn-secondary-hover: rgba(51, 65, 85, 0.9);
  --comment-bg: rgba(255, 255, 255, 0.03);
  --comment-border: rgba(255, 255, 255, 0.05);
  --delete-color: #ff4d4f;
  --page-gradient: radial-gradient(circle at 10% 20%, rgba(124, 58, 237, 0.15) 0%, transparent 40%),
    radial-gradient(circle at 90% 80%, rgba(249, 115, 22, 0.15) 0%, transparent 40%),
    radial-gradient(circle at 50% 50%, rgba(37, 99, 235, 0.1) 0%, transparent 60%),
    linear-gradient(135deg, #0f172a 0%, #020617 100%);
}

html[data-theme='light'] {
  --page-gradient: radial-gradient(circle at 10% 20%, rgba(124, 58, 237, 0.1) 0%, transparent 40%),
    radial-gradient(circle at 90% 80%, rgba(249, 115, 22, 0.1) 0%, transparent 40%),
    radial-gradient(circle at 50% 50%, rgba(37, 99, 235, 0.1) 0%, transparent 60%),
    linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  --text-color: #0f172a;
  --text-muted: #475569;
  --panel-bg: rgba(255, 255, 255, 0.7);
  --panel-border: rgba(0, 0, 0, 0.1);
  --input-bg: rgba(255, 255, 255, 0.9);
  --card-hover: rgba(255, 255, 255, 0.95);
  --sidebar-blur: rgba(255, 255, 255, 0.6);
  --brand-text: linear-gradient(to right, #0f172a, #334155);
  --btn-secondary: rgba(255, 255, 255, 0.9);
  --btn-secondary-hover: #f1f5f9;
  --comment-bg: rgba(0, 0, 0, 0.02);
  --comment-border: rgba(0, 0, 0, 0.05);
}

.comments-section {
  margin-top: 16px;
  background: var(--comment-bg);
  padding: 16px;
  border-radius: 12px;
  border: 1px solid var(--comment-border);
  position: relative;
}
.comments-section .close-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  background: var(--btn-secondary);
  border: 1px solid var(--panel-border);
  cursor: pointer;
  font-size: 11px;
  font-weight: bold;
  color: var(--text-color);
  padding: 4px 8px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: none;
}
.comments-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
  margin-top: 12px;
}
.comment-item {
  font-size: 14px;
  position: relative;
  padding: 12px;
  background: var(--panel-bg);
  border: 1px solid var(--panel-border);
  border-radius: 8px;
}
.comment-item p {
  margin: 6px 0 0 0;
  color: var(--text-color) !important;
}
.comment-item .timestamp {
  color: var(--text-muted);
  font-size: 12px;
  margin-left: 6px;
}
.comment-item .delete-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--delete-color);
  font-size: 11px;
  padding: 0;
  box-shadow: none;
}
.comment-input-row {
  display: flex;
  gap: 8px;
}

`;

// Insert our vars at the top
css = css.replace(/:root\s*{[\s\S]*?}/, ''); // remove original :root
css = themeCss + css;

// Replace background in body
css = css.replace(/background:[\s\S]*?linear-gradient.*?100%\);/, 'background: var(--page-gradient);');

css = css.replace(/color: #f1f5f9;/g, 'color: var(--text-color);');
css = css.replace(/color: #94a3b8;/g, 'color: var(--text-muted);');
css = css.replace(/rgba\(15, 23, 42, 0\.4\)/g, 'var(--panel-bg)');
css = css.replace(/rgba\(255, 255, 255, 0\.05\)/g, 'var(--panel-border)');
css = css.replace(/background: rgba\(15, 23, 42, 0\.6\)/g, 'background: var(--input-bg)');
css = css.replace(/background: rgba\(15, 23, 42, 0\.5\)/g, 'background: var(--panel-bg)');
css = css.replace(/#0f172a/g, 'var(--bg-color)');

css = css.replace(/background: linear-gradient\(to right, #fff, #cbd5e1\);/g, 'background: var(--brand-text);');
css = css.replace(/background: rgba\(30, 41, 59, 0\.8\);/g, 'background: var(--btn-secondary);');
css = css.replace(/background: rgba\(51, 65, 85, 0\.9\);/g, 'background: var(--btn-secondary-hover);');

// Change post content colors to respect variable
css = css.replace(/color: #cbd5e1;/g, 'color: var(--text-color); opacity: 0.9;');
css = css.replace(/color: #fff;/g, 'color: var(--text-color);');
// Handle button text color override
css = css.replace(/color: var\(--text-color\);\s*cursor: pointer;/g, 'color: #fff;\n  cursor: pointer;');

fs.writeFileSync('src/styles.css', css);
console.log('CSS transformed');
