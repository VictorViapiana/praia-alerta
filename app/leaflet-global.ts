import L from "leaflet";

const scope = globalThis as typeof globalThis & { L?: typeof L };
scope.L = L;

export { L };
