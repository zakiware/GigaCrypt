import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { ItemType, ProgressUpdate } from '../../types';

const archiverPkg = require('archiver');
const unzipperPkg = require('unzipper');
const unzipper = (unzipperPkg.default || unzipperPkg);

function createZipArchive(options: any = {}) {
  if (archiverPkg.ZipArchive) {
    return new archiverPkg.ZipArchive(options);
  }
  if (typeof archiverPkg === 'function') {
    return archiverPkg('zip', options);
  }
  if (archiverPkg.default && typeof archiverPkg.default === 'function') {
    return archiverPkg.default('zip', options);
  }
  throw new Error('Не удалось инициализировать модуль архивации zip');
}

const MAGIC_HEADER = Buffer.from('GCRYPT02', 'utf-8');
const MAGIC_FOOTER = Buffer.from('GEND02', 'utf-8');
const SALT_LEN = 32;
const IV_LEN = 12;
const TAG_LEN = 16;
const PBKDF2_ITERATIONS = 100_000;

export interface EncryptedMetadata {
  name: string;
  type: ItemType;
  originalSize: number;
  fileCount?: number;
  hint?: string;
  createdAt: number;
  isInPlaceFolder?: boolean;
}

export class CryptoEngine {
  private static deriveKey(password: string, salt: Buffer): Buffer {
    const normalized = (password || '').normalize('NFC');
    return crypto.pbkdf2Sync(normalized, salt, PBKDF2_ITERATIONS, 32, 'sha512');
  }

  public static async calculateItemStats(itemPath: string): Promise<{ size: number; count: number; type: ItemType }> {
    const stat = await fs.promises.stat(itemPath);
    if (!stat.isDirectory()) {
      return { size: stat.size, count: 1, type: 'file' };
    }

    let totalSize = 0;
    let fileCount = 0;

    async function walk(dir: string) {
      const entries = await fs.promises.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name === '.gigavault' || entry.name.toLowerCase() === 'desktop.ini') {
          continue;
        }

        const fullPath = path.join(dir, entry.name);
        try {
          if (entry.isDirectory()) {
            await walk(fullPath);
          } else if (entry.isFile()) {
            const fileStat = await fs.promises.stat(fullPath);
            totalSize += fileStat.size;
            fileCount++;
          }
        } catch {}
      }
    }

    await walk(itemPath);
    return { size: totalSize, count: fileCount, type: 'folder' };
  }

  public static async peekMetadata(
    targetPath: string,
    password?: string
  ): Promise<{ valid: boolean; metadata?: EncryptedMetadata; error?: string }> {
    try {
      let filePath = targetPath;
      if (fs.statSync(targetPath).isDirectory()) {
        filePath = path.join(targetPath, '.gigavault');
      }

      if (!fs.existsSync(filePath)) {
        return { valid: false, error: 'Файл защищенного хранилища не найден' };
      }

      const fd = await fs.promises.open(filePath, 'r');
      try {
        const headerBuf = Buffer.alloc(MAGIC_HEADER.length + SALT_LEN + IV_LEN + TAG_LEN + 4);
        const { bytesRead } = await fd.read(headerBuf, 0, headerBuf.length, 0);

        if (bytesRead < headerBuf.length) {
          return { valid: false, error: 'Хранилище повреждено' };
        }

        const magic = headerBuf.subarray(0, 8);
        if (!magic.equals(MAGIC_HEADER)) {
          return { valid: false, error: 'Неверный формат GigaCrypt' };
        }

        const salt = headerBuf.subarray(8, 40);
        const metaIv = headerBuf.subarray(40, 52);
        const metaTag = headerBuf.subarray(52, 68);
        const metaLen = headerBuf.readUInt32BE(68);

        if (metaLen <= 0 || metaLen > 65536) {
          return { valid: false, error: 'Поврежден заголовок' };
        }

        const encryptedMeta = Buffer.alloc(metaLen);
        await fd.read(encryptedMeta, 0, metaLen, headerBuf.length);

        if (!password) {
          return { valid: true };
        }

        const key = this.deriveKey(password, salt);
        const decipher = crypto.createDecipheriv('aes-256-gcm', key, metaIv);
        decipher.setAuthTag(metaTag);

        const decrypted = Buffer.concat([decipher.update(encryptedMeta), decipher.final()]);
        const metadata: EncryptedMetadata = JSON.parse(decrypted.toString('utf-8'));

        return { valid: true, metadata };
      } finally {
        await fd.close();
      }
    } catch {
      return { valid: false, error: 'Неверный пароль' };
    }
  }

  /**
   * Lock a folder:
   * Encrypts all existing files into .gigavault, wipes original unencrypted files.
   * Absolutely NO extra .exe files created inside or outside!
   */
  public static async lockFolder(
    folderPath: string,
    password: string,
    options: {
      hint?: string;
      onProgress?: (progress: ProgressUpdate) => void;
    } = {}
  ): Promise<{ outputPath: string }> {
    const rawPath = folderPath.replace(/[/\\]+$/, '');
    const baseName = path.basename(rawPath);
    const stats = await this.calculateItemStats(rawPath);

    options.onProgress?.({
      stage: 'analyzing',
      percent: 5,
      message: `Подготовка к шифрованию "${baseName}"...`,
    });

    const vaultPath = path.join(rawPath, '.gigavault');

    // 1. Generate keys
    const salt = crypto.randomBytes(SALT_LEN);
    const metaIv = crypto.randomBytes(IV_LEN);
    const payloadIv = crypto.randomBytes(IV_LEN);
    const key = this.deriveKey(password, salt);

    // 2. Encrypt Metadata
    const metadata: EncryptedMetadata = {
      name: baseName,
      type: 'folder',
      originalSize: stats.size,
      fileCount: stats.count,
      hint: options.hint?.trim() || undefined,
      createdAt: Date.now(),
      isInPlaceFolder: true,
    };

    const metaCipher = crypto.createCipheriv('aes-256-gcm', key, metaIv);
    const encryptedMeta = Buffer.concat([
      metaCipher.update(Buffer.from(JSON.stringify(metadata), 'utf-8')),
      metaCipher.final(),
    ]);
    const metaTag = metaCipher.getAuthTag();

    // 3. Write Vault Header
    const outStream = fs.createWriteStream(vaultPath);
    const metaLenBuf = Buffer.alloc(4);
    metaLenBuf.writeUInt32BE(encryptedMeta.length, 0);

    outStream.write(MAGIC_HEADER);
    outStream.write(salt);
    outStream.write(metaIv);
    outStream.write(metaTag);
    outStream.write(metaLenBuf);
    outStream.write(encryptedMeta);
    outStream.write(payloadIv);

    options.onProgress?.({
      stage: 'encrypting',
      percent: 25,
      message: 'Шифрование данных AES-256-GCM...',
    });

    // 4. Stream folder contents
    const payloadCipher = crypto.createCipheriv('aes-256-gcm', key, payloadIv);

    await new Promise<void>((resolve, reject) => {
      payloadCipher.pipe(outStream, { end: false });

      // Fast streaming compression (level 1 for maximum speed and throughput)
      const archive = createZipArchive({ zlib: { level: 1 } });
      archive.on('error', reject);
      payloadCipher.on('error', reject);

      let lastReport = 0;
      archive.on('progress', (data: any) => {
        const now = Date.now();
        if (now - lastReport > 60) {
          lastReport = now;
          const processed = (data && data.fs && data.fs.processedBytes) || 0;
          const total = stats.size || 1;
          const ratio = Math.min(1, Math.max(0, processed / total));
          const pct = Math.min(85, Math.floor(25 + ratio * 60));
          options.onProgress?.({
            stage: 'encrypting',
            percent: pct,
            message: `Шифрование данных... ${pct}%`,
          });
        }
      });

      archive.pipe(payloadCipher);

      const entries = fs.readdirSync(rawPath);
      for (const entry of entries) {
        if (entry === '.gigavault' || entry.toLowerCase() === 'desktop.ini') continue;
        const fullEntry = path.join(rawPath, entry);
        const entryStat = fs.statSync(fullEntry);
        if (entryStat.isDirectory()) {
          archive.directory(fullEntry, entry);
        } else {
          archive.file(fullEntry, { name: entry });
        }
      }

      archive.finalize();
      payloadCipher.on('end', () => resolve());
    });

    // 5. Append Auth Tag & Magic
    const payloadTag = payloadCipher.getAuthTag();
    await new Promise<void>((resolve, reject) => {
      outStream.write(payloadTag);
      outStream.write(MAGIC_FOOTER, (err) => {
        if (err) return reject(err);
        outStream.end(() => resolve());
      });
    });

    // 6. Rapidly and cleanly remove original unencrypted files
    options.onProgress?.({
      stage: 'wiping',
      percent: 90,
      message: 'Очистка исходных файлов...',
    });

    const entries = await fs.promises.readdir(rawPath);
    for (const entry of entries) {
      if (entry === '.gigavault' || entry.toLowerCase() === 'desktop.ini') continue;
      await fs.promises.rm(path.join(rawPath, entry), { recursive: true, force: true }).catch(() => {});
    }

    options.onProgress?.({
      stage: 'done',
      percent: 100,
      message: 'Папка заблокирована!',
    });

    return { outputPath: rawPath };
  }

  /**
   * Unlock a folder:
   * Verifies password, restores all files into the folder.
   * Absolutely NO extra files created!
   */
  public static async unlockFolder(
    folderPath: string,
    password: string,
    options: {
      onProgress?: (progress: ProgressUpdate) => void;
    } = {}
  ): Promise<{ outputPath: string }> {
    const rawPath = folderPath.replace(/[/\\]+$/, '');
    const vaultPath = path.join(rawPath, '.gigavault');

    if (!fs.existsSync(vaultPath)) {
      throw new Error('Файл защищенного хранилища (.gigavault) не найден');
    }

    options.onProgress?.({
      stage: 'analyzing',
      percent: 10,
      message: 'Проверка ключа доступа...',
    });

    // Decrypt .gigavault stream directly into rawPath
    await this.decryptStreamArchive(vaultPath, password, rawPath, options.onProgress);

    // Completely remove .gigavault so the folder is 100% clean with NO extra files left!
    let vaultDeleted = false;
    for (let attempt = 0; attempt < 10; attempt++) {
      try {
        if (!fs.existsSync(vaultPath)) {
          vaultDeleted = true;
          break;
        }
        await fs.promises.chmod(vaultPath, 0o666).catch(() => {});
        await fs.promises.unlink(vaultPath);
        if (!fs.existsSync(vaultPath)) {
          vaultDeleted = true;
          break;
        }
      } catch {
        await new Promise((r) => setTimeout(r, 60));
      }
    }

    if (!vaultDeleted && fs.existsSync(vaultPath)) {
      try {
        await fs.promises.rm(vaultPath, { force: true }).catch(() => {});
      } catch (err) {
        console.error('Failed to unlink .gigavault file:', err);
      }
    }

    options.onProgress?.({
      stage: 'done',
      percent: 100,
      message: 'Доступ открыт!',
    });

    return { outputPath: rawPath };
  }

  /**
   * Temporary isolated view:
   * Decrypts contents into an isolated temp directory without touching the original folder or .gigavault!
   */
  public static async tempViewFolder(
    folderPath: string,
    password: string,
    tempDestDir: string,
    options: {
      onProgress?: (progress: ProgressUpdate) => void;
    } = {}
  ): Promise<{ outputPath: string }> {
    const rawPath = folderPath.replace(/[/\\]+$/, '');
    const vaultPath = path.join(rawPath, '.gigavault');

    if (!fs.existsSync(vaultPath)) {
      throw new Error('Файл защищенного хранилища (.gigavault) не найден');
    }

    await fs.promises.mkdir(tempDestDir, { recursive: true });
    await this.decryptStreamArchive(vaultPath, password, tempDestDir, options.onProgress);

    return { outputPath: tempDestDir };
  }

  private static async decryptStreamArchive(
    vaultPath: string,
    password: string,
    destDir: string,
    onProgress?: (p: ProgressUpdate) => void
  ): Promise<void> {
    const stat = await fs.promises.stat(vaultPath);
    const fileSize = stat.size;

    const fd = await fs.promises.open(vaultPath, 'r');
    let salt: Buffer;
    let payloadIv: Buffer;
    let payloadTag: Buffer;
    let payloadOffset: number;
    let key: Buffer;

    try {
      const footerBuf = Buffer.alloc(TAG_LEN + MAGIC_FOOTER.length);
      await fd.read(footerBuf, 0, footerBuf.length, fileSize - footerBuf.length);

      const footerMagic = footerBuf.subarray(TAG_LEN);
      if (!footerMagic.equals(MAGIC_FOOTER)) {
        throw new Error('Хранилище повреждено');
      }
      payloadTag = footerBuf.subarray(0, TAG_LEN);

      const headerBuf = Buffer.alloc(MAGIC_HEADER.length + SALT_LEN + IV_LEN + TAG_LEN + 4);
      await fd.read(headerBuf, 0, headerBuf.length, 0);

      salt = headerBuf.subarray(8, 40);
      const metaIv = headerBuf.subarray(40, 52);
      const metaTag = headerBuf.subarray(52, 68);
      const metaLen = headerBuf.readUInt32BE(68);

      const encryptedMeta = Buffer.alloc(metaLen);
      await fd.read(encryptedMeta, 0, metaLen, headerBuf.length);

      const payloadIvBuf = Buffer.alloc(IV_LEN);
      payloadOffset = headerBuf.length + metaLen + IV_LEN;
      await fd.read(payloadIvBuf, 0, IV_LEN, headerBuf.length + metaLen);
      payloadIv = payloadIvBuf;

      key = this.deriveKey(password, salt);
      const metaDecipher = crypto.createDecipheriv('aes-256-gcm', key, metaIv);
      metaDecipher.setAuthTag(metaTag);

      metaDecipher.update(encryptedMeta);
      metaDecipher.final();
    } catch {
      throw new Error('Неверный пароль. Доступ заблокирован.');
    } finally {
      await fd.close();
    }

    onProgress?.({
      stage: 'decrypting',
      percent: 20,
      message: 'Распаковка и проверка целостности...',
    });

    const payloadLength = fileSize - payloadOffset - (TAG_LEN + MAGIC_FOOTER.length);

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, payloadIv);
    decipher.setAuthTag(payloadTag);

    if (payloadLength <= 0) {
      decipher.final();
      return;
    }

    const inStream = fs.createReadStream(vaultPath, {
      start: payloadOffset,
      end: payloadOffset + payloadLength - 1,
    });

    let bytesRead = 0;
    let lastReport = 0;
    inStream.on('data', (chunk: Buffer) => {
      bytesRead += chunk.length;
      const now = Date.now();
      if (now - lastReport > 60) {
        lastReport = now;
        const ratio = Math.min(1, Math.max(0, bytesRead / (payloadLength || 1)));
        const pct = Math.min(95, Math.floor(20 + ratio * 75));
        onProgress?.({
          stage: 'decrypting',
          percent: pct,
          message: `Восстановление файлов... ${pct}%`,
        });
      }
    });

    const extractor = unzipper.Extract({ path: destDir });

    await new Promise<void>((resolve, reject) => {
      let resolved = false;
      const onDone = () => {
        if (!resolved) {
          resolved = true;
          try {
            inStream.destroy();
          } catch {}
          resolve();
        }
      };
      const onError = (err: any) => {
        if (!resolved) {
          resolved = true;
          try {
            inStream.destroy();
          } catch {}
          reject(err);
        }
      };

      inStream
        .pipe(decipher)
        .on('error', onError)
        .pipe(extractor)
        .on('close', onDone)
        .on('finish', onDone)
        .on('error', onError);
    });

    try {
      inStream.destroy();
    } catch {}

    // Brief pause to allow OS file handles to be released on Windows
    await new Promise((r) => setTimeout(r, 50));
  }

  /**
   * Main Encrypt Entry Point
   */
  public static async encrypt(
    sourcePath: string,
    password: string,
    options: {
      hint?: string;
      wipeOriginal?: boolean;
      onProgress?: (progress: ProgressUpdate) => void;
    } = {}
  ): Promise<{ outputPath: string }> {
    if (!password || password.length < 6) {
      throw new Error('Пароль должен содержать минимум 6 символов');
    }
    const stat = await fs.promises.stat(sourcePath);

    if (stat.isDirectory()) {
      return this.lockFolder(sourcePath, password, options);
    }

    // Single file
    const stats = await this.calculateItemStats(sourcePath);
    const itemName = path.basename(sourcePath);
    const outputDir = path.dirname(sourcePath);
    const outputPath = path.join(outputDir, `${itemName}.gcrypt`);

    options.onProgress?.({
      stage: 'analyzing',
      percent: 5,
      message: `Подготовка файла "${itemName}"...`,
    });

    const salt = crypto.randomBytes(SALT_LEN);
    const metaIv = crypto.randomBytes(IV_LEN);
    const payloadIv = crypto.randomBytes(IV_LEN);
    const key = this.deriveKey(password, salt);

    const metadata: EncryptedMetadata = {
      name: itemName,
      type: 'file',
      originalSize: stats.size,
      fileCount: 1,
      hint: options.hint?.trim() || undefined,
      createdAt: Date.now(),
      isInPlaceFolder: false,
    };

    const metaCipher = crypto.createCipheriv('aes-256-gcm', key, metaIv);
    const encryptedMeta = Buffer.concat([
      metaCipher.update(Buffer.from(JSON.stringify(metadata), 'utf-8')),
      metaCipher.final(),
    ]);
    const metaTag = metaCipher.getAuthTag();

    const outStream = fs.createWriteStream(outputPath);
    const metaLenBuf = Buffer.alloc(4);
    metaLenBuf.writeUInt32BE(encryptedMeta.length, 0);

    outStream.write(MAGIC_HEADER);
    outStream.write(salt);
    outStream.write(metaIv);
    outStream.write(metaTag);
    outStream.write(metaLenBuf);
    outStream.write(encryptedMeta);
    outStream.write(payloadIv);

    options.onProgress?.({
      stage: 'encrypting',
      percent: 25,
      message: 'Шифрование AES-256-GCM...',
    });

    const payloadCipher = crypto.createCipheriv('aes-256-gcm', key, payloadIv);

    await new Promise<void>((resolve, reject) => {
      payloadCipher.pipe(outStream, { end: false });
      const fileStream = fs.createReadStream(sourcePath);
      fileStream.on('error', reject);
      payloadCipher.on('error', reject);

      let bytesRead = 0;
      let lastReport = 0;
      fileStream.on('data', (chunk: Buffer) => {
        bytesRead += chunk.length;
        const now = Date.now();
        if (now - lastReport > 60) {
          lastReport = now;
          const ratio = Math.min(1, Math.max(0, bytesRead / (stats.size || 1)));
          const pct = Math.min(90, Math.floor(25 + ratio * 65));
          options.onProgress?.({
            stage: 'encrypting',
            percent: pct,
            message: `Шифрование... ${pct}%`,
          });
        }
      });

      fileStream.pipe(payloadCipher);
      payloadCipher.on('end', () => resolve());
    });

    const payloadTag = payloadCipher.getAuthTag();
    await new Promise<void>((resolve, reject) => {
      outStream.write(payloadTag);
      outStream.write(MAGIC_FOOTER, (err) => {
        if (err) return reject(err);
        outStream.end(() => resolve());
      });
    });

    if (options.wipeOriginal !== false) {
      options.onProgress?.({
        stage: 'wiping',
        percent: 92,
        message: 'Удаление оригинала...',
      });
      await fs.promises.unlink(sourcePath).catch(() => this.wipePath(sourcePath));
    }

    options.onProgress?.({
      stage: 'done',
      percent: 100,
      message: 'Файл зашифрован!',
    });

    return { outputPath };
  }

  /**
   * Main Decrypt Entry Point
   */
  public static async decrypt(
    targetPath: string,
    password: string,
    options: {
      destinationDir?: string;
      keepOriginal?: boolean;
      onProgress?: (progress: ProgressUpdate) => void;
    } = {}
  ): Promise<{ outputPath: string; type: ItemType }> {
    const stat = await fs.promises.stat(targetPath);

    if (stat.isDirectory()) {
      const result = await this.unlockFolder(targetPath, password, options);
      return { outputPath: result.outputPath, type: 'folder' };
    }

    // Single .gcrypt file
    const statSize = stat.size;
    const fd = await fs.promises.open(targetPath, 'r');
    let salt: Buffer;
    let payloadIv: Buffer;
    let payloadTag: Buffer;
    let payloadOffset: number;
    let metadata: EncryptedMetadata;
    let key: Buffer;

    try {
      const footerBuf = Buffer.alloc(TAG_LEN + MAGIC_FOOTER.length);
      await fd.read(footerBuf, 0, footerBuf.length, statSize - footerBuf.length);

      const footerMagic = footerBuf.subarray(TAG_LEN);
      if (!footerMagic.equals(MAGIC_FOOTER)) {
        throw new Error('Файл поврежден');
      }
      payloadTag = footerBuf.subarray(0, TAG_LEN);

      const headerBuf = Buffer.alloc(MAGIC_HEADER.length + SALT_LEN + IV_LEN + TAG_LEN + 4);
      await fd.read(headerBuf, 0, headerBuf.length, 0);

      salt = headerBuf.subarray(8, 40);
      const metaIv = headerBuf.subarray(40, 52);
      const metaTag = headerBuf.subarray(52, 68);
      const metaLen = headerBuf.readUInt32BE(68);

      const encryptedMeta = Buffer.alloc(metaLen);
      await fd.read(encryptedMeta, 0, metaLen, headerBuf.length);

      const payloadIvBuf = Buffer.alloc(IV_LEN);
      payloadOffset = headerBuf.length + metaLen + IV_LEN;
      await fd.read(payloadIvBuf, 0, IV_LEN, headerBuf.length + metaLen);
      payloadIv = payloadIvBuf;

      key = this.deriveKey(password, salt);
      const metaDecipher = crypto.createDecipheriv('aes-256-gcm', key, metaIv);
      metaDecipher.setAuthTag(metaTag);

      const decryptedMeta = Buffer.concat([metaDecipher.update(encryptedMeta), metaDecipher.final()]);
      metadata = JSON.parse(decryptedMeta.toString('utf-8'));
    } catch {
      throw new Error('Неверный пароль. Доступ заблокирован.');
    } finally {
      await fd.close();
    }

    const destDir = options.destinationDir || path.dirname(targetPath);
    await fs.promises.mkdir(destDir, { recursive: true });

    let outputPath = path.join(destDir, metadata.name);
    if (fs.existsSync(outputPath)) {
      const ext = path.extname(metadata.name);
      const base = path.basename(metadata.name, ext);
      outputPath = path.join(destDir, `${base}_restored${ext}`);
    }

    const payloadLength = statSize - payloadOffset - (TAG_LEN + MAGIC_FOOTER.length);

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, payloadIv);
    decipher.setAuthTag(payloadTag);

    if (payloadLength <= 0) {
      decipher.final();
      await fs.promises.writeFile(outputPath, Buffer.alloc(0));
    } else {
      const inStream = fs.createReadStream(targetPath, {
        start: payloadOffset,
        end: payloadOffset + payloadLength - 1,
      });
      const outStream = fs.createWriteStream(outputPath);

      let bytesRead = 0;
      let lastReport = 0;
      inStream.on('data', (chunk: Buffer) => {
        bytesRead += chunk.length;
        const now = Date.now();
        if (now - lastReport > 60) {
          lastReport = now;
          const ratio = Math.min(1, Math.max(0, bytesRead / (payloadLength || 1)));
          const pct = Math.min(95, Math.floor(15 + ratio * 80));
          options.onProgress?.({
            stage: 'decrypting',
            percent: pct,
            message: `Расшифровка... ${pct}%`,
          });
        }
      });

      await new Promise<void>((resolve, reject) => {
        inStream
          .pipe(decipher)
          .on('error', reject)
          .pipe(outStream)
          .on('finish', () => resolve())
          .on('error', reject);
      });
    }

    if (!options.keepOriginal) {
      try {
        await fs.promises.unlink(targetPath);
      } catch {}
    }

    options.onProgress?.({
      stage: 'done',
      percent: 100,
      message: 'Файл расшифрован!',
    });

    return { outputPath, type: 'file' };
  }

  public static async wipePath(targetPath: string): Promise<void> {
    if (!fs.existsSync(targetPath)) return;
    try {
      await fs.promises.chmod(targetPath, 0o666).catch(() => {});
      const stat = await fs.promises.stat(targetPath);
      if (stat.isDirectory()) {
        const entries = await fs.promises.readdir(targetPath);
        for (const entry of entries) {
          await this.wipePath(path.join(targetPath, entry));
        }
        await fs.promises.rm(targetPath, { recursive: true, force: true }).catch(() => fs.promises.rmdir(targetPath));
      } else {
        const size = stat.size;
        if (size > 0) {
          try {
            const fd = await fs.promises.open(targetPath, 'r+');
            try {
              const chunkSize = Math.min(size, 64 * 1024);
              let written = 0;
              while (written < size) {
                const currentChunk = Math.min(chunkSize, size - written);
                const randomBuf = crypto.randomBytes(currentChunk);
                await fd.write(randomBuf, 0, currentChunk, written);
                written += currentChunk;
              }
              await fd.sync();
            } finally {
              await fd.close();
            }
          } catch (e) {
            console.warn('Wipe overwrite failed, proceeding with unlink:', e);
          }
        }
        await fs.promises.unlink(targetPath);
      }
    } catch (err) {
      console.warn('Failed to wipe path:', targetPath, err);
      await fs.promises.rm(targetPath, { recursive: true, force: true }).catch(() => {});
    }
  }
}
