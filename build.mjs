import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = process.cwd();
const templatePath = path.join(root, "src", "index.template.html");
const outFile = path.join(root, "index.html");
const contentJsonPath = path.join(root, "content.json");
const partialsDir = path.join(root, "src", "partials");
const contentPartialPath = path.join(partialsDir, "content-data.html");

function ensureDir(dir){
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function build(){
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`);
  }

  if (fs.existsSync(contentJsonPath)) {
    const json = fs.readFileSync(contentJsonPath, "utf8");
    ensureDir(partialsDir);
    const contentBlock = `<script type="application/json" id="content-data">\n${json}\n</script>`;
    fs.writeFileSync(contentPartialPath, contentBlock, "utf8");
  }

  const templateContent = fs.readFileSync(templatePath, "utf8");
  const srcRoot = path.dirname(templatePath);
  const regex = /<!--@include\s+(.+?)\s*-->/g;
  const expanded = templateContent.replace(regex, (match, relPathRaw) => {
    const relPath = relPathRaw.trim();
    const fullPath = path.join(srcRoot, relPath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Include not found: ${relPath}`);
    }
    return fs.readFileSync(fullPath, "utf8").trimEnd();
  });

  fs.writeFileSync(outFile, expanded, "utf8");
  console.log(`Built ${path.relative(root, outFile)} from ${path.relative(root, templatePath)}`);
}

const isDirect = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isDirect) {
  build();
}
