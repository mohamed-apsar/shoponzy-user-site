/* Browser storage with an in-memory fallback (private mode, blocked storage). */
const mem = {};

export const storage = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem("snz:" + key);
      return v ? JSON.parse(v) : fallback;
    } catch {
      return mem[key] ?? fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem("snz:" + key, JSON.stringify(value));
    } catch {
      mem[key] = value;
    }
  },
};
