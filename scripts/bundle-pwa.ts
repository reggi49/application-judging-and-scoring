import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const STANDALONE = path.join(ROOT, ".next/standalone");
const BUNDLE_DIR = path.join(ROOT, "dist-deploy");
const ZIP_NAME = "rwsa-judging-pwa-deploy.zip";
const ZIP_PATH = path.join(ROOT, ZIP_NAME);

function log(msg: string) {
  console.log(`\x1b[36m[BUNDLE]\x1b[0m ${msg}`);
}

async function run() {
  log("0. Membersihkan folder staging lama...");
  if (fs.existsSync(BUNDLE_DIR)) {
    fs.rmSync(BUNDLE_DIR, { recursive: true, force: true });
  }

  log("1. Memulai build Next.js PWA (Standalone)...");
  execSync("npm run build", { stdio: "inherit", cwd: ROOT });

  log("2. Menyiapkan folder staging distribusi...");
  fs.mkdirSync(BUNDLE_DIR, { recursive: true });

  log("3. Menyalin hasil standalone ke folder staging...");
  execSync(`cp -R "${STANDALONE}/." "${BUNDLE_DIR}/"`, { stdio: "inherit" });

  log("4. Membersihkan berkas source/dev mentah yang tidak dibutuhkan di runtime...");
  const devFilesToRemove = [
    "src",
    "scripts",
    "dist-deploy",
    "tsconfig.json",
    "tsconfig.tsbuildinfo",
    "eslint.config.mjs",
    "AGENTS.md",
    "PRD.md",
    "PANDUAN_VPS.md",
    "Dockerfile",
    "docker-compose.yml",
    ".env.production", // agar tidak menimpa .env hosting
    "start-vps.sh",
    "deploy.sh",
  ];
  for (const item of devFilesToRemove) {
    const p = path.join(BUNDLE_DIR, item);
    if (fs.existsSync(p)) {
      fs.rmSync(p, { recursive: true, force: true });
    }
  }

  // Hapus semua zip di dalam folder staging jika ada
  for (const file of fs.readdirSync(BUNDLE_DIR)) {
    if (file.endsWith(".zip")) {
      fs.unlinkSync(path.join(BUNDLE_DIR, file));
    }
  }

  log("5. Menyalin aset statis Next.js (.next/static & public)...");
  const destNextStatic = path.join(BUNDLE_DIR, ".next/static");
  const destPublic = path.join(BUNDLE_DIR, "public");

  fs.mkdirSync(destNextStatic, { recursive: true });
  fs.mkdirSync(destPublic, { recursive: true });

  execSync(`cp -R "${path.join(ROOT, ".next/static")}/." "${destNextStatic}/"`, { stdio: "inherit" });
  execSync(`cp -R "${path.join(ROOT, "public")}/." "${destPublic}/"`, { stdio: "inherit" });

  log("6. Memastikan binary multi-platform terpasang (Linux OpenSSL 3.0, RHEL, Alpine musl & macOS)...");
  // Multiplatform Prisma Engines
  const prismaClientSrc = path.join(ROOT, "node_modules/.prisma/client");
  const prismaClientDest = path.join(BUNDLE_DIR, "node_modules/.prisma/client");
  if (fs.existsSync(prismaClientSrc)) {
    fs.mkdirSync(prismaClientDest, { recursive: true });
    execSync(`cp -R "${prismaClientSrc}/." "${prismaClientDest}/"`, { stdio: "inherit" });
  }

  // Multiplatform Argon2 & Sharp
  const pkgDownloadDir = "/tmp/pkg-download";
  if (fs.existsSync(pkgDownloadDir)) {
    const nodeRsDest = path.join(BUNDLE_DIR, "node_modules/@node-rs");
    const imgDest = path.join(BUNDLE_DIR, "node_modules/@img");
    fs.mkdirSync(nodeRsDest, { recursive: true });
    fs.mkdirSync(imgDest, { recursive: true });

    // Argon2 tarballs
    for (const name of ["linux-x64-gnu", "linux-x64-musl", "linux-arm64-gnu"]) {
      const tgz = path.join(pkgDownloadDir, `node-rs-argon2-${name}-2.2.2.tgz`);
      if (fs.existsSync(tgz)) {
        const target = path.join(nodeRsDest, `argon2-${name}`);
        fs.mkdirSync(target, { recursive: true });
        execSync(`tar -xzf "${tgz}" --strip-components=1 -C "${target}"`);
      }
    }

    // Sharp tarballs
    for (const arch of ["linux-x64", "linux-arm64"]) {
      const sharpTgz = path.join(pkgDownloadDir, `img-sharp-${arch}-0.35.5.tgz`);
      if (fs.existsSync(sharpTgz)) {
        const target = path.join(imgDest, `sharp-${arch}`);
        fs.mkdirSync(target, { recursive: true });
        execSync(`tar -xzf "${sharpTgz}" --strip-components=1 -C "${target}"`);
      }
      const libvipsTgz = path.join(pkgDownloadDir, `img-sharp-libvips-${arch}-1.2.4.tgz`);
      if (fs.existsSync(libvipsTgz)) {
        const target = path.join(imgDest, `sharp-libvips-${arch}`);
        fs.mkdirSync(target, { recursive: true });
        execSync(`tar -xzf "${libvipsTgz}" --strip-components=1 -C "${target}"`);
      }
    }
  }

  log("7. Menyalin konfigurasi, skema, dan panduan...");
  fs.copyFileSync(path.join(ROOT, ".env.example"), path.join(BUNDLE_DIR, ".env.example"));
  fs.copyFileSync(path.join(ROOT, "ecosystem.config.cjs"), path.join(BUNDLE_DIR, "ecosystem.config.cjs"));
  fs.copyFileSync(path.join(ROOT, "start.sh"), path.join(BUNDLE_DIR, "start.sh"));
  fs.copyFileSync(path.join(ROOT, "PANDUAN_HOSTING.md"), path.join(BUNDLE_DIR, "PANDUAN_HOSTING.md"));
  fs.copyFileSync(path.join(ROOT, "PANDUAN_HOSTING.md"), path.join(BUNDLE_DIR, "README.md"));

  // Buat .env default dari .env.example
  fs.copyFileSync(path.join(ROOT, ".env.example"), path.join(BUNDLE_DIR, ".env"));

  // Prisma schema & migrations
  const prismaDest = path.join(BUNDLE_DIR, "prisma");
  fs.mkdirSync(prismaDest, { recursive: true });
  execSync(`cp -R "${path.join(ROOT, "prisma")}/." "${prismaDest}/"`, { stdio: "inherit" });

  // Storage directories (uploads & backups)
  const uploadsDir = path.join(BUNDLE_DIR, "storage/uploads");
  const backupsDir = path.join(BUNDLE_DIR, "storage/backups");
  fs.mkdirSync(uploadsDir, { recursive: true });
  fs.mkdirSync(backupsDir, { recursive: true });
  fs.writeFileSync(path.join(uploadsDir, ".gitkeep"), "");
  fs.writeFileSync(path.join(backupsDir, ".gitkeep"), "");

  // Pastikan server.js membaca .env terlebih dahulu & default port 3001
  const serverJsPath = path.join(BUNDLE_DIR, "server.js");
  if (fs.existsSync(serverJsPath)) {
    const envLoader = [
      "// Muat .env terlebih dahulu agar PORT & DATABASE_URL selalu terbaca",
      "try {",
      "  const _fs = require('fs');",
      "  const _path = require('path');",
      "  const _envFile = _path.join(__dirname, '.env');",
      "  if (_fs.existsSync(_envFile)) {",
      "    for (const _l of _fs.readFileSync(_envFile, 'utf8').split(/\\r?\\n/)) {",
      "      const _m = _l.match(/^\\s*([A-Za-z_][A-Za-z0-9_]*)\\s*=\\s*(.*)\\s*$/);",
      "      if (_m && !process.env[_m[1]]) process.env[_m[1]] = _m[2].replace(/^['\"]|['\"]$/g, '');",
      "    }",
      "  }",
      "} catch {}",
      "process.env.PORT = process.env.PORT || '3001';",
      "",
    ].join("\n");
    const origServer = fs.readFileSync(serverJsPath, "utf8");
    fs.writeFileSync(serverJsPath, envLoader + origServer, "utf8");
  }

  // Minimal package.json untuk hosting Node.js selector / npm start
  const minimalPackageJson = {
    name: "rwsa-judging",
    version: "1.0.0",
    private: true,
    scripts: {
      start: "node server.js",
    },
  };
  fs.writeFileSync(
    path.join(BUNDLE_DIR, "package.json"),
    JSON.stringify(minimalPackageJson, null, 2),
    "utf8"
  );

  log("8. Mengompresi seluruh paket ke dalam zip...");
  if (fs.existsSync(ZIP_PATH)) {
    fs.unlinkSync(ZIP_PATH);
  }

  execSync(`cd "${BUNDLE_DIR}" && zip -ry "${ZIP_PATH}" .`, { stdio: "inherit" });

  const stats = fs.statSync(ZIP_PATH);
  const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);

  log(`✅ Sukses! Berkas zip berhasil dibuat:`);
  console.log(`   📂 Path : ${ZIP_PATH}`);
  console.log(`   ⚖️ Ukuran : ${sizeMb} MB`);
  console.log(`   📖 Panduan: ${path.join(ROOT, "PANDUAN_HOSTING.md")}`);
}

run().catch((err) => {
  console.error("Gagal melakukan bundling:", err);
  process.exit(1);
});

