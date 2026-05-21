import axios from 'axios';

const AGENT_BASE_URL = 'http://localhost:5001/api/agent';

const agentApi = axios.create({
  baseURL: AGENT_BASE_URL,
  timeout: 60000, // AI responses can take time
});

// ── Chat ──
export interface ChatResponse {
  success: boolean;
  response: string;
  toolsUsed: string[];
  data?: any;
}

export async function sendChatMessage(message: string, sessionId: string = 'default'): Promise<ChatResponse> {
  const { data } = await agentApi.post<ChatResponse>('/chat', { message, sessionId });
  return data;
}

export async function clearChatHistory(sessionId: string = 'default'): Promise<void> {
  await agentApi.post('/chat/clear', { sessionId });
}

// ── Direct data endpoints ──
export async function getWorkload(departmentId?: number) {
  const params = departmentId ? { departmentId } : {};
  const { data } = await agentApi.get('/workload', { params });
  return data;
}

export async function getTatAlerts(departmentId?: number) {
  const params = departmentId ? { departmentId } : {};
  const { data } = await agentApi.get('/tat-alerts', { params });
  return data;
}

export async function getAssignmentSuggestions(departmentId: number) {
  const { data } = await agentApi.get(`/assignments/${departmentId}`);
  return data;
}

export async function getForecast(days: number = 7) {
  const { data } = await agentApi.get('/forecast', { params: { days } });
  return data;
}

export async function getBatchPlan(departmentId: number) {
  const { data } = await agentApi.get(`/batch-plan/${departmentId}`);
  return data;
}

export async function getInstruments(departmentId?: number) {
  const params = departmentId ? { departmentId } : {};
  const { data } = await agentApi.get('/instruments', { params });
  return data;
}

export async function getDailyPlan() {
  const { data } = await agentApi.get('/daily-plan');
  return data;
}
