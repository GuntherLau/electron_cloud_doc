
// const arr = [
//     {
//         id: '1', 
//         title: 'first post',
//         body: '内容A',
//         createAt: 1621962994
//     },
//     {
//         id: 2,
//         title: 'second post',
//         body: '内容B',
//         createAt: 1621963047
//     }
// ]
// const map = {
//     1: {
//         title: 'first post',
//         body: '内容A',
//         createAt: 1621962994
//     },
//     2: {
//         title: 'second post',
//         body: '内容B',
//         createAt: 1621963047
//     }
// }
export const flattenArr = (arr) => {
    return arr.reduce((map, item) => {
        map[item.id] = item
        return map
    }, {})
}

export const objToArr = (obj) => {
    return Object.keys(obj).map(key => obj[key])
}

export const getParentNode = (node, parentClassName) => {
    let current = node
    while(current != null) {
        if( current.classList.contains(parentClassName) ) {
            return current
        }
        current = current.parentNode
    }
    return false
}

export const timestampToString = (timestamp) => {
    const data = new Date(timestamp)
    return data.toLocaleDateString() +' '+ data.toLocaleTimeString()
}