export class EntityManager {
  public registerSystem(callback: (foo: string) => void, name: string): void {
    callback(name + " OLD");
  }
  public registerSystem2(name: string, callback: (foo: string) => void): void {
    callback(name + " NEW");
  }
}

export const EM: EntityManager = new EntityManager();
