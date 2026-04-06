const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const srcDir = path.join(rootDir, 'src');

const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else {
      if (dirFile.endsWith('.ts') || dirFile.endsWith('.tsx')) {
        filelist.push(dirFile);
      }
    }
  });
  return filelist;
};

const updateFile = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // General fixes for all files
  content = content.replace(/process\.env\.GEMINI_API_KEY/g, "import.meta.env.VITE_GOOGLE_AI_API_KEY");

  const relativeToSrc = path.relative(srcDir, filePath);
  const parts = relativeToSrc.split(path.sep);
  const depth = parts.length - 1;

  if (relativeToSrc === 'App.tsx' || relativeToSrc === 'index.tsx') {
    // These are in src/
    content = content.replace(/from '\.\/components\/Communities'/g, "from './pages/Communities'");
    content = content.replace(/from '\.\/components\/MyNotes'/g, "from './pages/MyNotes'");
    content = content.replace(/from '\.\/components\/(Home|Auth|ProfilePage|Settings|NotificationsPage|AITutor|TestsQuizzes|ProgressPage)'/g, "from './pages/$1'");
    content = content.replace(/from '\.\/components\/(Header|CodeBlock|OverviewChart|ParticleBackground|ProgressRing)'/g, "from './components/$1'");
    content = content.replace(/from '\.\/lib\//g, "from './services/");
  } else {
    // files in pages/, components/, services/, etc.
    let up = depth === 1 ? '../' : depth === 2 ? '../../' : '../../../';
    
    // Convert old ../lib/ to new services
    content = content.replace(/from '\.\.\/lib\//g, `from '${up}services/`);
    content = content.replace(/from '\.\/lib\//g, `from '${up}services/`); // edge cases
    
    // Components -> Pages
    content = content.replace(/from '\.\.\/components\/Communities/g, `from '${up}pages/Communities`);
    content = content.replace(/from '\.\.\/components\/MyNotes/g, `from '${up}pages/MyNotes`);
    content = content.replace(/from '\.\.\/components\/(Home|Auth|ProfilePage|Settings|NotificationsPage|AITutor|TestsQuizzes|ProgressPage)'/g, `from '${up}pages/$1'`);
    
    // Sibling import within old components/ updating
    content = content.replace(/from '\.\/(Header|CodeBlock|OverviewChart|ParticleBackground|ProgressRing)'/g, `from '${up}components/$1'`);
    
    // Generic types moving to root of src
    content = content.replace(/from '\.\.\/types'/g, `from '${up}types'`);
    content = content.replace(/from '\.\.\/utils'/g, `from '${up}utils'`);
    content = content.replace(/from '\.\.\/constants'/g, `from '${up}constants'`);
  }

  if (originalContent !== content) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
};

const files = walkSync(srcDir);
files.forEach(updateFile);

// index.html update
const htmlPath = path.join(rootDir, 'index.html');
if (fs.existsSync(htmlPath)) {
  let html = fs.readFileSync(htmlPath, 'utf8');
  html = html.replace('src="/index.tsx"', 'src="/src/index.tsx"');
  fs.writeFileSync(htmlPath, html, 'utf8');
  console.log('Updated index.html');
}

console.log('Done mapping imports.');
