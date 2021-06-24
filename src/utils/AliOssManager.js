const OSS = require("ali-oss")
const path = require('path')
const fs = require('fs')

class AliOssManager {

    constructor(region, accessKeyId, accessKeySecret, bucket) {
        this.client = new OSS({
            region: region,
            accessKeyId: accessKeyId,
            accessKeySecret: accessKeySecret,
            bucket: bucket
        })

        this.bucket = bucket
    }

    //  上传本地文件
    async uploadFile(objectName, localFilePath) {
        // 填写OSS文件完整路径和本地文件的完整路径。OSS文件完整路径中不能包含Bucket名称。
        // 如果本地文件的完整路径中未指定本地路径，则默认从示例程序所属项目对应本地路径中上传文件。
        return await this.client.put(objectName, localFilePath)
    }

    //  上传本地内存
    async uploadBuffer (fileName, content) {
        return await client.put(fileName, new Buffer(content))
    }

    //  流式上传
    async uploadStream (filePath, fileName, chunked=false) {
        if(chunked) {
            // use 'chunked encoding'
            let stream = fs.createReadStream(filePath)
            return await client.putStream(fileName, stream)
        } else {
            // don't use 'chunked encoding'
            let stream = fs.createReadStream(filePath)
            let size = fs.statSync(filePath).size
            return await client.putStream(fileName, stream, {contentLength: size})
        }
    }

    //  删除云端对象
    async deleteFile(objectName) {
        // 填写Object完整路径。Object完整路径中不能包含Bucket名称。
        return await this.client.delete(objectName)
    }

    //  下载本地文件
    async downloadFile(objectName, localFilePath) {
        // 填写Object完整路径和本地文件的完整路径。Object完整路径中不能包含Bucket名称。
        // 如果指定的本地文件存在会覆盖，不存在则新建。
        // 如果未指定本地路径，则下载后的文件默认保存到示例程序所属项目对应本地路径中。
        return await this.client.get(objectName, localFilePath)
    }

    async isExistObject(objectName, options = {}) {
        return await this.client.head(objectName, options)
    }

}

module.exports = AliOssManager