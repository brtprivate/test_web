export interface DashboardStats {
  stats: {
    users: {
      total: number;
      active: number;
    };
    investments: {
      total: number;
      active: number;
      totalAmount: number;
    };
    earnings: {
      total: number;
    };
    transactions: {
      total: number;
    };
  };
}

export interface DashboardResponse {
  status: string;
  data: DashboardStats;
}




