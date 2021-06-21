// import logo from './logo.svg';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import FileSearch from './components/FileSearch'
import FileList from './components/FileList'
import BottomBtn from './components/BottomBtn'
import TabList from './components/TabList'
import SimpleMDE from 'react-simplemde-editor'
import 'easymde/dist/easymde.min.css'
import defaultFiles from './utils/defaultFiles'
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid'
import { flattenArr, objToArr } from './utils/helper'
import fileHelper from './utils/fileHelper'

const { join } = window.require('path')
const { remote } = window.require('electron')
const Store = window.require('electron-store')

const fileStore = new Store({'name': 'Files Data'})

//  持久化
const saveFilesToStore = (files) => {
    const a = objToArr(files)
    console.log('AAAA', a)
    const filesStoreObj = a.reduce((result, file) => {
        const { id, path, title, createAt } = file
        result[id] = {
            id, path, title, createAt
        }
        return result
    }, {})
    fileStore.set('files', filesStoreObj)
}

function App() {

    const [ files, setFiles ] = useState(fileStore.get('files') || {} )
    const [ activeFileId, setActiveFileId ] = useState('')
    const [ openedFileIds, setOpenedFileIds ] = useState([])
    const [ unsavedFildIds, setUnsavedFileIds ] = useState([])
    const [ searchedFiles, setSearchedFiles ] = useState([])
    const filesArr = objToArr(files)
    const fileListArr = (searchedFiles.length > 0) ? searchedFiles : filesArr
    const activeFile = files[activeFileId]
    const openedFiles = openedFileIds.map(openId => {
        return files[openId]
    })
    const savedLocation = remote.app.getPath('documents')

    const createNewFile = () => {
        const newId = uuidv4()
        const newFile = {
            id: newId,
            title: '',
            body: '## 请输入 Markdown',
            createAt: new Date().getTime(),
            isNew: true
        }
        setFiles({ ...files, [newId]: newFile})
    }

    const deleteFile = (fileId) => {
        if(files[fileId].isNew) {
            // delete files[fileId]
            // setFiles(files)
            const { [fileId]:value, ...afterDelete} = files
            setFiles(afterDelete)
        } else {
            fileHelper.deleteFile(files[fileId].path).then(() => {
                const { [fileId]:value, ...afterDelete} = files
                setFiles(afterDelete)
                saveFilesToStore(afterDelete)
                tabClose(fileId)
            })
        }
    }

    const fileSearch = (value) => {
        const newFiles = filesArr.filter(file => file.title.includes(value))
        setSearchedFiles(newFiles)
    }

    const fileChange = (fileId, value) => {
        if(!unsavedFildIds.includes(fileId)) {
            setUnsavedFileIds([...unsavedFildIds, fileId])
        }
        const newFile = { ...files[fileId], body: value }
        setFiles({ ...files, [fileId]: newFile})
    }

    const updateFileName = (fileId, fileTitle, isNew) => {
        const newPath = join(savedLocation, `${fileTitle}.md`)

        const modifiedFile = { ...files[fileId], title: fileTitle, isNew: false, path: newPath }
        const newFiles = { ...files, [fileId]: modifiedFile}
        if(isNew) {
            fileHelper.writeFile(newPath, files[fileId].body).then(() => {
                setFiles(newFiles)
                saveFilesToStore(newFiles)
            })
        } else {
            const oldPath = join(savedLocation, `${files[fileId].title}.md`)
            fileHelper.readnameFile( oldPath, newPath ).then(() => {
                setFiles(newFiles)
                saveFilesToStore(newFiles)
            })
        }
    }


    const fileClick = (fileId) => {
        setActiveFileId(fileId)

        const currentFile = files[fileId]
        if(!currentFile.isLoaded) {
            fileHelper.readFile(currentFile.path).then((value) => {
                const newFile = { ...files[fileId], body: value, isLoaded: true}
                setFiles({...files, [fileId]: newFile})
            })
        }

        if(!openedFileIds.includes(fileId))
            setOpenedFileIds([...openedFileIds, fileId])
    }

    const tabClick = (fileId) => {
        setActiveFileId(fileId)
    }

    const tabClose = (fileId) => {
        const tabWithout = openedFileIds.filter(fileID => fileID != fileId)
        setOpenedFileIds(tabWithout)
        if(tabWithout.length > 0)
            setActiveFileId(tabWithout[0])
        else
            setActiveFileId('')
    }

    const saveCurrentFile = () => {
        fileHelper.writeFile(join(savedLocation, `${activeFile.title}.md`), activeFile.body).then(() => {
            setUnsavedFileIds(unsavedFildIds.filter(id => id != activeFile.id))
        })
    }

    return (
        <div className="App container-fluid ">
            <div className="row no-gutters">
                <div className="col-4 bg-light no-gutters left-panel px-0">
                    <FileSearch 
                        title="我的文档" 
                        onFileSearch={fileSearch}
                    />
                    <FileList files={fileListArr}
                        onFileClick={fileClick}
                        onFileDelete={deleteFile}
                        onFileEdit={updateFileName}
                    />
                    <div className="row no-gutters button-group mr-0">
                        <BottomBtn 
                            text="新建"
                            colorClass="col btn-primary"
                            icon="bi bi-file-earmark-plus-fill"
                            onBtnClick={createNewFile}
                            />
                        <BottomBtn 
                            text="导入"
                            colorClass="col btn-success"
                            icon="bi bi-box-arrow-in-right"
                            />
                    </div>
                </div>
                <div className="col-8 right-panel px-0">
                    
                    {
                        !activeFile &&
                        <div className="start-page">
                            选择或者创建新的Markdown文档
                        </div>
                    }


                    {
                        activeFile &&
                        <>
                            <TabList 
                                files={openedFiles}
                                activeId={activeFileId}
                                unsaveIds={unsavedFildIds}
                                onTabClick={tabClick}
                                onCloseTab={tabClose}
                            />
                            <SimpleMDE 
                                value={activeFile && activeFile.body}
                                options={{
                                    minHeight:'507px'
                                }}
                                onChange={(e) => { fileChange(activeFileId, e) }}
                            />
                            <BottomBtn 
                                text="保存"
                                colorClass="col btn-success"
                                icon="bi bi-box-arrow-in-right"
                                onBtnClick={saveCurrentFile}
                                />
                        </>
                    }

                </div>
            </div>
        </div>
    );
}

export default App;