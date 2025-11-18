import RNFS from 'react-native-fs';
import FileViewer from 'react-native-file-viewer';

export const downloadFile = async (url: string, fileName: string): Promise<string> => {
  try {
    const downloadDest = `${RNFS.DocumentDirectoryPath}/${fileName}`;
    
    const downloadResult = await RNFS.downloadFile({
      fromUrl: url,
      toFile: downloadDest,
    }).promise;

    if (downloadResult.statusCode === 200) {
      return downloadDest;
    } else {
      throw new Error(`Download failed with status code: ${downloadResult.statusCode}`);
    }
  } catch (error) {
    console.error('Error downloading file:', error);
    throw error;
  }
};

export const openFile = async (filePath: string): Promise<void> => {
  try {
    await FileViewer.open(filePath);
  } catch (error) {
    console.error('Error opening file:', error);
    throw error;
  }
};

export const downloadAndOpenFile = async (url: string, fileName: string): Promise<void> => {
  try {
    const filePath = await downloadFile(url, fileName);
    await openFile(filePath);
  } catch (error) {
    console.error('Error downloading and opening file:', error);
    throw error;
  }
};




