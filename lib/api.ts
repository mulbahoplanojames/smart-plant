export const apiBaseClient = () =>
  (typeof window !== "undefined" && localStorage.getItem("apiBase")) || "http://localhost:4000"
