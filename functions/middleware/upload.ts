import { NextFunction, Request, Response } from 'express';
import { https } from 'firebase-functions/v1';
import Busboy from 'busboy';

import os from 'os'
import path from 'path'
import fs from 'fs'

interface IFile {
    fieldname: string,
    originalname: string,
    encoding: string | undefined,
    mimetype: string | undefined,
    buffer: Buffer,
    size: number,
}

export const filesUpload = function (req: Request, res:Response, next:NextFunction) {
    const busboy =  Busboy({ headers: req.headers });
  
    const fields: { [key:string]: string} = {};
    const files: IFile[] = [];
    const fileWrites: Promise<void>[] = [];
    // Note: os.tmpdir() points to an in-memory file system on GCF
    // Thus, any files in it must fit in the instance's memory.
    const tmpdir = os.tmpdir();
  
    busboy.on("field", (key, value) => {
      // You could do additional deserialization logic here, values will just be
      // strings
      fields[key] = value;
    });
  
    busboy.on("file", (fieldname: string, file, filename: { filename: string, encoding: string, mimeType: string }) => {
      const filepath = path.join(tmpdir, filename.filename);
      const writeStream = fs.createWriteStream(filepath);
      file.pipe(writeStream);
  
      fileWrites.push(
        new Promise((resolve, reject) => {
          file.on("end", () => writeStream.end());
          writeStream.on("finish", () => {
            fs.readFile(filepath, (err, buffer) => {
              const size = Buffer.byteLength(buffer);
              if (err) {
                return reject(err);
              }
  
              files.push({
                fieldname,
                originalname: filename.filename,
                encoding: filename.encoding,
                mimetype: filename.mimeType,
                buffer,
                size,
              });
  
              try {
                fs.unlinkSync(filepath);
              } catch (error) {
                return reject(error);
              }
  
              resolve();
            });
          });
          writeStream.on("error", reject);
        })
      );
    });
  
    busboy.on("finish", () => {
      Promise.all(fileWrites)
        .then(() => {
          req.body = fields;
          req.body.files = files;
          req.body.file = files[0];
          next();
        })
        .catch(next);
    });
  
    busboy.end((req as https.Request).rawBody);
  };