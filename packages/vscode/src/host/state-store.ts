import type { PersistedViewState } from './bridge';

export interface KeyValueState {
  get<T>(key: string): T | undefined;
  update(key: string, value: unknown): PromiseLike<void>;
}

const SELECTED_ROOT_KEY = 'ply.selectedRoot';
const VIEW_STATE_KEY = 'ply.viewState';

export class StateStore {
  public constructor(private readonly state: KeyValueState) {}
  public selectedRoot(): string | undefined { return this.state.get<string>(SELECTED_ROOT_KEY); }
  public async selectRoot(path: string): Promise<void> { await this.state.update(SELECTED_ROOT_KEY, path); }
  public viewState(): PersistedViewState { return this.state.get<PersistedViewState>(VIEW_STATE_KEY) ?? {}; }
  public async persistViewState(value: PersistedViewState): Promise<void> { await this.state.update(VIEW_STATE_KEY, value); }
}
