import { getAccessToken } from './firebaseAuth';

export interface DriveBackupFile {
  id: string;
  name: string;
  createdTime: string;
  size?: string;
}

/**
 * List existing SoThuChi backup files in user's Google Drive
 */
export async function listDriveBackups(): Promise<DriveBackupFile[]> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Vui lòng đăng nhập Google để truy cập Google Drive');
  }

  const query = encodeURIComponent("name contains 'SoThuChi_Backup_' and trashed = false");
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,createdTime,size)&orderBy=createdTime desc`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || 'Không thể liệt kê file từ Google Drive');
  }

  const data = await response.json();
  return data.files || [];
}

/**
 * Upload backup JSON data to Google Drive
 */
export async function uploadBackupToDrive(jsonData: any): Promise<DriveBackupFile> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Vui lòng đăng nhập Google để sao lưu lên Google Drive');
  }

  const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const fileName = `SoThuChi_Backup_${dateStr}.json`;
  const fileContent = JSON.stringify(jsonData, null, 2);

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadata = {
    name: fileName,
    mimeType: 'application/json',
    description: 'Bản sao lưu dữ liệu ứng dụng Sổ Thu Chi AI',
  };

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    fileContent +
    closeDelimiter;

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || 'Không thể tải bản sao lưu lên Google Drive');
  }

  return await response.json();
}

/**
 * Download and parse backup JSON file from Google Drive
 */
export async function downloadBackupFromDrive(fileId: string): Promise<any> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Vui lòng đăng nhập Google để tải dữ liệu');
  }

  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Không thể tải file sao lưu từ Google Drive');
  }

  return await response.json();
}
