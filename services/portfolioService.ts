import { Position, Portfolio } from '../types';
import { db, auth, OperationType, handleFirestoreError } from '../firebase';
import { doc, onSnapshot, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

type PortfolioListener = (portfolio: Portfolio) => void;
type ModeListener = (isPaper: boolean) => void;

interface AccountState {
  cash: number;
  positions: { [symbol: string]: Position };
}

class PortfolioService {
  private isPaper: boolean = true;
  private userId: string | null = null;
  
  // Local cache for immediate UI updates
  private paperAccount: AccountState = {
    cash: 1_000_000_000, // $1B Initial
    positions: {}
  };

  private liveAccount: AccountState = {
    cash: 50_000, // $50k Initial Deposit
    positions: {}
  };

  private listeners: Set<PortfolioListener> = new Set();
  private modeListeners: Set<ModeListener> = new Set();
  private unsubscribeFirestore: (() => void) | null = null;

  constructor() {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        this.userId = user.uid;
        this.setupFirestoreSync(user.uid);
      } else {
        this.userId = null;
        if (this.unsubscribeFirestore) {
          this.unsubscribeFirestore();
          this.unsubscribeFirestore = null;
        }
      }
    });
  }

  private setupFirestoreSync(uid: string) {
    // Sync Paper Account
    const paperRef = doc(db, 'portfolios', `${uid}_paper`);
    const liveRef = doc(db, 'portfolios', `${uid}_live`);

    const syncAccount = (docSnap: any, isPaper: boolean) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (isPaper) {
          this.paperAccount = { cash: data.cash, positions: data.positions };
        } else {
          this.liveAccount = { cash: data.cash, positions: data.positions };
        }
        this.notifyListeners();
      } else {
        // Initialize if not exists
        const initial = isPaper ? this.paperAccount : this.liveAccount;
        setDoc(docSnap.ref, { ...initial, uid, isPaper }).catch(e => handleFirestoreError(e, OperationType.CREATE, docSnap.ref.path));
      }
    };

    const unsubPaper = onSnapshot(paperRef, (snap) => syncAccount(snap, true), (e) => handleFirestoreError(e, OperationType.GET, paperRef.path));
    const unsubLive = onSnapshot(liveRef, (snap) => syncAccount(snap, false), (e) => handleFirestoreError(e, OperationType.GET, liveRef.path));

    this.unsubscribeFirestore = () => {
      unsubPaper();
      unsubLive();
    };
  }

  private get currentAccount(): AccountState {
    return this.isPaper ? this.paperAccount : this.liveAccount;
  }

  public getPortfolio(): Portfolio {
    const account = this.currentAccount;
    return {
      cash: account.cash,
      positions: { ...account.positions },
      totalValue: account.cash // Equity calculation handled in UI components
    };
  }

  public isPaperMode(): boolean {
    return this.isPaper;
  }

  public subscribe(listener: PortfolioListener): () => void {
    this.listeners.add(listener);
    listener(this.getPortfolio());
    return () => this.listeners.delete(listener);
  }

  public subscribeMode(listener: ModeListener): () => void {
    this.modeListeners.add(listener);
    listener(this.isPaper);
    return () => this.modeListeners.delete(listener);
  }

  public toggleMode(): void {
    this.isPaper = !this.isPaper;
    this.notifyListeners(); 
    this.notifyModeListeners();
  }

  private async persistAccount(isPaper: boolean) {
    if (!this.userId) return;
    const account = isPaper ? this.paperAccount : this.liveAccount;
    const ref = doc(db, 'portfolios', `${this.userId}_${isPaper ? 'paper' : 'live'}`);
    try {
      await setDoc(ref, { ...account, uid: this.userId, isPaper }, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, ref.path);
    }
  }

  public async executeTrade(symbol: string, side: 'BUY' | 'SELL', quantity: number, price: number): Promise<{ success: boolean; message: string }> {
    const account = this.currentAccount;
    const totalCost = quantity * price;

    if (side === 'BUY') {
      if (account.cash < totalCost) {
        return { success: false, message: `Insufficient Buying Power. Required: $${totalCost.toLocaleString()} | Available: $${account.cash.toLocaleString()}` };
      }

      account.cash -= totalCost;
      
      const currentPos = account.positions[symbol] || { symbol, quantity: 0, averageEntryPrice: 0 };
      const newQuantity = currentPos.quantity + quantity;
      
      const totalValue = (currentPos.quantity * currentPos.averageEntryPrice) + (quantity * price);
      const newAvgPrice = totalValue / newQuantity;

      account.positions[symbol] = {
        symbol,
        quantity: newQuantity,
        averageEntryPrice: newAvgPrice
      };

    } else {
      const currentPos = account.positions[symbol];
      if (!currentPos || currentPos.quantity < quantity) {
        return { success: false, message: 'Insufficient Position Quantity' };
      }

      account.cash += totalCost;
      
      const newQuantity = currentPos.quantity - quantity;
      if (newQuantity === 0) {
        delete account.positions[symbol];
      } else {
        account.positions[symbol] = {
          ...currentPos,
          quantity: newQuantity
        };
      }
    }

    this.notifyListeners();
    await this.persistAccount(this.isPaper);
    return { success: true, message: `Order Filled: ${side} ${quantity} ${symbol} @ ${price.toFixed(2)}` };
  }

  public async resetPaperAccount() {
    if (!this.userId) return;
    this.paperAccount = {
      cash: 1_000_000_000,
      positions: {}
    };
    this.notifyListeners();
    await this.persistAccount(true);
  }

  private notifyListeners() {
    const portfolio = this.getPortfolio();
    this.listeners.forEach(listener => listener(portfolio));
  }

  private notifyModeListeners() {
    this.modeListeners.forEach(listener => listener(this.isPaper));
  }
}

export const portfolioService = new PortfolioService();
