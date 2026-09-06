import JSZip from 'jszip';
import { GO_CODE_FILES } from '../data/goCodeFiles';

export async function downloadGoProjectZip(): Promise<void> {
  const zip = new JSZip();

  // Add all Go files with their exact directory hierarchy
  GO_CODE_FILES.forEach((file) => {
    zip.file(file.path, file.content);
  });

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'voicestudio-go-project.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
