// Guardar como js/main.js
// =====================================================================
// CONFIGURACIÓN INICIAL Y VARIABLES
// =====================================================================
let balance = 0;
let clickValue = 1;
let autoClickValue = 0;
let totalClicks = 0;
let playerName = "Invitado";
let playerLevel = 1;
let playerXP = 0;
let isDarkTheme = true;
let soundEnabled = true;
let inventory = [];
let profileAvatar = '';
let unlockedAvatars = [];
let onlinePlayers = [];
let adsWatchedToday = 0;
let lastAdWatch = 0;

// Configuración desde admin
let gameConfig = {
    startBalance: 1000,
    xpPerLevel: 100,
    baseClickValue: 1,
    
    rocket: {
        minBet: 10,
        maxBet: 10000,
        maxMultiplier: 50,
        explosionChance: 5,
        speed: 100
    },
    
    dice: {
        minBet: 10,
        maxBet: 5000,
        highLowMultiplier: 2,
        doubleMultiplier: 6,
        sevenMultiplier: 3
    },
    
    slots: {
        minBet: 10,
        maxBet: 1000
    },
    
    chests: {
        bronzePrice: 100,
        silverPrice: 500,
        goldPrice: 1000,
        commonChance: 60,
        rareChance: 30,
        epicChance: 9,
        legendaryChance: 1
    },
    
    ads: {
        frequency: 60,
        reward: 50,
        maxDaily: 10,
        text: "¡Mira este increíble anuncio y gana PIX!"
    },
    
    rewards: {
        daily: 50,
        tournament: 500,
        special: 100
    }
};

// Base de datos de usuarios
const usersDatabase = {};

// Tienda de items
let shopItems = [
    { id: 1, type: 'chest', name: 'Cofre Bronce', price: 100, icon: '🎁', rarity: 'Común' },
    { id: 2, type: 'chest', name: 'Cofre Plata', price: 500, icon: '💎', rarity: 'Raro' },
    { id: 3, type: 'chest', name: 'Cofre Oro', price: 1000, icon: '👑', rarity: 'Épico' },
    { id: 4, type: 'avatar', name: 'Avatar Cyber', price: 5000, icon: '🤖', rarity: 'Legendario' },
    { id: 5, type: 'avatar', name: 'Avatar Dragon', price: 10000, icon: '🐉', rarity: 'Mítico' }
];

// Items de cofres
let chestItems = [
    { name: '10 PIX', type: 'currency', value: 10, rarity: 'Común', icon: '💰' },
    { name: '50 PIX', type: 'currency', value: 50, rarity: 'Raro', icon: '💰' },
    { name: '100 PIX', type: 'currency', value: 100, rarity: 'Épico', icon: '💰' },
    { name: 'Multiplicador x2', type: 'boost', value: 2, rarity: 'Legendario', icon: '⚡' }
];

// =====================================================================
// FUNCIONES DE UTILIDAD
// =====================================================================
function showNotification(message, type = "info") {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification show`;
    
    if (type === "success") {
        notification.style.borderColor = "var(--win-color)";
    } else if (type === "error") {
        notification.style.borderColor = "var(--loss-color)";
    } else if (type === "warning") {
        notification.style.borderColor = "#ffcc00";
    } else {
        notification.style.borderColor = "var(--secondary-color)";
    }
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

function playSound(soundId) {
    if (!soundEnabled) return;
    
    try {
        const sound = document.getElementById(soundId);
        if (sound) {
            sound.currentTime = 0;
            sound.play();
        }
    } catch (e) {
        console.log("Error playing sound:", e);
    }
}

function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// =====================================================================
// SISTEMA DE USUARIOS
// =====================================================================
function initAuthSystem() {
    loadUsersDatabase();
    
    const session = getCurrentSession();
    if (session) {
        loadUserData(session.username);
    } else {
        setTimeout(() => {
            document.querySelector('.auth-modal').classList.add('show');
            document.querySelector('.auth-overlay').classList.add('show');
        }, 1000);
    }
    
    // Tabs de login/register
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.dataset.tab;
            
            document.querySelectorAll('.auth-tab').forEach(t => {
                t.style.borderBottom = 'none';
            });
            
            this.style.borderBottom = '3px solid var(--secondary-color)';
            
            document.querySelectorAll('.auth-form').forEach(form => {
                form.style.display = 'none';
            });
            
            document.getElementById(tabId === 'login' ? 'loginForm' : 'registerForm').style.display = 'block';
        });
    });
    
    // Login form
    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;
        
        if (username && password) {
            if (authenticateUser(username, password)) {
                createSession(username);
                loadUserData(username);
                document.querySelector('.auth-modal').classList.remove('show');
                document.querySelector('.auth-overlay').classList.remove('show');
                showNotification(`¡Bienvenido, ${playerName}!`, "success");
                addOnlinePlayer(username);
            } else {
                showNotification("Usuario o contraseña incorrectos", "error");
            }
        }
    });
    
    // Register form
    document.getElementById('registerForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('registerUsername').value.trim();
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('registerConfirmPassword').value;
        
        if (password !== confirmPassword) {
            showNotification("Las contraseñas no coinciden", "error");
            return;
        }
        
        if (username && password) {
            if (registerUser(username, password)) {
                createSession(username);
                loadUserData(username);
                document.querySelector('.auth-modal').classList.remove('show');
                document.querySelector('.auth-overlay').classList.remove('show');
                showNotification(`¡Cuenta creada! Bienvenido, ${playerName}`, "success");
                addOnlinePlayer(username);
            } else {
                showNotification("El usuario ya existe", "error");
            }
        }
    });
    
    // Cerrar sesión
    document.getElementById('logoutBtn').addEventListener('click', function(e) {
        e.stopPropagation();
        logout();
    });
    
    // Cerrar modal
    document.querySelector('.auth-overlay').addEventListener('click', function() {
        document.querySelector('.auth-modal').classList.remove('show');
        this.classList.remove('show');
    });
}

function loadUsersDatabase() {
    const savedUsers = localStorage.getItem('neopixelUsersDB');
    if (savedUsers) {
        Object.assign(usersDatabase, JSON.parse(savedUsers));
    }
}

function saveUsersDatabase() {
    localStorage.setItem('neopixelUsersDB', JSON.stringify(usersDatabase));
}

function registerUser(username, password) {
    if (usersDatabase[username]) return false;
    
    usersDatabase[username] = {
        password: btoa(password),
        balance: gameConfig.startBalance,
        clickValue: gameConfig.baseClickValue,
        autoClickValue: 0,
        totalClicks: 0,
        inventory: [],
        level: 1,
        xp: 0,
        joinDate: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        adsWatchedToday: 0,
        lastAdWatch: 0
    };
    
    saveUsersDatabase();
    return true;
}

function authenticateUser(username, password) {
    const user = usersDatabase[username];
    return user && user.password === btoa(password);
}

function createSession(username) {
    localStorage.setItem('neopixelSession', JSON.stringify({
        username: username,
        timestamp: Date.now()
    }));
}

function getCurrentSession() {
    const session = localStorage.getItem('neopixelSession');
    return session ? JSON.parse(session) : null;
}

function loadUserData(username) {
    const user = usersDatabase[username];
    if (!user) return;
    
    playerName = username;
    balance = user.balance || gameConfig.startBalance;
    clickValue = user.clickValue || gameConfig.baseClickValue;
    autoClickValue = user.autoClickValue || 0;
    totalClicks = user.totalClicks || 0;
    inventory = user.inventory || [];
    playerLevel = user.level || 1;
    playerXP = user.xp || 0;
    adsWatchedToday = user.adsWatchedToday || 0;
    lastAdWatch = user.lastAdWatch || 0;
    
    user.lastLogin = new Date().toISOString();
    saveUsersDatabase();
    
    updateUI();
    updateProfile();
    updateAdsDisplay();
}

function saveUserData() {
    const user = usersDatabase[playerName];
    if (!user) return;
    
    user.balance = balance;
    user.clickValue = clickValue;
    user.autoClickValue = autoClickValue;
    user.totalClicks = totalClicks;
    user.inventory = inventory;
    user.level = playerLevel;
    user.xp = playerXP;
    user.adsWatchedToday = adsWatchedToday;
    user.lastAdWatch = lastAdWatch;
    
    saveUsersDatabase();
}

function logout() {
    removeOnlinePlayer(playerName);
    
    localStorage.removeItem('neopixelSession');
    
    playerName = "Invitado";
    balance = 0;
    clickValue = 1;
    autoClickValue = 0;
    totalClicks = 0;
    inventory = [];
    playerLevel = 1;
    playerXP = 0;
    
    updateUI();
    updateProfile();
    updateOnlinePlayersDisplay();
    
    document.querySelector('.auth-modal').classList.add('show');
    document.querySelector('.auth-overlay').classList.add('show');
    
    showNotification("Sesión cerrada", "success");
}

function addOnlinePlayer(username) {
    if (!onlinePlayers.includes(username)) {
        onlinePlayers.push(username);
        updateOnlinePlayersDisplay();
    }
}

function removeOnlinePlayer(username) {
    const index = onlinePlayers.indexOf(username);
    if (index > -1) {
        onlinePlayers.splice(index, 1);
        updateOnlinePlayersDisplay();
    }
}

function updateOnlinePlayersDisplay() {
    const container = document.getElementById('onlinePlayers');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (onlinePlayers.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 20px; opacity: 0.7;">No hay jugadores en línea</div>';
        return;
    }
    
    onlinePlayers.forEach(player => {
        const div = document.createElement('div');
        div.style.padding = '10px';
        div.style.borderBottom = '1px solid rgba(255, 255, 255, 0.1)';
        div.style.display = 'flex';
        div.style.alignItems = 'center';
        div.style.gap = '10px';
        
        div.innerHTML = `
            <div style="width: 10px; height: 10px; background: #00ff9d; border-radius: 50%;"></div>
            <div>${player}</div>
        `;
        
        container.appendChild(div);
    });
}

// =====================================================================
// MENÚ Y NAVEGACIÓN
// =====================================================================
function initMenu() {
    // Menú de juegos
    const menuToggle = document.getElementById('menuToggle');
    const menuContent = document.getElementById('menuContent');
    const menuIcon = document.getElementById('menuIcon');
    
    if (menuToggle && menuContent) {
        menuToggle.addEventListener('click', function() {
            menuContent.classList.toggle('active');
            menuIcon.innerHTML = menuContent.classList.contains('active') ? 
                '<i class="fas fa-chevron-up"></i>' : 
                '<i class="fas fa-chevron-down"></i>';
        });
    }
    
    // Cookie clicker mini
    const cookieToggle = document.getElementById('cookieToggle');
    const cookieContent = document.getElementById('cookieContent');
    const cookieIcon = document.getElementById('cookieIcon');
    
    if (cookieToggle && cookieContent) {
        cookieToggle.addEventListener('click', function() {
            cookieContent.classList.toggle('active');
            cookieIcon.innerHTML = cookieContent.classList.contains('active') ? 
                '<i class="fas fa-chevron-up"></i>' : 
                '<i class="fas fa-chevron-down"></i>';
        });
    }
    
    // Mini cookie clicker
    const miniCookie = document.getElementById('miniCookie');
    if (miniCookie) {
        miniCookie.addEventListener('click', function() {
            balance += clickValue;
            totalClicks++;
            updateUI();
            saveUserData();
            playSound('clickSound');
            
            // Efecto visual
            createFloatingNumber(clickValue, this.getBoundingClientRect());
        });
    }
    
    // Upgrade mini cookie
    document.getElementById('upgradeMini').addEventListener('click', function() {
        if (balance >= 1000) {
            balance -= 1000;
            autoClickValue += 1;
            updateUI();
            saveUserData();
            showNotification("Auto-click mejorado a +1 PIX/segundo", "success");
            playSound('coinSound');
        } else {
            showNotification("No tienes suficientes PIX", "error");
        }
    });
    
    // Botón de perfil
    document.getElementById('profileButton').addEventListener('click', function() {
        document.getElementById('page-content').innerHTML = 
            `<iframe src="profile.html" frameborder="0" style="width:100%; height:100%; border:none;"></iframe>`;
    });
}

// =====================================================================
// TEMA Y SONIDO
// =====================================================================
function initTheme() {
    const themeToggle = document.getElementById('themeToggle');
    const savedTheme = localStorage.getItem('neopixelTheme');
    
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
        isDarkTheme = false;
        themeToggle.innerHTML = '<i class="fas fa-sun"></i> Modo';
    }
    
    themeToggle.addEventListener('click', function() {
        isDarkTheme = !isDarkTheme;
        if (isDarkTheme) {
            document.body.classList.remove('light-theme');
            localStorage.setItem('neopixelTheme', 'dark');
            this.innerHTML = '<i class="fas fa-moon"></i> Modo';
        } else {
            document.body.classList.add('light-theme');
            localStorage.setItem('neopixelTheme', 'light');
            this.innerHTML = '<i class="fas fa-sun"></i> Modo';
        }
    });
    
    // Sonido
    const soundToggle = document.getElementById('soundToggle');
    if (soundToggle) {
        soundToggle.addEventListener('click', function() {
            soundEnabled = !soundEnabled;
            
            if (soundEnabled) {
                this.innerHTML = '<i class="fas fa-volume-up"></i>';
                showNotification("Sonido activado", "success");
            } else {
                this.innerHTML = '<i class="fas fa-volume-mute"></i>';
                showNotification("Sonido desactivado", "warning");
            }
        });
    }
}

// =====================================================================
// INICIALIZACIÓN COMPLETA
// =====================================================================
function init() {
    // Cargar configuraciones
    const savedConfig = localStorage.getItem('neopixelGameConfig');
    if (savedConfig) {
        Object.assign(gameConfig, JSON.parse(savedConfig));
    }
    
    // Inicializar sistemas
    initAuthSystem();
    initMenu();
    initTheme();
    
    // Actualizar UI
    updateUI();
    updateLeaderboard();
    updateAdsDisplay();
    createStars();
    
    // Usuario admin por defecto
    if (!usersDatabase['Admin']) {
        usersDatabase['Admin'] = {
            password: btoa('admin123'),
            balance: 10000,
            clickValue: 10,
            autoClickValue: 50,
            totalClicks: 1000,
            inventory: [],
            level: 10,
            xp: 0,
            joinDate: new Date().toISOString(),
            lastLogin: new Date().toISOString()
        };
        saveUsersDatabase();
    }
    
    // Auto-clicker
    setInterval(() => {
        if (autoClickValue > 0 && playerName !== "Invitado") {
            balance += autoClickValue;
            updateUI();
            saveUserData();
        }
    }, 1000);
}

function updateUI() {
    const balanceElement = document.getElementById('balance');
    if (balanceElement) balanceElement.textContent = formatNumber(balance);
    
    const miniClickValue = document.getElementById('miniClickValue');
    if (miniClickValue) miniClickValue.textContent = formatNumber(clickValue);
    
    const miniAutoValue = document.getElementById('miniAutoValue');
    if (miniAutoValue) miniAutoValue.textContent = formatNumber(autoClickValue);
    
    const miniTotalClicks = document.getElementById('miniTotalClicks');
    if (miniTotalClicks) miniTotalClicks.textContent = formatNumber(totalClicks);
}

function updateAdsDisplay() {
    const adText = document.getElementById('adText');
    if (adText) adText.textContent = gameConfig.ads.text;
    
    const adReward = document.getElementById('adReward');
    if (adReward) adReward.textContent = `+${gameConfig.ads.reward} PIX`;
    
    const adsRemaining = document.getElementById('adsRemaining');
    if (adsRemaining) adsRemaining.textContent = 
        `Anuncios hoy: ${adsWatchedToday}/${gameConfig.ads.maxDaily}`;
}

function updateLeaderboard() {
    const container = document.getElementById('leaderboard');
    if (!container) return;
    
    // Obtener usuarios ordenados por balance
    const users = Object.keys(usersDatabase).map(username => ({
        username,
        balance: usersDatabase[username].balance || 0,
        level: usersDatabase[username].level || 1
    })).sort((a, b) => b.balance - a.balance);
    
    container.innerHTML = '';
    
    if (users.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 20px; opacity: 0.7;">No hay datos</div>';
        return;
    }
    
    users.slice(0, 10).forEach((user, index) => {
        const item = document.createElement('div');
        item.className = 'leaderboard-item';
        
        item.innerHTML = `
            <div class="leaderboard-rank">${index + 1}</div>
            <div class="leaderboard-name">
                <div>${user.username}</div>
                <div style="font-size: 0.8rem; opacity: 0.7;">Nivel ${user.level}</div>
            </div>
            <div class="leaderboard-balance">${formatNumber(user.balance)} PIX</div>
        `;
        
        container.appendChild(item);
    });
}

function createStars() {
    const starsContainer = document.getElementById('backgroundStars');
    for (let i = 0; i < 150; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.width = Math.random() * 3 + 'px';
        star.style.height = star.style.width;
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        star.style.opacity = Math.random() * 0.7 + 0.3;
        starsContainer.appendChild(star);
    }
}

function createFloatingNumber(value, rect) {
    const floatingNumber = document.createElement('div');
    floatingNumber.className = 'floating-number';
    floatingNumber.textContent = `+${value}`;
    floatingNumber.style.left = `${rect.left + rect.width / 2}px`;
    floatingNumber.style.top = `${rect.top}px`;
    
    document.body.appendChild(floatingNumber);
    
    setTimeout(() => {
        floatingNumber.style.top = `${rect.top - 50}px`;
        floatingNumber.style.opacity = '0';
        
        setTimeout(() => {
            floatingNumber.remove();
        }, 1000);
    }, 10);
}

// Iniciar cuando la página cargue
document.addEventListener('DOMContentLoaded', init);

// Refresh leaderboard
document.getElementById('refreshLeaderboard').addEventListener('click', updateLeaderboard);