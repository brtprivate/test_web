/**
 * Check Server Connection Utility
 * Helps verify if server is running and accessible
 */

export const checkServerConnection = async (baseUrl: string): Promise<boolean> => {
  try {
    const response = await fetch(`${baseUrl.replace('/api', '')}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Add timeout
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    return response.ok;
  } catch (error) {
    console.error('Server connection check failed:', error);
    return false;
  }
};

export const getServerStatus = async (baseUrl: string) => {
  const isConnected = await checkServerConnection(baseUrl);
  
  if (!isConnected) {
    console.warn('⚠️ Server not accessible at:', baseUrl);
    console.warn('💡 Make sure:');
    console.warn('   1. Server is running');
    console.warn('   2. Server port matches API URL');
    console.warn('   3. No firewall blocking connection');
  }
  
  return isConnected;
};








