const fs = window.require('fs').promises;

interface FileHelper {
  readFile: (path: string) => Promise<string>;
  writeFile: (path: string, content: string) => Promise<void>;
  renameFile: (path: string, newPath: string) => Promise<void>;
  deleteFile: (path: string) => Promise<void>;
}

const fileHelper: FileHelper = {
  readFile: (path: string): Promise<string> => {
    return fs.readFile(path, { encoding: 'utf8' });
  },

  writeFile: (path: string, content: string): Promise<void> => {
    return fs.writeFile(path, content, { encoding: 'utf8' });
  },

  renameFile: (path: string, newPath: string): Promise<void> => {
    return fs.rename(path, newPath);
  },

  deleteFile: (path: string): Promise<void> => {
    return fs.unlink(path);
  }
};

export default fileHelper;