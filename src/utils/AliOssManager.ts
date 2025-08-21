const OSS = require('ali-oss');
const path = require('path');
const fs = require('fs');
import { AliOssConfig } from '../types';

interface OSSObject {
  name: string;
  url?: string;
  lastModified?: string;
  etag?: string;
  type?: string;
  size?: number;
  owner?: {
    id: string;
    displayName: string;
  };
}

interface OSSListResult {
  objects?: OSSObject[];
  nextMarker?: string;
  isTruncated?: boolean;
}

class AliOssManager {
  private client: any;
  private bucket: string;

  constructor(region: string, accessKeyId: string, accessKeySecret: string, bucket: string) {
    this.client = new OSS({
      region: region,
      accessKeyId: accessKeyId,
      accessKeySecret: accessKeySecret,
      bucket: bucket
    });

    this.bucket = bucket;
  }

  // 上传本地文件
  async uploadFile(objectName: string, localFilePath: string): Promise<any> {
    // 填写OSS文件完整路径和本地文件的完整路径。OSS文件完整路径中不能包含Bucket名称。
    // 如果本地文件的完整路径中未指定本地路径，则默认从示例程序所属项目对应本地路径中上传文件。
    return await this.client.put(objectName, localFilePath);
  }

  // 上传本地内存
  async uploadBuffer(fileName: string, content: string): Promise<any> {
    return await this.client.put(fileName, Buffer.from(content));
  }

  // 流式上传
  async uploadStream(filePath: string, fileName: string, chunked: boolean = false): Promise<any> {
    if (chunked) {
      // use 'chunked encoding'
      const stream = fs.createReadStream(filePath);
      return await this.client.putStream(fileName, stream);
    } else {
      // don't use 'chunked encoding'
      const stream = fs.createReadStream(filePath);
      const size = fs.statSync(filePath).size;
      return await this.client.putStream(fileName, stream, { contentLength: size });
    }
  }

  // 删除云端对象
  async deleteFile(objectName: string): Promise<any> {
    // 填写Object完整路径。Object完整路径中不能包含Bucket名称。
    return await this.client.delete(objectName);
  }

  // 下载本地文件
  async downloadFile(objectName: string, localFilePath: string): Promise<any> {
    // 填写Object完整路径和本地文件的完整路径。Object完整路径中不能包含Bucket名称。
    // 如果指定的本地文件存在会覆盖，不存在则新建。
    // 如果未指定本地路径，则下载后的文件默认保存到示例程序所属项目对应本地路径中。
    return await this.client.get(objectName, localFilePath);
  }

  async isExistObject(objectName: string, options: any = {}): Promise<any> {
    return await this.client.head(objectName, options);
  }

  async objects(): Promise<OSSObject[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const arr: OSSObject[] = [];
        let marker: string | null = null;
        // 每页列举20个文件。
        const maxKeys = 20;
        
        do {
          const result = await this.client.list({ marker, 'max-keys': maxKeys }) as OSSListResult;
          console.log(result);
          marker = result.nextMarker || null;
          
          if (result.objects && result.objects.length > 0) {
            result.objects.forEach(obj => {
              arr.push(obj);
            });
          }
        } while (marker);
        
        resolve(arr);
      } catch (error) {
        reject(error);
      }
    });
  }

  // 更新文件元信息
  async putMeta(objectName: string, data: any): Promise<any> {
    return await this.client.putMeta(objectName, data);
  }
}

module.exports = AliOssManager;