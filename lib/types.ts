export interface Block {
  number: number;
  hash: string;
  parent_hash: string;
  timestamp: number;
  proposer: string;
  size: number;
  transactions: Transaction[] | string[];
  validators: Record<string, boolean>;
  last_votes: any[];
  last_votes_hash: string;
  state_proof_hash: string;
}

export interface BlockHeader {
  number: number;
  hash: string;
  parent_hash: string;
  timestamp: number;
  proposer: string;
  size: number;
}

export interface Transaction {
  hash: string;
  address: string;
  nonce: number;
  timestamp: number;
  block_hash: string;
  block_number: number;
  index: number;
  operation: Operation;
  parent_tx_hash?: string;
  exec_result?: {
    code: number;
    gas_amount_charged: number;
    gas_cost_total: number;
  };
}

export interface Operation {
  type: 'SET_VALUE' | 'SET_RULE' | 'SET_FUNCTION' | 'SET_OWNER' | 'SET';
  ref?: string;
  value?: any;
  rule?: any;
  func?: any;
  owner?: any;
  op_list?: Operation[];
}

export interface ValidatorEntry {
  address: string;
  stake: number;
  proposal_right: boolean;
}

export interface NetworkStats {
  blockNumber: number;
  peerCount: number;
  consensusState: string;
}
