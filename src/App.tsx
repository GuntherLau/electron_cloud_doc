import React, { useState } from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'easymde/dist/easymde.min.css';

import SimpleMDE from 'react-simplemde-editor';
import FileSearch from './components/FileSearch';
import FileList from './components/FileList';
import BottomBtn from './components/BottomBtn';
import TabList from './components/TabList';
import Loader from './components/Loader';

import { v4 as uuidv4 } from 'uuid';
import { flattenArr, objToArr, timestampToString } from './utils/helper';
import fileHelper from './utils/fileHelper';
import useIpcRenderer from './hooks/useIpcRenderer';
import { FileItem, FileStore, IpcMessage } from './types';

const { join, basename, extname, dirname } = window.require('path');
const { ipcRenderer } = window.require('electron');
const { dialog, app } = window.require('@electron/remote');
const Store = window.require('electron-store');

const fileStore = new Store({ name: 'Files Data' });
const settingsStore = new Store({ name: 'Settings' });

// Persistence
const saveFilesToStore = (files: FileStore): void => {
  const filesStoreObj = objToArr(files).reduce((result: FileStore, file: FileItem) => {
    const { id, path, title, createAt, isSynced, updatedAt } = file;
    result[id] = {
      id,
      path,
      title,
      createAt,
      isSynced,
      updatedAt
    };
    return result;
  }, {});
  fileStore.set('files', filesStoreObj);
};

const getAutoSync = (): boolean =>
  [
    '#settings-Region',
    '#settings-AccessKeyId',
    '#settings-AccessKeySecret',
    '#settings-Bucket',
    'enableAutoSync'
  ].every(key => !!settingsStore.get(key));

const App: React.FC = () => {
  const [files, setFiles] = useState<FileStore>(fileStore.get('files') || {});
  const [activeFileId, setActiveFileId] = useState<string>('');
  const [openedFileIds, setOpenedFileIds] = useState<string[]>([]);
  const [unsavedFileIds, setUnsavedFileIds] = useState<string[]>([]);
  const [searchedFiles, setSearchedFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const activeFile: FileItem | null = files[activeFileId] || null;
  const fileListArr = searchedFiles.length > 0 ? searchedFiles : objToArr(files);
  const openedFiles = openedFileIds.map(openId => files[openId]).filter(Boolean);
  const savedLocation = settingsStore.get('savedFileLocation') || app.getPath('documents');

  const fileClick = (fileId: string): void => {
    setActiveFileId(fileId);
    const currentFile = files[fileId];

    const tabNotOpened = !openedFileIds.includes(fileId);
    if (tabNotOpened) {
      setOpenedFileIds(prev => [...prev, fileId]);
    }

    if (!currentFile.isLoaded) {
      if (currentFile.path) {
        fileHelper.readFile(currentFile.path).then(value => {
          const newFile: FileItem = { ...files[fileId], body: value, isLoaded: true };
          const newFiles = { ...files, [fileId]: newFile };
          setFiles(newFiles);
        });
      }
    }
  };

  const tabClick = (fileId: string): void => {
    setActiveFileId(fileId);
  };

  const tabClose = (id: string): void => {
    const tabsWithout = openedFileIds.filter(fileId => fileId !== id);
    setOpenedFileIds(tabsWithout);

    if (tabsWithout.length > 0) {
      setActiveFileId(tabsWithout[tabsWithout.length - 1]);
    } else {
      setActiveFileId('');
    }
  };

  const fileChange = (id: string, value: string): void => {
    if (!value.trim() && files[id].isNew) return;

    const newFile: FileItem = { ...files[id], body: value };
    const newFiles = { ...files, [id]: newFile };
    setFiles(newFiles);

    if (!unsavedFileIds.includes(id)) {
      setUnsavedFileIds(prev => [...prev, id]);
    }
  };

  const deleteFile = (fileId: string): void => {
    if (files[fileId].isNew) {
      const { [fileId]: value, ...afterDelete } = files;
      setFiles(afterDelete);
    } else {
      fileHelper.deleteFile(files[fileId].path!).then(() => {
        ipcRenderer.send('delete-file', {
          id: fileId,
          path: files[fileId].path
        });
        const { [fileId]: value, ...afterDelete } = files;
        setFiles(afterDelete);
        saveFilesToStore(afterDelete);
        tabClose(fileId);
      }).catch(() => {
        // File already manually deleted locally
        const { [fileId]: value, ...afterDelete } = files;
        setFiles(afterDelete);
        saveFilesToStore(afterDelete);
        tabClose(fileId);
      });
    }
  };

  const fileSearch = (keyword: string): void => {
    const newFiles = objToArr(files).filter(file => file.title.includes(keyword));
    setSearchedFiles(newFiles);
  };

  const createNewFile = (): void => {
    const newId = uuidv4();
    const newFile: FileItem = {
      id: newId,
      title: '',
      body: '## 请输入 Markdown',
      createAt: new Date().getTime(),
      isNew: true
    };
    setFiles({ ...files, [newId]: newFile });
  };

  const saveCurrentFile = (): void => {
    const { path, body, title } = activeFile!;
    fileHelper.writeFile(path!, body!).then(() => {
      setUnsavedFileIds(prev => prev.filter(id => id !== activeFile!.id));
      if (getAutoSync()) {
        ipcRenderer.send('upload-file', { id: activeFile!.id, path });
      }
    });
  };

  const updateFileName = (fileId: string, fileTitle: string, isNew: boolean): void => {
    const newPath = isNew 
      ? join(savedLocation as string, `${fileTitle}.md`) 
      : join(dirname(files[fileId].path!), `${fileTitle}.md`);

    const modifiedFile: FileItem = { 
      ...files[fileId], 
      title: fileTitle, 
      isNew: false, 
      path: newPath 
    };
    const newFiles = { ...files, [fileId]: modifiedFile };

    if (isNew) {
      fileHelper.writeFile(newPath, files[fileId].body!).then(() => {
        setFiles(newFiles);
        saveFilesToStore(newFiles);
      });
    } else {
      const oldPath = files[fileId].path!;
      fileHelper.renameFile(oldPath, newPath).then(() => {
        setFiles(newFiles);
        saveFilesToStore(newFiles);
        ipcRenderer.send('update-fileName', {
          oldPath,
          newPath
        });
      });
    }
  };

  const importFiles = (): void => {
    dialog.showOpenDialog({
      title: '选择导入的 Markdown 文件',
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'Markdown files', extensions: ['md'] }
      ]
    }).then((result: any) => {
      const { filePaths } = result;
      if (Array.isArray(filePaths)) {
        const filteredPaths = filePaths.filter((path: string) => {
          const alreadyAdded = Object.values(files).find((file: FileItem) => file.path === path);
          return !alreadyAdded;
        });

        const importFilesArr = filteredPaths.map((path: string) => {
          return {
            id: uuidv4(),
            title: basename(path, extname(path)),
            path
          };
        });

        const newFiles = { ...files, ...flattenArr(importFilesArr) };
        setFiles(newFiles);
        saveFilesToStore(newFiles);

        if (importFilesArr.length > 0) {
          dialog.showMessageBox({
            type: 'info',
            title: '导入成功',
            message: `成功导入了${importFilesArr.length}个文件`
          });
        }
      }
    });
  };

  const activeFileUploaded = (): void => {
    const { id } = activeFile!;
    const modifiedFile: FileItem = { ...files[id], isSynced: true, updatedAt: new Date().getTime() };
    const newFiles = { ...files, [id]: modifiedFile };
    setFiles(newFiles);
    saveFilesToStore(newFiles);
  };

  const activeFileDownloaded = (event: any, message: IpcMessage): void => {
    const currentFile = files[message.id];
    const { id, path } = currentFile;
    fileHelper.readFile(path!).then(value => {
      let newFile: FileItem;

      if (message.status === 'download-file-success') {
        newFile = { ...files[id], body: value, isLoaded: true, isSynced: true, updatedAt: new Date().getTime() };
      } else {
        newFile = { ...files[id], body: value, isLoaded: true };
      }

      const newFiles = { ...files, [id]: newFile };
      setFiles(newFiles);
      saveFilesToStore(newFiles);
    });
  };

  const filesUploaded = (): void => {
    const newFiles = objToArr(files).reduce((result: FileStore, file: FileItem) => {
      const currentTime = new Date().getTime();
      result[file.id] = {
        ...file,
        isSynced: true,
        updatedAt: currentTime
      };
      return result;
    }, {});
    setFiles(newFiles);
    saveFilesToStore(newFiles);
  };

  const allFileDownload = (event: any, newFiles: FileStore): void => {
    setFiles(newFiles);
    saveFilesToStore(newFiles);
  };

  const loadingStatus = (event: any, status: boolean): void => {
    setIsLoading(status);
  };

  useIpcRenderer({
    'create-new-file': createNewFile,
    'import-file': importFiles,
    'save-edit-file': saveCurrentFile,
    'active-file-uploaded': activeFileUploaded,
    'file-downloaded': activeFileDownloaded,
    'files-uploaded': filesUploaded,
    'all-file-download': allFileDownload,
    'loading-status': loadingStatus
  });

  return (
    <div className="App container-fluid px-0">
      {isLoading && <Loader />}
      <div className="row">
        <div className="col-3 bg-light left-panel">
          <FileSearch title="我的云文档" onFileSearch={fileSearch} />
          <FileList 
            files={fileListArr}
            onFileClick={fileClick}
            onFileDelete={deleteFile}
            onFileEdit={updateFileName}
          />
          <div className="row">
            <div className="col">
              <BottomBtn
                text="新建"
                colorClass="btn-primary"
                icon="add"
                onBtnClick={createNewFile}
              />
            </div>
            <div className="col">
              <BottomBtn
                text="导入"
                colorClass="btn-success"
                icon="arrow-down"
                onBtnClick={importFiles}
              />
            </div>
          </div>
        </div>
        <div className="col-9 right-panel">
          {!activeFile && (
            <div className="start-page">
              选择或者创建新的 Markdown 文档
            </div>
          )}
          {activeFile && (
            <>
              <TabList
                files={openedFiles}
                activeId={activeFileId}
                unsaveIds={unsavedFileIds}
                onTabClick={tabClick}
                onCloseTab={tabClose}
              />
              <SimpleMDE
                key={activeFile && activeFile.id}
                value={activeFile && activeFile.body}
                options={{
                  minHeight: '507px'
                }}
                onChange={(e: string) => {
                  fileChange(activeFileId, e);
                }}
              />
              {activeFile.isSynced && (
                <span className="sync-status">
                  已同步，上次同步{timestampToString(activeFile.updatedAt || 0)}
                </span>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;