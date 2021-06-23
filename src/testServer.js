const fs = require('fs')
const server = require('http').createServer()

server.on('request', (req, res) => {
    // fs.readFile('/Users/lg/Downloads/CocosCreator_v2.0.9_20190310_mac.dmg', (err, data) => {
    //     if(err) throw err
    //     res.end(data)
    // })

    const src = fs.createReadStream('/Users/lg/Downloads/CocosCreator_v2.0.9_20190310_mac.dmg')
    src.pipe(res)
})

server.listen(8000)