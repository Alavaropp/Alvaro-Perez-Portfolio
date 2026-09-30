import fs from 'fs'

const B = '/Alvaro-Perez-Portfolio'

const files = ['index.html']
if (fs.existsSync('projects')) {
  for (const f of fs.readdirSync('projects')) {
    if (f.endsWith('.html')) files.push('projects/' + f)
  }
}

for (const f of files) {
  let s = fs.readFileSync(f, 'utf8')
  s = s
    .replaceAll('data-src="/images/', `data-src="${B}/images/`)
    .replaceAll('href="/projects/', `href="${B}/projects/`)
    .replaceAll('href="/"', `href="${B}/"`)
  fs.writeFileSync(f, s)
  console.log('OK', f)
}