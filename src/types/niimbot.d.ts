export interface NiimbotPrinterInfo {
  modelId: number | null;
  protocolVersion: number | null;
  deviceName: string | null;
  label: string;
  task: "b1" | "v4" | null;
  dpi: number | null;
}

export interface NiimbotModelConfig {
  name_prefixes: string[];
  task: "b1" | "v4";
  density: number;
  label_type: number;
  speed: number;
}

export interface NiimbotSizeConfig {
  w_px: number;
  h_px: number;
  offset_y_px?: number;
  dpi?: number;
}

export interface NiimbotStatusResult {
  raw: {
    heartbeat: Uint8Array | null;
    heartbeatCmd: number | null;
    rfid: Uint8Array | null;
  };
  decoded: {
    heartbeat: {
      lidClosed?: boolean;
      paperInserted?: boolean;
      paperRfidSuccess?: boolean;
      ribbonInserted?: boolean;
      chargeLevel?: number;
      temp?: number;
    } | null;
    rfid: {
      uuid?: string;
      barCode?: string;
      serialNumber?: string;
      usedPaper?: number;
      capacity?: number;
      printLimit?: number;
      consumablesType?: number;
    } | null;
    evidence: unknown;
  } | null;
  confidence: string;
}

export interface NiimbotReadiness {
  ready: boolean | null;
  reasons: string[];
  evidence: string | null;
}

export interface NiimbotBattery {
  raw: number;
  scale: string;
  percent: number | null;
  text: string;
  evidence: string | null;
}

export interface NiimbotPrintOpts {
  model: NiimbotModelConfig;
  size: NiimbotSizeConfig;
  copies?: number;
  density?: number;
  offsetY?: number;
  onProgress?: (status: string) => void;
}

export interface NiimbotDriver {
  VERSION: string;
  DEBUG: boolean;
  PAGE_WAIT_MS: number;
  PAGE_ACK_MS: number;
  readonly printer: NiimbotPrinterInfo | null;
  isSupported: () => boolean;
  identify: (model: Partial<NiimbotModelConfig>) => Promise<NiimbotPrinterInfo>;
  connect: (model: Partial<NiimbotModelConfig>) => Promise<void>;
  disconnect: () => Promise<void>;
  getStatus: (opts?: { timeoutMs?: number }) => Promise<NiimbotStatusResult>;
  readiness: (status: NiimbotStatusResult) => NiimbotReadiness;
  battery: (status: NiimbotStatusResult) => NiimbotBattery | null;
  printImage: (url: string, opts: NiimbotPrintOpts) => Promise<void>;
  printBatch: (urls: string[], opts: NiimbotPrintOpts) => Promise<void>;
}

export interface NiimbotLabelSizeHelper {
  sizeFromMm: (spec: {
    w_mm: number;
    h_mm: number;
    dpi: number;
    printhead_px?: number;
    label?: string;
  }) => {
    w_px: number;
    h_px: number;
    stride: number;
    clamped: boolean;
    label_px: number;
  } | null;
}

declare global {
  interface Navigator {
    readonly bluetooth?: {
      requestDevice: (options: unknown) => Promise<unknown>;
    };
  }
  interface Window {
    Niimbot?: NiimbotDriver;
    NiimbotLabelSize?: NiimbotLabelSizeHelper;
  }
}

export {};
