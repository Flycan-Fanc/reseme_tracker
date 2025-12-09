// renderer.js (MODIFIED)
const db = require('./database');

document.addEventListener('DOMContentLoaded', () => {
    // --- UI 元素获取 ---
    const authScreen = document.getElementById('auth-screen');
    const loginBox = document.getElementById('login-box');
    const registerBox = document.getElementById('register-box');
    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');

    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const registerForm = document.getElementById('register-form');
    const registerError = document.getElementById('register-error');

    const mainApp = document.getElementById('main-app');
    const logoutBtn = document.getElementById('logout-btn');
    const welcomeMessage = document.getElementById('welcome-message');

    const form = document.getElementById('record-form');
    const recordsTableBody = document.getElementById('records-table-body');

    // 编辑模态框元素
    const editModal = document.getElementById('edit-modal');
    const editCloseBtn = editModal.querySelector('.close-btn');
    const editForm = document.getElementById('edit-form');

    let isLoggedIn = false;

    // --- 界面切换逻辑 ---

    // 初始状态显示登录界面
    showLoginScreen();

    function showLoginScreen() {
        mainApp.style.display = 'none';
        authScreen.style.display = 'flex';
        loginBox.style.display = 'block';
        registerBox.style.display = 'none';
        loginError.textContent = '';
        registerError.textContent = '';
        isLoggedIn = false;
    }

    function showRegisterScreen() {
        loginBox.style.display = 'none';
        registerBox.style.display = 'block';
        registerError.textContent = '';
        loginError.textContent = '';
    }

    function showMainApp(username) {
        welcomeMessage.textContent = `欢迎您，${username}！`;
        authScreen.style.display = 'none';
        mainApp.style.display = 'block';
        isLoggedIn = true;
        loadRecords();
    }

    showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        showRegisterScreen();
    });

    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        showLoginScreen();
    });

    // --- 注册逻辑 ---
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        registerError.textContent = '';

        const username = document.getElementById('reg-username').value;
        const password = document.getElementById('reg-password').value;
        const confirmPassword = document.getElementById('reg-confirm-password').value;

        if (password !== confirmPassword) {
            registerError.textContent = '两次输入的密码不一致！';
            return;
        }

        try {
            await db.registerUser(username, password);
            alert('注册成功！请使用新账号登录。');
            registerForm.reset();
            showLoginScreen(); // 注册成功后返回登录界面
        } catch (error) {
            registerError.textContent = '注册失败：' + error.message;
            console.error('Registration error:', error);
        }
    });


    // --- 登录/登出逻辑 ---
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        loginError.textContent = '';

        try {
            const success = await db.verifyUser(username, password);
            if (success) {
                showMainApp(username);
            } else {
                loginError.textContent = '用户名或密码错误。';
            }
        } catch (error) {
            loginError.textContent = '登录验证失败：' + error.message;
            console.error('Login error:', error);
        }
    });

    logoutBtn.addEventListener('click', () => {
        showLoginScreen();
    });

    // --- 记录添加逻辑 (未修改) ---
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const newRecord = {
            submission_time: document.getElementById('submission-time').value,
            company: document.getElementById('company').value,
            status: document.getElementById('status').value,
            interview_details: document.getElementById('interview-details').value,
            business: document.getElementById('business').value,
            address: document.getElementById('address').value,
            benefits: document.getElementById('benefits').value
        };

        try {
            await db.insertRecord(newRecord);
            alert('投递记录添加成功！');
            form.reset();
            loadRecords();
        } catch (error) {
            alert('添加记录失败: ' + error.message);
        }
    });

    // --- 记录列表加载和渲染 (未修改) ---
    async function loadRecords() {
        if (!isLoggedIn) return;

        recordsTableBody.innerHTML = '<tr><td colspan="9" style="text-align:center;">加载中...</td></tr>';
        try {
            const records = await db.getAllRecords();
            recordsTableBody.innerHTML = '';

            if (records.length === 0) {
                recordsTableBody.innerHTML = '<tr><td colspan="9" style="text-align:center;">暂无投递记录</td></tr>';
                return;
            }

            records.forEach(record => {
                const row = recordsTableBody.insertRow();

                const displayTime = record.submission_time ? record.submission_time.replace('T', ' ') : 'N/A';

                row.insertCell().textContent = record.id;
                row.insertCell().textContent = displayTime;
                row.insertCell().textContent = record.company;
                row.insertCell().textContent = record.status;
                row.insertCell().textContent = record.interview_details || '暂无';

                const actionCell = row.insertCell();
                actionCell.className = 'action-col';

                const editBtn = document.createElement('button');
                editBtn.textContent = '编辑';
                editBtn.className = 'action-btn edit-btn';
                editBtn.onclick = () => showEditModal(record);
                actionCell.appendChild(editBtn);

                const deleteBtn = document.createElement('button');
                deleteBtn.textContent = '删除';
                deleteBtn.className = 'action-btn delete-btn';
                deleteBtn.onclick = () => handleDeleteRecord(record.id, record.company);
                actionCell.appendChild(deleteBtn);

                row.insertCell().textContent = record.business || 'N/A';
                row.insertCell().textContent = record.address || 'N/A';
                row.insertCell().textContent = record.benefits || 'N/A';
            });

        } catch (error) {
            console.error('加载记录失败:', error);
            recordsTableBody.innerHTML = `<tr><td colspan="9" style="color:red; text-align:center;">加载记录失败: ${error.message}</td></tr>`;
        }
    }

    // --- 删除记录逻辑 (未修改) ---
    async function handleDeleteRecord(id, company) {
        if (confirm(`确定要删除公司 ${company} (ID: ${id}) 的投递记录吗？此操作不可撤销。`)) {
            try {
                const changes = await db.deleteRecord(id);
                if (changes > 0) {
                    alert('记录删除成功！');
                    loadRecords();
                } else {
                    alert('删除失败，未找到该记录。');
                }
            } catch (error) {
                alert('删除记录失败: ' + error.message);
                console.error('Delete error:', error);
            }
        }
    }

    // --- 全记录编辑模态框逻辑 (未修改) ---

    editCloseBtn.onclick = () => editModal.style.display = 'none';
    window.onclick = (event) => {
        if (event.target == editModal) {
            editModal.style.display = 'none';
        }
    }

    function showEditModal(record) {
        document.getElementById('edit-id').value = record.id;
        document.getElementById('edit-record-id').textContent = `(ID: ${record.id})`;

        let datetimeLocalValue = record.submission_time;
        if (datetimeLocalValue) {
            if (datetimeLocalValue.length !== 16 || datetimeLocalValue.indexOf('T') !== 10) {
                try {
                    const date = new Date(record.submission_time);
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    const hour = String(date.getHours()).padStart(2, '0');
                    const minute = String(date.getMinutes()).padStart(2, '0');
                    datetimeLocalValue = `${year}-${month}-${day}T${hour}:${minute}`;
                } catch (e) {
                    datetimeLocalValue = '';
                }
            }
        }

        document.getElementById('edit-submission-time').value = datetimeLocalValue;
        document.getElementById('edit-company').value = record.company;
        document.getElementById('edit-status').value = record.status;
        document.getElementById('edit-interview-details').value = record.interview_details;
        document.getElementById('edit-business').value = record.business;
        document.getElementById('edit-address').value = record.address;
        document.getElementById('edit-benefits').value = record.benefits;

        editModal.style.display = 'block';
    }

    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const id = document.getElementById('edit-id').value;

        const updatedRecord = {
            submission_time: document.getElementById('edit-submission-time').value,
            company: document.getElementById('edit-company').value,
            status: document.getElementById('edit-status').value,
            interview_details: document.getElementById('edit-interview-details').value,
            business: document.getElementById('edit-business').value,
            address: document.getElementById('edit-address').value,
            benefits: document.getElementById('edit-benefits').value
        };

        try {
            const changes = await db.updateFullRecord(id, updatedRecord);
            if (changes > 0) {
                alert(`记录 ID: ${id} 更新成功!`);
                editModal.style.display = 'none';
                loadRecords();
            } else {
                alert('更新失败，数据没有变化或未找到记录。');
            }
        } catch (error) {
            alert('更新记录失败: ' + error.message);
            console.error('Update error:', error);
        }
    });
});