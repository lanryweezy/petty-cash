import { v4 as uuidv4 } from 'uuid';

// Local storage keys
const USERS_KEY = 'pettycash_users';
const REQUESTS_KEY = 'pettycash_requests';
const RECEIPTS_KEY = 'pettycash_receipts';
const APPROVAL_RULES_KEY = 'pettycash_approval_rules';
const SMTP_CONFIG_KEY = 'pettycash_smtp_config';

// Initialize data in localStorage if not exists
export const initializeData = () => {
  // Initialize users if not exists
  if (!localStorage.getItem(USERS_KEY)) {
    const defaultUsers = [
      {
        id: uuidv4(),
        name: 'Admin User',
        username: 'admin',
        email: 'admin@example.com',
        role: 'admin',
      },
      {
        id: uuidv4(),
        name: 'Approver User',
        username: 'approver',
        email: 'approver@example.com',
        role: 'approver',
      },
      {
        id: uuidv4(),
        name: 'Cashier User',
        username: 'cashier',
        email: 'cashier@example.com',
        role: 'cashier',
      },
      {
        id: uuidv4(),
        name: 'Regular User',
        username: 'user',
        email: 'user@example.com',
        role: 'user',
      }
    ];
    localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers));
  }

  // Initialize requests if not exists
  if (!localStorage.getItem(REQUESTS_KEY)) {
    const users = getUsers();
    const adminId = users.find(u => u.username === 'admin')?.id;
    const approverId = users.find(u => u.username === 'approver')?.id;
    const userId = users.find(u => u.username === 'user')?.id;
    
    const defaultRequests = [];
    
    if (adminId && approverId && userId) {
      // Generate some sample requests
      const now = new Date();
      const threeDaysAgo = new Date(now);
      threeDaysAgo.setDate(now.getDate() - 3);
      
      const fiveDaysAgo = new Date(now);
      fiveDaysAgo.setDate(now.getDate() - 5);
      
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 7);
      
      const tenDaysAgo = new Date(now);
      tenDaysAgo.setDate(now.getDate() - 10);
      
      defaultRequests.push(
        {
          id: uuidv4(),
          userId: userId,
          requesterName: 'Regular User',
          amount: 75.50,
          purpose: 'Office supplies',
          description: 'Paper, pens, and notebooks',
          status: 'approved',
          createdAt: sevenDaysAgo.toISOString(),
          approvedBy: approverId,
          approvedAt: fiveDaysAgo.toISOString()
        },
        {
          id: uuidv4(),
          userId: adminId,
          requesterName: 'Admin User',
          amount: 120.00,
          purpose: 'Team lunch',
          description: 'Monthly team lunch meeting',
          status: 'approved',
          createdAt: tenDaysAgo.toISOString(),
          approvedBy: approverId,
          approvedAt: sevenDaysAgo.toISOString()
        },
        {
          id: uuidv4(),
          userId: userId,
          requesterName: 'Regular User',
          amount: 250.00,
          purpose: 'Software subscription',
          description: 'Annual subscription for productivity tools',
          status: 'pending',
          createdAt: threeDaysAgo.toISOString()
        },
        {
          id: uuidv4(),
          userId: adminId,
          requesterName: 'Admin User',
          amount: 45.00,
          purpose: 'Parking fees',
          description: 'Parking fees for client meeting',
          status: 'rejected',
          createdAt: fiveDaysAgo.toISOString(),
          approvedBy: approverId,
          approvedAt: threeDaysAgo.toISOString()
        }
      );
    }
    
    localStorage.setItem(REQUESTS_KEY, JSON.stringify(defaultRequests));
  }

  // Initialize receipts if not exists
  if (!localStorage.getItem(RECEIPTS_KEY)) {
    const requests = getRequests();
    const approvedRequests = requests.filter(r => r.status === 'approved');
    
    if (approvedRequests.length > 0) {
      // Create a receipt for the first approved request
      const users = getUsers();
      const cashierId = users.find(u => u.username === 'cashier')?.id;
      
      const defaultReceipts = [
        {
          id: uuidv4(),
          requestId: approvedRequests[0].id,
          fileName: '/images/receipt.jpg',
          fileType: 'image/jpeg',
          fileSize: 245000,
          uploadedBy: cashierId || approvedRequests[0].userId,
          uploadedAt: new Date().toISOString(),
          amount: approvedRequests[0].amount,
          merchant: 'Office Depot',
          notes: 'Original receipt'
        }
      ];
      
      localStorage.setItem(RECEIPTS_KEY, JSON.stringify(defaultReceipts));
    } else {
      localStorage.setItem(RECEIPTS_KEY, JSON.stringify([]));
    }
  }

  // Initialize approval rules if not exists
  if (!localStorage.getItem(APPROVAL_RULES_KEY)) {
    const users = getUsers();
    const approverId = users.find(u => u.username === 'approver')?.id;
    const adminId = users.find(u => u.username === 'admin')?.id;
    
    const defaultRules = [];
    
    if (approverId) {
      defaultRules.push({
        id: uuidv4(),
        approverId: approverId,
        amountThreshold: 500,
        isActive: true,
        approveAll: false
      });
    }
    
    if (adminId) {
      defaultRules.push({
        id: uuidv4(),
        approverId: adminId,
        amountThreshold: 5000,
        isActive: true,
        approveAll: true
      });
    }
    
    localStorage.setItem(APPROVAL_RULES_KEY, JSON.stringify(defaultRules));
  }

  // Initialize SMTP config if not exists
  if (!localStorage.getItem(SMTP_CONFIG_KEY)) {
    const defaultConfig = {
      host: 'smtp.example.com',
      port: 587,
      secure: false,
      user: 'pettycash@example.com',
      password: 'password',
      fromEmail: 'pettycash@example.com',
      fromName: 'Petty Cash System'
    };
    
    localStorage.setItem(SMTP_CONFIG_KEY, JSON.stringify(defaultConfig));
  }
};

// User functions
export const getUsers = () => {
  const usersJson = localStorage.getItem(USERS_KEY);
  return usersJson ? JSON.parse(usersJson) : [];
};

export const saveUser = (user) => {
  const users = getUsers();
  
  if (user.id) {
    // Update existing user
    const index = users.findIndex(u => u.id === user.id);
    if (index !== -1) {
      users[index] = { ...users[index], ...user };
    }
  } else {
    // Create new user
    user.id = uuidv4();
    users.push(user);
  }
  
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  return user;
};

// Request functions
export const getRequests = () => {
  const requestsJson = localStorage.getItem(REQUESTS_KEY);
  return requestsJson ? JSON.parse(requestsJson) : [];
};

export const saveRequest = (request) => {
  const requests = getRequests();
  
  if (request.id) {
    // Update existing request
    const index = requests.findIndex(r => r.id === request.id);
    if (index !== -1) {
      requests[index] = { ...requests[index], ...request };
    }
  } else {
    // Create new request
    request.id = uuidv4();
    request.status = 'pending';
    request.createdAt = new Date().toISOString();
    requests.push(request);
  }
  
  localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));
  return request;
};

// Receipt functions
export const getReceipts = () => {
  const receiptsJson = localStorage.getItem(RECEIPTS_KEY);
  return receiptsJson ? JSON.parse(receiptsJson) : [];
};

export const saveReceipt = (receipt) => {
  const receipts = getReceipts();
  
  if (receipt.id) {
    // Update existing receipt
    const index = receipts.findIndex(r => r.id === receipt.id);
    if (index !== -1) {
      receipts[index] = { ...receipts[index], ...receipt };
    }
  } else {
    // Create new receipt
    receipt.id = uuidv4();
    receipt.uploadedAt = new Date().toISOString();
    receipts.push(receipt);
  }
  
  localStorage.setItem(RECEIPTS_KEY, JSON.stringify(receipts));
  return receipt;
};

// Approval rule functions
export const getApprovalRules = () => {
  const rulesJson = localStorage.getItem(APPROVAL_RULES_KEY);
  return rulesJson ? JSON.parse(rulesJson) : [];
};

export const saveApprovalRule = (rule) => {
  const rules = getApprovalRules();
  
  if (rule.id) {
    // Update existing rule
    const index = rules.findIndex(r => r.id === rule.id);
    if (index !== -1) {
      rules[index] = { ...rules[index], ...rule };
    }
  } else {
    // Create new rule
    rule.id = uuidv4();
    rules.push(rule);
  }
  
  localStorage.setItem(APPROVAL_RULES_KEY, JSON.stringify(rules));
  return rule;
};

// SMTP config functions
export const getSmtpConfig = () => {
  const configJson = localStorage.getItem(SMTP_CONFIG_KEY);
  return configJson ? JSON.parse(configJson) : {
    host: '',
    port: 587,
    secure: false,
    user: '',
    password: '',
    fromEmail: '',
    fromName: 'Petty Cash System'
  };
};

export const saveSmtpConfig = (config) => {
  localStorage.setItem(SMTP_CONFIG_KEY, JSON.stringify(config));
  return config;
};

// Email function (simulated)
export const sendEmailNotification = (to, subject, body) => {
  const config = getSmtpConfig();
  
  // In a real application, this would connect to an SMTP server
  // For demo purposes, just log the email and return true
  console.log(`Email sent to ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Body: ${body}`);
  console.log(`Using SMTP: ${config.host}:${config.port}`);
  
  return true;
};