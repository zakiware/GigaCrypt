const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

async function main() {
  console.log('Retrieving GitHub credentials from Git Credential Manager...');
  const credOutput = execSync('git credential fill', { input: 'protocol=https\nhost=github.com\n' }).toString();
  const token = credOutput.match(/password=(.+)/)?.[1]?.trim();
  if (!token) {
    throw new Error('Failed to retrieve GitHub token');
  }

  const installerPath = path.resolve(__dirname, '../release/GigaCrypt-Setup-1.0.0.exe');
  if (!fs.existsSync(installerPath)) {
    throw new Error('Installer not found at: ' + installerPath);
  }

  const stats = fs.statSync(installerPath);
  console.log(`Found installer: ${installerPath} (${(stats.size / (1024 * 1024)).toFixed(2)} MB)`);

  const releaseNotes = `## 🦊 GigaCrypt v1.0.0 — Official Production Release

Добро пожаловать в первый официальный релиз **GigaCrypt** — мощного инструмента для защиты файлов и папок на Windows с бескомпромиссным уровнем безопасности и теплым янтарно-имбирным стилем!

---

### ✨ Что нового в версии 1.0.0:
* 🔒 **Военный уровень шифрования**: Аутентифицированный шифр **AES-256-GCM** с 128-битным тегом подлинности и деривацией ключа **PBKDF2-SHA512** (100 000 итераций, 32-байтовая криптографическая соль).
* ⚡ **Мгновенная блокировка папок на месте (Zero-Copy)**: Никакого медленного копирования гигабайтов — шифрование прямо в исходном каталоге.
* 👁 **Изолированный временный просмотр**: Безопасная временная распаковка в защищенную песочницу без модификации заблокированного оригинала.
* 🧹 **100% чистая дешифрация**: Никаких остаточных мусорных файлов или .gigavault после разблокировки.
* 🎬 **Кинематографичный запуск**: Видео-интро высокого разрешения при старте программы.
* 🛡 **Криптографический шредер**: Безвозвратное затирание исходных файлов случайными байтами.
* 🖱 **Глубокая интеграция с Windows Explorer**: Контекстное меню по клику правой кнопкой мыши и ассоциация формата \`.gcrypt\`.
* 🔄 **Автообновление через GitHub**: Автоматическая фоновая проверка релизов и уведомление о выходе обновлений.
* 📦 **Автономный установщик (All-in-One)**: В установщик встроен пакет **Microsoft Visual C++ 2015-2022 Redistributable (x64)** с автоматической тихой установкой при отсутствии в системе.

---

### 📥 Установка:
1. Скачайте файл **\`GigaCrypt-Setup-1.0.0.exe\`** ниже.
2. Запустите установку. Мастер установки сделает всё необходимое.
3. Программа готова к мгновенной защите ваших данных!`;

  console.log('Creating GitHub Release v1.0.0...');
  const createReleaseRes = await fetch('https://api.github.com/repos/zakiware/GigaCrypt/releases', {
    method: 'POST',
    headers: {
      'Authorization': 'token ' + token,
      'User-Agent': 'GigaCrypt-Publisher',
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      tag_name: 'v1.0.0',
      target_commitish: 'main',
      name: 'GigaCrypt v1.0.0 — Official Production Release',
      body: releaseNotes,
      draft: false,
      prerelease: false
    })
  });

  const releaseData = await createReleaseRes.json();
  if (!createReleaseRes.ok) {
    if (releaseData.errors && releaseData.errors.some(e => e.code === 'already_exists')) {
      console.log('Release already exists, fetching existing release...');
      const getRes = await fetch('https://api.github.com/repos/zakiware/GigaCrypt/releases/tags/v1.0.0', {
        headers: {
          'Authorization': 'token ' + token,
          'User-Agent': 'GigaCrypt-Publisher',
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      Object.assign(releaseData, await getRes.json());
    } else {
      throw new Error(`Failed to create release (${createReleaseRes.status}): ` + JSON.stringify(releaseData));
    }
  }

  console.log(`Release created/verified at: ${releaseData.html_url}`);
  const uploadUrlTemplate = releaseData.upload_url;
  const uploadUrl = uploadUrlTemplate.replace('{?name,label}', `?name=GigaCrypt-Setup-1.0.0.exe`);

  console.log(`Uploading installer asset (${(stats.size / (1024 * 1024)).toFixed(2)} MB)... This may take 30-60 seconds.`);

  const urlObj = new URL(uploadUrl);
  await new Promise((resolve, reject) => {
    const req = https.request({
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Authorization': 'token ' + token,
        'User-Agent': 'GigaCrypt-Publisher',
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/octet-stream',
        'Content-Length': stats.size
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log('Asset uploaded successfully!');
          resolve(body);
        } else {
          reject(new Error(`Asset upload failed with HTTP ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', reject);

    const fileStream = fs.createReadStream(installerPath);
    let uploadedBytes = 0;
    let lastPercent = 0;

    fileStream.on('data', (chunk) => {
      uploadedBytes += chunk.length;
      const percent = Math.floor((uploadedBytes / stats.size) * 100);
      if (percent - lastPercent >= 10 || percent === 100) {
        console.log(`Upload progress: ${percent}% (${(uploadedBytes / (1024 * 1024)).toFixed(1)} / ${(stats.size / (1024 * 1024)).toFixed(1)} MB)`);
        lastPercent = percent;
      }
    });

    fileStream.pipe(req);
  });

  console.log('🎉 Release v1.0.0 published and installer attached successfully!');
  console.log('URL: ' + releaseData.html_url);
}

main().catch(err => {
  console.error('Fatal release error:', err);
  process.exit(1);
});
