import { useState, useEffect } from "react";
import bootstrapIcons from 'bootstrap-icons/bootstrap-icons.svg'
import PropTypes from 'prop-types'
import useKeyPress from '../hooks/usekeyPress'
import useContextMenu from "../hooks/useContextMenu"
import { getParentNode } from '../utils/helper'

const FileList = ({ files, onFileClick, onFileEdit, onFileDelete }) => {

    const [ editStatus, setEditStatus ] = useState(false)
    const [ value, setValue ] = useState('')
    const enterPressed = useKeyPress(13)
    const escPressed = useKeyPress(27)

    const closeSearch = (editItem) => {
        setEditStatus(false)
        setValue('')
        if(editItem.isNew) {
            onFileDelete(editItem.id)
        }
    }

    useEffect(() => {
        const editItem = files.find(file => file.id === editStatus)
        if(enterPressed && editStatus && value.trim()!=='') {
            const editItem = files.find(file => file.id === editStatus)
            onFileEdit(editItem.id, value, editItem.isNew)
            setEditStatus(false)
            setValue('')
        } else if(escPressed && editStatus) {
            closeSearch(editItem)
        }
    })

    useEffect(() => {
        const newFile = files.find(file => file.isNew)
        console.log(newFile)
        if(newFile) {
            setEditStatus(newFile.id)
            setValue(newFile.title)
        }
    }, [files])

    const clickedItem = useContextMenu([
        {
            label: '打开',
            click: () => {
                
                const parentElement = getParentNode(clickedItem.current, 'file-item')
                console.log('打开', parentElement.dataset.id)
                if(parentElement)
                    onFileClick(parentElement.dataset.id)
            }
        },
        {
            label: '重命名',
            click: () => {
                const parentElement = getParentNode(clickedItem.current, 'file-item')
                console.log('重命名', parentElement.dataset.id)
                if(parentElement) {
                    setEditStatus(parentElement.dataset.id);
                    setValue(parentElement.dataset.title); 
                }
            }
        },
        {
            label: '删除',
            click: () => {
                const parentElement = getParentNode(clickedItem.current, 'file-item')
                console.log('删除', parentElement.dataset.id)
                if(parentElement) {
                    onFileDelete(parentElement.dataset.id)
                }
            }
        }
    ], '.file-list', [files])

    return (
        <ul className="list-group list-group-flush file-list">
            {
                files.map(file => (
                    <li className="list-group-item bg-light row mx-0 d-flex align-items-center file-item"
                        key={file.id} data-id={file.id} data-title={file.title}
                    >
                        {   (file.id !== editStatus && !file.isNew) &&
                        <>
                            <i src={bootstrapIcons} className="bi bi-markdown-fill" style={{"font-size": "20px", "width":"30px"}} />
                            <span className="col-6" onClick={() => { onFileClick(file.id) }}>{ file.title }</span>
                        </>
                        }

                        {   ((file.id === editStatus) || (file.isNew)) &&
                        <>
                            <input 
                                className="col-10"
                                value={value}
                                onChange={(e) => { setValue(e.target.value) }}
                            />
                            <button 
                                type="button"
                                className="btn btn-primary col-2"
                                onClick={() => { closeSearch(file) }}>
                                    <i src={bootstrapIcons} className="bi bi-x-lg"></i>
                            </button>
                        </>
                        }

                    </li>
                ))
            }
        </ul>
    )
}

FileList.propTypes = {
    onFileClick: PropTypes.func,
    onFileEdit: PropTypes.func
}

export default FileList