import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

function runReg(args: string[]): Promise<void> {
  return new Promise((resolve) => {
    const proc = spawn('reg.exe', args, { windowsHide: true });
    proc.on('close', () => resolve());
    proc.on('error', () => resolve());
  });
}

export class WindowsRegistry {
  /**
   * Determine executable path dynamically across production installations and dev environments
   */
  public static getExePath(): string {
    if (process.execPath && path.basename(process.execPath).toLowerCase().includes('gigacrypt')) {
      return process.execPath;
    }
    const devCandidates = [
      path.join(__dirname, '../../../dist-exe/GigaCrypt-win32-x64/GigaCrypt.exe'),
      path.join(process.cwd(), 'dist-exe/GigaCrypt-win32-x64/GigaCrypt.exe'),
      path.join(process.cwd(), 'GigaCrypt.exe'),
    ];
    for (const cand of devCandidates) {
      if (fs.existsSync(cand)) {
        return path.resolve(cand);
      }
    }
    return process.execPath;
  }

  public static getIconPath(): string {
    const candidatePaths = [
      path.join(path.dirname(process.execPath), 'icon.ico'),
      path.join(path.dirname(process.execPath), 'resources', 'icon.ico'),
      path.join(__dirname, '../../../icon.ico'),
      path.join(process.cwd(), 'icon.ico'),
    ];
    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        return path.resolve(p);
      }
    }
    return this.getExePath();
  }

  /**
   * Register .gcrypt file association with custom GigaCrypt 3D icon & instant open command
   */
  public static async registerFileAssociation(): Promise<void> {
    if (process.platform !== 'win32') return;

    const exe = this.getExePath();
    const ico = this.getIconPath();

    try {
      await runReg(['delete', 'HKCU\\Software\\Classes\\GigaCrypt.Vault\\shell\\GigaCrypt_Decrypt', '/f']);
      await runReg(['delete', 'HKCU\\Software\\Classes\\GigaCrypt.Vault\\shell\\GigaCrypt', '/f']);

      await runReg(['add', 'HKCU\\Software\\Classes\\.gcrypt', '/ve', '/d', 'GigaCrypt.Vault', '/f']);
      await runReg(['add', 'HKCU\\Software\\Classes\\GigaCrypt.Vault', '/ve', '/d', 'Зашифрованный объект GigaCrypt', '/f']);
      await runReg(['add', 'HKCU\\Software\\Classes\\GigaCrypt.Vault\\DefaultIcon', '/ve', '/d', `"${ico}",0`, '/f']);
      await runReg(['add', 'HKCU\\Software\\Classes\\GigaCrypt.Vault\\shell\\open', '/ve', '/d', '🔓 Расшифровать в GigaCrypt', '/f']);
      await runReg(['add', 'HKCU\\Software\\Classes\\GigaCrypt.Vault\\shell\\open', '/v', 'Icon', '/d', `"${ico}",0`, '/f']);
      await runReg(['add', 'HKCU\\Software\\Classes\\GigaCrypt.Vault\\shell\\open\\command', '/ve', '/d', `"${exe}" open "%1"`, '/f']);
    } catch (err) {
      console.error('Failed to register file association:', err);
    }
  }

  /**
   * Register Windows Explorer Right-Click Context Menu
   * Strictly 1 clean item per target type:
   * - Files (except .gcrypt): "🔒 Зашифровать в GigaCrypt"
   * - Folders: "🔒 Зашифровать папку в GigaCrypt" and "🔓 Расшифровать папку в GigaCrypt"
   */
  public static async registerContextMenu(): Promise<void> {
    if (process.platform !== 'win32') return;

    const exe = this.getExePath();
    const ico = this.getIconPath();

    // 1. Purge ALL duplicate/legacy keys first
    await this.unregisterContextMenu();

    try {
      // 2. For all regular files (*) - do NOT show on .gcrypt files
      await runReg(['add', 'HKCU\\Software\\Classes\\*\\shell\\GigaCrypt_Encrypt', '/ve', '/d', '🔒 Зашифровать в GigaCrypt', '/f']);
      await runReg(['add', 'HKCU\\Software\\Classes\\*\\shell\\GigaCrypt_Encrypt', '/v', 'Icon', '/d', `"${ico}",0`, '/f']);
      await runReg(['add', 'HKCU\\Software\\Classes\\*\\shell\\GigaCrypt_Encrypt', '/v', 'AppliesTo', '/d', 'NOT System.FileExtension:=.gcrypt', '/f']);
      await runReg(['add', 'HKCU\\Software\\Classes\\*\\shell\\GigaCrypt_Encrypt\\command', '/ve', '/d', `"${exe}" encrypt "%1"`, '/f']);

      // 3. For directories - Encrypt
      await runReg(['add', 'HKCU\\Software\\Classes\\Directory\\shell\\GigaCrypt_Encrypt', '/ve', '/d', '🔒 Зашифровать папку в GigaCrypt', '/f']);
      await runReg(['add', 'HKCU\\Software\\Classes\\Directory\\shell\\GigaCrypt_Encrypt', '/v', 'Icon', '/d', `"${ico}",0`, '/f']);
      await runReg(['add', 'HKCU\\Software\\Classes\\Directory\\shell\\GigaCrypt_Encrypt\\command', '/ve', '/d', `"${exe}" encrypt "%V"`, '/f']);

      // 4. For directories - Decrypt
      await runReg(['add', 'HKCU\\Software\\Classes\\Directory\\shell\\GigaCrypt_Decrypt', '/ve', '/d', '🔓 Расшифровать папку в GigaCrypt', '/f']);
      await runReg(['add', 'HKCU\\Software\\Classes\\Directory\\shell\\GigaCrypt_Decrypt', '/v', 'Icon', '/d', `"${ico}",0`, '/f']);
      await runReg(['add', 'HKCU\\Software\\Classes\\Directory\\shell\\GigaCrypt_Decrypt\\command', '/ve', '/d', `"${exe}" open "%V"`, '/f']);
    } catch (err) {
      console.error('Failed to register context menu:', err);
    }
  }

  public static async unregisterContextMenu(): Promise<void> {
    if (process.platform !== 'win32') return;

    const keysToClean = [
      'HKCU\\Software\\Classes\\*\\shell\\GigaCrypt',
      'HKCU\\Software\\Classes\\*\\shell\\GigaCryptEncrypt',
      'HKCU\\Software\\Classes\\*\\shell\\GigaCrypt_Encrypt',
      'HKCU\\Software\\Classes\\*\\shell\\GigaCrypt_EncryptFile',
      'HKCU\\Software\\Classes\\Directory\\shell\\GigaCrypt',
      'HKCU\\Software\\Classes\\Directory\\shell\\GigaCryptEncrypt',
      'HKCU\\Software\\Classes\\Directory\\shell\\GigaCryptUnlock',
      'HKCU\\Software\\Classes\\Directory\\shell\\GigaCrypt_Encrypt',
      'HKCU\\Software\\Classes\\Directory\\shell\\GigaCrypt_Decrypt',
      'HKCU\\Software\\Classes\\Directory\\shell\\GigaCrypt_EncryptFolder',
      'HKCU\\Software\\Classes\\Directory\\shell\\GigaCrypt_DecryptFolder',
    ];

    for (const key of keysToClean) {
      try {
        await runReg(['delete', key, '/f']);
      } catch {}
    }
  }
}
