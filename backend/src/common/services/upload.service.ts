import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

@Injectable()
export class UploadService {
  private uploadDir: string;
  private readonly objectClient?:S3Client;

  constructor(private configService: ConfigService) {
    this.uploadDir = path.join(process.cwd(), 'uploads');
    const endpoint=configService.get<string>('R2_ENDPOINT');
    if(endpoint)this.objectClient=new S3Client({region:'auto',endpoint,credentials:{accessKeyId:configService.getOrThrow('R2_ACCESS_KEY_ID'),secretAccessKey:configService.getOrThrow('R2_SECRET_ACCESS_KEY')}});
    else if(configService.get('NODE_ENV')==='production')throw new Error('R2 object storage configuration is required in production');
    else void this.ensureUploadDir();
  }

  private async ensureUploadDir() {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'general',
  ): Promise<string> {
    const ext=path.extname(file.originalname).toLowerCase();const filename=`${uuidv4()}${ext}`;const key=`${folder}/${filename}`;
    if(this.objectClient){await this.objectClient.send(new PutObjectCommand({Bucket:this.configService.getOrThrow('R2_BUCKET'),Key:key,Body:file.buffer,ContentType:file.mimetype,CacheControl:'public, max-age=31536000, immutable'}));return `${this.configService.getOrThrow('R2_PUBLIC_URL').replace(/\/$/,'')}/${key}`}
    const folderPath = path.join(this.uploadDir, folder);

    try {
      await fs.access(folderPath);
    } catch {
      await fs.mkdir(folderPath, { recursive: true });
    }

    const filepath = path.join(folderPath, filename);

    await fs.writeFile(filepath, file.buffer);

    // Return URL path (relative to uploads directory)
    return `/uploads/${folder}/${filename}`;
  }

  async deleteFile(fileUrl: string): Promise<void> {
    try {
      if(this.objectClient){const base=this.configService.getOrThrow<string>('R2_PUBLIC_URL').replace(/\/$/,'')+'/';if(!fileUrl.startsWith(base))return;await this.objectClient.send(new DeleteObjectCommand({Bucket:this.configService.getOrThrow('R2_BUCKET'),Key:fileUrl.slice(base.length)}));return}
      // Remove /uploads prefix if present
      const relativePath = fileUrl.replace(/^\/uploads\//, '');
      const filepath = path.join(this.uploadDir, relativePath);
      if(!filepath.startsWith(this.uploadDir))return;
      await fs.unlink(filepath);
    } catch (error) {
      console.error('Error deleting file:', error);
      // Don't throw - file might already be deleted
    }
  }

}
