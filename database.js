// database.js (MODIFIED)
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 数据库文件路径
const dbPath = path.join(process.cwd(), 'resume_tracker.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database ' + err.message);
    } else {
        console.log('Database connected.');

        // --- 1. 创建 records 表 ---
        db.run(`
            CREATE TABLE IF NOT EXISTS records (
                                                   id INTEGER PRIMARY KEY AUTOINCREMENT,
                                                   submission_time TEXT NOT NULL,
                                                   company TEXT NOT NULL,
                                                   status TEXT NOT NULL,
                                                   interview_details TEXT,
                                                   business TEXT,
                                                   address TEXT,
                                                   benefits TEXT
            )
        `, (err) => {
            if (err) {
                console.error("Error creating records table: " + err.message);
            } else {
                console.log("Records table created or already exists.");
            }
        });

        // --- 2. 创建 users 表 (用于登录/注册) ---
        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                                                 id INTEGER PRIMARY KEY AUTOINCREMENT,
                                                 username TEXT UNIQUE NOT NULL,
                                                 password TEXT NOT NULL
            )
        `, (err) => {
            if (err) {
                console.error("Error creating users table: " + err.message);
            } else {
                console.log("Users table created or already exists.");
                // 确保至少有一个默认用户 (如果数据库为空)
                const defaultUser = 'admin';
                const defaultPass = '123456';
                db.get(`SELECT username FROM users WHERE username = ?`, [defaultUser], (err, row) => {
                    if (!row) {
                        db.run(`INSERT INTO users (username, password) VALUES (?, ?)`, [defaultUser, defaultPass], (err) => {
                            if (err) console.error("Error inserting default user: " + err.message);
                            else console.log("Default user 'admin' inserted.");
                        });
                    }
                });
            }
        });
    }
});

// --- 记录操作函数 (CRUD) ---
function insertRecord(record) {
    const { submission_time, company, status, interview_details, business, address, benefits } = record;
    return new Promise((resolve, reject) => {
        db.run(`INSERT INTO records (submission_time, company, status, interview_details, business, address, benefits)
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [submission_time, company, status, interview_details, business, address, benefits],
            function(err) {
                if (err) {
                    console.error('Insert error:', err.message);
                    reject(err);
                } else {
                    resolve(this.lastID);
                }
            }
        );
    });
}

function getAllRecords() {
    return new Promise((resolve, reject) => {
        db.all("SELECT id, submission_time, company, status, interview_details, business, address, benefits FROM records ORDER BY id DESC", [], (err, rows) => {
            if (err) {
                console.error('Fetch error:', err.message);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

function updateFullRecord(id, record) {
    const { submission_time, company, status, interview_details, business, address, benefits } = record;
    return new Promise((resolve, reject) => {
        db.run(`
                    UPDATE records
                    SET submission_time = ?, company = ?, status = ?, interview_details = ?, business = ?, address = ?, benefits = ?
                    WHERE id = ?
            `, [submission_time, company, status, interview_details, business, address, benefits, id],
            function(err) {
                if (err) {
                    console.error('Full update error:', err.message);
                    reject(err);
                } else {
                    resolve(this.changes);
                }
            }
        );
    });
}

function deleteRecord(id) {
    return new Promise((resolve, reject) => {
        db.run(`DELETE FROM records WHERE id = ?`, [id], function(err) {
            if (err) {
                console.error('Delete error:', err.message);
                reject(err);
            } else {
                resolve(this.changes);
            }
        });
    });
}


// --- 登录/用户操作函数 ---

/**
 * 验证用户名和密码
 */
function verifyUser(username, password) {
    return new Promise((resolve, reject) => {
        db.get(`SELECT * FROM users WHERE username = ? AND password = ?`, [username, password], (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(!!row);
            }
        });
    });
}

/**
 * 注册新用户
 * @param {string} username
 * @param {string} password
 */
function registerUser(username, password) {
    return new Promise((resolve, reject) => {
        db.run(`INSERT INTO users (username, password) VALUES (?, ?)`, [username, password], function(err) {
            if (err) {
                // SQLITE_CONSTRAINT: UNIQUE 约束错误 (用户已存在)
                if (err.message.includes('SQLITE_CONSTRAINT')) {
                    reject(new Error('用户已存在，请更换用户名。'));
                } else {
                    reject(err);
                }
            } else {
                resolve(this.lastID);
            }
        });
    });
}

module.exports = {
    insertRecord,
    getAllRecords,
    updateFullRecord,
    deleteRecord,
    verifyUser,
    registerUser // 新增
};