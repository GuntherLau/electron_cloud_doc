import bootstrapIcons from 'bootstrap-icons/bootstrap-icons.svg'
import classNames from 'classnames'
import './TabList.scss'

const TabList = ({ files, activeId, unsaveIds, onTabClick, onCloseTab }) => {

    return (
        <ul className="nav nav-pills tablist-component">
            {
                files.map(file => {

                    const withUnsaved = unsaveIds.includes(file.id)

                    const finalClassName = classNames({
                        'nav-link': true,
                        'active': file.id === activeId
                    })

                    const finelIconClassName = classNames({
                        'close-icon': true,
                        'bi bi-x-lg': true,
                        'bi bi-circle-fill': withUnsaved
                        // 'withUnsaved': withUnsaved
                    })

                    const unsavedClassName = classNames({
                        'unsaved-icon': true,
                        'rounded-circle ml-0': true,
                        'withUnsaved': withUnsaved
                    })

                    return (
                        <li className="nav-item" key={file.id}>
                            <button type="button"
                            className={finalClassName}
                            style={{border: 'none', background: 'none', cursor: 'pointer'}}
                            onClick={(e) => { e.preventDefault(); onTabClick(file.id); }}
                            >
                                <span >{file.title}</span>
                                <i onClick={(e) => { e.stopPropagation(); onCloseTab(file.id); }} src={bootstrapIcons} className={finelIconClassName} />
                                { withUnsaved && <span className={unsavedClassName}></span>}
                            </button>
                        </li>
                    )
                })
            }
        </ul>
    )
}

TabList.propTypes = {

}

TabList.defaultTypes = {
    unsaveIds: []
}

export default TabList