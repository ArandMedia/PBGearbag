import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UploadService {
  private uploadDir: string;

  constructor(private configService: ConfigService) {
    // For now, use local storage. Can be swapped for S3 later
    this.uploadDir = path.join(process.cwd(), 'uploads');
    this.ensureUploadDir();
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
    const folderPath = path.join(this.uploadDir, folder);

    try {
      await fs.access(folderPath);
    } catch {
      await fs.mkdir(folderPath, { recursive: true });
    }

    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    const filepath = path.join(folderPath, filename);

    await fs.writeFile(filepath, file.buffer);

    // Return URL path (relative to uploads directory)
    return `/uploads/${folder}/${filename}`;
  }

  async deleteFile(fileUrl: string): Promise<void> {
    try {
      // Remove /uploads prefix if present
      const relativePath = fileUrl.replace(/^\/uploads\//, '');
      const filepath = path.join(this.uploadDir, relativePath);
      await fs.unlink(filepath);
    } catch (error) {
      console.error('Error deleting file:', error);
      // Don't throw - file might already be deleted
    }
  }

  // TODO: Implement S3 upload
  // async uploadToS3(file: Express.Multer.File, folder: string): Promise<string> {
  //   const s3 = new S3Client({
  //     region: this.configService.get('AWS_REGION'),
  //     credentials: {
  //       accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
  //       secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
  //     },
  //   });
  //
  //   const ext = path.extname(file.originalname);
  //   const key = `${folder}/${uuidv4()}${ext}`;
  //
  //   await s3.send(new PutObjectCommand({
  //     Bucket: this.configService.get('AWS_S3_BUCKET'),
  //     Key: key,
  //     Body: file.buffer,
  //     ContentType: file.mimetype,
  //   }));
  //
  //   return `https://${this.configService.get('AWS_S3_BUCKET')}.s3.amazonaws.com/${key}`;
  // }
}
