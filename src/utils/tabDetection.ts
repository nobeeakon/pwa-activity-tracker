import { useState, useEffect } from 'react';

const CHANNEL_NAME = 'pwa-activity-tracker-tabs';
const HEARTBEAT_INTERVAL_MS = 3000; 

type TabMessage = {
  type: 'heartbeat' | 'goodbye';
  tabId: string;
  timestamp: number;
};

class TabDetectionService {
  private channel: BroadcastChannel;
  private tabId: string;
  private activeTabs: Set<string>;
  private listeners: Set<(count: number) => void> = new Set();

  constructor() {
    this.tabId = crypto.randomUUID();
    this.activeTabs = new Set([this.tabId]);
    this.channel = new BroadcastChannel(CHANNEL_NAME);

    // Listen for messages from other tabs
    this.channel.onmessage = (event: MessageEvent<TabMessage>) => {
      const { type, tabId } = event.data;

      if (type === 'heartbeat') {
        // Add or update the tab
        if (!this.activeTabs.has(tabId)) {
          this.activeTabs.add(tabId);
          this.notifyListeners();
        }
      } else if (type === 'goodbye') {
        // Remove the tab
        if (this.activeTabs.has(tabId)) {
          this.activeTabs.delete(tabId);
          this.notifyListeners();
        }
      }
    };

    // Send initial heartbeat to announce this tab
    this.sendMessage('heartbeat');

    // Start heartbeat interval
    let heartbeatInterval: number | null = window.setInterval(() => {
      this.sendMessage('heartbeat');
    }, HEARTBEAT_INTERVAL_MS);

    // Send goodbye message when tab closes
    window.addEventListener('beforeunload', () => {
        if (heartbeatInterval !== null) {
            clearInterval(heartbeatInterval);
            heartbeatInterval = null;
        }
        this.sendMessage('goodbye');
        this.channel.close();
    });
  }


  private sendMessage(type: 'heartbeat' | 'goodbye') {
    let message: TabMessage|null = null;
    
    if (type === 'heartbeat') {
       message = {
        type: 'heartbeat',
        tabId: this.tabId,
        timestamp: Date.now()
      };
    } else if (type === 'goodbye') {
       message = {
        type: 'goodbye',
        tabId: this.tabId,
        timestamp: Date.now()
      };
    }

    if (message) {
        this.channel.postMessage(message);
    }
  }


  private notifyListeners() {
    const count = this.activeTabs.size;
    this.listeners.forEach(listener => listener(count));
  }

  public subscribe(listener: (count: number) => void): () => void {
    this.listeners.add(listener);

    this.notifyListeners();

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

}

// Singleton instance
let tabDetectionService: TabDetectionService | null = null;

function getTabDetectionService(): TabDetectionService {
  if (!tabDetectionService) {
    tabDetectionService = new TabDetectionService();
  }
  return tabDetectionService;
}

/**
 * React hook to detect multiple tabs/windows
 * Returns true if more than one tab is open
 */
export function useMultiTabDetection(): boolean {
  const [hasMultipleTabs, setHasMultipleTabs] = useState(false);

  useEffect(() => {
    const service = getTabDetectionService();

    const unsubscribe = service.subscribe((count) => {
      setHasMultipleTabs(count > 1);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return hasMultipleTabs;
}
