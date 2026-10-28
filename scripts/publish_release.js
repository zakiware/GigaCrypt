const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

async function main() {
  const pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf-8'));
  const version = pkg.version || '1.0.1';
  const tag = `v${version}`;

  console.log(`Starting publication workflow for GigaCrypt ${tag}...`);
  console.log('Retrieving GitHub credentials from Git Credential Manager...');
  const credOutput = execSync('git credential fill', { input: 'protocol=https\nhost=github.com\n' }).toString();
  const token = credOutput.match(/password=(.+)/)?.[1]?.trim();
  if (!token) {
    throw new Error('Failed to retrieve GitHub token');
  }

  const installerName = `GigaCrypt-Setup-${version}.exe`;
  const installerPath = path.resolve(__dirname, `../release/${installerName}`);
  if (!fs.existsSync(installerPath)) {
    throw new Error('Installer not found at: ' + installerPath);
  }

  const stats = fs.statSync(installerPath);
  console.log(`Found installer: ${installerPath} (${(stats.size / (1024 * 1024)).toFixed(2)} MB)`);

  const releaseNotes = `## 🦊 GigaCrypt v${version} — Редизайн интерфейса и оптимизация производительности

Рады представить плановое обновление **GigaCrypt v${version}**! В этой версии проведен масштабный редизайн десктопного интерфейса, повышена скорость криптографических операций, ускорен отклик системы и добавлена загрузка и установка обновлений прямо в окне программы.

---

### 🎨 Что нового в интерфейсе:
* **Современная компоновка Workbench**: Программа перешла на эргономичную структуру с боковой панелью навигации (Sidebar) и центральной рабочей областью (Workbench Canvas).
* **Быстрые фильтры и поиск**: Мгновенный доступ ко всем объектам, защищенным папкам, одиночным файлам и активным песочницам временного просмотра, а также моментальный поиск по реестру.
* **Табличный реестр хранилищ (Vault Ledger)**: Четкая, структурированная таблица заблокированных объектов с подробной информацией о типе, расположении и дате защиты.
* **Обновленная типографика и контраст**: Тщательно подобранная цветовая палитра, гармоничные акценты фирменного янтарно-имбирного цвета, аккуратные скругления и оптимизированные кнопки управления окном.

---

### ⚡ Производительность и криптография:
* **Ускоренная зашифровка и расшифровка**: Оптимизированы алгоритмы упаковки и потоковой передачи данных при шифровании директорий на месте (In-Place Folder Locking).
* **Плавный потоковый отсчет прогресса**: Добавлено динамическое отслеживание прогресса в реальном времени для всех типов операций (файлы, папки, песочница). Проценты плавно и точно отражают фактический объем обработанных байтов.
* **Оптимизация деривации ключа**: Устранено избыточное повторное вычисление ключа при операциях доступа, снижена задержка перед стартом расшифровки.
* **Быстрое освобождение ресурсов**: Очистка оригиналов и временных директорий переведена на неблокирующие асинхронные методы удаления без длительных системных задержек.

---

### 👁 Сессии временного просмотра:
* **Мгновенное завершение сессий**: Кнопка «Завершить» в реестре временного просмотра теперь реагирует моментально (< 16 мс) — сессия сразу снимается с учета, а очистка файлов песочницы выполняется в фоновом режиме.

---

### 🔄 Система автообновления:
* **Загрузка и установка прямо в программе**: Добавлена возможность скачать новую версию и запустить процесс обновления в один клик прямо из окна приложения с отображением прогресса загрузки в мегабайтах и процентах.

---

### 📦 Установка:
1. Скачайте инсталлятор **\`${installerName}\`** ниже.
2. Запустите установку. При необходимости инсталлятор автоматически настроит требуемые компоненты среды Microsoft Visual C++.
3. Приложение готово к работе!`;

  console.log(`Creating GitHub Release ${tag}...`);
  const createReleaseRes = await fetch('https://api.github.com/repos/zakiware/GigaCrypt/releases', {
    method: 'POST',
    headers: {
      'Authorization': 'token ' + token,
      'User-Agent': 'GigaCrypt-Publisher',
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      tag_name: tag,
      target_commitish: 'main',
      name: `GigaCrypt v${version} — Редизайн интерфейса и оптимизация производительности`,
      body: releaseNotes,
      draft: false,
      prerelease: false
    })
  });

  const releaseData = await createReleaseRes.json();
  if (!createReleaseRes.ok) {
    if (releaseData.errors && releaseData.errors.some(e => e.code === 'already_exists')) {
      console.log('Release already exists, fetching existing release info...');
      const getRes = await fetch(`https://api.github.com/repos/zakiware/GigaCrypt/releases/tags/${tag}`, {
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

  console.log(`Release verified at: ${releaseData.html_url}`);
  const uploadUrlTemplate = releaseData.upload_url;
  const uploadUrl = uploadUrlTemplate.replace('{?name,label}', `?name=${installerName}`);

  console.log(`Uploading installer asset (${(stats.size / (1024 * 1024)).toFixed(2)} MB)...`);

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

  console.log(`\n🎉 Release ${tag} published and ${installerName} attached successfully!`);
  console.log('URL: ' + releaseData.html_url);
}

main().catch(err => {
  console.error('Fatal release error:', err);
  process.exit(1);
});
