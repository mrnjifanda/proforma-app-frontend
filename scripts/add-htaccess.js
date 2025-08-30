import fs from 'node:fs';
import path from 'node:path';

const config = {

    outputDir: 'out',
    cacheTime: {
        assets: 31536000,
        html: 0,
        api: 300
    },

    assetExtensions: ['css', 'js', 'png', 'jpg', 'jpeg', 'gif', 'ico', 'svg', 'woff', 'woff2', 'ttf', 'eot', 'webp', 'avif'],

    security: {
        xFrameOptions: 'SAMEORIGIN',
        xContentTypeOptions: 'nosniff',
        xXSSProtection: '1; mode=block',
        referrerPolicy: 'strict-origin-when-cross-origin'
    },

    fallbackPage: '/index.html'
};

function generateHtaccessContent() {
    const assetExts = config.assetExtensions.join('|');

    return `# Configuration générée automatiquement pour Next.js export statique
  # Généré le: ${new Date().toISOString()}
  
  # ==========================================
  # REDIRECTION POUR SPA (Single Page App)
  # ==========================================
  <IfModule mod_rewrite.c>
    RewriteEngine On
    
    # Gestion des assets - ne pas rediriger les fichiers existants
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_URI} !\\.(${assetExts})$ [NC]
    
    # Redirection vers ${config.fallbackPage}
    RewriteRule . ${config.fallbackPage} [L]
    
    # Cache pour les assets statiques
    <IfModule mod_expires.c>
      ExpiresActive On
      
      # Assets avec cache long terme
  ${config.assetExtensions.map(ext => `    ExpiresByType ${getContentType(ext)} "access plus ${config.cacheTime.assets} seconds"`).join('\n')}
      
      # HTML sans cache
      ExpiresByType text/html "access plus ${config.cacheTime.html} seconds"
      
      # JSON/API avec cache court
      ExpiresByType application/json "access plus ${config.cacheTime.api} seconds"
    </IfModule>
  </IfModule>
  
  # ==========================================
  # COMPRESSION GZIP/BROTLI
  # ==========================================
  <IfModule mod_deflate.c>
    # Compression GZIP
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE text/javascript
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
    AddOutputFilterByType DEFLATE application/json
    AddOutputFilterByType DEFLATE image/svg+xml
  </IfModule>
  
  # Compression Brotli (si disponible)
  <IfModule mod_brotli.c>
    BrotliCompressionQuality 6
    AddOutputFilterByType BROTLI_COMPRESS text/plain
    AddOutputFilterByType BROTLI_COMPRESS text/html
    AddOutputFilterByType BROTLI_COMPRESS text/css
    AddOutputFilterByType BROTLI_COMPRESS application/javascript
    AddOutputFilterByType BROTLI_COMPRESS application/json
  </IfModule>
  
  # ==========================================
  # HEADERS DE SÉCURITÉ
  # ==========================================
  <IfModule mod_headers.c>
    # Protection contre le clickjacking
    Header always set X-Frame-Options "${config.security.xFrameOptions}"
    
    # Protection contre le sniffing de type MIME
    Header always set X-Content-Type-Options "${config.security.xContentTypeOptions}"
    
    # Protection XSS
    Header always set X-XSS-Protection "${config.security.xXSSProtection}"
    
    # Politique de référent
    Header always set Referrer-Policy "${config.security.referrerPolicy}"
    
    # Cache control pour les assets
    <FilesMatch "\\.(${assetExts})$">
      Header set Cache-Control "public, max-age=${config.cacheTime.assets}, immutable"
      Header set Vary "Accept-Encoding"
    </FilesMatch>
    
    # Cache control pour HTML
    <FilesMatch "\\.html$">
      Header set Cache-Control "no-cache, no-store, must-revalidate"
      Header set Pragma "no-cache"
      Header set Expires "0"
    </FilesMatch>
    
    # Cache pour JSON/API
    <FilesMatch "\\.json$">
      Header set Cache-Control "public, max-age=${config.cacheTime.api}"
    </FilesMatch>
  </IfModule>
  
  # ==========================================
  # OPTIMISATIONS SUPPLÉMENTAIRES
  # ==========================================
  
  # Désactiver le listing des répertoires
  Options -Indexes
  
  # Protection des fichiers sensibles
  <FilesMatch "\\.(env|log|htaccess|htpasswd)$">
    Order Allow,Deny
    Deny from all
  </FilesMatch>
  
  # Optimisation des images
  <IfModule mod_headers.c>
    <FilesMatch "\\.(jpg|jpeg|png|gif|webp|avif)$">
      Header set Cache-Control "public, max-age=${config.cacheTime.assets}"
      Header set Vary "Accept"
    </FilesMatch>
  </IfModule>
  
  # Support des polices web
  <IfModule mod_mime.c>
    AddType application/font-woff2 .woff2
    AddType application/font-woff .woff
    AddType application/font-ttf .ttf
    AddType application/font-eot .eot
  </IfModule>
  
  # CORS pour les polices (si nécessaire)
  <IfModule mod_headers.c>
    <FilesMatch "\\.(woff|woff2|ttf|eot)$">
      Header set Access-Control-Allow-Origin "*"
    </FilesMatch>
  </IfModule>
  `;
}

function getContentType(extension) {
    const contentTypes = {
        'css': 'text/css',
        'js': 'application/javascript',
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'gif': 'image/gif',
        'ico': 'image/x-icon',
        'svg': 'image/svg+xml',
        'woff': 'font/woff',
        'woff2': 'font/woff2',
        'ttf': 'font/ttf',
        'eot': 'application/vnd.ms-fontobject',
        'webp': 'image/webp',
        'avif': 'image/avif'
    };

    return contentTypes[extension] || 'application/octet-stream';
}

function addHtaccess() {
    const outDir = path.join(process.cwd(), config.outputDir);
    const htaccessPath = path.join(outDir, '.htaccess');

    try {
        // Vérifier si le dossier out existe
        if (!fs.existsSync(outDir)) {
            console.error(`❌ Le dossier "${config.outputDir}" n'existe pas. Exécutez d'abord "npm run build"`);
            process.exit(1);
        }

        // Générer le contenu du .htaccess
        const htaccessContent = generateHtaccessContent();

        // Créer ou remplacer le fichier .htaccess
        fs.writeFileSync(htaccessPath, htaccessContent, 'utf8');

        console.log('✅ Fichier .htaccess avancé créé avec succès !');
        console.log(`📁 Chemin: ${htaccessPath}`);

        // Afficher les statistiques
        const stats = fs.statSync(htaccessPath);
        console.log(`📊 Taille: ${(stats.size / 1024).toFixed(2)} KB`);

        console.log('\n🚀 Fonctionnalités ajoutées:');
        console.log('   • Redirection SPA avec fallback personnalisable');
        console.log(`   • Cache des assets (${config.cacheTime.assets / 86400} jours)`);
        console.log('   • Compression GZIP + Brotli');
        console.log('   • Headers de sécurité complets');
        console.log('   • Protection contre clickjacking et XSS');
        console.log('   • Support optimisé des polices web');
        console.log('   • Protection des fichiers sensibles');
        console.log(`   • Support de ${config.assetExtensions.length} types d'assets`);

    } catch (error) {
        console.error('❌ Erreur lors de la création du fichier .htaccess:', error.message);
        process.exit(1);
    }
}

const args = process.argv.slice(2);
if (args.includes('--help')) {
    console.log(`
  Usage: node scripts/add-htaccess-advanced.js [options]
  
  Options:
    --output-dir <dir>    Dossier de destination (défaut: out)
    --cache-time <sec>    Temps de cache pour les assets en secondes (défaut: 31536000)
    --fallback <page>     Page de fallback (défaut: /index.html)
    --help               Afficher cette aide
  
  Exemple:
    node scripts/add-htaccess-advanced.js --output-dir dist --cache-time 86400
    `);
    process.exit(0);
}

args.forEach((arg, index) => {
    if (arg === '--output-dir' && args[index + 1]) {
        config.outputDir = args[index + 1];
    }
    if (arg === '--cache-time' && args[index + 1]) {
        config.cacheTime.assets = parseInt(args[index + 1]);
    }
    if (arg === '--fallback' && args[index + 1]) {
        config.fallbackPage = args[index + 1];
    }
});

addHtaccess();
