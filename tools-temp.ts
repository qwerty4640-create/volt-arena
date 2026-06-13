import fs from 'fs';
import path from 'path';

function listAll(dir: string) {
  if (!fs.existsSync(dir)) {
    console.log(`Directory does not exist: ${dir}`);
    return;
  }
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      console.log(`DIR: ${full}`);
      listAll(full);
    } else {
      console.log(`FILE: ${full} (${stat.size} bytes)`);
    }
  }
}

listAll('.');
