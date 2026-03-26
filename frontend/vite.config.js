import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function localUploadPlugin() {
  return {
    name: 'local-upload',
    configureServer(server) {
      server.middlewares.use('/api/upload', (req, res) => {
        if (req.method === 'POST') {
          const fileNameHeader = req.headers['file-name'] || 'upload.bin';
          const safeName = path.basename(decodeURIComponent(fileNameHeader)).replace(/[^a-zA-Z0-9.-]/g, '_');
          const filename = Date.now() + '-' + safeName;
          const uploadDir = path.resolve(__dirname, 'public/uploads');
          
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          
          const uploadPath = path.resolve(uploadDir, filename);
          const fileStream = fs.createWriteStream(uploadPath);
          req.pipe(fileStream);
          
          req.on('end', () => {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ url: '/uploads/' + filename }));
          });
        }
      });
    }
  }
}

export default defineConfig({
  plugins: [react(), localUploadPlugin()],
  server: {
    port: 5173
  }
})
