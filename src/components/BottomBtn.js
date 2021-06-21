import { useState, useEffect, useRef } from "react";
import bootstrapIcons from 'bootstrap-icons/bootstrap-icons.svg'
import PropTypes from 'prop-types'

const BottomBtn = ({ text, colorClass, icon, onBtnClick }) => (
    <button
        type="button"
        className={`btn btn-block no-border ${colorClass}`}
        onClick={onBtnClick}
    >
        <i src={bootstrapIcons} className={icon}></i>
        { text }
    </button>
)

export default BottomBtn