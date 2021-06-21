import { useState, useEffect, useRef } from "react";
import bootstrapIcons from 'bootstrap-icons/bootstrap-icons.svg'
import PropTypes from 'prop-types'
import useKeyPress from '../hooks/usekeyPress'

const FileSearch = ({ title, onFileSearch }) => {
    const [inputActive, setInputActive] = useState(false);
    const [value, setValue] = useState("")
    let node  = useRef(null)
    const enterPressed = useKeyPress(13)
    const escPressed = useKeyPress(27)

    const closeSearch = () => {
        setInputActive(false)
        setValue('')
        onFileSearch('')
    }

    useEffect(() => {
        if(enterPressed && inputActive) {
            onFileSearch(value)
        } else if(escPressed && inputActive) {
            closeSearch()
        }
    })

    useEffect(() => {
        if(inputActive) {
            node.current.focus()
        }
    }, [inputActive])

    return (
        <div className="alert alert-primary mb-0">
            {
                !inputActive && 
                <div className="d-flex justify-content-between align-items-center">
                    <span>{title}</span>
                    <button 
                        className="btn btn-primary" 
                        onClick={() => { setInputActive(true) }}>
                        <i src={bootstrapIcons} className="bi bi-search" />
                    </button>
                </div>
            }

            {
                inputActive && 
                <div className="row">
                <input 
                    className="col-9"
                    value={value}
                    ref={node}
                    onChange={(e) => { setValue(e.target.value) }}
                />
                <button 
                    type="button"
                    className="btn btn-primary col-3" 
                    onClick={closeSearch}>
                        <i src={bootstrapIcons} className="bi bi-x-lg"></i>
                    </button>
                </div>
            }
        </div>
    );
};

FileSearch.propTypes = {
    title: PropTypes.string,
    onFileSearch: PropTypes.func.isRequired
}

FileSearch.defaultProps = {
    title: "我的云文档"
}

export default FileSearch;
