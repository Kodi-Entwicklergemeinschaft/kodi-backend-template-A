export interface SystemMetrics {
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;

  // Job metrics
  jobs: {
    total: number;
    active: number;
    paused: number;
    failed: number;
    completed: number;
    averageExecutionTime: number;
    successRate: number;
    failureRate: number;
  };

  // Queue metrics
  queues: {
    scraping: QueueMetrics;
    cleanup: QueueMetrics;
  };

  // System metrics
  system: {
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage: number;
    diskUsage?: DiskUsage;
    networkConnections: number;
  };

  // Database metrics
  database: {
    connectionCount: number;
    healthyDatabases?: number;
    totalDatabases?: number;
    databaseStatuses?: Record<string, { connections: number; healthy: boolean }>;
    queryCount: number;
    averageQueryTime: number;
    slowQueries: number;
  };

  // Error metrics
  errors: {
    totalErrors: number;
    errorRate: number;
    criticalErrors: number;
    recentErrors: number;
  };
}

export interface QueueMetrics {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: number;
  throughput: number; // jobs per minute
  averageProcessingTime: number;
}

export interface DiskUsage {
  total: number;
  used: number;
  available: number;
  usagePercent: number;
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  condition: string;
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  cooldownMinutes: number;
  lastTriggered?: Date;
}

export interface Alert {
  id: string;
  ruleId: string;
  ruleName: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  metadata?: Record<string, any>;
}

export interface AlertChannel {
  type: 'email' | 'webhook' | 'slack' | 'console';
  config: Record<string, any>;
  enabled: boolean;
}
