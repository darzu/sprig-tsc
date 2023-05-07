class EntityManager {
  public registerSystem(callback: (foo: string) => void, name: string): void {
    callback(name);
  }
}

export const EM: EntityManager = new EntityManager();
