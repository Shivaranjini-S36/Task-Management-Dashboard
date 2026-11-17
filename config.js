/**
 * TaskFlow Configuration
 * Configures API base URL depending on local development or GitHub Pages deployment
 */

const CONFIG = {
  // Deployed Render backend URL
  // Matches user's Render service
  RENDER_BACKEND_URL: 'https://task-management-dashboard-j8sy.onrender.com',

  // Local development backend URL
  LOCAL_BACKEND_URL: 'http://localhost:5000',

  /**
   * Determine the API base URL dynamically based on host
   */
  getApiBaseUrl() {
    // If a custom URL is stored in localStorage by the user/tester, prioritize it
    const customUrl = localStorage.getItem('taskflow_api_url');
    if (customUrl) {
      return customUrl.replace(/\/+$/, '') + '/api/tasks';
    }

    const host = window.location.hostname;

    // Running locally (localhost / 127.0.0.1 / file)
    if (host === 'localhost' || host === '127.0.0.1' || window.location.port === '5000') {
      return `${window.location.origin}/api/tasks`;
    }

    // Hosted on GitHub Pages or custom domain
    // If deployed on Render or other server, use that
    return `${this.RENDER_BACKEND_URL}/api/tasks`;
  },

  getHealthUrl() {
    const apiBase = this.getApiBaseUrl();
    return apiBase.replace('/api/tasks', '/api/health');
  }
};

window.CONFIG = CONFIG;
