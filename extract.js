import AdmZip from 'adm-zip';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const zipPath = join(__dirname, 'attached_assets', 'UNDERITALL-Report-Cards (1)_1759880001664.zip');
const outputPath = join(__dirname, 'attached_assets', 'extracted');

try {
  const zip = new AdmZip(zipPath);
  zip.extractAllTo(outputPath, true);
  console.log('Extraction complete!');
  console.log('Files extracted to:', outputPath);
} catch (error) {
  console.error('Error extracting zip:', error.message);
}
