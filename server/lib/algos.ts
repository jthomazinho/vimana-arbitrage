export interface Id {
  id: number;
}

export interface Timestamp {
  createdAt: string; // ISO8601
  updatedAt: string; // ISO8601
}

export interface PartialObject {
  [key: string]: string | undefined;
}

/**
 * AlgoInstance represents an order to be executed by a trading algorithm.
 */
export interface AlgoInstance extends Id {
  /**
   * algoName is the kind of algo this is instance is running.
   */
  algoKind: string;
  /**
   * active indicatess this is the active instance
   */
  active: Maybe<boolean>;
}

/**
 * AlgoDetails expands an AlgoInstance with extra details.
 */
export interface AlgoDetails extends AlgoData {
  instance: AlgoInstance;
}

export interface AlgoData {
  /**
   * state is the current state of the algo
   */
  state: string;
  /**
   * outputs is the public information exposed by the algo
   */
  output: PartialObject;
  /**
   * inputs is the configuration object for the algo
   */
  input: PartialObject;
}

export interface ExecutionData extends Id, Timestamp {
  algoInstanceId: number;
  /**
   * summary is an object with summarized data of the execution.
   * Its format may vary.
   */
  summary: object;
}

export class InputValidationError extends Error {}
