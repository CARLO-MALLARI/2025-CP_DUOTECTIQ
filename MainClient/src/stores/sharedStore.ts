type SharedStoreType = {
  serverUrl: string;
  setServerUrl: (url: string) => void;
};

const DEFAULT_URL = 'http://192.168.100.33:5000';

class SharedStore implements SharedStoreType {
  serverUrl = DEFAULT_URL;
  private listeners: ((url: string) => void)[] = [];

  setServerUrl(url: string) {
    this.serverUrl = url;
    this.listeners.forEach(listener => listener(url));
  }

  subscribe(listener: (url: string) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
}

export const sharedStore = new SharedStore();
