const API_URL = process.env.REACT_APP_API_URL;

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// User functions
export const getUsers = async () => {
  const res = await fetch(`${API_URL}/users`, { headers: getAuthHeaders() });
  return res.json();
};

export const saveUser = async (user) => {
  const url = user.id ? `${API_URL}/users/${user.id}` : `${API_URL}/users`;
  const method = user.id ? 'PUT' : 'POST';
  const res = await fetch(url, {
    method,
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(user),
  });
  return res.json();
};

// Request functions
export const getRequests = async () => {
  const res = await fetch(`${API_URL}/requests`, { headers: getAuthHeaders() });
  return res.json();
};

export const saveRequest = async (request) => {
  const url = request.id ? `${API_URL}/requests/${request.id}` : `${API_URL}/requests`;
  const method = request.id ? 'PUT' : 'POST';
  const res = await fetch(url, {
    method,
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  return res.json();
};

// Receipt functions
export const getReceipts = async () => {
  const res = await fetch(`${API_URL}/receipts`, { headers: getAuthHeaders() });
  return res.json();
};

export const saveReceipt = async (receipt) => {
  const res = await fetch(`${API_URL}/receipts`, {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(receipt),
  });
  return res.json();
};

// Approval rule functions
export const getApprovalRules = async () => {
  const res = await fetch(`${API_URL}/roles`, { headers: getAuthHeaders() });
  const roles = await res.json();
  const rules = [];
  for (const role of roles) {
    const res = await fetch(`${API_URL}/roles/${role.id}/permissions`, { headers: getAuthHeaders() });
    const permissions = await res.json();
    for (const permission of permissions) {
      if (permission.permission.startsWith('requests.approve')) {
        rules.push({
          id: permission.id,
          approverId: role.id,
          amountThreshold: parseInt(permission.permission.split('.')[2]),
          isActive: true,
          approveAll: permission.permission.endsWith('.all'),
        });
      }
    }
  }
  return rules;
};

export const saveApprovalRule = async (rule) => {
  const permission = `requests.approve.${rule.approveAll ? 'all' : rule.amountThreshold}`;
  if (rule.id) {
    // This is not supported by the backend yet
  } else {
    const res = await fetch(`${API_URL}/roles/${rule.approverId}/permissions`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ permission }),
    });
    return res.json();
  }
};

// SMTP config functions
export const getSmtpConfig = async () => {
  // This is not supported by the backend yet
  return {
    host: '',
    port: 587,
    secure: false,
    user: '',
    password: '',
    fromEmail: '',
    fromName: 'Petty Cash System',
  };
};

export const saveSmtpConfig = async (config) => {
  // This is not supported by the backend yet
  return config;
};

// Email function
export const sendEmailNotification = async (to, subject, body) => {
  const res = await fetch(`${API_URL}/send-email`, {
    method: 'POST',
    headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, subject, text: body }),
  });
  return res.json();
};