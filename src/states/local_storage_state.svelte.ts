import { browser } from "wxt/browser";

const syncStorage = browser.storage.sync;

export class LocalStorageState<T> {
  private internalValue: T;

  constructor(private key: string, initialValue: T) {
    this.internalValue = initialValue;

    $effect.root(() => {
      $effect(() => {
        if (storageAvailable("sync")) {
          syncStorage
            .get(key)
            .then((result: { [s: string]: any }) => {
              if (result[key] !== undefined) {
                this.internalValue = result[key] as T;
              }
            })
            .catch((error: any) => {
              console.error(`Error loading ${key} from storage:`, error);
            });

          const listener = (changes: {
            [key: string]: Browser.storage.StorageChange;
          }) => {
            if (changes[key] !== undefined) {
              this.internalValue = changes[key].newValue as T;
            }
          };
          syncStorage.onChanged.addListener(listener);

          return () => {
            syncStorage.onChanged.removeListener(listener);
          };
        } else {
          console.warn("Storage not available. Is this a browser extension?");
        }
      });
    });
  }

  get value(): T {
    return this.internalValue;
  }

  set value(newValue: T) {
    this.internalValue = newValue;

    if (storageAvailable("sync")) {
      syncStorage.set({ [this.key]: newValue }).catch((error: any) => {
        console.error(`Error saving ${this.key} to storage:`, error);
      });
    }
  }
}
function storageAvailable(
  storageType: "sync" | "local" | "session" = "sync"
): boolean {
  let storage: Browser.storage.StorageArea;
  if (storageType === "sync") {
    storage = browser.storage.sync;
  } else if (storageType === "local") {
    storage = browser.storage.local;
  } else {
    storage = browser.storage.session;
  }
  return typeof browser !== "undefined" && browser.storage && !!storage;
}
