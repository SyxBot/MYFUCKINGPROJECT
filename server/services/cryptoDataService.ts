import axios from 'axios';
import { storage } from '../storage';
import type { Token } from '@shared/schema';

interface DEXScreenerToken {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
  priceNative: string;
  priceUsd: string;
  volume: {
    h24: number;
    h6: number;
    h1: number;
    m5: number;
  };
  priceChange: {
    h24: number;
    h6: number;
    h1: number;
    m5: number;
  };
  liquidity?: {
    usd?: number;
    base: number;
    quote: number;
  };
  fdv?: number;
  marketCap?: number;
}

interface BirdeyeToken {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  price: number;
  volume24h: number;
  priceChange24h: number;
  marketCap?: number;
  holders?: number;
}

interface CoinGeckoToken {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  total_volume: number;
  price_change_percentage_24h: number;
  market_cap: number;
}

export class CryptoDataService {
  private readonly dexScreenerBaseUrl = 'https://api.dexscreener.com/latest/dex';
  private readonly birdeyeBaseUrl = 'https://public-api.birdeye.so/public';
  private readonly coinGeckoBaseUrl = 'https://api.coingecko.com/api/v3';
  private readonly jupiterBaseUrl = 'https://quote-api.jup.ag/v6';

  // === Optional filters via env (leave unset for no filtering) ===
  // TOKENS_MIN_VOLUME_24H: number (USD)
  // TOKENS_MAX_MARKETCAP: number (USD)
  // TOKENS_MIN_ALPHA: number (0-100)
  private readonly filterMinVolume24h = this.envNum('TOKENS_MIN_VOLUME_24H');
  private readonly filterMaxMarketCap = this.envNum('TOKENS_MAX_MARKETCAP');
  private readonly filterMinAlpha = this.envNum('TOKENS_MIN_ALPHA');

  // Tiny per-source caches (30s TTL) to smooth bursts
  private dexCache: { tokens: Token[]; timestamp: number } | null = null;
  private birdeyeCache: { tokens: Token[]; timestamp: number } | null = null;
  private coinGeckoCache: { tokens: Token[]; timestamp: number } | null = null;
  private readonly cacheTTL = 30_000;

  constructor() {
    this.initializeDataSources();
  }

  private async initializeDataSources() {
    const sources = ['DEXScreener', 'Birdeye', 'CoinGecko', 'Jupiter'];
    for (const name of sources) {
      await storage.updateDataSourceStatus(name, 'active');
    }
  }

  // --- Helpers ---
  private parseNumber(value: any): number {
    const n = Number(value ?? 0);
    return Number.isNaN(n) ? 0 : n;
  }

  // Parse optional numeric env var; returns null when unset/invalid
  private envNum(name: string): number | null {
    const raw = (process.env as any)?.[name];
    if (raw === undefined || raw === null || raw === '') return null;
    const n = Number(raw);
    return Number.isNaN(n) ? null : n;
  }

  // Apply all filters in one place; true => keep token
  private passesFilters(t: Token): boolean {
    const vol = this.parseNumber((t as any).volume24h);
    const mcap = t.marketCap !== null && t.marketCap !== undefined ? this.parseNumber(t.marketCap) : null;
    const alpha = this.parseNumber((t as any).alphaScore);

    if (this.filterMinVolume24h !== null && vol < this.filterMinVolume24h) return false;
    if (this.filterMaxMarketCap !== null) {
      if (mcap === null || mcap > this.filterMaxMarketCap) return false;
    }
    if (this.filterMinAlpha !== null && alpha < this.filterMinAlpha) return false;
    return true;
  }

  // Simple retry with jittered backoff
  private async retryRequest<T>(fn: () => Promise<T>, attempts = 2): Promise<T> {
    for (let i = 0; i < attempts; i++) {
      try {
        return await fn();
      } catch (err) {
        if (i === attempts - 1) throw err;
        await new Promise(res => setTimeout(res, 200 + Math.floor(Math.random() * 300)));
      }
    }
    throw new Error('retryRequest: exhausted attempts');
  }

  async fetchSolanaTokens(): Promise<Token[]> {
    const tokens: Token[] = [];

    try {
      const dexTokens = await this.fetchFromDEXScreener();
      tokens.push(...dexTokens);
    } catch (error) {
      console.error('DEXScreener fetch failed:', error);
      await storage.updateDataSourceStatus(
        'DEXScreener',
        'error',
        error instanceof Error ? error.message : 'Unknown error',
      );
    }

    try {
      const birdeyeTokens = await this.fetchFromBirdeye();
      tokens.push(...birdeyeTokens);
    } catch (error) {
      console.error('Birdeye fetch failed:', error);
      await storage.updateDataSourceStatus(
        'Birdeye',
        'error',
        error instanceof Error ? error.message : 'Unknown error',
      );
    }

    try {
      const coinGeckoTokens = await this.fetchFromCoinGecko();
      tokens.push(...coinGeckoTokens);
    } catch (error) {
      console.error('CoinGecko fetch failed:', error);
      await storage.updateDataSourceStatus(
        'CoinGecko',
        'error',
        error instanceof Error ? error.message : 'Unknown error',
      );
    }

    // Optional filtering before dedup/display
    const filtered =
      this.filterMinVolume24h === null &&
      this.filterMaxMarketCap === null &&
      this.filterMinAlpha === null
        ? tokens
        : tokens.filter(t => this.passesFilters(t));

    return this.deduplicateTokens(filtered);
  }

  private async fetchFromDEXScreener(): Promise<Token[]> {
    const now = Date.now();
    if (this.dexCache && now - this.dexCache.timestamp < this.cacheTTL) {
      await storage.updateDataSourceStatus('DEXScreener', 'active');
      return this.dexCache.tokens;
    }

    try {
      const response = await this.retryRequest(() =>
        axios.get(`${this.dexScreenerBaseUrl}/tokens/solana`, { timeout: 10000 }),
      );

      await storage.updateDataSourceStatus('DEXScreener', 'active');

      const pairs = response.data?.pairs;
      if (!pairs) return [];

      const tokens = pairs.slice(0, 50).map((pair: DEXScreenerToken) => {
        const volume = this.parseNumber(pair.volume?.h24);
        const priceChange = this.parseNumber(pair.priceChange?.h24);
        const marketCapNum = this.parseNumber(pair.marketCap);
        return {
          symbol: pair.baseToken.symbol,
          name: pair.baseToken.name,
          mint: pair.baseToken.address,
          decimals: 9,
          price: this.parseNumber(pair.priceUsd).toString(),
          volume24h: volume.toString(),
          priceChange24h: priceChange.toString(),
          marketCap: marketCapNum ? marketCapNum.toString() : null,
          holders: null,
          alphaScore: this.calculateAlphaScore(volume, priceChange, marketCapNum),
        };
      });

      this.dexCache = { tokens, timestamp: now };
      return tokens;
    } catch (error) {
      await storage.updateDataSourceStatus(
        'DEXScreener',
        'error',
        error instanceof Error ? error.message : 'Unknown error',
      );
      throw error;
    }
  }

  private async fetchFromBirdeye(): Promise<Token[]> {
    const now = Date.now();
    if (this.birdeyeCache && now - this.birdeyeCache.timestamp < this.cacheTTL) {
      await storage.updateDataSourceStatus('Birdeye', 'active');
      return this.birdeyeCache.tokens;
    }

    const apiKey = process.env.BIRDEYE_API_KEY || process.env.VITE_BIRDEYE_API_KEY || '';

    try {
      const response = await this.retryRequest(() =>
        axios.get(`${this.birdeyeBaseUrl}/tokenlist`, {
          headers: { 'X-API-KEY': apiKey },
          params: { sort_by: 'v24hUSD', sort_type: 'desc', offset: 0, limit: 50 },
          timeout: 10000,
        }),
      );

      await storage.updateDataSourceStatus('Birdeye', 'active');

      const list = response.data?.data?.tokens;
      if (!list) return [];

      const tokens = list.map((token: BirdeyeToken) => {
        const price = this.parseNumber(token.price);
        const volume = this.parseNumber(token.volume24h);
        const priceChange = this.parseNumber(token.priceChange24h);
        const marketCapNum = this.parseNumber(token.marketCap);
        return {
          symbol: token.symbol,
          name: token.name,
          mint: token.address,
          decimals: token.decimals,
          price: price.toString(),
          volume24h: volume.toString(),
          priceChange24h: priceChange.toString(),
          marketCap: marketCapNum ? marketCapNum.toString() : null,
          holders: token.holders ?? null,
          alphaScore: this.calculateAlphaScore(volume, priceChange, marketCapNum),
        };
      });

      this.birdeyeCache = { tokens, timestamp: now };
      return tokens;
    } catch {
      await storage.updateDataSourceStatus('Birdeye', 'warning', 'Using fallback data');
      return [];
    }
  }

  private async fetchFromCoinGecko(): Promise<Token[]> {
    const now = Date.now();
    if (this.coinGeckoCache && now - this.coinGeckoCache.timestamp < this.cacheTTL) {
      await storage.updateDataSourceStatus('CoinGecko', 'active');
      return this.coinGeckoCache.tokens;
    }

    try {
      const response = await this.retryRequest(() =>
        axios.get(`${this.coinGeckoBaseUrl}/coins/markets`, {
          params: {
            vs_currency: 'usd',
            category: 'solana-ecosystem',
            order: 'volume_desc',
            per_page: 30,
            page: 1,
            sparkline: false,
          },
          timeout: 10000,
        }),
      );

      await storage.updateDataSourceStatus('CoinGecko', 'active');

      const tokens = response.data.map((token: CoinGeckoToken) => {
        const price = this.parseNumber(token.current_price);
        const volume = this.parseNumber(token.total_volume);
        const priceChange = this.parseNumber(token.price_change_percentage_24h);
        const marketCapNum = this.parseNumber(token.market_cap);
        return {
          symbol: token.symbol.toUpperCase(),
          name: token.name,
          mint: token.id, // CoinGecko uses ID instead of mint
          decimals: 9,
          price: price.toString(),
          volume24h: volume.toString(),
          priceChange24h: priceChange.toString(),
          marketCap: marketCapNum.toString(),
          holders: null,
          alphaScore: this.calculateAlphaScore(volume, priceChange, marketCapNum),
        };
      });

      this.coinGeckoCache = { tokens, timestamp: now };
      return tokens;
    } catch (error) {
      await storage.updateDataSourceStatus(
        'CoinGecko',
        'error',
        error instanceof Error ? error.message : 'Unknown error',
      );
      throw error;
    }
  }

  private calculateAlphaScore(volume: number, priceChange: number, marketCap?: number): number {
    let score = 50; // Base score

    // Volume factor (0-30 points)
    if (volume > 10_000_000) score += 30;
    else if (volume > 1_000_000) score += 20;
    else if (volume > 100_000) score += 10;

    // Price change factor (-20 to +20 points)
    score += Math.max(-20, Math.min(20, priceChange * 2));

    // Market cap factor (0-20 points)
    if (marketCap) {
      if (marketCap > 1_000_000_000) score += 20;
      else if (marketCap > 100_000_000) score += 15;
      else if (marketCap > 10_000_000) score += 10;
      else if (marketCap > 1_000_000) score += 5;
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private deduplicateTokens(tokens: Token[]): Token[] {
    const uniqueTokens = new Map<string, Token>();

    tokens.forEach(token => {
      const key = token.mint;
      const existing = uniqueTokens.get(key);

      if (!existing || (existing.alphaScore || 0) < (token.alphaScore || 0)) {
        uniqueTokens.set(key, token);
      }
    });

    return Array.from(uniqueTokens.values());
  }

  async getTokenPrice(mint: string): Promise<number | null> {
    try {
      const response = await axios.get(`${this.jupiterBaseUrl}/price`, {
        params: { ids: mint },
        timeout: 5000,
      });

      await storage.updateDataSourceStatus('Jupiter', 'active');

      if (response.data?.data?.[mint]?.price) {
        return parseFloat(response.data.data[mint].price);
      }

      return null;
    } catch (error) {
      await storage.updateDataSourceStatus(
        'Jupiter',
        'error',
        error instanceof Error ? error.message : 'Unknown error',
      );
      return null;
    }
  }
}

export const cryptoDataService = new CryptoDataService();