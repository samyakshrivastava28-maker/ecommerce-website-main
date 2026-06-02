import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager, 
  memoryLocalCache, 
  doc, 
  getDocFromServer 
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Ensure single-instance initialization of Firebase config in proper sequence
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Auth first, then Firestore. Pass the exact custom database ID from config
export const auth = getAuth(app);

// Enable robust native offline local persistence with robust try-catch fallback mechanism
let cacheImplementation;
try {
  cacheImplementation = persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  });
} catch (e: any) {
  console.warn('[Firebase Config] Offline persistence layer unavailable, falling back to clean memory-only buffer:', e.message);
  cacheImplementation = memoryLocalCache();
}

const firestoreDatabaseId = (firebaseConfig as any).firestoreDatabaseId || '(default)';
console.log('[Firebase Initializer] Using Firestore database ID:', firestoreDatabaseId);

export const db = initializeFirestore(app, {
  localCache: cacheImplementation
}, firestoreDatabaseId);

// 14: Monitor and dispatch custom alerts for quota exceeds or database failures
export const checkQuotaExceeded = (err: any): boolean => {
  if (!err) return false;
  const msg = (err?.message || err?.toString() || '').toLowerCase();
  const code = (err?.code || '').toLowerCase();
  
  if (
    msg.includes('quota') ||
    msg.includes('rate exceeded') ||
    msg.includes('exhaustion') ||
    msg.includes('exhausted') ||
    code.includes('resource-exhausted') ||
    code.includes('quota') ||
    code.includes('exhausted')
  ) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('firebase-quota-exceeded'));
    }
    return true;
  }
  return false;
};

// 17 & 10: Validate and retry connection diagnostics
export const testConnection = async (): Promise<boolean> => {
  try {
    // Attempt standard read to verify connection holds
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error: any) {
    console.error("Firestore connection health-check failed:", error);
    checkQuotaExceeded(error);
    
    const isOffline = error?.message?.toLowerCase().includes('offline') || error?.message?.toLowerCase().includes('client is offline');
    if (isOffline) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('firebase-connection-failed', { detail: error }));
      }
    }
    return false;
  }
};

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  checkQuotaExceeded(error);
  
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
    },
    operationType,
    path
  };
  
  console.error('[Firestore Error Interceptor]:', JSON.stringify(errInfo, null, 2));
  throw new Error(JSON.stringify(errInfo));
}
