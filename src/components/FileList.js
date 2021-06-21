import { useState, useEffect, useRef } from "react";
import bootstrapIcons from 'bootstrap-icons/bootstrap-icons.svg'
import PropTypes from 'prop-types'
import useKeyPress from '../hooks/usekeyPress'

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
        if(enterPressed && editStatus && value.trim()!='') {
            const editItem = files.find(file => file.id == editStatus)
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

    return (
        <ul className="list-group list-group-flush file-list">
            {
                files.map(file => (
                    <li className="list-group-item bg-light row mx-0 d-flex align-items-center file-item"
                        key={file.id}
                    >
                        {   (file.id != editStatus && !file.isNew) &&
                        <>
                            <button className="col-2 btn btn-outline-primary">
                                <i src={bootstrapIcons} className="bi bi-markdown-fill" style={{"font-size": "20px"}} />
                            </button>

                            <span className="col-6" onClick={() => { onFileClick(file.id) }}>{ file.title }</span>

                            <button className="col-2 btn btn-outline-primary"
                                onClick={() => { setEditStatus(file.id); setValue(file.title); }}
                            >
                                <i src={bootstrapIcons} className="bi bi-file-text-fill" style={{"font-size": "20px"}} />
                            </button>
                            
                            <button className="col-2 btn btn-outline-primary"
                                onClick={() => { onFileDelete(file.id) }}
                            >
                                <i src={bootstrapIcons} className="bi bi-archive-fill" style={{"font-size": "20px"}} />
                            </button>
                        </>
                        }

                        {   ((file.id == editStatus) || (file.isNew)) &&
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