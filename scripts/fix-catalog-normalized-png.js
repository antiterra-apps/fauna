const fs = require('fs')
const path = require('path')
const file = path.join(process.cwd(), 'src/lib/catalog.ts')
let c = fs.readFileSync(file, 'utf8')
for (let i = 11; i <= 41; i++) {
  const broken = `normalizedPngUrl: "https://4homyyqtbbvsfvmu.public.blob.vercel-storage.com/assets/normalized/engineers-manual-\n      normalizedWebpUrl: "https://4homyyqtbbvsfvmu.public.blob.vercel-storage.com/assets/normalized/engineers-manual-${i}-1024.webp",`
  const fixed = `normalizedPngUrl: "https://4homyyqtbbvsfvmu.public.blob.vercel-storage.com/assets/normalized/engineers-manual-${i}-1024.png",\n      normalizedWebpUrl: "https://4homyyqtbbvsfvmu.public.blob.vercel-storage.com/assets/normalized/engineers-manual-${i}-1024.webp",`
  c = c.replace(broken, fixed)
}
fs.writeFileSync(file, c)
console.log('Fixed catalog normalizedPngUrl for assets 11-41')
