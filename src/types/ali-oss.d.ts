declare module 'ali-oss' {
  interface OSSOptions {
    region: string;
    accessKeyId: string;
    accessKeySecret: string;
    bucket: string;
  }

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

  interface OSSListOptions {
    marker?: string;
    'max-keys'?: number;
  }

  interface OSSListResult {
    objects?: OSSObject[];
    nextMarker?: string;
    isTruncated?: boolean;
  }

  class OSS {
    constructor(options: OSSOptions);
    put(objectName: string, file: string | Buffer | any): Promise<any>;
    putStream(objectName: string, stream: any, options?: any): Promise<any>;
    get(objectName: string, localFilePath?: string): Promise<any>;
    delete(objectName: string): Promise<any>;
    head(objectName: string, options?: any): Promise<any>;
    list(options?: OSSListOptions): Promise<OSSListResult>;
    putMeta(objectName: string, meta: any): Promise<any>;
  }

  export = OSS;
}