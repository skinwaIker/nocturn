export const uploadToLocalStorage = async (
  file: File,
  folder: 'avatars' | 'banners',
  userId: string
): Promise<{ success: boolean; path?: string; error?: string }> => {
  try {
    const ext = file.name.split('.').pop();
    const filename = `${userId}.${ext}`;
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    formData.append('filename', filename);

    console.log('Uploading to localhost:3001:', { folder, filename, fileSize: file.size });

    const response = await fetch('http://localhost:3001/api/upload', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Upload error response:', response.status, data);
      return { success: false, error: data.error || `Upload failed: ${response.status}` };
    }

    console.log('Upload successful, path:', data.path);
    return { success: true, path: data.path };
  } catch (error) {
    const msg = String(error);
    console.error('Upload exception:', msg);
    return { success: false, error: msg };
  }
};
