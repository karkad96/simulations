export abstract class ISimulationFrame {
  public abstract generateNextFrame(delta: number): void;
}