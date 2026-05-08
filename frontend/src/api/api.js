// Frontend API Module
// Axios instance with automatic JWT token handling

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// TODO: Create axios instance with base URL

// TODO: Add request interceptor that:
// 1. Retrieves JWT token from localStorage
// 2. Adds Authorization header with token (Bearer format)
// 3. Passes request to server

// TODO: Add response interceptor that:
// 1. Checks for 401 Unauthorized responses
// 2. If 401, clear token from localStorage and redirect to login
// 3. Otherwise pass response through

// TODO: Export API wrapper functions:
// - authAPI.register(email, name, password)
// - authAPI.login(email, password)
// - authAPI.getMe()
// - modulesAPI.getModules()
// - modulesAPI.createModule(data)
// - modulesAPI.updateModule(id, data)
// - modulesAPI.deleteModule(id)
// - tasksAPI.getTasks()
// - tasksAPI.createTask(data)
// - tasksAPI.updateTask(id, data)
// - tasksAPI.deleteTask(id)
// - scheduleAPI.generateSchedule()
// - scheduleAPI.getSchedule()

export default api;
